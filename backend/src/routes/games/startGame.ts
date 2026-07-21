import { Request, Response } from "express";
import { ddbClient } from "../../dbClient";
import { QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

export const startGame: any = async (req: Request, res: Response) => {
    try {
        const hostId = req.user!.userId
        const query = new QueryCommand({
                  TableName: "Games",
                  IndexName: "GameCodeIndex",
                  KeyConditionExpression: "code = :code",
                  ExpressionAttributeValues: { ":code": req.params.gameCode },
                  Limit: 1,
        })
        const response = await ddbClient.send(query);
        if (!response.Items || response.Count === 0) {
            return res.status(404).json({ message: "Game not found with this code" });
        }

        const game: any = response.Items[0];
        if (game.status !== "waiting") {
            return res.status(400).json({ message: "Game is already in play or finished" });
        }

        if (game.hostId !== hostId) {
            return res.status(403).json({ message: "Only the host can start the game" });
        }

        const topic = {
            text: req.body.topic.text,
            revised: false
        }

        const command = new UpdateCommand({
            TableName: "Games",
            Key: { gameId: game.gameId },
            UpdateExpression: `
                SET topic = :topic,
                #gameStatus = :status
            `,
            ExpressionAttributeValues: {
                ":topic": topic ,
                ":status": "in-progress",
            },
            ExpressionAttributeNames: {
                "#gameStatus": "status",
            },
            ReturnValues: "ALL_NEW"
        })
        const { Attributes } = await ddbClient.send(command);
        return res.status(200).json({data: Attributes});
        
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
        
    }
}