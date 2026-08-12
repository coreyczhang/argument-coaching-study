// AI co-player for e18 study rounds.
//
// Live-first: it asks the funded agent's /co-player/turn for a real, in-good-faith
// rebuttal (a "reasonable sparring partner" — no fallacies, strongest fair case).
// If the agent is unavailable it falls back to a canned rebuttal so the round always
// works. Either way it writes the same tile shape the human client writes.

import { Server } from "socket.io";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddbClient } from "../dbClient";
import { Tile } from "../models/Tile";

export const AI_USER_ID = "ai-coplayer";
const MAX_AI_REPLIES = 4; // don't overrun the board
const REPLY_DELAY_MS = 500; // brief "thinking" beat (the agent call adds its own latency)
const PT_AGENT_URL = process.env.PT_AGENT_URL || "http://127.0.0.1:8000";

// Unit-cell offsets by edge index — must match the frontend (useGameBoard.ts).
const OFFSETS: Array<{ x: number; y: number }> = [
  { x: 0, y: -1 }, { x: 1, y: -1 }, { x: 1, y: 0 }, { x: 1, y: 1 },
  { x: 0, y: 1 }, { x: -1, y: 1 }, { x: -1, y: 0 }, { x: -1, y: -1 },
];

// Generic, topic-agnostic pushback an opponent might make. Rotated per reply.
const REBUTTALS = [
  "But is that always true? I can think of cases where the opposite holds.",
  "That assumes the cause is what you say it is — could something else explain it?",
  "Even if that's right, does the benefit outweigh the cost to everyone else?",
  "Who decides where the line gets drawn? That seems hard to enforce fairly.",
  "That might work in theory, but what happens when people don't follow the rule?",
  "Isn't that a bit of an overgeneralization? Not every case fits that pattern.",
];

/** BFS the board from root '0'; return occupied "x,y" cells and each tile's position. */
function boardLayout(board: Record<string, Tile>): {
  occ: Set<string>;
  pos: Record<string, { x: number; y: number }>;
} {
  const pos: Record<string, { x: number; y: number }> = { "0": { x: 0, y: 0 } };
  const occ = new Set<string>(["0,0"]);
  const queue = ["0"];
  while (queue.length) {
    const pid = queue.shift()!;
    const ppos = pos[pid];
    const parent = board[pid];
    if (!parent || !ppos) continue;
    for (const cid of parent.children || []) {
      const child = board[cid];
      if (!child || child.parentEdge == null) continue;
      const off = OFFSETS[child.parentEdge];
      const cpos = { x: ppos.x + off.x, y: ppos.y + off.y };
      pos[cid] = cpos;
      occ.add(`${cpos.x},${cpos.y}`);
      queue.push(cid);
    }
  }
  return { occ, pos };
}

/** Pick an edge off `parent` whose target cell is free; prefer continuing outward. */
function pickFreeEdge(
  board: Record<string, Tile>,
  parentId: string
): number | null {
  const { occ, pos } = boardLayout(board);
  const ppos = pos[parentId];
  if (!ppos) return null;
  const parent = board[parentId];
  // Prefer the same outward direction the parent extends, then fan out.
  const base = parent.parentEdge ?? 4;
  const order = [base, (base + 1) % 8, (base + 7) % 8, (base + 2) % 8, (base + 6) % 8, (base + 4) % 8];
  for (const edge of order) {
    const off = OFFSETS[edge];
    const cell = `${ppos.x + off.x},${ppos.y + off.y}`;
    if (!occ.has(cell)) return edge;
  }
  return null;
}

/** Tiles that still have at least one free edge — where the co-player may attach a child. */
function viableParentIds(board: Record<string, Tile>): string[] {
  const { occ, pos } = boardLayout(board);
  const out: string[] = [];
  for (const id of Object.keys(board)) {
    const ppos = pos[id];
    if (!ppos) continue;
    if (OFFSETS.some((off) => !occ.has(`${ppos.x + off.x},${ppos.y + off.y}`))) out.push(id);
  }
  return out;
}

/** Ask the live agent for a reasonable, good-faith rebuttal. Returns null on any failure. */
async function liveCoPlayerTile(
  board: Record<string, Tile>,
  topic: string,
  aiRole: "plus" | "minus"
): Promise<{ parentId: string; text: string } | null> {
  try {
    const res = await fetch(`${PT_AGENT_URL}/co-player/turn`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        game_board: board,
        topic,
        ai_role: aiRole,
        viable_parent_ids: viableParentIds(board),
      }),
      signal: AbortSignal.timeout(25000),
    });
    if (!res.ok) return null;
    const d: any = await res.json();
    const parentId = d?.parent_id;
    const text = (d?.text || "").toString().trim();
    if (parentId && text && board[parentId]) return { parentId, text };
    return null;
  } catch {
    return null;
  }
}

/**
 * Place one co-player rebuttal after the participant confirms a tile. Tries the live
 * agent (reasonable sparring partner); falls back to a canned rebuttal off the human's
 * tile. No-op if the board is full of AI replies or there's no free edge.
 */
export async function placeAiReply(opts: {
  io: Server;
  gameCode: string;
  gameId: string;
  board: Record<string, Tile>;
  humanTileId: string;
  aiRole: "plus" | "minus";
  topic: string;
}): Promise<void> {
  const { io, gameCode, gameId, board, humanTileId, aiRole, topic } = opts;

  const priorReplies = Object.values(board).filter((t) => (t as any)._ai).length;
  if (priorReplies >= MAX_AI_REPLIES) return;

  await new Promise((r) => setTimeout(r, REPLY_DELAY_MS));

  // Live-first: the agent chooses which tile to answer and what to say.
  let parentId: string | null = null;
  let text: string | null = null;
  const live = await liveCoPlayerTile(board, topic, aiRole);
  if (live) {
    parentId = live.parentId;
    text = live.text;
  } else if (board[humanTileId]) {
    parentId = humanTileId;
    text = REBUTTALS[priorReplies % REBUTTALS.length];
  }
  if (!parentId || !text) return;

  const edge = pickFreeEdge(board, parentId);
  if (edge == null) return;

  const maxId = Object.keys(board).reduce((m, id) => Math.max(m, parseInt(id) || 0), 0);
  const newTileId = (maxId + 1).toString();

  const tile: Tile & { _ai?: boolean } = {
    tileId: newTileId,
    parentId,
    parentEdge: edge,
    children: [],
    player: aiRole,
    text,
    emoji: null,
    confirmed: true,
    _ai: true,
  };

  await ddbClient.send(
    new UpdateCommand({
      TableName: "Games",
      Key: { gameId },
      UpdateExpression:
        "SET gameBoard.#new = :tile, gameBoard.#parent.children = list_append(gameBoard.#parent.children, :childId)",
      ExpressionAttributeNames: { "#new": newTileId, "#parent": parentId },
      ExpressionAttributeValues: { ":tile": tile, ":childId": [newTileId] },
    })
  );

  io.in(gameCode).emit("placeTile", { userId: AI_USER_ID, tile });
  io.in(gameCode).emit("confirmTile", { userId: AI_USER_ID, tileId: newTileId, text });
}
