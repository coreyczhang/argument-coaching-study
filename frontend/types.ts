export interface Tile {
  tileId: string; // tile id starting from "0"
  parentId: string | null;
  parentEdge: number | null;
  children: string[]; // array of child tile ids
  player: "plus" | "minus" | null;
  text: string;
  emoji: 'thumbs-up' | 'shared-facts' | 'wine' | 'scale' | null;
  ruleCard: string | null;
  confirmed: boolean;
  revised: boolean;
  /** Set to true on tiles placed by the AI co-player so the UI can badge them */
  isAiPlaced?: boolean;
  /** Transient: true while the AI is actively "writing" this tile (reading phase done, text incoming) */
  isAiWriting?: boolean;
  /** Transient: true on the parent tile while the AI is writing a response to it */
  isAiTarget?: boolean;
}

export type FirstWaveCategory =
  // original
  | 'needs_more_detail'
  | 'too_broad'
  | 'causal_leap'
  | 'needs_clearer_connection'
  // 9-check additions
  | 'personal_attack'
  | 'not_a_statement'
  | 'exaggeration'
  | 'weak_evidence'
  | 'straw_man'
  | 'off_topic';

export type ReasoningCheckDetail = {
  detected: boolean;
  trigger_phrase: string | null;
  explanation: string | null;
};

export interface AiFeedback {
  tileId: string;
  // pipeline metadata (present on live evaluator responses)
  schema_version?: string;
  evaluated_at?: string | null;
  model_name?: string | null;
  pipeline_mode?: string | null;
  prompt_versions?: Record<string, string>;
  threshold_version?: string | null;
  // display decision — authoritative gate for showing feedback (FR-05, BE-02)
  display_feedback?: boolean;
  display_reason?: string | null;
  // evaluation output
  feedback: string | null;
  suggestion: string | null;
  suggestion_source?: 'explanation_agent' | 'clarify_agent' | 'none' | null;
  suggestion_confidence?: 'high' | 'medium' | 'low' | null;
  suggestion_preserves_stance?: boolean | null;
  errors_found: boolean;
  error_types: Array<
    | 'overgeneralization'
    | 'false_causation'
    | 'irrelevant_rebuttal'
    | 'clarification_needed'
    | 'personal_attack'
    | 'not_a_statement'
    | 'exaggeration'
    | 'straw_man'
    | 'appeal_to_authority'
    | 'anecdotal_data'
    | 'whataboutism_red_herring'
  >;
  first_wave_categories?: FirstWaveCategory[];
  clarify?: {
    clarification_needed: boolean;
    reason?: string;
    rewrites: string[];
  };
  structure?: {
    relationship?: "SUPPORTS" | "REBUTS" | "IRRELEVANT";
    reason?: string;
  };
  reasoning?: {
    overgeneralization?: boolean;
    false_causation?: boolean;
    reason?: string;
    errors_found?: boolean;
    violations?: string[];
    checks?: Record<string, ReasoningCheckDetail>;
  };
}

export type GamePlayer = {
  userId: string;
  name: string;
  role: "plus" | "minus" | null;
  money: number;
};

export type Game = {
  gameId: string;
  code: string;
  date: string;
  hostId: string;
  gameStatus: "waiting" | "in-progress" | "finished";
  topic: {
    text: string;
    revised: boolean;
  };
  players: GamePlayer[];
  gameBoard: Record<string, any>; // not used here yet
};

export type Position = {
  x: number;
  y: number;
};

export type CollapsedThread = {
  parentId: string;
  childId: string;
  edge: number;
  pos: Position;
  tiles: Tile[];
}

export type Stance = -2 | -1 | 0 | 1 | 2;

export type AgreementStatus = {
  userId: string;
  acknowledged: boolean[];
}
