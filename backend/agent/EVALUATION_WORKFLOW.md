# Reasoning Evaluation Workflow

This workflow is the current baseline for prompt iteration on the reasoning agent.

## Goal

Improve prompt quality while minimizing false positives, especially for:
- overgeneralization
- false causation

## Inputs

- Prompt logic in `agents.py`
- Labeled cases in `reasoning_test_cases.json`
- Full-tile labeled cases in `full_tile_eval_cases.json`

## Run

From `point-taken-backend/agent`:

```bash
source .venv/bin/activate
python run_reasoning_eval.py
python run_full_tile_eval.py
```

## Outputs

Each run writes two files to `eval_outputs/`:
- `reasoning_eval_<timestamp>.json`
- `reasoning_eval_<timestamp>.md`
- `full_tile_eval_<timestamp>.json`
- `full_tile_eval_<timestamp>.md`

The markdown summary includes:
- overall accuracy
- false positive rate
- category-level pass/fail counts
- benchmark pass/fail status
- mismatch list
- model name and prompt version metadata for the run

The full-tile evaluation harness additionally checks:
- first-wave category mapping
- display suppression on short but valid claims
- display reason selection
- stance-preservation metadata on rewrite suggestions

## Current Benchmarks

- minimum accuracy: `85%`
- maximum false positive rate: `15%`

These are starting benchmarks and should be updated as the labeled set matures.
See [SUCCESS_CRITERIA_AND_BENCHMARKS.md](./SUCCESS_CRITERIA_AND_BENCHMARKS.md) for the broader product and research criteria.

## Prompt Iteration Rules

1. Change prompts for a specific failure mode, not everything at once.
2. Re-run the harness after each prompt revision.
3. Review mismatches before deciding a prompt is better.
4. Do not expand categories until the first-wave categories are stable.

## First-Wave Focus

- overgeneralization
- false causation
- false positive control
- needs more detail / clarification-needed suppression
- rewrite stance preservation

## Next Improvements

- expand category coverage beyond the first-wave reasoning checks
- split train-style prompt drafting from holdout-style validation review
- add a lightweight holdout set for prompt changes before broader rollout
- add manual review for explanation quality and rewrite quality
