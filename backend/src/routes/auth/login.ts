import { Request, Response } from "express";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { ddbClient } from "../../dbClient";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { randomUUID } from "crypto";
import dotenv from "dotenv";
dotenv.config();

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID!,
  tokenUse: "id",
  clientId: process.env.COGNITO_APP_CLIENT_ID!,
});

//* Admin Login, requires admin account with email and password
export const adminLogin: any = async (req: Request, res: Response) => {
  try {
    const { Item: emailMapItem } = await ddbClient.send(
      new GetCommand({ TableName: "UserEmailMap", Key: { email: req.body.email } })
    );
    if (!emailMapItem) return res.status(400).json({ message: "Unable to authenticate user" });

    const { Item: user } = await ddbClient.send(
      new GetCommand({ TableName: "Users", Key: { userId: emailMapItem.userId } })
    );
    if (!user) return res.status(400).json({ message: "Unable to authenticate user" });

    if (user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied" });
    }

    const isPasswordValid = await argon2.verify(user.password, req.body.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Unable to authenticate user" });
    }

    const token = jwt.sign(
      { userId: user.userId, name: user.firstName, role: user.role },
      process.env.PRIVATEKEY as string
    );

    if (req.cookies["auth-token"]) res.clearCookie("auth-token");

    return res.cookie("auth-token", token, {
      expires: new Date(new Date().getTime() + 60 * 60 * 24 * 7 * 1000 * 2),
      secure: true,
      sameSite: "none",
      httpOnly: true,
    }).json({ message: `Welcome back, ${user.firstName}!` });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const cognitoLogin: any = async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body || {};
    if (!idToken) return res.status(400).send("Missing idToken");

    const data: any = await verifier.verify(idToken);
    const sub = data.sub;
    const email = data.email;
    const firstName = data.given_name || data.name || "";
    const lastName = data.family_name || "";

    if (!sub || !email) {
      return res.status(400).json({ message: "Invalid Cognito token payload" });
    }

    // Ensure UserEmailMap entry exists (idempotent — Lambda may have already created it)
    const { Item: emailMapItem } = await ddbClient.send(
      new GetCommand({ TableName: "UserEmailMap", Key: { email } })
    );

    if (!emailMapItem) {
      // New user — create both records (fallback if Lambda didn't fire)
      await ddbClient.send(new PutCommand({
        TableName: "Users",
        Item: { userId: sub, firstName, lastName, role: "user", gameHistory: [], stances: {} },
        ConditionExpression: "attribute_not_exists(userId)",
      })).catch(err => { if (err?.name !== "ConditionalCheckFailedException") throw err; });

      await ddbClient.send(new PutCommand({
        TableName: "UserEmailMap",
        Item: { email, userId: sub, anonId: randomUUID() },
        ConditionExpression: "attribute_not_exists(email)",
      })).catch(err => { if (err?.name !== "ConditionalCheckFailedException") throw err; });
    }

    return res.cookie("auth-token", idToken, {
      expires: new Date(new Date().getTime() + 60 * 60 * 24 * 7 * 1000 * 2),
      secure: true,
      sameSite: "none",
      httpOnly: true,
    }).json({ message: "Login successful" });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};
