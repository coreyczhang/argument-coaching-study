# AsPredicted Pre-Registration — Point Taken (Argument Coaching)

Paste into a Google Doc. Wording is drawn from your own answers; read it through
and adjust anything before submitting so it's fully yours.

**Study type:** Experiment
**Authors:** Corey Zhang, Aakriti Kumar, Steven Franconeri

---

**1) Has data collection begun for this study?**

No. Only a small pilot (n = 5) has run, and that was solely to test that the game
and scoring pipeline work — it is not used as data in the actual analysis. Real
data collection has not started.

**2) What's the main question being asked or hypothesis being tested?**

Whether giving people short AI-generated coaching tips between rounds of a debate
game helps them make better arguments over time. The hypothesis is that the coached
group's argument quality will improve more across the three rounds than the control
group's.

**3) Describe the key dependent variable(s) and how they will be measured.**

The main dependent variable is a composite argument-quality score for each round:
the mean of three "helpful" dimensions (reasoning quality, engagement, constructive
stance), each rated 1–5 by an AI judge. A secondary measure is the full six-
dimension score (the three helpful dimensions minus three counterproductive ones:
fallacies, evasion, hostility).

The dimensions are not ad hoc. Reasoning quality follows the "cogency" criteria
(acceptability, relevance, sufficiency of claims) in Wachsmuth et al.'s (2017)
argument-quality taxonomy; engagement follows its dialectical criterion (addressing
the real counterargument) and the pragma-dialectical rule of addressing the actual
standpoint (van Eemeren & Grootendorst); constructive stance follows the respect
and constructive-politics codes of the Discourse Quality Index (Steenbergen et al.,
2003). The counterproductive dimensions are the inverses: fallacies (Walton, 1995),
evasion (a relevance failure), and hostility (ad hominem / DQI disrespect). The
three-helpful/three-counterproductive split mirrors the preregistered structure of
the paradigm being replicated (Kumar et al., arXiv:2603.15245).

**4) How many and which conditions will participants be assigned to?**

Two, assigned between subjects and randomized 50/50: Control (the game with no
coaching) and Treatment / "AICoach" (the same game, with personalized coaching
between each round). Everything else — the topics, the AI opponent, the three
rounds, the scoring — is identical; the only difference is whether the between-
round coaching message appears.

**5) Specify exactly which analyses you will conduct.**

Whether the coached group's score climbs more across the three rounds than the
control group's does — the condition-by-round interaction. This follows the primary
analysis in the paper we replicate (Kumar et al., arXiv:2603.15245), which used a
condition-by-round interaction with standard errors clustered at the participant
level. I fit this as a mixed-effects model, composite ~ condition * round +
(1 | participant); a linear regression with participant-clustered standard errors
is the equivalent. If that model does not fit cleanly at this sample size, the
backup is a round-1-vs-round-3 change-score comparison (a Welch two-sample t-test).

**6) Describe exactly how outliers/exclusions will be handled.**

A participant is excluded if they: don't finish all three rounds; fail an effort
check (for example, a whole round of empty or one-character non-answers);
self-report having used AI assistance (e.g., ChatGPT) to write their arguments
(the same exclusion used in Kumar et al., arXiv:2603.15245); show up as a duplicate
Prolific ID; or have a round whose score had to fall back to error text because the
coach or opponent AI failed.

**7) How many observations will be collected / what determines sample size?**

About 30 participants per group (~60 total) for the full run. This is not from a
formal power calculation; at this scale the study is treated as a first estimate of
the effect size (with its confidence interval), which would inform a properly
powered follow-up.

**8) Anything else you would like to pre-register?**

Secondary and exploratory analyses: the same test on the full six-dimension score
and on the counterproductive dimensions (does coaching reduce fallacies, evasion,
and hostility), and per-dimension trajectories (exploratory, not corrected for
multiple comparisons). Separately, the AI judge is validated against human coding
(Krippendorff's alpha vs. an expert coder) before the full run; the judge is
currently zero-shot and few-shot examples may be added from the expert-coded
rounds.

**9) Title.**

Point Taken: An Argument-Coaching Study. (Alternative, more descriptive: "Does
Between-Round AI Coaching Improve Argument Quality Over Repeated Practice? A
Between-Subjects Study.")
