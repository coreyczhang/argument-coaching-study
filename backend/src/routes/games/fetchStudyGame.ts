import { Request, Response } from "express";
import { ddbClient } from "../../dbClient";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";

export const fetchStudyGame: any = async (req: Request, res: Response) => {
  try {
    const { Items = [], Count } = await ddbClient.send(new QueryCommand({
      TableName: "Games",
      IndexName: "GameCodeIndex",
      KeyConditionExpression: "code = :code",
      ExpressionAttributeValues: { ":code": req.params.gameCode },
      Limit: 1,
    }));

    if (!Items.length || Count === 0) {
      return res.status(404).json({ message: "Game not found" });
    }

    return res.status(200).json({
      data: { game: Items[0], me: req.user!.userId },
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};
