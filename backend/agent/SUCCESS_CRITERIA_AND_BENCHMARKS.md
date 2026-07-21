# AI Success Criteria and Benchmarks

This document defines the first-wave success criteria for AI feedback in Point Taken.

## Scope

These benchmarks apply to the current first-wave reasoning categories:

- overgeneralization
- false causation
- clarification-needed support

They are designed to support:

- prompt iteration
- demo quality
- research-readiness decisions
- future treatment/control comparisons

## Product Success Criteria

The AI feedback system is considered ready for broader pilot use when it consistently:

1. flags clearly flawed tiles without over-interrupting play
2. avoids frequent false positives on short but acceptable claims
3. produces user-facing feedback that is understandable and actionable
4. preserves the side/stance of the original tile in rewrite suggestions
5. logs enough metadata for later research analysis

## Evaluation Benchmarks

These are the current working thresholds for the reasoning evaluation harness.

| Metric | Target | Why |
| --- | --- | --- |
| Accuracy on labeled reasoning cases | `>= 85%` | Baseline quality floor |
| False positive rate on labeled reasoning cases | `<= 15%` | Prevent over-triggering |
| Prompt/version metadata present in eval output | `100%` | Traceability |
| Schema validation on `/evaluate` response | `100%` | Stable downstream use |

## Operational Benchmarks

These are practical targets for real gameplay and demo quality.

| Metric | Target | Why |
| --- | --- | --- |
| Good-enough tiles should not open corrective feedback | `100% by policy` | Reduce friction |
| Feedback popup shown only when `errors_found = true` | `100% by policy` | Keep play flow smooth |
| AI evaluation record contains `tileId`, `errorTypes`, `feedback`, `suggestion`, `modelName`, `promptVersions` | `100%` | Research usefulness |
| Rewrite preserves original stance | `>= 95%` on reviewed samples | Prevent confusing feedback |

## Review Criteria for Manual Validation

For spreadsheet-based or human review, a category is promising when:

1. at least 4 of 5 sample tiles look like plausible true positives
2. the category can be explained in plain language in the UI
3. the category leads to a rewrite the player can actually use

If a category fails these checks, it should stay research-only or move to a later wave.

## Decision Rules

- If accuracy drops below `85%`, do not expand category coverage yet.
- If false positive rate exceeds `15%`, prioritize prompt tightening over new features.
- If rewrite stance alignment drops below `95%` in manual review, block rollout of new rewrite behavior.
- If exported AI metadata is incomplete, do not claim research-ready logging.

## Next Benchmark Improvements

- split labeled cases into iteration vs holdout sets
- add category-specific accuracy reporting
- add latency benchmarks for live evaluation
- add manual-review pass rate for rewrite usefulness
