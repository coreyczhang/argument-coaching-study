import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import argon2 from "argon2";
import { User } from "../../models/User";
import { ddbClient } from "../../dbClient";
import {
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import dotenv from "dotenv";
dotenv.config();

//* Admin can update user roles (user/admin)
//* expects body with admin's email and new password
export const updateRole: any = async (req: Request, res: Response) => {
  try {
    console.log(req.user);
    if (req.user!.role !== "admin"){
        return res.status(403).json({ message: "Forbidden" });
    }

    const query = new QueryCommand({
      TableName: "Users",
      IndexName: "EmailIndex",
      KeyConditionExpression: "email = :email",
      ExpressionAttributeValues: { ":email": req.body.email },
      Limit: 1,
    });

    const response = await ddbClient.send(query);
    if (!response.Items || response.Count === 0) {
      return res.status(400).json({ message: "Unable to find user" });
    }

    const password = await argon2.hash(req.body.password);
      
    const command = new UpdateCommand({
      TableName: "Users",
      Key: { userId: response.Items[0].userId },
      UpdateExpression: "SET #role = :role, #password = :password",
      ExpressionAttributeNames: {
        "#role": "role",
        "#password": "password",
      },
      ExpressionAttributeValues: {
        ":role": "admin",
        ":password": password,
      },
    });

    await ddbClient.send(command);

    return res.status(200).json({ message: "User role updated" });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};
