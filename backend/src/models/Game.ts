import { Tile } from "./Tile";

export interface GamePlayer {
  userId: string;
  name: string;
  role: "minus" | "plus";
  money: number;
  acknowledged?: boolean[]; 
}

export type GameActionType =
  | "PLACE_TILE"
  | "CONFIRM_TILE"
  | "AI_FEEDBACK"
  | "PLACE_EMOJI"
  | "UNDO_PLACE_EMOJI"
  | "REVISE_TOPIC_PROPOSAL"
  | "REJECT_TOPIC_PROPOSAL"
  | "REVISE_TOPIC"
  // | "PLACE_RULE_CARD"
  // | "REVISE_TILE";


export interface GameAction {
  type: GameActionType;
  actorRole: string;   // role of user who triggered it
}

export interface AiEvaluationRecord {
  tileId: string;
  tileText: string;
  parentText: string | null;
  userId: string;
  actorRole: string;
  topic: string | null;
  schemaVersion?: string;
  modelName?: string | null;
  pipelineMode?: string | null;
  promptVersions?: Record<string, string>;
  errorTypes: string[];
  firstWaveCategories?: string[];
  errorsFound: boolean;
  feedback: string | null;
  suggestion: string | null;
  suggestionSource?: string | null;
  suggestionConfidence?: string | null;
  suggestionPreservesStance?: boolean | null;
  feedbackShown?: boolean;
  experimentCondition?: string | null;
  structure?: Record<string, unknown>;
  reasoning?: Record<string, unknown>;
  clarify?: Record<string, unknown>;
  createdAt: string;
}

export interface Game {
  gameId: string;
  code: string; // rename to gameCode
  date: Date;
  hostId: string;
  gameStatus: "waiting" | "in-progress" | "finished";
  topic: {
    text: string;
    revised: boolean;
  }
  players: GamePlayer[];
  gameBoard: Record<string, Tile>; // key is tileId,
  gameLog: GameAction[]
  aiEvaluations?: AiEvaluationRecord[];
}
