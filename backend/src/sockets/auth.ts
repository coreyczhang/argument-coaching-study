import { Server } from "socket.io";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ddbClient } from "../dbClient";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import dotenv from "dotenv";

dotenv.config();

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID!,
  tokenUse: "id",
  clientId: process.env.COGNITO_APP_CLIENT_ID!,
});

export default function socketsAuth(io: Server) {
  io.use(async (socket, next) => {
    try {
      const gameCode = socket.handshake.query.gameCode as string;
      const studyPid = socket.handshake.query.studyPid as string | undefined;

      const { Items = [] } = await ddbClient.send(
        new QueryCommand({
          TableName: "Games",
          IndexName: "GameCodeIndex",
          KeyConditionExpression: "code = :c",
          ExpressionAttributeValues: { ":c": gameCode },
          Limit: 1,
        })
      );
      if (Items.length === 0) throw new Error("Game not found");
      const game = Items[0] as any;

      let userId: string;
      let name: string;

      if (studyPid) {
        // Study mode: authenticate by Prolific PID, no Cognito required
        userId = studyPid;
        name = "Participant";
      } else {
        // Normal mode: verify Cognito JWT from cookie
        const rawCookie = socket.handshake.headers.cookie;
        if (!rawCookie) return next(new Error("No cookie found"));
        const token = rawCookie.split("; ").find((c) => c.startsWith("auth-token="));
        const cookieValue = token ? token.split("=")[1] : null;
        const data: any = await verifier.verify(cookieValue!);
        userId = data.sub || data["cognito:username"];
        name = data.given_name || data.name;
      }

      const me = (game.players as any[]).find((p) => p.userId === userId);
      if (!me) throw new Error("Not a participant in this game");

      socket.data.user = {
        userId,
        name,
        role: me.role,
        isHost: game.hostId === userId,
      };
      socket.data.gameCode = gameCode;
      socket.data.gameId = game.gameId;
      next();
    } catch (error) {
      next(new Error("Unauthorized"));
    }
  });
}
