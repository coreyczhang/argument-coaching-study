# AI Feedback Logging Requirements

This document captures the minimum logging payload needed for research analysis of AI feedback events.

## Goals

- measure when AI feedback is shown versus suppressed
- trace results back to model and prompt versions
- support later treatment/control comparisons
- make anonymized exports include enough context for analysis

## Required Event Fields

| Field | Why it matters |
| --- | --- |
| `gameId` | Group evaluations by play session |
| `tileId` | Identify the evaluated tile |
| `player` | Compare behavior across sides/roles |
| `topic` or `topicId` | Analyze performance by debate topic |
| `tileText` | Review model behavior against actual claims |
| `parentText` | Needed for structure/relevance analysis |
| `createdAt` | Time-series analysis |
| `schema_version` | Interpret stored payloads correctly |
| `model_name` | Compare model behavior |
| `pipeline_mode` | Distinguish combined vs fallback execution |
| `prompt_versions` | Track prompt iteration effects |
| `threshold_version` | Track feedback-display policy revisions |
| `error_types` | Analyze category frequency |
| `errors_found` | Identify whether corrective feedback was triggered |
| `display_feedback` | Separate AI detection from popup-display policy |
| `display_reason` | Explain why feedback was shown or suppressed |
| `first_wave_categories` | Preserve the player-facing category mapping |
| `feedback` | Preserve the user-facing explanation |
| `suggestion` | Preserve the suggested rewrite |
| `suggestion_source` | Trace which stage produced the rewrite |
| `suggestion_confidence` | Analyze rewrite-quality thresholds |
| `suggestion_preserves_stance` | Measure stance-preservation reliability |
| `structure.relationship` | Measure relevance/structure issues |
| `reasoning.overgeneralization` | First-wave reasoning metric |
| `reasoning.false_causation` | First-wave reasoning metric |
| `clarify.clarification_needed` | Clarity metric |
| `feedbackShown` | Distinguish silent pass vs popup shown |
| `feedbackDismissed` | Understand interaction behavior |
| `feedbackRevised` | Measure whether users act on suggestions |
| `experimentCondition` | Required later for treatment vs control |

## Nice-to-Have Fields

- `gameCode`
- `turnNumber`
- `revisionTileText`
- `latencyMs`
- `frontendRoute`
- `userActionSource` (`confirm`, `revise`, `retry`)

## Export Guidance

- anonymized exports should preserve evaluation metadata but remove identifying user fields
- exported rows should keep `tileId`, `gameId`, timestamps, category labels, and AI output text
- if text must be redacted later, prompt/model/version metadata should still remain

## Immediate Engineering Recommendation

If only a subset ships first, prioritize:

1. `gameId`
2. `tileId`
3. `createdAt`
4. `schema_version`
5. `model_name`
6. `prompt_versions`
7. `error_types`
8. `errors_found`
9. `feedback`
10. `suggestion`
11. `feedbackShown`
12. `experimentCondition`
