import { Request, Response } from "express";
import { ddbClient } from "../../dbClient";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { Tile } from "../../models/Tile";

function generateGameCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}

const freshBoard = (): Record<string, Tile> => ({
  "0": { tileId: "0", parentId: null, parentEdge: null, children: ["1","2","3","4"], player: null, text: "", emoji: null, confirmed: true },
  "1": { tileId: "1", parentId: "0", parentEdge: 1, children: [], player: "plus",  text: "", emoji: null, confirmed: false },
  "2": { tileId: "2", parentId: "0", parentEdge: 3, children: [], player: "plus",  text: "", emoji: null, confirmed: false },
  "3": { tileId: "3", parentId: "0", parentEdge: 5, children: [], player: "minus", text: "", emoji: null, confirmed: false },
  "4": { tileId: "4", parentId: "0", parentEdge: 7, children: [], player: "minus", text: "", emoji: null, confirmed: false },
});

export const createStudyGame: any = async (req: Request, res: Response) => {
  try {
    const { topic, condition, role = "plus" } = req.body as {
      topic: string;
      condition: "AI_FEEDBACK" | "CONTROL";
      role?: "plus" | "minus";
    };

    if (!topic || !condition) {
      return res.status(400).json({ message: "topic and condition are required" });
    }

    const gameCode = generateGameCode();
    const gameId = uuidv4();
    const board = freshBoard();
    board["0"].text = topic;

    await ddbClient.send(new PutCommand({
      TableName: "Games",
      Item: {
        gameId,
        code: gameCode,
        date: new Date().toISOString(),
        hostId: req.user!.userId,
        status: "waiting",
        isStudyGame: true,
        topic: { text: topic, revised: false },
        aiConfig: {
          enabled: condition === "AI_FEEDBACK",
          condition,
        },
        players: [{
          userId: req.user!.userId,
          name: "Participant",
          role,
          money: 0,
          acknowledged: [true, true, true, true],
        }],
        gameBoard: board,
      },
    }));

    return res.status(201).json({ data: { gameCode, gameId } });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};
