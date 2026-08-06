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

// Real opening arguments for the AI opponent (it argues the "No" side against the
// participant's "for" side). Topic-specific for the study's rotation; a substantive
// generic pair otherwise. Replaced by the live LLM co-player when the agent is funded.
function aiOpeningArguments(topic: string): [string, string] {
  const t = (topic || "").toLowerCase();
  if (t.includes("student loan") || t.includes("community college")) {
    return [
      "It's unfair to people who already paid off their loans or picked a cheaper school to avoid debt.",
      "The cost doesn't disappear — it shifts onto taxpayers, many of whom never went to college.",
    ];
  }
  if (t.includes("soda") || t.includes("sugary")) {
    return [
      "A soda tax hits low-income families hardest, since they spend more of their income on groceries.",
      "People switch to other junk food or buy across the border, so it barely moves health outcomes.",
    ];
  }
  if (t.includes("ai-generated") || t.includes("labeled") || t.includes("labelled")) {
    return [
      "Labels are easy to strip out or fake, so they give people a false sense of security.",
      "Almost everything uses some AI now, so a blanket label becomes noise people learn to ignore.",
    ];
  }
  return [
    "The costs of doing this fall on people who had no say in it, which makes it hard to justify.",
    "It sounds good in principle, but it's very hard to enforce fairly in practice.",
  ];
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
    const { topic, condition, role = "plus", vsAi = false } = req.body as {
      topic: string;
      condition: "AI_FEEDBACK" | "CONTROL";
      role?: "plus" | "minus";
      vsAi?: boolean;
    };

    if (!topic || !condition) {
      return res.status(400).json({ message: "topic and condition are required" });
    }

    const gameCode = generateGameCode();
    const gameId = uuidv4();
    const board = freshBoard();
    board["0"].text = topic;

    // Solo-vs-AI round (e18 study): seed an AI opponent on the opposite side so the
    // board shows two sides and the participant has something to argue against. The
    // opponent's opening tiles are pre-filled statically (no live agent call), so the
    // round works even when the AI agent is unavailable; a funded agent can replace
    // these with live moves later without changing this contract.
    const aiRole = role === "plus" ? "minus" : "plus";
    const players: any[] = [{
      userId: req.user!.userId,
      name: "Participant",
      role,
      money: 0,
      acknowledged: [true, true, true, true],
    }];
    if (vsAi) {
      players.push({
        userId: "ai-coplayer",
        name: "AI",
        role: aiRole,
        money: 0,
        isAi: true,
        acknowledged: [true, true, true, true],
      });
      // Pre-fill the AI side's two opening tiles with a real opening case so the
      // opponent's position is substantive from the start (topic-specific where known).
      const aiTileIds = aiRole === "minus" ? ["3", "4"] : ["1", "2"];
      aiOpeningArguments(topic).forEach((text, i) => {
        if (board[aiTileIds[i]]) { board[aiTileIds[i]].text = text; board[aiTileIds[i]].confirmed = true; }
      });
    }

    await ddbClient.send(new PutCommand({
      TableName: "Games",
      Item: {
        gameId,
        code: gameCode,
        date: new Date().toISOString(),
        hostId: req.user!.userId,
        status: vsAi ? "in-progress" : "waiting",
        isStudyGame: true,
        isAiGame: vsAi,
        topic: { text: topic, revised: false },
        aiConfig: {
          enabled: condition === "AI_FEEDBACK",
          condition,
        },
        players,
        gameBoard: board,
      },
    }));

    return res.status(201).json({ data: { gameCode, gameId } });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};
