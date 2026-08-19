# Analysis Plan — Argument-Coaching Study (e18)

Draft for preregistration. This freezes what we test and how, *before* the full
run, so the confirmatory tests are locked and anything else is labeled
exploratory. It mirrors the RPG paper's preregistered structure (six scored
dimensions, helpful minus counterproductive composite, a subset shown to
participants) applied to argumentation instead of empathy.

Status: DRAFT for Aakriti/Steve review. Pilot (n=5) is for pipeline validation
only, not inference. Freeze this file, then run the full study.

---

## 1. Design

- **Type:** between-subjects, 2 conditions, randomized 50/50 at first load.
  - **Control:** three rounds of the argument game, no coach.
  - **AICoach:** same three rounds + the between-round LLM coach.
- **Task:** each participant argues solo against a live, good-faith LLM
  co-player, three rounds, one topic per round (topic order randomized per
  participant to unconfound topic from round).
- **Unit:** participant. Each participant contributes one score per round.

## 2. Measures

Each round is scored by an LLM judge on **six dimensions, 1-5**:
- **Helpful (shown to AICoach participants):** reasoning_quality, engagement,
  constructive_stance.
- **Counterproductive (analysis-only, never shown):** fallacies, evasion,
  hostility.

Derived per round:
- `composite` = mean of the three helpful dimensions (1-5). Primary DV.
- `analysis_overall` = sum(helpful) − sum(counterproductive). Full six-dim
  measure, mirrors RPG's prescriptive-minus-proscriptive score.

Also collected: baseline survey (stance on each topic + four disagreement-style
self-ratings), exit survey, rewrites, and any ask-the-coach exchanges.

## 3. Hypotheses and confirmatory tests

**H1 (primary).** AICoach participants improve in argument quality across
rounds more than Control.
- **Model:** linear mixed-effects,
  `composite ~ condition * round_c + (1 | participant)`, where `round_c` is
  round centered (rounds coded 0,1,2). The **condition × round** interaction is
  the confirmatory test; a positive interaction supports H1.
- **Effect estimate to report:** the interaction coefficient (extra
  points-per-round for AICoach) with 95% CI.
- **Fallback if the mixed model doesn't converge on the pilot n:** two-sample
  Welch t-test on each participant's round-1 → round-3 change score
  (difference-in-differences). This is what `analyze_e18.py` computes by default.

**H2 (secondary).** The effect holds on the full six-dimension measure.
- Same model on `analysis_overall`.

**H3 (secondary, mechanism).** Coaching reduces counterproductive behaviors
(fallacies, evasion, hostility) across rounds relative to Control.
- Same model on the summed counterproductive score.

**H4 (exploratory).** Per-dimension effects — which of the three helpful
dimensions moves most. Reported descriptively, not corrected for multiplicity.

## 4. Rubric validation (measurement, runs alongside)

The whole outcome rests on the LLM judge, so we validate it rather than assume
it. Per Aakriti's eval-framework paper:
- Hand-code a random subsample of rounds (target ~20-30 rounds, two coders on an
  overlapping subset) on the same six-dimension 1-5 rubric.
- Compute **Krippendorff's alpha** (or weighted Cohen's kappa) between the LLM
  scores and the human codes, per dimension.
- Benchmark against **human-human** agreement on the overlap subset — the LLM
  should approach the coder-coder ceiling, not be judged against perfection.
- If agreement is weak on a dimension, that dimension's anchors get revised (or
  it moves to exploratory) before the confirmatory tests are trusted.

## 5. Exclusions (prespecified)

- Did not complete all three rounds.
- Failed an attention/effort check (e.g., empty or single-character arguments
  across a whole round).
- Duplicate Prolific ID.
- Technical failure (coach/opponent errored and returned canned fallback for a
  scored round — flagged via `model_name` / rationale in the export).

State N excluded and reasons in the report.

## 6. Sample and power

- **Pilot:** n=5 (Prolific), pipeline + timing check only, no inference.
- **Full:** target ~30/arm (60 total) for the pilot-scale URG report; treat as
  estimation of the effect size + CI, not a powered confirmatory test. A
  formal power analysis for a confirmatory follow-up uses the effect size
  observed here.

## 7. What's confirmatory vs exploratory

- **Confirmatory:** H1 (and its model), the exclusion rules, the primary DV.
- **Exploratory:** H2-H4, per-dimension breakdowns, exit-survey correlations,
  baseline-style moderators. Labeled as such in the writeup.

## 8. Deviations

Any change to this plan after preregistration is logged here with date and
reason.
