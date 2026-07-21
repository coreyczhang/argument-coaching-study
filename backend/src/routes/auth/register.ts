import { Request, Response } from "express";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { User } from "../../models/User";
import { ddbClient } from "../../dbClient";
import {
  BatchWriteCommand,
  PutCommand,
  PutCommandInput,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
dotenv.config();

//* takes in request body with email, password (to be hashed), first name, last name
export const register: any = async (req: Request, res: Response) => {
  try {
      const query = new QueryCommand({
        TableName: "Users",
        IndexName: "EmailIndex",
        KeyConditionExpression: "email = :email",
        ExpressionAttributeValues: { ":email": req.body.email },
        Limit: 1,
      });
      const response = await ddbClient.send(query);
        if (response.Items && response.Items.length > 0) {
          return res
            .status(400)
            .json({
              message: "Email already registered: meant to log in?"
            });
        }
    const user: User = req.body;
    const id = uuidv4();

        let input: PutCommandInput = {
            Item: {
                userId: id,
                role: 'user',
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                gameHistory: [],
            },
            TableName: "Users"
        }
        let command = new PutCommand(input);
        await ddbClient.send(command);

        const token = jwt.sign({
          userId: id,
          name: user.firstName,
          role: 'user'
        }, process.env.PRIVATEKEY as string)

        if (req.cookies["auth-token"]) {
          res.clearCookie("auth-token");
        }
        
        return res
          .cookie("auth-token", token, {
            expires: new Date(
              new Date().getTime() + 60 * 60 * 24 * 7 * 1000 * 2
            ),
            secure: true,
            sameSite: "none",
            httpOnly: true,
            // domain: '.pointtaken.social'
          })
          .json({ message: `Welcome, ${user.firstName}!` });

    } catch (error:any) {
        return res.status(500).json({ message: error.message });
    }
}

export const batchCreateAccounts: any = async (req: Request, res: Response) => {
  try {
    if (req.user!.role !== 'admin') return res.status(403).json({ message: "Forbidden" });

    if (req.body.count < 1 || req.body.count > 25) {
      return res.status(400).json({ message: "Count must be between 1 and 100" });
    }
    if (req.body.start < 1) {
      return res.status(400).json({ message: "Start must be at least 1" });
    }

    const emails = Array.from({ length: req.body.count }, (_, i) => `user${req.body.start + i}@pointtaken.social`);

    const RequestItems: Record<string, any[]> = {
      Users: emails.map((email, idx) => ({
        PutRequest: {
          Item: {
            userId: uuidv4(),
            role: "user",
            firstName: `User ${req.body.start + idx}`,
            lastName: "Test",
            email,
            gameHistory: [],
          },
        },
      })),
    };
    let unprocessed = RequestItems;
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts && Object.keys(unprocessed).length > 0) {
      const resp = await ddbClient.send(
        new BatchWriteCommand({ RequestItems: unprocessed })
      );
      unprocessed = resp.UnprocessedItems ?? {};
      if (Object.keys(unprocessed).length === 0) break;

      attempts++;
      const delayMs = 100 * Math.pow(2, attempts); // 100, 200, 400, 800, 1600
      await new Promise((r) => setTimeout(r, delayMs));
    }

    const unprocessedEmails =
      unprocessed.Users?.map((r: any) => r.PutRequest.Item.email) ?? [];

    return res.status(200).json({message: `Created ${emails.length - unprocessedEmails.length} accounts, failed to create ${unprocessedEmails.length} emails`});

  } catch (error) {
    return res.status(500).json({ message: error });
  }
}