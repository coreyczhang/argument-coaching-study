# AI Output Schema

This document defines the current response shape for the `/evaluate` endpoint.

## Purpose

- give the frontend a stable contract for AI feedback
- give research/export work a defined set of fields to log
- make prompt and model changes traceable across evaluations

## Top-Level Fields

| Field | Type | Notes |
| --- | --- | --- |
| `tileId` | `string \| null` | Tile being evaluated |
| `schema_version` | `string` | Version for the response contract |
| `evaluated_at` | `string \| null` | UTC ISO timestamp |
| `model_name` | `string \| null` | Active Gemini model |
| `pipeline_mode` | `"combined_analysis" \| "fallback_split" \| null` | Which orchestration path produced the result |
| `prompt_versions` | `object` | Prompt version metadata by stage |
| `threshold_version` | `string \| null` | Version for feedback-display policy |
| `display_feedback` | `boolean` | Whether corrective feedback should be shown |
| `display_reason` | `string \| null` | Why feedback is or is not shown |
| `structure` | `object` | Relationship-to-parent result |
| `reasoning` | `object` | Reasoning agent result |
| `clarify` | `object` | Clarity agent result |
| `error_types` | `string[]` | Normalized error labels |
| `first_wave_categories` | `string[]` | User-facing first-wave category mapping |
| `feedback` | `string \| null` | User-facing explanation |
| `suggestion` | `string \| null` | Suggested rewrite |
| `suggestion_source` | `"explanation_agent" \| "clarify_agent" \| "none" \| null` | Which stage produced the rewrite |
| `suggestion_confidence` | `"high" \| "medium" \| "low" \| null` | Confidence that the rewrite is safe to show |
| `suggestion_preserves_stance` | `boolean \| null` | Whether the rewrite preserved the original side/intent |
| `errors_found` | `boolean` | Whether the user should receive corrective feedback |

## Nested Objects

### `structure`

```json
{
  "relationship": "SUPPORTS",
  "reason": "one sentence explanation"
}
```

### `reasoning`

```json
{
  "overgeneralization": false,
  "false_causation": false,
  "reason": "one sentence explanation",
  "errors_found": false
}
```

### `clarify`

```json
{
  "clarification_needed": false,
  "reason": "one sentence explanation",
  "rewrites": []
}
```

## Example Response

```json
{
  "tileId": "tile-123",
  "schema_version": "2026-04-16",
  "evaluated_at": "2026-04-16T18:22:31.155849+00:00",
  "model_name": "gemini-2.5-flash",
  "pipeline_mode": "combined_analysis",
  "prompt_versions": {
    "analysis": "2026-04-16",
    "structure": "2026-04-16",
    "reasoning": "2026-04-16",
    "clarify": "2026-04-16",
    "explanation": "2026-04-16"
  },
  "threshold_version": "2026-04-17",
  "display_feedback": true,
  "display_reason": "reasoning_issue",
  "structure": {
    "relationship": "REBUTS",
    "reason": "The tile directly disputes the parent claim."
  },
  "reasoning": {
    "overgeneralization": true,
    "false_causation": false,
    "reason": "The tile uses a broad majority claim without support.",
    "errors_found": true
  },
  "clarify": {
    "clarification_needed": false,
    "reason": "",
    "rewrites": []
  },
  "error_types": [
    "overgeneralization"
  ],
  "first_wave_categories": [
    "too_broad"
  ],
  "feedback": "This claim is too broad and needs a narrower scope.",
  "suggestion": "Some teenagers rely heavily on social media, which can make it harder to focus in class.",
  "suggestion_source": "explanation_agent",
  "suggestion_confidence": "high",
  "suggestion_preserves_stance": true,
  "errors_found": true
}
```
