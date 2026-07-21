import { Request, Response } from "express";
import { ddbClient } from "../../dbClient";
import { QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { GamePlayer } from "../../models/Game";

export const joinStudyGame: any = async (req: Request, res: Response) => {
  try {
    const { Items = [] } = await ddbClient.send(new QueryCommand({
      TableName: "Games",
      IndexName: "GameCodeIndex",
      KeyConditionExpression: "code = :code",
      ExpressionAttributeValues: { ":code": req.params.gameCode },
      Limit: 1,
    }));

    if (!Items.length) return res.status(404).json({ message: "Game not found" });
    const game: any = Items[0];

    const existing = game.players.find((p: GamePlayer) => p.userId === req.user!.userId);
    if (existing) return res.status(200).json({ message: "Already in game", data: { gameId: game.gameId } });

    if (game.players.length > 1) return res.status(400).json({ message: "Game is already full" });

    const hostRole: string = game.players[0]?.role ?? "plus";
    const joiningRole = hostRole === "plus" ? "minus" : "plus";

    const player: GamePlayer = {
      userId: req.user!.userId,
      name: "Participant",
      role: joiningRole,
      money: 0,
      acknowledged: [true, true, true, true],
    };

    await ddbClient.send(new UpdateCommand({
      TableName: "Games",
      Key: { gameId: game.gameId },
      UpdateExpression: "SET players = list_append(players, :p), #s = :status",
      ConditionExpression: "size(players) < :max",
      ExpressionAttributeNames: { "#s": "status" },
      ExpressionAttributeValues: { ":p": [player], ":max": 2, ":status": "in-progress" },
    }));

    return res.status(200).json({ message: "Joined study game", data: { gameId: game.gameId, role: joiningRole } });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};
