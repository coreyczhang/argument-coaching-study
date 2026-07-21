import { Server, Socket } from "socket.io";
import { QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddbClient } from "../dbClient";

export default function lobbyHandlers(io: Server, socket: Socket) {
  const gameCode = socket.data.gameCode;
  const { userId, name, role, isHost } = socket.data.user as {
    userId: string;
    name: string;
    role: "plus" | "minus";
    isHost: boolean;
  };

  socket.join(gameCode);
  io.in(gameCode).emit("playerJoined", { userId, name, role, isHost });

  // Broadcast live presence: the distinct users with an active socket in this room.
  // Used to gate the study board so it only starts when BOTH players are actually
  // connected (the host is pre-seeded in the DB, so DB player count isn't enough).
  async function broadcastPresence() {
    try {
      const sockets = await io.in(gameCode).fetchSockets();
      const userIds = Array.from(
        new Set(sockets.map((s) => s.data?.user?.userId).filter(Boolean))
      );
      io.in(gameCode).emit("presence", { userIds });
    } catch (err) {
      console.error("broadcastPresence error:", err);
    }
  }
  broadcastPresence();

  let latestTopic = "";
  let debounceTimer: NodeJS.Timeout | null = null;

  socket.on("choosingTopic", ({ partialTopic }: { partialTopic: string }) => {
    if (!isHost) {
      socket.emit("error", {
        message: "Only the host can choose the topic.",
      });
      return;
    }
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(async () => {
      io.to(gameCode).emit("choosingTopic", {
        userId,
        partialTopic,
      });

      try {
        const { Items = [] } = await ddbClient.send(
          new QueryCommand({
            TableName: "Games",
            IndexName: "GameCodeIndex",
            KeyConditionExpression: "code = :c",
            ExpressionAttributeValues: { ":c": gameCode },
            Limit: 1,
          })
        );
        if (!Items.length) throw new Error("Game not found");
        const game = Items[0] as any;
        if (partialTopic === latestTopic) return;
        latestTopic = partialTopic;
        
        await ddbClient.send(
          new UpdateCommand({
            TableName: "Games",
            Key: { gameId: game.gameId },
            UpdateExpression: "SET topic = :topic",
            ExpressionAttributeValues: {
              ":topic": {
                text: partialTopic,
                revised: false,
              },
            },
          })
        );
      } catch (error) {
        console.log(error);
      }
    });
    return;
  });

  socket.on("acknowledgeAgreement", async ({ acknowledged }: { acknowledged: boolean[] }) => {
    try {
      const { Items = [] } = await ddbClient.send(
        new QueryCommand({
          TableName: "Games",
          IndexName: "GameCodeIndex",
          KeyConditionExpression: "code = :c",
          ExpressionAttributeValues: { ":c": gameCode },
          Limit: 1,
        })
      );
      if (!Items.length) throw new Error("Game not found");
      const game = Items[0] as any;

      const players: Array<any> = game.players || [];
      
      const updatedPlayers = players.map((p: any) => {
        if (p.userId === userId) {
          return { ...p, acknowledged };
        }
        return p;
      });

      await ddbClient.send(
        new UpdateCommand({
          TableName: "Games",
          Key: { gameId: game.gameId },
          UpdateExpression: "SET players = :players",
          ExpressionAttributeValues: { ":players": updatedPlayers },
        })
      );

      io.in(gameCode).emit("agreementUpdated", { userId, acknowledged });
    } catch (error) {
      console.error("Error updating agreement:", error);
      socket.emit("error", { message: "Failed to update agreement" });
    }
  });

socket.on("selectRole", async ({ role }: { role: "plus" | "minus" }) => {
  if (!isHost) {
    socket.emit("error", { message: "Only the host can select roles." });
    return;
  }

  // Fetch game by code
  const { Items = [] } = await ddbClient.send(
    new QueryCommand({
      TableName: "Games",
      IndexName: "GameCodeIndex",
      KeyConditionExpression: "code = :c",
      ExpressionAttributeValues: { ":c": gameCode },
      Limit: 1,
    })
  );
  if (!Items.length) throw new Error("Game not found");
  const game = Items[0] as any;

  const hostId = game.hostId as string;
  const players: Array<any> = game.players || [];

  const other = players.find((p) => p.userId !== hostId);
  const opposite = role === "plus" ? "minus" : "plus";

  const updatedPlayers = players.map((p) => {
    if (p.userId === hostId) return { ...p, role };
    if (other && p.userId === other.userId) return { ...p, role: opposite };
    return p; // spectators or extra players unchanged
  });

  // Persist
  await ddbClient.send(
    new UpdateCommand({
      TableName: "Games",
      Key: { gameId: game.gameId },
      UpdateExpression: "SET players = :players",
      ExpressionAttributeValues: { ":players": updatedPlayers },
    })
  );

  // Broadcast a canonical update event with the full players state
  io.in(gameCode).emit("rolesUpdated", {
    players: updatedPlayers,
    selectedBy: hostId,
    role, // host's selected role
  });
});
  

  socket.on("startGame", async () => {
    if (!isHost) {
      socket.emit("error", { message: "Only the host can start the game." });
      return;
    }
    try {
      const query = new QueryCommand({
        TableName: "Games",
        IndexName: "GameCodeIndex",
        KeyConditionExpression: "code = :code",
        ExpressionAttributeValues: { ":code": gameCode },
        Limit: 1,
      });
      const response: any = await ddbClient.send(query);
      if (!response.Items || response.Count === 0) {
        socket.emit("error", { message: "Game not found with this code" });
        return; // <-- important
      }

      const game: any = response.Items[0];
      if (game.status !== "waiting") {
        socket.emit("error", {
          message: "Game is already in play or finished",
        });
        return; // <-- important
      }

      const players = game.players || [];
      if (players.length !== 2) {
        socket.emit("error", {
          message: "Two players are required to start the game",
        });
        return;
      }

      for (const player of players) {
        const acknowledged = player.acknowledged || [];
        if (acknowledged.length !== 4 || !acknowledged.every((v: boolean) => v === true)) {
          socket.emit("error", {
            message: "Both players must acknowledge all agreement items before starting",
          });
          return;
        }
      }

      // 1) Update game status
      const command = new UpdateCommand({
        TableName: "Games",
        Key: { gameId: game.gameId },
        UpdateExpression: `SET #gameStatus = :status`,
        ExpressionAttributeValues: { ":status": "in-progress" },
        ExpressionAttributeNames: { "#gameStatus": "status" },
        ReturnValues: "ALL_NEW",
      });
      const { Attributes } = await ddbClient.send(command);

      // 2) Append gameId to both players' gameHistory (guaranteed exactly two players)
      const [p1, p2] = game.players.map((p: any) => p.userId);
      const mkUserUpdate = (userId: string) =>
        new UpdateCommand({
          TableName: "Users",
          Key: { userId },
          UpdateExpression:
            "SET gameHistory = list_append(if_not_exists(gameHistory, :empty), :gid)",
          ExpressionAttributeValues: {
            ":empty": [],
            ":gid": [game.gameId],
          },
        });

      await Promise.all([
        ddbClient.send(mkUserUpdate(p1)),
        ddbClient.send(mkUserUpdate(p2)),
      ]);

      io.in(gameCode).emit("gameStarted", { game: Attributes });
    } catch (error) {
      socket.emit("error", error);
    }
  });


  // AI Co-Player: start a solo game — host only, no second human player required
  socket.on("startAiGame", async ({ topic, hostRole }: { topic: string; hostRole: "plus" | "minus" }) => {
    if (!isHost) {
      socket.emit("error", { message: "Only the host can start the game." });
      return;
    }
    try {
      const query = new QueryCommand({
        TableName: "Games",
        IndexName: "GameCodeIndex",
        KeyConditionExpression: "code = :code",
        ExpressionAttributeValues: { ":code": gameCode },
        Limit: 1,
      });
      const response: any = await ddbClient.send(query);
      if (!response.Items || response.Count === 0) {
        socket.emit("error", { message: "Game not found with this code" });
        return;
      }
      const game: any = response.Items[0];
      if (game.status !== "waiting") {
        socket.emit("error", { message: "Game is already in play or finished" });
        return;
      }

      const aiRole = hostRole === "plus" ? "minus" : "plus";
      const aiPlayer = {
        userId: "ai-coplayer",
        name: "AI",
        role: aiRole,
        isAi: true,
        acknowledged: [true, true, true, true],
      };

      // Assign host role + topic + add AI player
      const hostPlayers = (game.players || []).map((p: any) =>
        p.userId === userId ? { ...p, role: hostRole, acknowledged: [true, true, true, true] } : p
      );
      const allPlayers = [...hostPlayers, aiPlayer];

      const command = new UpdateCommand({
        TableName: "Games",
        Key: { gameId: game.gameId },
        UpdateExpression: `SET #gameStatus = :status, players = :players, topic = :topic, isAiGame = :isAiGame`,
        ExpressionAttributeValues: {
          ":status": "in-progress",
          ":players": allPlayers,
          ":topic": { text: topic, revised: false },
          ":isAiGame": true,
        },
        ExpressionAttributeNames: { "#gameStatus": "status" },
        ReturnValues: "ALL_NEW",
      });
      const { Attributes } = await ddbClient.send(command);

      // Append gameId to host's gameHistory
      await ddbClient.send(new UpdateCommand({
        TableName: "Users",
        Key: { userId },
        UpdateExpression: "SET gameHistory = list_append(if_not_exists(gameHistory, :empty), :gid)",
        ExpressionAttributeValues: { ":empty": [], ":gid": [game.gameId] },
      }));

      io.in(gameCode).emit("gameStarted", { game: Attributes });
    } catch (error) {
      socket.emit("error", error);
    }
  });

  socket.on("disconnect", () => {
    socket.to(gameCode).emit("playerLeft", { userId });
    // Recompute presence after this socket has left the room
    setTimeout(broadcastPresence, 0);
  });
}
