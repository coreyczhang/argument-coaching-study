# AsPredicted Pre-Registration for Point Taken (Argument Coaching)

Paste this into a Google Doc. Read it through and adjust anything so it is fully
yours.

**Study type.** Experiment

**Authors.** Corey Zhang, Aakriti Kumar, Steven Franconeri

---

**1) Has data collection begun for this study?**

No. The only run so far was a small pilot with five people, and that was just to
check that the game and the scoring pipeline work. None of it counts as data for the
main analysis.

**2) What is the main question being asked or hypothesis being tested?**

The study asks whether short AI coaching between rounds helps people build better
arguments over time. Our prediction is that the coached group improves its argument
quality across the three rounds more than the control group does.

**3) Describe the key dependent variable and how it will be measured.**

The main dependent variable is a composite argument-quality score for each round. It
is the mean of three constructive dimensions, reasoning quality, engagement, and
constructive stance, each rated 1 to 5 by an AI judge. A secondary score,
analysis_overall, adds those three constructive dimensions and subtracts the three
counterproductive ones, which are fallacies, evasion, and hostility. None of the
dimensions are ad hoc. Reasoning quality follows the cogency criteria in Wachsmuth et
al. (2017), engagement follows the pragma-dialectical rule of addressing the real
standpoint (van Eemeren and Grootendorst, 2004), and constructive stance follows the
respect and constructive-politics codes in the Discourse Quality Index (Steenbergen
et al., 2003). The counterproductive side covers common fallacies (Walton, 1995),
along with evasion and hostility.

**4) How many and which conditions will participants be assigned to?**

The design is between-subjects with two conditions, and each participant is randomly
assigned to one of them on entry with a 50/50 split. The control group plays three
rounds with no coaching, and the treatment group (which we call AICoach) plays the
same three rounds with personalized coaching between each one. Everything else stays
constant across the two groups, including the topics, the AI opponent, the three
rounds, and the scoring. The only thing that differs is whether the coaching appears.

**5) Specify exactly which analyses you will conduct.**

The main test is whether the coached group improves across rounds more than the
control group does, which is the condition-by-round interaction. This follows the
primary analysis in Kumar et al. (arXiv:2603.15245), who used a condition-by-round
interaction with standard errors clustered at the participant level. We fit it as a
linear mixed-effects model, composite ~ condition * round + (1 | participant), and a
positive interaction supports the hypothesis. If that model does not fit cleanly at
our sample size, the backup is a Welch t-test on each participant's round 1 to
round 3 change score.

**6) Describe exactly how outliers will be handled and your rules for excluding
observations.**

A participant is excluded for any of a few reasons. They do not finish all three
rounds, they fail an effort check such as blank or single-character answers for a
whole round, or they report using an outside AI tool like ChatGPT to write their
arguments. That last rule matches the exclusion protocol in Kumar et al.
(arXiv:2603.15245). We also drop duplicate Prolific IDs and any round where an API
failure forced the judge or coach to output fallback text. Every exclusion and its
reason gets recorded.

**7) How many observations will be collected or what will determine sample size?**

The plan is to recruit about 30 participants per condition, or roughly 60 total. This
number is not from a power calculation. The study works as a first estimate of the
effect size and its confidence interval, which will then inform a larger follow-up.

**8) Anything else you would like to pre-register?**

A few secondary and exploratory analyses are also planned. The same model runs on the
full six-dimension score and on the summed counterproductive score, to see whether
coaching reduces fallacies, evasion, and hostility over time. Each dimension also gets
tracked on its own as an exploratory analysis, without correction for multiple
comparisons. Separately, the AI judge is validated against human coding before the
full run. Agreement is measured with Krippendorff's alpha and benchmarked against
agreement between two human coders. The judge currently runs zero-shot, and
human-scored examples may be added as few-shot exemplars before the full run.

**9) Title.**

Point Taken, An Argument-Coaching Study. A more descriptive option is Does
Between-Round AI Coaching Improve Argument Quality Over Repeated Practice, a
Between-Subjects Study.
