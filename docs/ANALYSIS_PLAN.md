# Preregistered Analysis Plan

**Study:** Point Taken — Argument-Coaching Experiment
**Authors:** Corey Zhang, Aakriti Kumar, Steven Franconeri
**Status:** Frozen prior to full data collection. The pilot (*n* = 5) is for
pipeline validation and timing only and is not used for inference.

This plan specifies the confirmatory analyses in advance, following the
preregistration practice of the source studies (Kumar et al., arXiv:2603.15245;
Kumar et al., *Nature Machine Intelligence*, 2025). It mirrors the six-dimension
scoring (three prescriptive, three proscriptive) of the practice-plus-coaching
paradigm, adapted from empathic communication to argumentation.

---

## 1. Design

A between-subjects experiment with two conditions, randomly assigned 50/50 on
first entry:

- **Control:** three rounds of the argument game, no coaching.
- **Treatment (AICoach):** the same three rounds, with a between-round coaching
  interface.

Each participant argues against a live, good-faith LLM co-player rather than
another participant, enabling asynchronous single-participant collection. Each
round presents one topic; topic order is randomized per participant so that topic
is not confounded with round. The unit of analysis is the participant, who
contributes one score per round.

## 2. Measures

Each round is scored by an LLM judge on six dimensions, each 1–5:

- **Helpful (shown to treatment participants):** reasoning quality, engagement,
  constructive stance.
- **Counterproductive (analysis only, not shown):** fallacies, evasion,
  hostility.

Derived per round:

- `composite` = mean of the three helpful dimensions (1–5). **Primary dependent
  measure.**
- `analysis_overall` = Σ(helpful) − Σ(counterproductive). The full six-dimension
  score, mirroring the prescriptive-minus-proscriptive composite of the source
  paradigm.

Additional measures: a baseline survey (topic stances and four disagreement-style
items) and an exit survey.

## 3. Hypotheses and confirmatory tests

**H1 (primary).** Treatment participants improve in argument quality across rounds
to a greater extent than control participants.

- **Model:** linear mixed-effects,
  `composite ~ condition * round_c + (1 | participant)`, with `round_c` the
  round centered (0, 1, 2). The **condition × round** interaction is the
  confirmatory test; a positive coefficient supports H1, reported with its 95%
  confidence interval.
- **Fallback (prespecified):** if the mixed model does not converge at the
  available sample size, a Welch two-sample *t*-test on each participant's
  round-1-to-round-3 change score (a difference-in-differences contrast).

**H2–H3 (secondary).** The same model is applied to `analysis_overall` and to the
summed counterproductive score, testing whether coaching reduces counterproductive
behaviors across rounds relative to control.

**H4 (exploratory).** Per-dimension trajectories, examined descriptively to
identify which dimensions are most affected. Not corrected for multiple
comparisons; labeled exploratory.

## 4. LLM-as-judge validation

The primary outcome depends on the LLM judge, which is validated rather than
assumed, following Kumar et al. (*Nature Machine Intelligence*, 2025). Expert
annotations do not yet exist for this task and will be constructed. Following the
pilot, an expert coder (and, where feasible, a second coder for inter-rater
reliability) will score a random subsample of approximately 20–30 rounds on the
same six-dimension rubric. Agreement between the LLM and human coders
(Krippendorff's α) is computed per dimension and benchmarked against human–human
agreement on the overlapping subset. Dimensions with weak agreement have their
anchors revised before the confirmatory analyses are conducted. Validation is
performed on pilot data, prior to the full run.

## 5. Prespecified exclusions

A participant is excluded if they:

- do not complete all three rounds;
- fail an effort check (e.g., empty or single-character arguments across an entire
  round);
- submit a duplicate Prolific identifier; or
- have any scored round that reverted to fallback text owing to a coach or
  opponent error (flagged via the exported `model_name` field).

The number of exclusions and their reasons are reported.

## 6. Sample and inference

- **Pilot:** *n* = 5, for pipeline and timing validation only; not used for
  inference.
- **Full run:** approximately 30 participants per condition. At this scale the
  study is treated as an estimate of the effect size and its confidence interval
  rather than a fully powered confirmatory test; a formal power analysis for any
  subsequent confirmatory study is based on the effect observed here.

## 7. Confirmatory versus exploratory

- **Confirmatory:** H1 and its model, the prespecified exclusions, and the primary
  dependent measure.
- **Exploratory:** H2–H4, per-dimension breakdowns, and any survey-based
  moderator analyses. Labeled as such in the report.

## 8. Deviations

Any departure from this plan after preregistration is recorded here with the date
and rationale.

## 9. References

- Kumar et al. *Practicing with Language Models Cultivates Human Empathic
  Communication.* arXiv:2603.15245. Code/data:
  https://github.com/aakriti1kumar/replication-data-and-code-practicing-with-llms-cultivates-human-empathic-communication
  · Zenodo https://doi.org/10.5281/zenodo.20703371
- Kumar et al. *When Large Language Models are Reliable for Judging Empathic
  Communication.* *Nature Machine Intelligence* (s42256-025-01169-6);
  arXiv:2506.10150. Code/data:
  https://github.com/aakriti1kumar/replication-data-and-code-when-LLMs-reliable-empathic-communication
  · Zenodo https://doi.org/10.5281/zenodo.17230987
