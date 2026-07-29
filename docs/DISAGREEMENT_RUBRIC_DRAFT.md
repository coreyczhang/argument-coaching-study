# Disagreement-quality rubric (strawman v0.1)

**Purpose.** This is the LLM-as-judge rubric that scores how well a person disagrees in
a round of the game. It's the measurement backbone: we score every round the same way,
and the primary outcome is **improvement in these scores across rounds**, treatment
(coach between rounds) vs. control.

**This is a first draft meant to be torn apart, not a finished instrument.** It mirrors
the structure of the empathic-communication rubric from the prior study.

---

## Mapping to the empathic-communication rubric

| Empathic study (prior) | This study (disagreement) |
|---|---|
| Validating emotions | Constructive stance |
| Encouraging elaboration | Engagement with the other side |
| Demonstrating understanding | Reasoning quality |

Same shape: 3 positively-framed, behaviorally-anchored dimensions, each scored per round
by the LLM judge, plus a short rationale and a piece of feedback.

---

## The three dimensions

### 1. Reasoning quality
Are the claims sound, supported, and logically coherent?
- **Strong (5):** claims are specific and backed by a reason, mechanism, or example; no
  obvious fallacies; conclusions follow from premises.
- **Mixed (3):** some support, but vague claims, overgeneralizations, or a weak causal leap.
- **Weak (1):** unsupported assertions, sweeping generalizations, or clear fallacies
  (false cause, overgeneralization, exaggeration).

> We already have a fallacy-detection pipeline (9 checks). It can feed this dimension as a
> signal, but the score is positive/holistic, not just "count of fallacies."

### 2. Engagement with the other side
Does the person actually address the opponent's points, and the strongest version of them?
- **Strong (5):** directly responds to the opponent's best argument; represents their view
  fairly before rebutting.
- **Mixed (3):** acknowledges the other side but partly talks past it, or rebuts a weaker
  version.
- **Weak (1):** ignores the opponent, changes the subject, or straw-mans them.

### 3. Constructive stance
Is the person attacking the idea rather than the person, and staying open?
- **Strong (5):** critiques the argument, not the person; curious, non-hostile; shows some
  openness to being moved.
- **Mixed (3):** mostly civil but dismissive or closed.
- **Weak (1):** personal attacks, hostility, or contempt.

*(Possible 4th dimension: **Clarity / specificity** — concrete, specific claims vs. vague
or sweeping ones. Could stand alone or fold into Reasoning quality. Flagging for discussion.)*

---

## How the judge scores a round

Input: the full set of arguments the participant made in that round (plus the topic and
the opponent's arguments for context).

Output per round:
```json
{
  "reasoning_quality":  { "score": 1-5, "rationale": "…" },
  "engagement":         { "score": 1-5, "rationale": "…" },
  "constructive_stance":{ "score": 1-5, "rationale": "…" },
  "composite": 1.0-5.0,          // mean of the three
  "feedback": "one or two specific, actionable tips for the next round"
}
```

- **Composite** (mean of the three) is the headline number that should rise across rounds.
- **feedback** is what the coach page shows the participant between rounds (the "review the
  tape" note).

---

## Primary outcome

Change in **composite** (and per-dimension) from round 1 to round N, compared between
control and treatment. Treatment should show a steeper improvement curve if the coaching works.

---

## Open questions for Aakriti / Matt

1. **Scale.** Match whatever the empathic rubric used (was it 1–5, 1–7, or qualitative
   labels)? I'd rather mirror it than invent a new scale.
2. **Grain.** Score the whole round, or each argument and average? Whole-round is simpler
   and matches "how well did they disagree this round."
3. **Dimensions.** Are these three the right ones, and do we want the 4th (clarity)?
4. **Validation.** Plan to hand-rate a sample and check judge agreement (per the Nature MI
   LLM-as-judge paper). What agreement threshold do we consider acceptable?
5. **Reuse.** OK to feed the existing fallacy pipeline into the reasoning-quality dimension
   as a signal, or keep the judge fully holistic?
