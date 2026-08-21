# AsPredicted Pre-Registration — Skeleton

Paste this into a Google Doc and write each answer yourself, in your own words.
The bracketed notes are cues for what belongs in each field, not text to copy.
Format follows the standard AsPredicted 9 questions (see the lab example:
https://aspredicted.org/hdjx-tdsr.pdf).

**Study title:** _[short, specific name for this pre-registration]_

**Authors:** Corey Zhang, Aakriti Kumar, Steven Franconeri

**Study type:** Experiment

---

**1) Has data collection begun for this study?**
_[Yes/No. If you only ran the internal test/pilot, say exactly what and note it is
not part of the confirmatory data.]_

**2) What's the main question or hypothesis?**
_[State H1 in one or two sentences: does between-round AI coaching improve argument
quality across rounds more than practice alone? Name the direction you predict.]_

**3) Describe the key dependent variable(s) and how they are measured.**
_[The composite: mean of the three helpful dimensions (reasoning quality,
engagement, constructive stance), scored 1–5 per round by the LLM judge. Note the
secondary DVs: analysis_overall (6-dim), and the counterproductive score. Say the
judge model and that scoring is automated.]_

**4) How many and which conditions? How assigned?**
_[Two: control (rounds only) and treatment (rounds + between-round coach).
Between-subjects, randomized 50/50 at entry.]_

**5) Specify exactly the analyses to test the main question.**
_[The mixed model composite ~ condition * round_c + (1|participant); the
condition × round interaction is the test. State the prespecified fallback
(Welch t-test on round-1-to-last change). Point to the notebook.]_

**6) Outliers and exclusions — exact rules.**
_[List the prespecified exclusions: incomplete rounds; effort-check failures
(empty/one-character arguments for a whole round); duplicate Prolific IDs; rounds
that fell back to canned text. Give the exact rule for each.]_

**7) Sample size — how determined.**
_[State the target (e.g., ~30/condition) and what determines it — budget, a fixed
n, or a stopping rule. Be precise; no justification needed, just the rule. Note
the 5-person pilot is separate and not part of confirmatory n.]_

**8) Anything else to pre-register?**
_[Secondary/exploratory analyses: per-dimension trajectories, exit-survey
relationships, the rubric-validation (LLM vs. human agreement). Label them
exploratory. Note the judge is currently zero-shot and few-shot examples may be
added before the full run.]_

**9) Name the pre-registration.**
_[Same as the title, or a short handle.]_
