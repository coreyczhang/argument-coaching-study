import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

const client = DynamoDBDocumentClient.from(
  new DynamoDBClient({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  })
);

const TABLE_NAME = "Games";
const OUTPUT_DIR = path.resolve(process.cwd(), "exports");
const OUTPUT_PATH = path.join(OUTPUT_DIR, "anonymized_games.json");

type GameRecord = {
  gameId: string;
  code?: string;
  date?: string;
  hostId?: string;
  status?: string;
  topic?: unknown;
  players?: Array<{
    userId?: string;
    name?: string;
    role?: string;
    money?: number;
    acknowledged?: boolean[];
  }>;
  gameBoard?: Record<string, unknown>;
  gameLog?: unknown[];
  aiEvaluations?: Array<{
    tileId?: string;
    tileText?: string;
    parentText?: string | null;
    userId?: string;
    actorRole?: string;
    topic?: string | null;
    schemaVersion?: string;
    modelName?: string | null;
    pipelineMode?: string | null;
    promptVersions?: Record<string, string>;
    errorTypes?: string[];
    firstWaveCategories?: string[];
    errorsFound?: boolean;
    feedback?: string | null;
    suggestion?: string | null;
    suggestionSource?: string | null;
    suggestionConfidence?: string | null;
    suggestionPreservesStance?: boolean | null;
    feedbackShown?: boolean;
    experimentCondition?: string | null;
    structure?: Record<string, unknown>;
    reasoning?: Record<string, unknown>;
    clarify?: Record<string, unknown>;
    createdAt?: string;
  }>;
};

const aliasMap = new Map<string, string>();
let aliasCounter = 1;

function getAlias(userId: string | undefined) {
  if (!userId) return null;
  if (!aliasMap.has(userId)) {
    aliasMap.set(userId, `anonUser${String(aliasCounter).padStart(4, "0")}`);
    aliasCounter += 1;
  }
  return aliasMap.get(userId)!;
}

function anonymizeGame(game: GameRecord) {
  const anonymizedPlayers = (game.players ?? []).map((player, index) => ({
    userId: getAlias(player.userId),
    role: player.role ?? null,
    money: player.money ?? 0,
    acknowledged: player.acknowledged ?? [],
    playerLabel: `player${index + 1}`,
  }));
  const anonymizedAiEvaluations = (game.aiEvaluations ?? []).map((evaluation) => ({
    tileId: evaluation.tileId ?? null,
    tileText: evaluation.tileText ?? null,
    parentText: evaluation.parentText ?? null,
    userId: getAlias(evaluation.userId),
    actorRole: evaluation.actorRole ?? null,
    topic: evaluation.topic ?? null,
    schemaVersion: evaluation.schemaVersion ?? null,
    modelName: evaluation.modelName ?? null,
    pipelineMode: evaluation.pipelineMode ?? null,
    promptVersions: evaluation.promptVersions ?? {},
    errorTypes: evaluation.errorTypes ?? [],
    firstWaveCategories: evaluation.firstWaveCategories ?? [],
    errorsFound: evaluation.errorsFound ?? false,
    feedback: evaluation.feedback ?? null,
    suggestion: evaluation.suggestion ?? null,
    suggestionSource: evaluation.suggestionSource ?? null,
    suggestionConfidence: evaluation.suggestionConfidence ?? null,
    suggestionPreservesStance: evaluation.suggestionPreservesStance ?? null,
    feedbackShown: evaluation.feedbackShown ?? false,
    experimentCondition: evaluation.experimentCondition ?? null,
    structure: evaluation.structure ?? {},
    reasoning: evaluation.reasoning ?? {},
    clarify: evaluation.clarify ?? {},
    createdAt: evaluation.createdAt ?? null,
  }));

  return {
    gameId: game.gameId,
    date: game.date ?? null,
    status: game.status ?? null,
    topic: game.topic ?? null,
    hostId: getAlias(game.hostId),
    players: anonymizedPlayers,
    gameBoard: game.gameBoard ?? {},
    gameLog: game.gameLog ?? [],
    aiEvaluations: anonymizedAiEvaluations,
  };
}

async function exportGames() {
  const items: GameRecord[] = [];
  let ExclusiveStartKey: Record<string, unknown> | undefined;

  do {
    const res = await client.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        ExclusiveStartKey,
      })
    );

    items.push(...((res.Items as GameRecord[]) || []));
    ExclusiveStartKey = res.LastEvaluatedKey as
      | Record<string, unknown>
      | undefined;
  } while (ExclusiveStartKey);

  const anonymizedGames = items.map(anonymizeGame);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(
    OUTPUT_PATH,
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        gameCount: anonymizedGames.length,
        uniqueUserCount: aliasMap.size,
        games: anonymizedGames,
      },
      null,
      2
    )
  );

  console.log(`Exported ${anonymizedGames.length} anonymized games`);
  console.log(`Wrote ${OUTPUT_PATH}`);
}

exportGames().catch((error) => {
  console.error("Failed to export anonymized games:", error);
  process.exit(1);
});
