import { Request, Response } from "express";
import { ddbClient } from "../../dbClient";
import { PutCommand, PutCommandInput } from "@aws-sdk/lib-dynamodb";

import { v4 as uuidv4 } from "uuid";
import { Tile } from "../../models/Tile";

function generateGameCode(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
}

const gameBoard: Record<string, Tile> = {
  "0": {
    tileId: "0",
    parentId: null,
    parentEdge: null,
    children: ["1", "2", "3", "4"],
    player: null,
    text: "",
    emoji: null,
    confirmed: true,
    // ruleCard: null,
    // revised: false,
  },
  "1": {
    tileId: "1",
    parentId: "0",
    parentEdge: 1,
    children: [],
    player: "plus",
    text: "",
    emoji: null,
    confirmed: false,
    // ruleCard: null,
    // revised: false,
  },
  "2": {
    tileId: "2",
    parentId: "0",
    parentEdge: 3,
    children: [],
    player: "plus",
    text: "",
    emoji: null,
    confirmed: false,
    // ruleCard: null,
    // revised: false,
  },
  "3": {
    tileId: "3",
    parentId: "0",
    parentEdge: 5,
    children: [],
    player: "minus",
    text: "",
    emoji: null,
    confirmed: false,
    // ruleCard: null,
    // revised: false,
  },
  "4": {
    tileId: "4",
    parentId: "0",
    parentEdge: 7,
    children: [],
    player: "minus",
    text: "",
    emoji: null,
    confirmed: false,
    // ruleCard: null,
    // revised: false,
  },
};

export const createGame: any = async (req: Request, res: Response) => {
    try {
        const gameCode = generateGameCode();
        let input: PutCommandInput = {
          TableName: "Games",
          Item: {
            gameId: uuidv4(),
            code: gameCode,
            date: new Date().toISOString(),
            hostId: req.user!.userId,
            status: "waiting",
            topic: {
              text: "",
              revised: false,
            },
            players: [
              {
                userId: req.user!.userId,
                name: req.user!.name,
                role: "plus", // host defaults to plus
                money: 0,
                acknowledged: [false, false, false, false],
              },
            ],
            gameBoard: gameBoard,
          },
        };
        let command: PutCommand = new PutCommand(input);
        await ddbClient.send(command);

        return res.status(201).json({message: "Game created successfully", data: {gameCode: gameCode}});
  } catch (error: any) {
    return res.status(500).json({message: error.message});
  }
}