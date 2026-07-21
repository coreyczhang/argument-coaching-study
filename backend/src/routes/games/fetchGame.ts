import { Request, Response } from "express";
import { ddbClient } from "../../dbClient";
import {
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";

export const fetchGame: any = async (req: Request, res: Response) => {
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

    return res.status(200).json({
      data: { game: game, me: req.user!.userId },
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};
