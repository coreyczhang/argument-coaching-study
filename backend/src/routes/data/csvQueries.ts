import { Request, Response } from "express";
import { ddbClient } from "../../dbClient";
import { ScanCommand } from "@aws-sdk/client-dynamodb";

const isAttrVal = (v: any) =>
  v &&
  typeof v === "object" &&
  (v.S !== undefined ||
    v.N !== undefined ||
    v.M !== undefined ||
    v.L !== undefined ||
    v.BOOL !== undefined ||
    v.NULL !== undefined);

// Recursively decode AttributeValue -> plain JS (works with DocClient/plain too)
const decodeAttr = (v: any): any => {
  if (v == null) return v;
  if (!isAttrVal(v)) return v; // already plain (DocumentClient)
  if (v.S !== undefined) return v.S;
  if (v.N !== undefined) return Number(v.N);
  if (v.BOOL !== undefined) return Boolean(v.BOOL);
  if (v.NULL !== undefined && v.NULL) return null;
  if (v.L !== undefined) return v.L.map(decodeAttr);
  if (v.M !== undefined) {
    const out: Record<string, any> = {};
    for (const k of Object.keys(v.M)) out[k] = decodeAttr(v.M[k]);
    return out;
  }
  return v;
};

// --- simple field accessors for mixed shapes ---
const getS = (v: any): string | null => {
  if (!v && v !== 0) return null;
  if (!isAttrVal(v)) return typeof v === "string" ? v : String(v);
  if (v.S !== undefined) return v.S;
  if (v.N !== undefined) return String(v.N);
  return null;
};

const getM = (v: any): Record<string, any> | null => (v && v.M ? v.M : null);

const parseDateMs = (v: any): number => {
  const raw = isAttrVal(v)
    ? v.S ?? (v.N !== undefined ? String(v.N) : null)
    : v;
  if (raw == null) return 0;
  const t = new Date(String(raw)).getTime();
  return Number.isFinite(t) ? t : 0;
};

// (Currently unused here, but kept for consistency)
const toChicago = (ms: number): string => {
  if (!Number.isFinite(ms) || ms <= 0) return "";
  const d = new Date(ms);
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Chicago",
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZoneName: "short",
    }).format(d);
  } catch {
    return d.toISOString();
  }
};

const EXCLUDED_HOST_IDS = new Set<string>([
  "b1bbb5b0-e071-7058-9bad-e9dfa248c4db",
  "015bf510-00b1-7087-341a-9bc2ff8dc044",
  "119b65b0-20f1-70fb-e91d-f0a905074a23",
  "412b55e0-9041-7060-df90-10d61891d9a3",
  "81fb2530-4051-705e-1a85-4bcf31356c12",
  "f1cb05c0-2011-70a0-d8b0-cceba38c781e",
  "618bb570-f041-70b4-e260-19f0d8f73f95",
]);

// CSV row type
type FlatGameRow = {
  GameNum: number;
  TileID: string | null;
  Player: string | null; // "Topic", "+", "-" or null
  ResolutionType: string | null; // keep null for now
  TextEntry: string | null;
  CertaintyText: string | null; // keep null for now
  ThreadNum: number;
  TileType: "Topic" | "Starter_Reason" | "Rebuttal";
  TileNum: number; // now: global placement order for tiles
  CertaintyThread: string | null; // leave empty for now
};

// Given a decoded gameBoard object, return [topicTileId, topicTile] or null
const findTopicTile = (
  board: Record<string, any> | null
): [string, any] | null => {
  if (!board) return null;
  for (const [id, t] of Object.entries(board)) {
    if (t && (t as any).parentId == null) return [id, t];
  }
  return null;
};

// Simpler, robust TileType classification:
// - Topic: parentId == null
// - Starter_Reason: parentId === topicId
// - Rebuttal: everything else
const classifyTileType = (
  tile: any,
  topicId: string
): "Topic" | "Starter_Reason" | "Rebuttal" => {
  if (tile.parentId == null) return "Topic";
  if (tile.parentId === topicId) return "Starter_Reason";
  return "Rebuttal";
};

const formatPlayerForCsv = (tile: any): string | null => {
  if (tile.parentId == null) return "Topic";
  if (tile.player === "plus") return "+";
  if (tile.player === "minus") return "-";
  return null;
};

// Main handler: flatten each game into tile rows -----------------------

