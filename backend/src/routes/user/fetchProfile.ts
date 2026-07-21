import { Request, Response } from "express";

import { ddbClient } from "../../dbClient";
import { BatchGetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

interface UserProfile {
  gameHistory: GameSummary[];
  stances: Record<string, number>
}

interface GameSummary {
  code: string;
  date: Date;
  topic: string;
}

export const fetchProfile: any = async (req: Request, res: Response) => {
  try {
    //fetch user info from DynamoDB
    const query = new QueryCommand({
      TableName: "Users",
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: { ":userId": req.user!.userId },
      Limit: 1,
    });
    const response = await ddbClient.send(query);

    if (!response.Items || response.Count === 0) {
      return res.status(400).json({ message: "User not found" });
    }
    const user = response.Items[0];
    const gameIds = user.gameHistory || [];

    let recentGames: GameSummary[] = [];

    if (gameIds.length > 0) {
      // Take the 9 most recent game IDs.
      // Assuming gameHistory is ordered oldest -> newest:
      const recentGameIds = gameIds.slice(-9).reverse(); // newest first

      const batchCmd = new BatchGetCommand({
        RequestItems: {
          Games: {
            Keys: recentGameIds.map((id: any) => ({ gameId: id })),
            // "date" is reserved, so alias it
            ProjectionExpression: "gameId, code, #d, topic",
            ExpressionAttributeNames: { "#d": "date" },
          },
        },
      });

      const batchResp = await ddbClient.send(batchCmd);
      const items = batchResp.Responses?.Games ?? [];

      // Build a map so we can restore the original recentGameIds order
      const gameMap: Record<string, GameSummary> = {};
      for (const item of items) {
        gameMap[item.gameId] = {
          code: item.code,
          date: item.date,
          topic: item.topic.text,
        };
      }

      recentGames = recentGameIds
        .map((id: string | number) => gameMap[id])
        .filter((g: any): g is GameSummary => Boolean(g));
    }

    const userProfile: UserProfile = {
      gameHistory: recentGames,
      stances: user.stances || {},
    };

    return res.json(userProfile);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};