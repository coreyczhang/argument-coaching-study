# AsPredicted Pre-Registration for Point Taken (Argument Coaching)

Paste this into a Google Doc. Read it through and adjust anything so it is fully
yours.

**Study type.** Experiment

**Authors.** Corey Zhang, Aakriti Kumar, Steven Franconeri

---

**1) Has data collection begun for this study?**

No. We have not collected any data for the main analysis. We ran a small pilot with
five people to check that the game and the scoring pipeline work. We do not use that
pilot as data.

**2) What is the main question being asked or hypothesis being tested?**

We ask whether short, AI-generated coaching between rounds helps people build better
arguments over time. We predict that the coached group improves its argument quality
across the three rounds more than the control group does.

**3) Describe the key dependent variable and how it will be measured.**

Our main dependent variable is a composite argument-quality score for each round. It
is the mean of three constructive dimensions. These dimensions are reasoning quality,
engagement, and constructive stance. An AI judge rates each dimension from 1 to 5. We
also track a secondary score called analysis_overall. It adds the three constructive
dimensions and subtracts the three counterproductive ones, which are fallacies,
evasion, and hostility. Each dimension draws on established argumentation research.
Reasoning quality follows the cogency criteria in Wachsmuth et al. (2017). Engagement
follows the pragma-dialectical rule of addressing the real standpoint (van Eemeren
and Grootendorst, 2004). Constructive stance follows the respect and
constructive-politics codes in the Discourse Quality Index (Steenbergen et al.,
2003). The counterproductive dimensions cover common fallacies (Walton, 1995),
evasion, and hostility.

**4) How many and which conditions will participants be assigned to?**

We use two conditions in a between-subjects design. We randomly assign each
participant to one condition when they enter, with a 50/50 split. The control group
plays three rounds with no coaching. The treatment group, which we call AICoach,
plays the same three rounds and receives personalized coaching between each round.
The topics, the AI opponent, the three rounds, and the scoring stay the same across
both groups. The only difference is whether the coaching appears.

**5) Specify exactly which analyses you will conduct.**

We test whether the coached group improves across rounds more than the control group
does. This is the condition-by-round interaction. We follow the primary analysis in
Kumar et al. (arXiv:2603.15245), who used a condition-by-round interaction with
standard errors clustered at the participant level. We fit a linear mixed-effects
model, composite ~ condition * round + (1 | participant). A positive interaction
supports our hypothesis. If that model does not fit cleanly at our sample size, we
compare the round 1 to round 3 change scores with a Welch t-test.

**6) Describe exactly how outliers will be handled and your rules for excluding
observations.**

We exclude a participant who does not finish all three rounds. We exclude anyone who
fails an effort check, such as submitting blank or single-character answers for a
whole round. We exclude anyone who reports using an outside AI tool such as ChatGPT
to write their arguments. This matches the exclusion protocol in Kumar et al.
(arXiv:2603.15245). We also remove duplicate Prolific IDs. We remove any round where
an API failure forced the judge or coach to output fallback text. We record every
exclusion and the reason for it.

**7) How many observations will be collected or what will determine sample size?**

We plan to recruit about 30 participants per condition, or about 60 total. This is
not a power-calculated number. We treat this study as a first estimate of the effect
size and its confidence interval. That estimate will inform a larger follow-up study.

**8) Anything else you would like to pre-register?**

We will run the same model on the full six-dimension score and on the summed
counterproductive score. This tests whether coaching reduces fallacies, evasion, and
hostility over time. We will track each dimension on its own as an exploratory
analysis. We will not correct these exploratory tests for multiple comparisons. We
validate the AI judge against human coding before the full run. We measure agreement
with Krippendorff's alpha and benchmark it against agreement between two human
coders. The judge currently runs zero-shot. We may add human-scored examples as
few-shot exemplars before the full run.

**9) Title.**

Point Taken, An Argument-Coaching Study. A more descriptive option is Does
Between-Round AI Coaching Improve Argument Quality Over Repeated Practice, a
Between-Subjects Study.