export const queryGamesCsvStyle = async (req: Request, res: Response) => {
  // FIND-01: defence-in-depth admin check (middleware already verifies auth)
  if (!req.user || (req.user as any).role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  try {
    const TableName = "Games";

    // Optional filter: ?since=YYYY-MM-DD (or full ISO date string)
    let sinceMs = 0;
    if (req.query.since) {
      const parsed = new Date(String(req.query.since)).getTime();
      if (Number.isFinite(parsed)) sinceMs = parsed;
    }

    const ProjectionExpression =
      "#gid, #code, #date, #players, #topic, #gameLog, #hostId, #board, #status";
    const ExpressionAttributeNames = {
      "#gid": "gameId",
      "#code": "code",
      "#date": "date",
      "#players": "players",
      "#topic": "topic",
      "#gameLog": "gameLog",
      "#hostId": "hostId",
      "#board": "gameBoard",
      "#status": "status",
    };

    const items: any[] = [];
    let ExclusiveStartKey: Record<string, any> | undefined;

    do {
      const page = await ddbClient.send(
        new ScanCommand({
          TableName,
          ProjectionExpression,
          ExpressionAttributeNames,
          ExclusiveStartKey,
        })
      );
      if (page.Items) items.push(...page.Items);
      ExclusiveStartKey = page.LastEvaluatedKey;
    } while (ExclusiveStartKey);

    // 1) Decode & filter out excluded hosts + only "in-progress" + since filter
    const decoded = items
      .map((it) => {
        const createdMs = parseDateMs(it.date);
        const hostId = getS(it.hostId);
        const status = getS(it.status);
        return {
          raw: it,
          hostId,
          createdMs,
          status,
        };
      })
      .filter(
        (g) =>
          g.hostId &&
          !EXCLUDED_HOST_IDS.has(g.hostId) &&
          g.status === "in-progress" &&
          g.createdMs > 0 &&
          g.createdMs >= sinceMs
      )
      .sort((a, b) => b.createdMs - a.createdMs); // newest first

    // 2) Flatten each game into CSV-style rows
    const allRows: FlatGameRow[] = [];
    let gameNum = 0;

    for (const g of decoded) {
      gameNum++;

      const it = g.raw;
      const board = decodeAttr(it.gameBoard) as Record<string, any> | null;
      if (!board || Object.keys(board).length === 0) continue;

      const [topicId, topicTile] = findTopicTile(board) ?? [null, null];
      if (!topicId || !topicTile) continue;

      // Topic text comes from Game.topic
      const decodedTopic = decodeAttr(it.topic);
      let topicText: string | null = null;
      if (typeof decodedTopic === "string") {
        topicText = decodedTopic;
      } else if (
        decodedTopic &&
        typeof decodedTopic === "object" &&
        "text" in decodedTopic
      ) {
        topicText = decodedTopic.text
          ? String((decodedTopic as any).text)
          : null;
      }

      // --- Build global tile placement order from gameLog ---
      const decodedLog = decodeAttr(it.gameLog) as any[] | null;
      const tileOrder: Record<string, number> = {};
      let globalCounter = 0;

      if (Array.isArray(decodedLog)) {
        for (const entry of decodedLog) {
          if (!entry || typeof entry !== "object") continue;
          if (entry.type !== "PLACE_TILE") continue;

          // NOTE: We assume real actions have a tileId somewhere;
          // this is defensive and won't crash if it's missing.
          const tileIdFromAction: string | undefined =
            (entry.tileId as string | undefined) ??
            (entry.payload && (entry.payload.tileId as string | undefined));

          if (!tileIdFromAction) continue;
          if (tileOrder[tileIdFromAction] == null) {
            tileOrder[tileIdFromAction] = ++globalCounter;
          }
        }
      }

      // We’ll also have a fallback counter for any tiles not found in tileOrder
      let fallbackCounter = globalCounter;

      const rows: FlatGameRow[] = [];

      // Topic row: GameNum, ThreadNum = 0
      const topicTileId = topicTile.tileId ?? String(topicId);
      const topicTileNum =
        tileOrder[topicTileId] != null ? tileOrder[topicTileId] : 0;

      rows.push({
        GameNum: gameNum,
        TileID: topicTileId,
        Player: formatPlayerForCsv(topicTile),
        ResolutionType: null, // resolutionType ignored for now
        TextEntry: topicText,
        CertaintyText: null,
        ThreadNum: 0,
        TileType: "Topic",
        TileNum: topicTileNum,
        CertaintyThread: null,
      });

      // For threads: each child of the topic starts a new thread
      let nextThreadNum = 1;

      const traverseThread = (startTileId: string, threadNum: number) => {
        const queue: string[] = [startTileId];

        while (queue.length) {
          const id = queue.shift()!;
          const tile = board[id];
          if (!tile) continue;

          const tileId = tile.tileId ?? String(id);

          // Primary: use order from gameLog; fallback: sequential after known ones
          let tileNum = tileOrder[tileId];
          if (tileNum == null) {
            tileNum = ++fallbackCounter;
            tileOrder[tileId] = tileNum;
          }

          rows.push({
            GameNum: gameNum,
            TileID: tileId,
            Player: formatPlayerForCsv(tile),
            ResolutionType: null,
            TextEntry: tile.text ?? null,
            CertaintyText: null,
            ThreadNum: threadNum,
            TileType: classifyTileType(tile, topicId),
            TileNum: tileNum,
            CertaintyThread: null,
          });

          // Enqueue children to stay in the same thread
          if (Array.isArray(tile.children)) {
            for (const childId of tile.children) {
              if (board[childId]) queue.push(childId);
            }
          }
        }
      };

      if (Array.isArray(topicTile.children)) {
        for (const childId of topicTile.children) {
          const threadNum = nextThreadNum++;
          traverseThread(childId, threadNum);
        }
      }

      allRows.push(...rows);
    }

    res.json(allRows);
  } catch (err) {
    console.error("Failed to fetch CSV-style games:", err);
    res.status(500).json({ error: "Failed to fetch games in CSV format" });
  }
};
