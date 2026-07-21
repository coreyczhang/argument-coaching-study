import type { AiFeedback, Tile } from "~/types";

type EvaluateInput = {
  tile: Tile;
  topic: string;
  gameBoard: Record<string, Tile>;
};

type FeedbackActionInput = {
  tileId: string | null;
  action: "accepted" | "dismissed";
  originalSuggestion?: string | null;
  editedSuggestion?: string | null;
  // Extended research logging fields (AI_FEEDBACK_LOGGING_REQUIREMENTS.md)
  gameId?: string | null;
  aiFeedback?: {
    schema_version?: string | null;
    model_name?: string | null;
    prompt_versions?: Record<string, string> | null;
    threshold_version?: string | null;
    error_types?: string[] | null;
    first_wave_categories?: string[] | null;
    errors_found?: boolean | null;
    display_feedback?: boolean | null;
    display_reason?: string | null;
    feedback?: string | null;
    suggestion?: string | null;
    suggestion_source?: string | null;
    suggestion_preserves_stance?: boolean | null;
  } | null;
};

export function logFeedbackAction({
  tileId,
  action,
  originalSuggestion,
  editedSuggestion,
  gameId,
  aiFeedback,
}: FeedbackActionInput): void {
  const runtimeConfig = useRuntimeConfig();
  const base =
    (runtimeConfig.public.NUXT_PUBLIC_AI_EVAL_URL as string | undefined)
      ?.replace("/evaluate", "") ?? "http://127.0.0.1:8000";

  // Fire-and-forget — never block gameplay for a log write
  fetch(`${base}/feedback-action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tile_id: tileId,
      action,
      original_suggestion: originalSuggestion ?? null,
      edited_suggestion: editedSuggestion ?? null,
      game_id: gameId ?? null,
      // Spread full AI evaluation metadata for research analysis
      ...(aiFeedback ? {
        schema_version: aiFeedback.schema_version ?? null,
        model_name: aiFeedback.model_name ?? null,
        prompt_versions: aiFeedback.prompt_versions ?? null,
        threshold_version: aiFeedback.threshold_version ?? null,
        error_types: aiFeedback.error_types ?? null,
        first_wave_categories: aiFeedback.first_wave_categories ?? null,
        errors_found: aiFeedback.errors_found ?? null,
        display_feedback: aiFeedback.display_feedback ?? null,
        display_reason: aiFeedback.display_reason ?? null,
        feedback: aiFeedback.feedback ?? null,
        suggestion: aiFeedback.suggestion ?? null,
        suggestion_source: aiFeedback.suggestion_source ?? null,
        suggestion_preserves_stance: aiFeedback.suggestion_preserves_stance ?? null,
      } : {}),
    }),
  }).catch(() => {
    // Silently swallow — logging must never crash the game
  });
}

export async function evaluateAiFeedback({
  tile,
  topic,
  gameBoard,
}: EvaluateInput): Promise<AiFeedback> {
  const runtimeConfig = useRuntimeConfig();
  const endpoint =
    runtimeConfig.public.NUXT_PUBLIC_AI_EVAL_URL ||
    "http://127.0.0.1:8000/evaluate";

  const controller = new AbortController();
  // The live four-agent pipeline can take a while on Gemini, especially when
  // multiple stages need to reason and rewrite. Since the demo must always use
  // the real pipeline, wait longer instead of degrading or failing early.
  const timeout = window.setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tile,
        game_board: gameBoard,
        topic,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`AI evaluator returned ${response.status}`);
    }

    return (await response.json()) as AiFeedback;
  } catch (error) {
    console.error("Live AI evaluation failed:", error);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("The live AI evaluation timed out.");
    }
    throw error instanceof Error
      ? error
      : new Error("The live AI evaluation failed.");
  } finally {
    window.clearTimeout(timeout);
  }
}
