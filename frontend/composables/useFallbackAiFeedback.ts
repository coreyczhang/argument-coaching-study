import type { AiFeedback, FirstWaveCategory, Tile } from "~/types";

type EvaluateInput = {
  tile: Tile;
  topic: string;
  gameBoard: Record<string, Tile>;
};

// Fallback evaluator — regex only, used when the Gemini backend is unavailable.
// Intentionally conservative: only flags patterns that are clear-cut at the
// lexical level. The real Gemini pipeline (9-check system) handles the rest.

const OVERGENERALIZATION_PATTERNS = [
  /\b(all|always|never|everyone|nobody|no one|every student|everybody)\b/i,
  /\bmost\s+\w+/i,
];

const FALSE_CAUSATION_PATTERNS = [
  /\b(causes?|caused|results? in|leads? to|creates?)\b/i,
];

// Only flag genuinely vague/empty claims — not just short ones
const VAGUE_PATTERNS = [
  /^(this|that|it)\s+(is|isn't|was|wasn't)\s+(bad|good|wrong|right|better|worse)[.!?]*$/i,
  /^(bad|good|wrong|unfair|harmful|problematic)[.!?]*$/i,
];

// Only produce a suggestion when we can make a real word-level fix
// (overgeneralization or false causation). Return null otherwise.
function buildSuggestion(text: string, errorTypes: AiFeedback["error_types"]): string | null {
  let suggestion = text.trim();
  let changed = false;

  if (errorTypes.includes("overgeneralization")) {
    const next = suggestion
      .replace(/\b(all|always|never|everyone|nobody|no one)\b/gi, "some")
      .replace(/\bmost\b/gi, "many");
    if (next !== suggestion) { suggestion = next; changed = true; }
  }

  if (errorTypes.includes("false_causation")) {
    const next = suggestion.replace(
      /\b(causes?|caused|results? in|leads? to|creates?)\b/gi,
      "can contribute to"
    );
    if (next !== suggestion) { suggestion = next; changed = true; }
  }

  if (!changed) return null;
  const trimmed = suggestion.trim();
  return trimmed.length <= 100 ? trimmed : null;
}

function toFirstWaveCategories(types: AiFeedback["error_types"]): FirstWaveCategory[] {
  const categories: FirstWaveCategory[] = [];
  if (types.includes("clarification_needed")) categories.push("needs_more_detail");
  if (types.includes("overgeneralization"))   categories.push("too_broad");
  if (types.includes("false_causation"))      categories.push("causal_leap");
  if (types.includes("irrelevant_rebuttal"))  categories.push("needs_clearer_connection");
  if (types.includes("personal_attack"))      categories.push("personal_attack");
  if (types.includes("not_a_statement"))      categories.push("not_a_statement");
  if (types.includes("exaggeration"))         categories.push("exaggeration");
  if (types.includes("straw_man"))            categories.push("straw_man");
  if (
    types.includes("appeal_to_authority") ||
    types.includes("anecdotal_data")
  )                                           categories.push("weak_evidence");
  if (types.includes("whataboutism_red_herring")) categories.push("off_topic");
  return categories;
}

export function evaluateFallbackAiFeedback({
  tile,
  topic,
  gameBoard,
}: EvaluateInput): AiFeedback {
  const text = tile.text.trim();
  const errorTypes: AiFeedback["error_types"] = [];

  // Overgeneralization — explicit universal/majority quantifier
  if (OVERGENERALIZATION_PATTERNS.some((p) => p.test(text))) {
    errorTypes.push("overgeneralization");
  }

  // False causation — explicit confident causal verb + causal linking word
  // Extreme causal verbs (kills/destroys/ruins) trigger without linking word
  const EXTREME_CAUSAL = /\b(kills?|destroys?|ruins?)\b/i;
  if (
    EXTREME_CAUSAL.test(text) ||
    (FALSE_CAUSATION_PATTERNS.some((p) => p.test(text)) &&
      /\b(because|since|therefore|that's why|so)\b/i.test(text))
  ) {
    errorTypes.push("false_causation");
  }

  // Not a statement — questions are not valid debate tiles
  if (/[?]$/.test(text) || /^(don't|doesn't|isn't|aren't|won't|wouldn't|shouldn't|can't|couldn't|did|do|does|is|are|was|were|have|has|will|would|should|could|can)\s/i.test(text)) {
    errorTypes.push("not_a_statement");
  }

  // Clarification needed — only truly empty or obviously vague
  if (text.length < 10 || VAGUE_PATTERNS.some((p) => p.test(text))) {
    errorTypes.push("clarification_needed");
  }

  // Personal attack, straw man, anecdotal data, whataboutism, appeal to authority,
  // and exaggeration are NOT checked in fallback — lexical patterns produce too many
  // false positives. The Gemini 9-check pipeline handles these accurately.

  const uniqueErrorTypes = [...new Set(errorTypes)];
  const errorsFound = uniqueErrorTypes.length > 0;

  if (!errorsFound) {
    return {
      tileId: tile.tileId,
      display_feedback: false,
      display_reason: "no_feedback_needed",
      feedback: null,
      suggestion: null,
      suggestion_source: "none",
      suggestion_confidence: null,
      suggestion_preserves_stance: null,
      errors_found: false,
      error_types: [],
      first_wave_categories: [],
      clarify: { clarification_needed: false, rewrites: [] },
    };
  }

  const feedbackParts: string[] = [];
  if (uniqueErrorTypes.includes("overgeneralization")) {
    feedbackParts.push("This claim is broader than the evidence supports — try narrowing the scope.");
  }
  if (uniqueErrorTypes.includes("false_causation")) {
    feedbackParts.push("This claim assumes a causal link that needs more support.");
  }
  if (uniqueErrorTypes.includes("not_a_statement")) {
    feedbackParts.push("Arguments must be statements, not questions — rephrase as a claim.");
  }
  if (uniqueErrorTypes.includes("clarification_needed")) {
    feedbackParts.push("Try being more specific so other players can respond to your point.");
  }

  const suggestion = buildSuggestion(text, uniqueErrorTypes);
  const displayReason =
    uniqueErrorTypes.includes("overgeneralization") || uniqueErrorTypes.includes("false_causation")
      ? "reasoning_issue"
      : uniqueErrorTypes.includes("not_a_statement")
      ? "reasoning_issue"
      : uniqueErrorTypes.includes("clarification_needed")
      ? "clarification_needed"
      : "irrelevant_to_parent";

  return {
    tileId: tile.tileId,
    display_feedback: true,
    display_reason: displayReason,
    feedback: feedbackParts.join(" "),
    suggestion,
    suggestion_source: suggestion ? "clarify_agent" : "none",
    suggestion_confidence: suggestion ? "medium" : null,
    suggestion_preserves_stance: suggestion ? true : null,
    errors_found: true,
    error_types: uniqueErrorTypes,
    first_wave_categories: toFirstWaveCategories(uniqueErrorTypes),
    clarify: {
      clarification_needed: uniqueErrorTypes.includes("clarification_needed"),
      rewrites: [],
    },
  };
}
