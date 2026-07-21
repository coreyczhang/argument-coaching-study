import fs from "fs";
import path from "path";

type TopicValue = string | { text?: string; revised?: boolean } | null;

type PlayerRecord = {
  userId?: string | null;
  role?: string | null;
  money?: number;
  acknowledged?: boolean[];
  playerLabel?: string;
};

type TileRecord = {
  tileId?: string;
  parentId?: string | null;
  parentEdge?: number | null;
  children?: string[];
  player?: string | null;
  text?: string;
  emoji?: string | null;
  confirmed?: boolean;
};

type GameRecord = {
  gameId: string;
  date: string | null;
  status: string | null;
  topic: TopicValue;
  hostId: string | null;
  players: PlayerRecord[];
  gameBoard: Record<string, TileRecord>;
  gameLog: unknown[];
};

const EXPORT_DIR = path.resolve(process.cwd(), "exports");
const INPUT_PATH = path.join(EXPORT_DIR, "anonymized_games.json");
const SUMMARY_OUTPUT_PATH = path.join(EXPORT_DIR, "anonymized_games_summary.csv");
const TILES_OUTPUT_PATH = path.join(EXPORT_DIR, "anonymized_game_tiles.csv");

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return "";
  const stringValue = String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function toCsv(rows: Array<Record<string, unknown>>): string {
  if (rows.length === 0) return "";

  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(",")),
  ];
  return lines.join("\n");
}

function getTopicText(topic: TopicValue): string {
  if (!topic) return "";
  if (typeof topic === "string") return topic;
  return topic.text ?? "";
}

function convert() {
  const raw = fs.readFileSync(INPUT_PATH, "utf-8");
  const parsed = JSON.parse(raw) as {
    exportedAt: string;
    gameCount: number;
    uniqueUserCount: number;
    games: GameRecord[];
  };

  const gameSummaryRows = parsed.games.map((game) => ({
    gameId: game.gameId,
    date: game.date ?? "",
    status: game.status ?? "",
    topicText: getTopicText(game.topic),
    topicRevised:
      typeof game.topic === "object" && game.topic !== null
        ? Boolean(game.topic.revised)
        : "",
    hostId: game.hostId ?? "",
    playerCount: game.players.length,
    players: game.players
      .map((player) => `${player.playerLabel ?? ""}:${player.userId ?? ""}:${player.role ?? ""}`)
      .join(" | "),
    tileCount: Object.keys(game.gameBoard ?? {}).length,
    gameLogCount: Array.isArray(game.gameLog) ? game.gameLog.length : 0,
  }));

  const tileRows = parsed.games.flatMap((game) =>
    Object.values(game.gameBoard ?? {}).map((tile) => ({
      gameId: game.gameId,
      date: game.date ?? "",
      topicText: getTopicText(game.topic),
      tileId: tile.tileId ?? "",
      parentId: tile.parentId ?? "",
      parentEdge: tile.parentEdge ?? "",
      player: tile.player ?? "",
      text: tile.text ?? "",
      emoji: tile.emoji ?? "",
      confirmed: tile.confirmed ?? "",
      childCount: Array.isArray(tile.children) ? tile.children.length : 0,
      children: Array.isArray(tile.children) ? tile.children.join("|") : "",
    }))
  );

  fs.writeFileSync(SUMMARY_OUTPUT_PATH, toCsv(gameSummaryRows));
  fs.writeFileSync(TILES_OUTPUT_PATH, toCsv(tileRows));

  console.log(`Wrote ${SUMMARY_OUTPUT_PATH}`);
  console.log(`Wrote ${TILES_OUTPUT_PATH}`);
}

convert();
