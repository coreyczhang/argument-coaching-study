import { Request, Response } from "express";
import { ddbClient } from "../../dbClient";
import { GamePlayer } from "../../models/Game";
import {
  QueryCommand,
  UpdateCommand,
  UpdateCommandInput,
} from "@aws-sdk/lib-dynamodb";

export const joinGame: any = async (req: Request, res: Response) => {
  try {
    const query = new QueryCommand({
      TableName: "Games",
      IndexName: "GameCodeIndex",
      KeyConditionExpression: "code = :code",
      ExpressionAttributeValues: { ":code": req.params.gameCode },
      Limit: 1,
    });
    const response = await ddbClient.send(query);
    if (!response.Items || response.Count === 0) {
      return res.status(404).json({ message: "Game not found with this code" });
    }
    const game: any = response.Items[0];

    const existingPlayer = game.players.find((p: GamePlayer) => p.userId === req.user!.userId);
    if (existingPlayer) {
      return res.status(200).json({
        message: "Already in game",
        data: { gameId: game.gameId },
      });
    }

    if (game.players.length > 1) {
      return res.status(400).json({ message: "Game is already full" });
    }

    // Assign the complement of the host's role so the sides are always opposite.
    // Host defaults to "plus" (createGame.ts), so joiners default to "minus",
    // but this stays correct if that ever changes.
    const hostRole: string = game.players[0]?.role ?? "plus";
    const joiningRole = hostRole === "plus" ? "minus" : "plus";

    const player: GamePlayer = {
      userId: req.user!.userId,
      name: req.user!.name,
      role: joiningRole,
      money: 0,
      acknowledged: [false, false, false, false],
    };

    let input: UpdateCommandInput = {
      TableName: "Games",
      Key: { gameId: game.gameId },
      UpdateExpression: "SET players = list_append(players, :p)",
      ConditionExpression: "size(players) < :max",
      ExpressionAttributeValues: {
        ":p": [player],
        ":max": 2,
      },
    };

    let command: UpdateCommand = new UpdateCommand(input);
    await ddbClient.send(command);

    return res.status(200).json({
      message: "Game joined successfully",
      data: { gameId: game.gameId },
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};
