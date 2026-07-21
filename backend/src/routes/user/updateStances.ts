import { Request, Response } from "express";
import { ddbClient } from "../../dbClient";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { Stance } from "../../models/User";

interface UpdateStancesBody {
  stances: Record<string, Stance>;
}

export const updateStances: any = async (req: Request, res: Response) => {
  try {
    const stances = req.body;
    console.log(stances);
    const cmd = new UpdateCommand({
      TableName: "Users",
      Key: { userId: req.user!.userId },
      UpdateExpression: "SET stances = :s",
      ExpressionAttributeValues: {
        ":s": stances,
      },
    });

    await ddbClient.send(cmd);
    return res.json({ message: "Stances updated" });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};
