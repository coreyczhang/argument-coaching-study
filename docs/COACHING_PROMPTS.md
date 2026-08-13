# Where every piece of coaching comes from

A map of the four coaching elements a participant sees, and the exact prompt / source
behind each — so the measures and wording can be reviewed and edited in one place.
All are **zero-shot** right now (no few-shot examples); adding exemplars is a natural
next step if we want tighter, more consistent scoring.

| What the participant sees | How it's generated | Where to edit |
|---|---|---|
| **Rubric scores** (3 dims /10) + **overall round feedback** | One LLM call, `claude-sonnet-4-5` | `RUBRIC_PROMPT` in `routes_e18_argument_coach.py` (haic) |
| **Point-level critique + behavior tag** (per argument) | The game's per-tile evaluation pipeline | `agent/agents.py` (this repo) — structure / reasoning / clarify agents |
| **Point-level "How to make it stronger"** | **Static text keyed by the detected category** (this is why it can feel generic) | `CATEGORY_TIPS` dict in `routes_e18_argument_coach.py` |
| **"Try this version" rewrite hint** | Per-tile `suggestion` from the evaluation pipeline (LLM) | `agent/agents.py` |
| **Ask-the-coach answers** | One LLM call with the participant's arguments as context | `_coach_answer()` in `routes_e18_argument_coach.py` |
| **AI co-player replies** | Two-agent (strategy + content) pipeline | `agent/agents.py` — `co_player_turn` |

## The rubric / overall-feedback prompt (verbatim, the outcome measure)

```
You are scoring how well a participant argued in one round of a debate game.
Score each dimension from 1 (weak) to 10 (strong):

1. reasoning_quality — claims are specific and supported, no fallacies (overgeneralizing,
   false cause, exaggeration); conclusions follow from premises.
2. engagement — directly addresses the opponent's strongest points and represents their
   view fairly, rather than talking past them or straw-manning.
3. constructive_stance — critiques the argument not the person; curious and non-hostile;
   shows some openness.

Topic: {topic}
The participant's arguments this round:
{arguments}

Respond with ONLY a JSON object: {reasoning_quality:{score,rationale}, engagement:{...},
constructive_stance:{...}, feedback:"1-2 forward-looking tips for the next round"}
```

## Two things worth flagging for the rubric review

1. **`constructive_stance` likely has a ceiling.** As written it mostly rewards the
   *absence* of hostility, so minimal, civil answers score high (matching Aakriti's
   observation). If it stays a primary dimension it needs sharper anchors (e.g., points
   for genuinely representing/steelmanning the other side and signalling openness, not
   just "not rude"), or it should be reconsidered.
2. **The "how to make it stronger" line is static per category, not per-argument.** That's
   the generic-feeling part. Easy change: generate it from the argument itself in the same
   call that produces the critique + rewrite, so all three point-level pieces are specific.

## Why three dimensions (and why three)

They mirror the empathic-communication (RPG) rubric we're replicating — a one-to-one map:
validating emotions → constructive stance, encouraging elaboration → engagement,
demonstrating understanding → reasoning quality. Three keeps structural parity with the
paradigm we're anchoring to, keeps the LLM judge reliable, and keeps the composite simple
to interpret. A fourth dimension (e.g. **clarity / specificity**) is an open option in the
rubric draft if the team wants it.
