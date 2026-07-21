import { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import { CognitoJwtVerifier } from "aws-jwt-verify";
dotenv.config();

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID!,
  tokenUse: "id",
  clientId: process.env.COGNITO_APP_CLIENT_ID!, 
});

export const requiresAuth: any = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies["auth-token"];
  if (!token) return res.status(401).json("You are not logged in");
  try {
    const data: any = await verifier.verify(token);
    const payload = {
      userId: data.sub || data["cognito:username"],
      name: data.given_name || data.name, 
      role: data.role || 'user'
    };
    req.user = payload;
    next();
    return;
  } catch (error: any) {
    return res.status(401).json({ message: error.message });
  }
};
