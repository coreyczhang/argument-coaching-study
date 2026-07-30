# Study spec: AI coaching for better disagreement

**Status:** design approved (Steve + Aakriti, July 2026). This supersedes the earlier
single-round, in-play-coaching prototype.

**Summary:** replicate the empathic-communication "practice + LLM coach" paradigm, swapping
the support conversation for the structured argument game, to test whether an AI coach helps
people get better at disagreeing over repeated rounds.

---

## Research question

1. Do people get better at disagreeing from repeated practice?
2. Does an LLM coach between rounds speed that up, vs. practice alone?

---

## Design

| | |
|---|---|
| Paradigm | Replication of the prior empathic-communication study (RPG), game swapped in |
| Opponent | **Single human vs. the AI co-player** (already built), not human pairs |
| Structure | Play the game over **multiple rounds** (target ~3, TBD) |
| Coach | LLM feedback **between rounds** ("review the tape"), not in-play |
| Conditions | **Control** (rounds, no coach) vs. **Treatment** (rounds + between-round coach) |
| Primary outcome | Improvement in disagreement-quality score across rounds, treatment vs. control |
| First run | Pilot, ~15 vs. 15 on Prolific |

**Why single-player + AI opponent, not pairs:** it's a literal replication of RPG (their
partner was an LLM), removes the partner as a confound, and eliminates the multi-round
scheduling/dropout problem with real pairs. Human-human is a later ecological-validity
extension, not the pilot.

---

## Participant flow (mirrors the RPG route sequence)

```
consent → instructions → baseline survey
   → [ play a round vs. AI opponent → coach page ] × N
   → final survey → Prolific completion
```

- **A round:** the participant debates the AI opponent on the board (one topic).
- **Coach page (between rounds):** shows the arguments they just made, personalized
  feedback, their scores on the rubric, and an "ask the coach" chat. Control skips the
  feedback/scores and just continues.
- Loop N rounds, then the final survey.

---

## The coach

- Reviews the round the participant just played.
- Points out reasoning issues and gives 1–2 specific, actionable tips for the next round.
- Same delivery as RPG's `coach.html` (feedback text + per-dimension scores + ask-the-coach).
- The evaluation model already exists from the current build; the change is calling it at
  round boundaries and packaging it as a between-round review.

---

## Measurement

The backbone is an **LLM-as-judge rubric** that scores each round on three positively-framed
dimensions (mapped to the empathic rubric):

| Empathic study | This study |
|---|---|
| Validating emotions | Constructive stance (idea not the person; open) |
| Encouraging elaboration | Engagement with the other side (addresses their strongest points) |
| Demonstrating understanding | Reasoning quality (sound, supported, fallacy-free) |

Each scored per round; **composite** (mean) is the headline number that should rise across
rounds. Full draft + scoring format + open questions: see `DISAGREEMENT_RUBRIC_DRAFT.md`.

**Primary outcome:** change in composite from round 1 to N, treatment vs. control.

---

## What we reuse from RPG (directly copyable)

- Route structure: consent → instructions → baseline → round/coach loop → final survey.
- Data model: condition assignment, per-round records, coach feedback + scores, exit survey
  (their `E4Condition / Conversation / CoachFeedback / CoachScores / SurveyResponse`).
- The coach page pattern and the ask-the-coach interaction.
- Flask + SQLite on the HAIC infra.

## What's new (the actual build)

1. Slot the game in as the "round" (single player vs. AI opponent).
2. Move coaching to between rounds and package it as a review.
3. **Build + validate the disagreement rubric** (the biggest scientific piece).

---

## Scaffold to fork: e4

Confirmed with Aakriti: fork the **e4** online setup (`routes_e4_llm_rpg.py`,
`models_e4_rpg.py`, `templates/rpg/`). e14/e15 are the in-person versions of e4, so e4 is
the right base for our online study. We'll take a new experiment number (e18+, since e17 is
taken) once assigned.

## Open items for Aakriti

1. Rubric decisions: scale to match the empathic version, whole-round vs. per-argument
   scoring, whether to add a 4th "clarity" dimension, and the validation plan (hand-rate +
   judge agreement, per the Nature MI paper).
2. Number of rounds and round length.
3. The next free experiment number to claim.

---

## Status of the pieces

**Built and verified:**
- The game, the real evaluation model, AWS + repo setup.
- The **e18 scaffold** (fork of e4) — full flow walks: consent → instructions → baseline →
  [round → coach] × N → finish → completion. Condition branching works (treatment sees the
  coach page, control skips it); rounds persist; tables create. See `mattgroh/haic` PR #112.
- The **round wiring (HAIC side)** — `/round` creates a real game on the backend, rotates
  the topic per round, and hands off with the round-complete postback URL.

**Next, and what each is blocked on:**
- **Game-frontend round page** (round-only board + AI-opponent auto-start + postback):
  buildable but needs the game deployed to verify → blocked on **NU AWS credentials**.
- **`vsAi` in study-game creation** (start the game with the AI co-player): same deploy gate.
- **Rubric scoring** (`_score_round`): blocked on **Aakriti's rubric decisions** (dimensions,
  scale) — see the open items above.

**Blocked:** AWS migration to the NU account (waiting on credentials from Steve).
