from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import json
import os
import re
import anthropic
from dotenv import load_dotenv
from schemas import AiEvaluationResponse, ClarifyResult, CoPlayerTurnResponse, ReasoningResult, StructureResult

load_dotenv(override=True)

MODEL_NAME = os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022")
client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
SCHEMA_VERSION = "2026-04-16"
THRESHOLD_VERSION = "2026-04-17"
PROMPT_VERSIONS = {
    "analysis": "2026-05-11-v3",
    "structure": "2026-05-11-v3",
    "reasoning": "2026-05-01-v4",   # 9-check system
    "clarify": "2026-05-01-v2",
    "explanation": "2026-05-01-v2",
}

VALID_SHORT_CLAIM_MARKERS = (
    "because",
    "should",
    "can",
    "could",
    "helps",
    "hurts",
    "limits",
    "improves",
    "reduces",
    "increases",
    "is unfair",
    "is bad",
    "is good",
    "is harmful",
    "is useful",
    "is distracting",
    "is dangerous",
    "makes",
)

# Canonical key names for the 9 checks (must match prompt output)
NINE_CHECK_KEYS = [
    "personal_attack",
    "not_a_statement",
    "overgeneralization",
    "exaggeration",
    "false_causation",
    "straw_man",
    "appeal_to_authority",
    "anecdotal_data",
    "whataboutism_red_herring",
]

# Big 5: surface in UI with feedback + category labels
# Other 4: detected internally, logged as research metadata only
UI_CHECK_KEYS = {
    "overgeneralization",
    "false_causation",
    "personal_attack",
    "exaggeration",
    "straw_man",
}
RESEARCH_ONLY_CHECK_KEYS = {
    "not_a_statement",
    "appeal_to_authority",
    "anecdotal_data",
    "whataboutism_red_herring",
}


def safe_json(text: str) -> dict:
    try:
        return json.loads(text)
    except Exception:
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1:
            try:
                return json.loads(text[start:end+1])
            except Exception:
                pass
    return {}


def clamp_string_list(values: list, limit: int = 3) -> list[str]:
    cleaned: list[str] = []
    for value in values:
        if isinstance(value, str):
            stripped = value.strip()
            if stripped:
                cleaned.append(stripped)
        if len(cleaned) >= limit:
            break
    return cleaned


def normalize_structure(data: dict | None) -> dict:
    if not isinstance(data, dict):
        data = {}
    return StructureResult.model_validate(
        {
            "relationship": data.get("relationship") or "IRRELEVANT",
            "reason": data.get("reason") or "",
        }
    ).model_dump()


def normalize_reasoning(data: dict | None) -> dict:
    if not isinstance(data, dict):
        data = {}

    # ── New 9-check format ───────────────────────────────────────────────────
    if "checks" in data and "violations" in data:
        raw_violations = data.get("violations") or []
        violations = [
            v for v in raw_violations
            if isinstance(v, str) and v != "none" and v in NINE_CHECK_KEYS
        ]
        raw_checks = data.get("checks") or {}
        checks: dict = {}
        for key in NINE_CHECK_KEYS:
            cd = raw_checks.get(key) or {}
            if isinstance(cd, dict):
                checks[key] = {
                    "detected": bool(cd.get("detected")),
                    "trigger_phrase": cd.get("trigger_phrase") if cd.get("detected") else None,
                    "explanation": cd.get("explanation") if cd.get("detected") else None,
                }
            else:
                checks[key] = {"detected": False, "trigger_phrase": None, "explanation": None}

        overgeneralization = "overgeneralization" in violations
        false_causation = "false_causation" in violations
        errors_found = len(violations) > 0

        # build a brief reason from the first detected explanation
        reason = ""
        for v in violations:
            expl = checks.get(v, {}).get("explanation")
            if expl:
                reason = expl
                break

        return ReasoningResult.model_validate({
            "overgeneralization": overgeneralization,
            "false_causation": false_causation,
            "reason": reason,
            "errors_found": errors_found,
            "violations": violations,
            "checks": checks,
        }).model_dump()

    # ── Legacy 2-check format (backward compat) ──────────────────────────────
    overgeneralization = bool(data.get("overgeneralization"))
    false_causation = bool(data.get("false_causation"))
    return ReasoningResult.model_validate({
        "overgeneralization": overgeneralization,
        "false_causation": false_causation,
        "reason": data.get("reason") or "",
        "errors_found": overgeneralization or false_causation,
        "violations": (
            (["overgeneralization"] if overgeneralization else []) +
            (["false_causation"] if false_causation else [])
        ),
        "checks": {},
    }).model_dump()


def normalize_clarify(data: dict | None) -> dict:
    if not isinstance(data, dict):
        data = {}
    normalized = {
        "clarification_needed": bool(data.get("clarification_needed")),
        "reason": data.get("reason") or "",
        "rewrites": clamp_string_list(data.get("rewrites", []), limit=3),
    }
    return ClarifyResult.model_validate(normalized).model_dump()


def normalized_text(value: str | None) -> str:
    return re.sub(r"\s+", " ", (value or "").strip()).lower()


def map_first_wave_categories(structure: dict, reasoning: dict, clarify: dict) -> list[str]:
    """Only includes UI-surfaced (Big 5) categories. Research-only violations are
    accessible via reasoning.violations but do not appear here."""
    categories: list[str] = []
    all_violations = set(reasoning.get("violations") or [])
    ui_violations = all_violations & UI_CHECK_KEYS

    if clarify.get("clarification_needed"):
        categories.append("needs_more_detail")
    if reasoning.get("overgeneralization") or "overgeneralization" in ui_violations:
        categories.append("too_broad")
    if reasoning.get("false_causation") or "false_causation" in ui_violations:
        categories.append("causal_leap")
    if "exaggeration" in ui_violations:
        categories.append("exaggeration")
    if "personal_attack" in ui_violations:
        categories.append("personal_attack")
    if "straw_man" in ui_violations:
        categories.append("straw_man")
    # not_a_statement, appeal_to_authority, anecdotal_data, whataboutism → research only
    if structure.get("relationship") == "IRRELEVANT" and "personal_attack" not in ui_violations:
        categories.append("needs_clearer_connection")

    seen: set[str] = set()
    result: list[str] = []
    for c in categories:
        if c not in seen:
            seen.add(c)
            result.append(c)
    return result


def map_error_types(structure: dict, reasoning: dict, clarify: dict) -> list[str]:
    """Only includes UI-surfaced error types. Research-only violations are still
    stored in reasoning.violations for logging and analysis."""
    error_types: list[str] = []
    ui_violations = [v for v in (reasoning.get("violations") or []) if v in UI_CHECK_KEYS]

    if structure.get("relationship") == "IRRELEVANT":
        error_types.append("irrelevant_rebuttal")

    for v in ui_violations:
        if v not in error_types:
            error_types.append(v)

    if clarify.get("clarification_needed") and "clarification_needed" not in error_types:
        error_types.append("clarification_needed")

    return error_types


def is_valid_short_claim(tile_text: str, structure: dict, reasoning: dict) -> bool:
    text = normalized_text(tile_text)
    words = [word for word in re.split(r"\s+", text) if word]
    if len(words) > 10:
        return False
    if structure.get("relationship") == "IRRELEVANT" or reasoning.get("errors_found"):
        return False
    return any(marker in text for marker in VALID_SHORT_CLAIM_MARKERS)


def suppress_false_positive_clarify(tile: dict, structure: dict, reasoning: dict, clarify: dict) -> dict:
    if not clarify.get("clarification_needed"):
        return clarify
    if is_valid_short_claim(tile.get("text", ""), structure, reasoning):
        clarify["clarification_needed"] = False
        clarify["reason"] = "Short but interpretable claim; clarification is not necessary."
        clarify["rewrites"] = []
    return clarify


TILE_MAX_CHARS = 100


def _within_limit(text: str | None) -> str | None:
    """Return text only if it fits in a tile, otherwise None."""
    if text and len(text.strip()) <= TILE_MAX_CHARS:
        return text.strip()
    return None


def select_suggestion(
    clarify: dict,
    explanation: dict,
) -> tuple[str | None, str | None, str | None, bool | None]:
    suggestion = _within_limit(explanation.get("suggestion"))
    preserves_stance = explanation.get("suggestion_preserves_stance")
    confidence = explanation.get("suggestion_confidence")

    if suggestion and preserves_stance and confidence in {"high", "medium"}:
        return suggestion, "explanation_agent", confidence, True

    clarify_rewrites = [r for r in clarify.get("rewrites", []) if _within_limit(r)]
    if clarify_rewrites:
        return clarify_rewrites[0], "clarify_agent", "medium", True

    return None, "none", None, preserves_stance


def fallback_explanation(structure: dict, reasoning: dict, clarify: dict) -> dict:
    violations = reasoning.get("violations") or []
    checks = reasoning.get("checks") or {}

    # personal attack — targeted message, no suggestion
    if "personal_attack" in violations:
        return {
            "feedback": "Arguments should respond to the claim, not the person making it.",
            "suggestion": None,
            "suggestion_confidence": None,
            "suggestion_preserves_stance": None,
        }

    # off-topic (structure) and no personal attack
    if structure.get("relationship") == "IRRELEVANT":
        reason = structure.get("reason", "").lower()
        is_personal = any(
            kw in reason
            for kw in ("personal attack", "ad hominem", "insult", "opponent", "person", "mockery")
        )
        return {
            "feedback": (
                "Arguments should respond to the claim, not the person making it."
                if is_personal
                else "This doesn't connect to the debate — try making a point about the actual topic."
            ),
            "suggestion": None,
            "suggestion_confidence": None,
            "suggestion_preserves_stance": None,
        }

    # use the explanation from the first detected check if available
    for v in violations:
        expl = checks.get(v, {}).get("explanation") if isinstance(checks.get(v), dict) else None
        if expl:
            return {
                "feedback": expl,
                "suggestion": None,
                "suggestion_confidence": None,
                "suggestion_preserves_stance": None,
            }

    # generic fallbacks by violation type
    if reasoning.get("overgeneralization") or "overgeneralization" in violations:
        return {"feedback": "This claim is broader than the evidence supports — try narrowing the scope.", "suggestion": None, "suggestion_confidence": None, "suggestion_preserves_stance": None}
    if reasoning.get("false_causation") or "false_causation" in violations:
        return {"feedback": "This claim assumes a causal link that needs more support.", "suggestion": None, "suggestion_confidence": None, "suggestion_preserves_stance": None}
    if "exaggeration" in violations:
        return {"feedback": "This claim is more extreme than the evidence supports.", "suggestion": None, "suggestion_confidence": None, "suggestion_preserves_stance": None}
    if "not_a_statement" in violations:
        return {"feedback": "Arguments must be statements, not questions. Rephrase as a claim.", "suggestion": None, "suggestion_confidence": None, "suggestion_preserves_stance": None}
    if "straw_man" in violations:
        return {"feedback": "This misrepresents the opposing argument — engage with what they actually said.", "suggestion": None, "suggestion_confidence": None, "suggestion_preserves_stance": None}
    if "appeal_to_authority" in violations:
        return {"feedback": "Citing an authority alone isn't enough — explain why the evidence supports the claim.", "suggestion": None, "suggestion_confidence": None, "suggestion_preserves_stance": None}
    if "anecdotal_data" in violations:
        return {"feedback": "A single example isn't sufficient to support a broad claim.", "suggestion": None, "suggestion_confidence": None, "suggestion_preserves_stance": None}
    if "whataboutism_red_herring" in violations:
        return {"feedback": "This deflects from the argument — address the actual point being made.", "suggestion": None, "suggestion_confidence": None, "suggestion_preserves_stance": None}
    if clarify.get("clarification_needed"):
        return {"feedback": "Try being more specific so other players can respond to your point.", "suggestion": None, "suggestion_confidence": None, "suggestion_preserves_stance": None}

    return {"feedback": None, "suggestion": None, "suggestion_confidence": None, "suggestion_preserves_stance": None}


def get_context(tile: dict, game_board: dict):
    parent = game_board.get(tile.get("parentId")) if tile.get("parentId") else None

    siblings = []
    if parent:
        for t in game_board.values():
            if (
                t.get("parentId") == tile.get("parentId")
                and t.get("tileId") != tile.get("tileId")
            ):
                siblings.append(t)

    return parent, siblings


# ─────────────────────────────────────────────────────────────────────────────
# NINE-CHECK REASONING PROMPT  (shared by both reasoning_agent and inline Task 2)
# ─────────────────────────────────────────────────────────────────────────────

def _nine_check_instructions() -> str:
    return """
======================================
GROUND RULES
======================================
RULE 0-A: BIAS TOWARD FALSE — When in doubt, do NOT flag. Only flag when confident the definition is clearly met.
RULE 0-B: EVALUATE THE TILE AS WRITTEN. Do not infer intent. Judge only the words on the page.
RULE 0-C: ALL CHECKS ARE INDEPENDENT. Run every check in order regardless of prior results. A tile can fail multiple checks.
RULE 0-D: SHORT, VAGUE, OR IMPRECISE STATEMENTS ARE NOT FALLACIES. "Things have gotten worse" or "This is wrong" is vague, not a fallacy.

======================================
THE NINE CHECKS — IN ORDER
======================================

CHECK 1: PERSONAL ATTACK (Ad Hominem)
DEFINITION: Attacks the person's character, intelligence, background, motives, or identity instead of engaging with their argument.
TO FLAG — ALL must be true:
  ✓ Targets the person's identity (not the ideas)
  ✓ The attack is about who they ARE, not what they ARGUED
  ✓ No engagement with the substance of any argument is present
DO NOT FLAG IF:
  AD-1: Criticism targets an argument, policy, idea, or reasoning ("This reasoning is flawed" → NOT ad hominem)
  AD-2: Strong but argument-directed critique ("This policy is reckless" → NOT ad hominem)
  AD-3: Unsure whether target is person or idea → default false (Rule 0-A)
FLAGGED: "Only someone completely ignorant would argue that." / "She has no credibility because she never went to university."
NOT FLAGGED: "This argument is logically inconsistent." / "The evidence cited here is unreliable."

CHECK 2: NOT A STATEMENT (Invalid Format)
DEFINITION: The tile is phrased as a question rather than a statement. Questions make no claim.
TO FLAG — the following must be true:
  ✓ Ends with a question mark, OR
  ✓ Grammatically structured as a direct question (inverted subject-verb: "Is it not true that...", "Don't you think...", "Wouldn't it be better if...")
DO NOT FLAG IF:
  QS-1: Rhetorical framing that is fundamentally a statement ("The fact that crime rose proves the policy failed" → statement)
  QS-2: Question embedded inside a statement ("One must ask whether the evidence supports this, and it clearly does not")
FLAGGED: "Don't you think all politicians are corrupt?" / "Isn't it obvious that this policy has failed?"
NOT FLAGGED: "This policy has clearly failed." / "The evidence does not support this conclusion."

CHECK 3: OVERGENERALIZATION
TO FLAG — ALL FOUR must be true:
  ✓ CONDITION A — SCALE WORD PRESENT: Explicit universal or near-universal quantifier:
    UNIVERSAL: all, every, always, never, everyone, nobody, no one, none, everywhere, without exception, invariably, universally
    NEAR-UNIVERSAL: most, almost all, virtually all, the vast majority of, nearly everyone
    STRONG IMPLICIT: unqualified noun phrase applying a non-trivial trait to an ENTIRE named group with no qualifier ("Politicians are corrupt" = implicit "all politicians")
  ✓ CONDITION B — NAMED GROUP EXISTS: A clearly identifiable group the scale claim applies to
  ✓ CONDITION C — NON-TRIVIAL PROPERTY: A meaningful behavioral, moral, cognitive, or evaluative trait applied to the whole group — not a trivially true or widely accepted fact
  ✓ CONDITION D — NOT A SOLID FACT: The statement is not a fact that science or history agrees with
DO NOT FLAG IF:
  OG-0: Data-supported generalization (>80% data supports "most"; >95% supports "almost all"); universally agreed facts ("No one can survive without equipment in space")
  OG-1: Scope word is a PARTIAL quantifier: many, some, a few, several, certain, various
  OG-2: Short opinion/reaction with no named group ("This argument is weak")
  OG-3: Vague statement with no named group ("Things have gotten worse")
  OG-4: Specific scoped population (study participants) without generalizing beyond it
  OG-5: Hedged by attribution to others ("Some researchers argue that...")
  OG-6: If in doubt → false
FLAGGED: "All politicians are corrupt." / "Most young people have no interest in history."
NOT FLAGGED: "Many voters feel disconnected." / "This argument is unconvincing." / "Tuition debt stops low-income students from graduating."

CHECK 4: EXAGGERATION (Hyperbole Used as Fact)
DEFINITION: A claim presented as factual but so extreme or disproportionate relative to available evidence that it distorts reality in a way that misleads. Does NOT require a scale word — it is about magnitude.
TO FLAG — ALL must be true:
  ✓ Presented as factual (not explicitly as opinion or rhetorical emphasis)
  ✓ Magnitude clearly and verifiably disproportionate to what evidence could plausibly support
  ✓ Would materially mislead a reasonable reader
DO NOT FLAG IF:
  EX-1: Clearly rhetorical emphasis ("This is the most important issue of our time" → opinion/emphasis)
  EX-2: Opinion about severity with no verifiable factual content ("This is a massive problem" → vague emphasis)
  EX-3: Plausibly true even if strong ("This policy has caused enormous harm" → strong but plausible)
  EX-4: If in doubt → false
FLAGGED: "This tax increase will completely destroy the entire economy." / "Nobody has ever successfully argued against this position."
NOT FLAGGED: "This is a very serious problem." / "The consequences could be devastating."

CHECK 5: FALSE CAUSATION
DEFINITION: Asserts X caused Y based solely on temporal sequence or correlation, without establishing a causal mechanism and without ruling out confounders.
TO FLAG — ALL must be true:
  ✓ CONDITION A — EXPLICIT CAUSAL ASSERTION: Uses causal language to assert X caused Y:
    caused, led to, resulted in, is why, proves that, demonstrates that [causally], is the reason, therefore [causal], clearly [causal], must be because, is responsible for, shows that [causally], which is why
  ✓ CONDITION B — INSUFFICIENT BASIS: Rests on temporal sequence alone, correlation alone, no mechanism described, no confounders ruled out
DO NOT FLAG IF:
  FC-1: Explicitly acknowledges reporting correlation, not asserting causation
  FC-2: Causal language is hedged ("may contribute to", "might be related to", "could influence")
  FC-3: Well-established scientific consensus ("Smoking causes cancer")
  FC-4: A plausible mechanism IS described
  FC-5: Describes a barrier, mechanism, or plausible consequence without asserting a surprising causal chain ("Tuition debt stops low-income students from graduating" → NOT flagged)
  FC-6: If in doubt → false
FLAGGED: "Crime rose after the mayor took office, so his policies must be making the city less safe." / "Ever since the reading program started, test scores improved — clearly the program works."
NOT FLAGGED: "Sleep deprivation may contribute to lower performance." / "Tuition debt stops many students from finishing college." / "Phone bans can improve grades."

CHECK 6: STRAW MAN
DEFINITION: Misrepresents, distorts, or exaggerates an opposing position to make it easier to attack.
TO FLAG — ALL must be true:
  ✓ References or implies an opposing position or argument
  ✓ The opposing position as described is a distortion or oversimplification of what the opposition actually argues
  ✓ Attacks the distorted version rather than the real one
DO NOT FLAG IF:
  SM-1: Accurately describes the opposing position before critiquing it
  SM-2: No opposing position is referenced at all
  SM-3: The simplification is reasonable and fair
  SM-4: If in doubt → false
FLAGGED: "Those who oppose this policy just want criminals to run free." / "Environmentalists want to shut down all industry and send us back to the Stone Age."
NOT FLAGGED: "Opponents argue it will increase costs — but evidence shows otherwise."

CHECK 7: APPEAL TO AUTHORITY
DEFINITION: Uses endorsement of a person, institution, or source as the sole justification, where either (a) the authority is not a genuine expert in the relevant field, OR (b) the appeal is used as a substitute for evidence.
TO FLAG — ALL must be true:
  ✓ An authority is cited
  ✓ Their endorsement is presented as the PRIMARY or ONLY reason to accept the claim
  ✓ EITHER the authority lacks genuine expertise in the specific field, OR no actual evidence or reasoning accompanies the appeal
DO NOT FLAG IF:
  AA-1: Authority IS a genuine expert AND citation accompanies other evidence/reasoning
  AA-2: Authority cited as one piece of evidence among several
  AA-3: Acknowledges uncertainty while citing authority
  AA-4: If in doubt → false
FLAGGED: "This economic policy must be correct because a famous actor endorsed it." / "It must be true — a Nobel Prize winner said so." (sole evidence, no reasoning)
NOT FLAGGED: "The IPCC, drawing on thousands of peer-reviewed studies, concludes temperatures are rising."

CHECK 8: ANECDOTAL DATA
DEFINITION: Uses a single personal story, isolated example, or small number of cases as primary evidence for a broad general claim.
TO FLAG — ALL must be true:
  ✓ A broad general claim is being made
  ✓ Evidence is a single case, personal experience, or small number of examples
  ✓ Anecdote is presented as sufficient evidence for the broad claim, not merely as illustration
DO NOT FLAG IF:
  AN-1: Anecdote offered as illustration alongside other evidence
  AN-2: Claim is narrow and scoped to the individual case
  AN-3: Explicitly acknowledges the anecdote is limited
  AN-4: If in doubt → false
FLAGGED: "My uncle smoked his whole life and lived to 95, so smoking can't be that harmful." / "I know someone who got the vaccine and got sick, so vaccines clearly cause illness."
NOT FLAGGED: "Research shows vaccines are safe, and my own experience was consistent with that."

CHECK 9: WHATABOUTISM / RED HERRING
DEFINITION:
  WHATABOUTISM: Deflects from a criticism by pointing to a different issue rather than addressing the original point.
  RED HERRING: Introduces an irrelevant point that distracts from the actual argument.
TO FLAG — ANY must be true:
  ✓ WHATABOUTISM: Responds to a claim by redirecting to a different actor's behavior rather than engaging with the original claim
  ✓ RED HERRING: Introduces a point clearly irrelevant to the matter being argued, serving only to distract
DO NOT FLAG IF:
  WH-1: Comparison IS logically relevant to establishing consistency or hypocrisy in applying a principle
  WH-2: The introduced point genuinely bears on the argument
  WH-3: If in doubt → false
FLAGGED: "Why are we talking about our carbon emissions when China pollutes far more?" / "This politician's spending is criticized, but what about the other party's?"
NOT FLAGGED: "Before accepting this argument, consider how this principle applies in other contexts."

======================================
DECISION PROCEDURE
======================================
For each check in order:
  STEP A: Read the definition.
  STEP B: Check all TO-FLAG conditions. Are ALL required conditions met? If NO → detected=false.
  STEP C: Check DO-NOT-FLAG rules one by one. Does ANY rule apply? If YES → detected=false. If NO → detected=true. Extract trigger_phrase. Write explanation (do not use "you").
  STEP D: Move to next check regardless of result.
After all nine: compile violations = array of key names where detected=true. If none: violations=["none"].
"""


def _nine_check_output_schema() -> str:
    return """{
  "checks": {
    "personal_attack":           {"detected": <bool>, "trigger_phrase": <str|null>, "explanation": <str|null>},
    "not_a_statement":           {"detected": <bool>, "trigger_phrase": <str|null>, "explanation": <str|null>},
    "overgeneralization":        {"detected": <bool>, "trigger_phrase": <str|null>, "explanation": <str|null>},
    "exaggeration":              {"detected": <bool>, "trigger_phrase": <str|null>, "explanation": <str|null>},
    "false_causation":           {"detected": <bool>, "trigger_phrase": <str|null>, "explanation": <str|null>},
    "straw_man":                 {"detected": <bool>, "trigger_phrase": <str|null>, "explanation": <str|null>},
    "appeal_to_authority":       {"detected": <bool>, "trigger_phrase": <str|null>, "explanation": <str|null>},
    "anecdotal_data":            {"detected": <bool>, "trigger_phrase": <str|null>, "explanation": <str|null>},
    "whataboutism_red_herring":  {"detected": <bool>, "trigger_phrase": <str|null>, "explanation": <str|null>}
  },
  "violations": [<str>]
}"""


def structure_agent(tile: dict, parent: dict | None, siblings: list, topic: str) -> dict:
    player = tile.get('player', 'plus')
    side_label = "Plus (pro) — argues IN FAVOR of the topic" if player == 'plus' else "Minus (con) — argues AGAINST the topic"
    prompt = f"""
You are analyzing an argument tile in a structured debate game.

Topic: {topic}
Parent tile: "{parent['text'] if parent else 'None (root tile)'}"
Sibling tiles: {[s['text'] for s in siblings] if siblings else 'None'}
Current tile: "{tile['text']}"
Tile player side: {side_label}

Classify the tile's relationship to its parent:
- SUPPORTS: adds evidence, reasoning, or agreement with the parent argument
- REBUTS: contradicts, challenges, or undermines the parent argument
- IRRELEVANT: does not function as a valid debate argument

Classify as IRRELEVANT if any of the following apply:
  a) Personal attack — targets the opponent as a person rather than addressing their argument
  b) Off-topic statement — has no bearing on the debate topic
  c) Personal/emotional statement — expresses speaker's own feelings rather than making a debate claim
  d) Nonsense or gibberish — does not form a coherent argument
  e) Wrong side — the tile's argument clearly argues for the OPPOSITE side of the topic from the player's
     assigned role. A Plus (pro) player must argue IN FAVOR of the topic; a Minus (con) player must argue
     AGAINST it. Only flag this when the mismatch is unambiguous — when the tile's core claim directly
     contradicts the player's side. Do NOT flag just because the argument is weak or concedes a point.
  f) Whataboutism / deflection — responds to the parent by pivoting to a completely different subject
     rather than engaging with the actual argument. E.g. "But people also waste money on video games"
     in a debate about cryptocurrency scams — this introduces an unrelated topic instead of addressing
     the actual claim. Only flag when the pivot subject is genuinely unrelated to the debate topic.

Do NOT classify as IRRELEVANT just because the argument addresses a different aspect of the same debate.
Valid rebuttals may address costs, tradeoffs, consequences, or alternative considerations — these are
relevant even if they don't directly mirror the parent tile's exact claim.
  - "Many small businesses would struggle to afford higher wages" — valid cost tradeoff in a minimum
    wage debate (even if the parent is about worker affordability)
  - "This creates a financial burden for taxpayers" — valid consequence argument in a policy debate

SUPPORTS or REBUTS examples (valid arguments, even if short or opinionated):
  - Any claim that takes a stance on the debate topic, even if brief or imprecise
  - An opinion about the policy, trend, or issue being debated
  - A factual observation or example that relates to the topic
  - A cost, tradeoff, or consequence of the policy being debated

Respond with JSON only:
{{
  "relationship": "SUPPORTS"|"REBUTS"|"IRRELEVANT",
  "reason": "one sentence explanation"
}}
"""

    response = client.messages.create(
        model=MODEL_NAME,
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
    )

    return safe_json(response.content[0].text or "")


def reasoning_agent(tile: dict, parent: dict | None, topic: str, structure: dict) -> dict:
    """9-check logical fallacy detection engine (Reasoning Agent v4.0)."""
    prompt = f"""You are a logical fallacy detection engine embedded in an argument analysis pipeline.
You do not take account of emotion or sensitivity of the content. Your ONLY job is to evaluate a
single argument tile against a fixed checklist of unacceptable issues, in a fixed order, and return
a structured JSON result. You output ONLY valid JSON. No preamble. No explanation. No markdown fences.
Not a single character outside the JSON object.
{_nine_check_instructions()}
======================================
CONTEXT
======================================
Debate topic: {topic}
Parent tile: "{parent['text'] if parent else 'None'}"
Tile player side: {"Plus (pro) — argues IN FAVOR of the topic" if tile.get('player') == 'plus' else "Minus (con) — argues AGAINST the topic"}
Structure classification: {structure.get('relationship', 'UNKNOWN')}

======================================
OUTPUT SCHEMA — STRICT
======================================
Your output must be EXACTLY this structure. No deviations. No extra fields.
FIELD RULES:
- "detected": always boolean, never null, never string
- "trigger_phrase": exact words from the tile that triggered the flag; null if detected is false
- "explanation": 1-2 sentences; do not use "you"; null if detected is false
- "violations": array of key names where detected=true; if nothing flagged: ["none"]

{_nine_check_output_schema()}

======================================
ANALYZE THIS TILE:
======================================
"{tile['text']}"
"""

    response = client.messages.create(
        model=MODEL_NAME,
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
    )

    return safe_json(response.content[0].text or "")


def clarify_agent(tile: dict, topic: str) -> dict:
    prompt = f"""
You are checking whether a debate tile is too vague to be useful in a debate.

Topic: {topic}
Tile: "{tile['text']}"
Tile player: {"Plus (pro)" if tile.get('player') == 'plus' else "Minus (con)"}

Clarification is needed ONLY when the tile is so vague, generic, or underspecified
that another player cannot meaningfully respond to it.

SHOULD trigger — tile makes no identifiable claim:
- "That is just wrong." (what is wrong? why?)
- "This causes problems." (what causes what problems?)
- "It is bad." (what is bad about what?)
- "People have issues with this." (which people? what issues?)

Should NOT trigger — tile makes a recognizable claim even if brief:
- "Phones can distract students."
- "School uniforms limit self-expression."
- "Tuition debt makes college harder for low-income students."
- "This policy is unfair."
- "Students deserve more freedom."
- "Phone bans improve focus."

Hard rules:
- Minimize false positives — when in doubt, do NOT trigger clarification.
- Do NOT trigger because the tile is short or informal.
- Do NOT trigger on opinions or value statements — those are valid claims.
- Do NOT trigger on personal attacks or off-topic content — those are structure issues, not clarity issues.
- If you provide rewrites, MUST preserve the original side and stance (pro or con).
- Each rewrite MUST be 100 characters or fewer.

Return valid JSON only:
{{
  "clarification_needed": true|false,
  "reason": "one sentence explanation",
  "rewrites": ["rewrite 1", "rewrite 2"]
}}
"""

    response = client.messages.create(
        model=MODEL_NAME,
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
    )

    return safe_json(response.content[0].text or "")


def analysis_agent(tile: dict, parent: dict | None, siblings: list, topic: str) -> dict:
    player = tile.get('player', 'plus')
    side_label = "Plus (pro) — argues IN FAVOR of the topic" if player == 'plus' else "Minus (con) — argues AGAINST the topic"
    prompt = f"""
You are analyzing an argument tile in a structured debate game. Do all three tasks below
in one pass and return ONLY valid JSON. No preamble, no markdown, no text outside the object.

Topic: {topic}
Parent tile: "{parent['text'] if parent else 'None (root tile)'}"
Sibling tiles: {[s['text'] for s in siblings] if siblings else 'None'}
Current tile: "{tile['text']}"
Tile player side: {side_label}

════════════════════════════════════════
TASK 1 — STRUCTURE
════════════════════════════════════════
Classify the tile's relationship to its parent:
- SUPPORTS: adds evidence, reasoning, or agreement with the parent argument
- REBUTS: contradicts, challenges, or undermines the parent argument
- IRRELEVANT: does not function as a valid debate argument

Classify as IRRELEVANT if any of the following apply:
  a) Personal attack — targets the opponent as a person rather than addressing their argument
  b) Off-topic statement — no bearing on the debate topic
  c) Personal/emotional statement — expresses speaker's own feelings, not a debate claim
  d) Nonsense or gibberish
  e) Wrong side — the tile's argument clearly argues for the OPPOSITE side of the topic from the
     player's assigned role. Plus (pro) must argue IN FAVOR; Minus (con) must argue AGAINST.
     Only flag when the mismatch is unambiguous — the tile's core claim directly contradicts the
     player's side. Do NOT flag for weak arguments or partial concessions.
  f) Whataboutism / deflection — responds to the parent by pivoting to a completely different subject
     rather than engaging with the actual argument. E.g. "But people also waste money on video games"
     in a cryptocurrency debate — this introduces an unrelated topic instead of addressing the actual
     claim. Only flag when the pivot subject is genuinely unrelated to the debate topic.

Do NOT classify as IRRELEVANT just because the argument addresses a different aspect of the same debate.
Valid rebuttals may address costs, tradeoffs, consequences, or alternative considerations — these are
relevant even if they don't directly mirror the parent tile's exact claim.
  - "Many small businesses would struggle to afford higher wages" — valid cost tradeoff in a minimum
    wage debate (even if the parent is about worker affordability)

Output:
  "structure": {{"relationship": "SUPPORTS"|"REBUTS"|"IRRELEVANT", "reason": "one sentence"}}

════════════════════════════════════════
TASK 2 — REASONING (9-Check Fallacy Detection)
════════════════════════════════════════
{_nine_check_instructions()}

Output the full 9-check results nested under "reasoning":
  "reasoning": {_nine_check_output_schema()}

════════════════════════════════════════
TASK 3 — CLARITY
════════════════════════════════════════
Flag clarification ONLY when the tile is so vague that another player cannot meaningfully respond.
Do NOT trigger because the tile is short, informal, or an opinion.
Do NOT trigger if the tile is already IRRELEVANT — that is a structure issue, not a clarity issue.
If clarification is needed, provide 2-3 rewrites keeping the same side and stance. Each ≤100 chars.

Should trigger: "That is just wrong." / "This causes problems." / "It is bad."
Should NOT trigger: "Phones can distract students." / "This policy is unfair." / "Tuition debt makes college harder."

Output:
  "clarify": {{"clarification_needed": true|false, "reason": "one sentence", "rewrites": [...]}}

════════════════════════════════════════
RETURN EXACTLY THIS STRUCTURE:
════════════════════════════════════════
{{
  "structure": {{
    "relationship": "SUPPORTS"|"REBUTS"|"IRRELEVANT",
    "reason": "one sentence explanation"
  }},
  "reasoning": {{
    "checks": {{
      "personal_attack":          {{"detected": <bool>, "trigger_phrase": <str|null>, "explanation": <str|null>}},
      "not_a_statement":          {{"detected": <bool>, "trigger_phrase": <str|null>, "explanation": <str|null>}},
      "overgeneralization":       {{"detected": <bool>, "trigger_phrase": <str|null>, "explanation": <str|null>}},
      "exaggeration":             {{"detected": <bool>, "trigger_phrase": <str|null>, "explanation": <str|null>}},
      "false_causation":          {{"detected": <bool>, "trigger_phrase": <str|null>, "explanation": <str|null>}},
      "straw_man":                {{"detected": <bool>, "trigger_phrase": <str|null>, "explanation": <str|null>}},
      "appeal_to_authority":      {{"detected": <bool>, "trigger_phrase": <str|null>, "explanation": <str|null>}},
      "anecdotal_data":           {{"detected": <bool>, "trigger_phrase": <str|null>, "explanation": <str|null>}},
      "whataboutism_red_herring": {{"detected": <bool>, "trigger_phrase": <str|null>, "explanation": <str|null>}}
    }},
    "violations": [<str>]
  }},
  "clarify": {{
    "clarification_needed": <bool>,
    "reason": "one sentence explanation",
    "rewrites": [<str>]
  }}
}}
"""

    response = client.messages.create(
        model=MODEL_NAME,
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
    )

    return safe_json(response.content[0].text or "")


def explanation_agent(
    tile: dict,
    parent: dict | None,
    structure: dict,
    reasoning: dict,
    clarify: dict,
    topic: str,
) -> dict:
    # Only UI (Big 5) violations surface as user-facing feedback
    all_violations = reasoning.get("violations") or []
    ui_violations_for_gate = [v for v in all_violations if v in UI_CHECK_KEYS]

    has_issue = bool(
        ui_violations_for_gate
        or clarify.get("clarification_needed")
        or structure.get("relationship") == "IRRELEVANT"
    )
    if not has_issue:
        return {
            "feedback": None,
            "suggestion": None,
            "suggestion_confidence": None,
            "suggestion_preserves_stance": None,
        }

    # ui_violations_for_gate already computed above; reuse as ui_violations
    ui_violations = ui_violations_for_gate
    checks = reasoning.get("checks") or {}
    irrelevant_reason = structure.get("reason", "")

    is_personal_attack = (
        "personal_attack" in ui_violations
        or (
            structure.get("relationship") == "IRRELEVANT"
            and any(
                kw in irrelevant_reason.lower()
                for kw in ("personal attack", "ad hominem", "insult", "opponent", "person", "mockery")
            )
        )
    )

    # Build rich issue descriptions — UI violations only
    issues: list[str] = []
    if is_personal_attack:
        issues.append("personal attack on the opponent rather than their argument")
    elif structure.get("relationship") == "IRRELEVANT":
        issues.append("off-topic — does not connect to the debate")

    ui_check_labels = {
        "overgeneralization": "overgeneralization — claim applies too broadly",
        "exaggeration": "exaggeration — claim is more extreme than evidence supports",
        "false_causation": "false causation — asserting causation without sufficient support",
        "straw_man": "straw man — misrepresents the opposing argument",
    }
    for v in ui_violations:
        if v != "personal_attack" and v in ui_check_labels:
            explanation_from_check = checks.get(v, {}).get("explanation") or ""
            label = ui_check_labels[v]
            issues.append(f"{label}: {explanation_from_check}" if explanation_from_check else label)

    if clarify.get("clarification_needed"):
        issues.append("lacks clarity — too vague to respond to")

    prompt = f"""
A debate tile needs short, user-facing feedback (one plain sentence).

Topic: {topic}
Tile: "{tile['text']}"
Parent tile: "{parent['text'] if parent else 'None'}"
Tile player: {"Plus (pro)" if tile.get('player') == 'plus' else "Minus (con)"}

Detected issues:
{chr(10).join(f'  - {i}' for i in issues)}

Feedback tone by issue type:
- Personal attack: Arguments should address the other person's claim, not the person themselves.
- Off-topic / no connection: This doesn't connect to the debate; make a point about the actual topic.
- Overgeneralization: The claim is broader than evidence supports; narrow the scope.
- Exaggeration: The claim is more extreme than evidence can support.
- False causation: The claim assumes a causal link that needs more support.
- Not a statement: Rephrase as a declarative claim, not a question.
- Straw man: Engage with what the opponent actually argued.
- Appeal to authority: Explain why the evidence supports the claim, not just who said it.
- Anecdotal data: A single example is not enough to support a broad claim.
- Whataboutism / red herring: Address the actual point rather than deflecting.
- Lacks clarity: Be more specific so others can respond.

Suggestion rules:
- For personal attacks: return "suggestion": null — an insult cannot be rewritten into a valid argument.
- For not_a_statement: rewrite as a declarative statement if the intent is clear; otherwise null.
- For all other issues: provide a concrete improved version if possible.
- MUST preserve the player's original side and stance (pro stays pro, con stays con).
- Do not flip the argument or soften it into a neutral statement.
- The suggestion MUST be 100 characters or fewer. Count carefully. If you cannot stay under 100 chars, return "suggestion": null.
- Prefer the strongest rewrite from the clarify rewrites list if available.
Clarify rewrites: {clarify.get('rewrites', [])}

Return valid JSON only:
{{
  "feedback": "one plain sentence",
  "suggestion": "improved tile text or null",
  "suggestion_confidence": "high|medium|low",
  "suggestion_preserves_stance": true|false|null
}}
"""

    try:
        response = client.messages.create(
            model=MODEL_NAME,
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}],
        )
        parsed = safe_json(response.content[0].text or "")
        if isinstance(parsed, dict) and parsed:
            return parsed
    except Exception as error:
        print(f"explanation_agent fallback: {error}")

    return fallback_explanation(structure, reasoning, clarify)


# ── False-positive logging ────────────────────────────────────────────────────
_LOG_PATH = os.path.join(os.path.dirname(__file__), "eval_log.jsonl")


def _append_eval_log(
    tile: dict,
    structure: dict,
    reasoning: dict,
    clarify: dict,
    ui_violations: list[str],
    research_only_violations: list[str],
) -> None:
    """Append one JSON line per evaluation for offline research analysis.

    Each record captures:
      - tile text and id
      - all 9 check results (full checks dict)
      - which violations fired (split by UI vs research-only)
      - structure and clarify outcomes
      - timestamp

    Revisit at ~50 contested-claim cases to calibrate false-positive rate.
    """
    try:
        record = {
            "logged_at": datetime.now(timezone.utc).isoformat(),
            "tile_id": tile.get("tileId"),
            "tile_text": tile.get("text", ""),
            "structure_relationship": structure.get("relationship"),
            "clarification_needed": clarify.get("clarification_needed"),
            "ui_violations": ui_violations,
            "research_only_violations": research_only_violations,
            "all_violations": reasoning.get("violations") or [],
            "checks": reasoning.get("checks") or {},
        }
        with open(_LOG_PATH, "a", encoding="utf-8") as fh:
            fh.write(json.dumps(record, ensure_ascii=False) + "\n")
    except Exception as err:  # never crash the main pipeline
        print(f"[eval_log] write failed: {err}")


def append_action_log(
    tile_id: str | None,
    action: str,
    original_suggestion: str | None,
    edited_suggestion: str | None,
    *,
    game_id: str | None = None,
    schema_version: str | None = None,
    model_name: str | None = None,
    prompt_versions: dict | None = None,
    threshold_version: str | None = None,
    error_types: list | None = None,
    first_wave_categories: list | None = None,
    errors_found: bool | None = None,
    display_feedback: bool | None = None,
    display_reason: str | None = None,
    feedback: str | None = None,
    suggestion: str | None = None,
    suggestion_source: str | None = None,
    suggestion_preserves_stance: bool | None = None,
) -> None:
    """Log the player's response to AI feedback (RS-03 / UR-10).

    Fields:
      action             — "accepted" or "dismissed"
      original_suggestion — what Claude suggested
      edited_suggestion  — what the player actually submitted (may be edited or same)
      player_edited      — true if the player changed the suggestion before accepting

    This appends to the same eval_log.jsonl file so eval + action records
    can be joined on tile_id for research analysis.
    """
    try:
        record = {
            "logged_at": datetime.now(timezone.utc).isoformat(),
            "event": "feedback_action",
            "tile_id": tile_id,
            "action": action,                         # "accepted" | "dismissed"
            "feedback_shown": True,
            "feedback_dismissed": action == "dismissed",
            "feedback_revised": action == "accepted",
            "original_suggestion": original_suggestion,
            "edited_suggestion": edited_suggestion,
            "player_edited": (
                bool(edited_suggestion and original_suggestion and
                     edited_suggestion.strip() != original_suggestion.strip())
            ),
        }
        optional_fields = {
            "game_id": game_id,
            "schema_version": schema_version,
            "model_name": model_name,
            "prompt_versions": prompt_versions,
            "threshold_version": threshold_version,
            "error_types": error_types,
            "first_wave_categories": first_wave_categories,
            "errors_found": errors_found,
            "display_feedback": display_feedback,
            "display_reason": display_reason,
            "feedback": feedback,
            "suggestion": suggestion,
            "suggestion_source": suggestion_source,
            "suggestion_preserves_stance": suggestion_preserves_stance,
        }
        for key, value in optional_fields.items():
            if value is not None:
                record[key] = value
        with open(_LOG_PATH, "a", encoding="utf-8") as fh:
            fh.write(json.dumps(record, ensure_ascii=False) + "\n")
    except Exception as err:
        print(f"[action_log] write failed: {err}")


def append_ai_turn_log(
    game_id: str | None,
    tile_id: str | None,
    parent_id: str | None,
    text: str | None,
    ai_role: str | None,
    strategy: str | None = None,
    angle: str | None = None,
    model_name: str | None = None,
    prompt_version: str | None = None,
    evaluated_at: str | None = None,
) -> None:
    """Log each AI co-player turn for research analysis (FR-11 / BE-04)."""
    try:
        record = {
            "logged_at": datetime.now(timezone.utc).isoformat(),
            "event": "ai_coplayer_turn",
            "game_id": game_id,
            "tile_id": tile_id,
            "parent_id": parent_id,
            "text": text,
            "ai_role": ai_role,
            "strategy": strategy,
            "angle": angle,
            "model_name": model_name,
            "prompt_version": prompt_version,
            "evaluated_at": evaluated_at,
        }
        with open(_LOG_PATH, "a", encoding="utf-8") as fh:
            fh.write(json.dumps(record, ensure_ascii=False) + "\n")
    except Exception as err:
        print(f"[ai_turn_log] write failed: {err}")


def export_session_logs(
    event_types: list[str] | None = None,
    game_id: str | None = None,
) -> list[dict]:
    """Read eval_log.jsonl and return matching records (BE-05 / FR-12).

    Args:
        event_types: if provided, filter to records whose "event" field is in this list.
                     Defaults to all event types.
        game_id:     if provided, filter to records with matching game_id.
    Returns:
        list of matching log records as dicts.
    """
    results: list[dict] = []
    if not os.path.exists(_LOG_PATH):
        return results
    try:
        with open(_LOG_PATH, encoding="utf-8") as fh:
            for line in fh:
                line = line.strip()
                if not line:
                    continue
                try:
                    record = json.loads(line)
                except json.JSONDecodeError:
                    continue
                if event_types and record.get("event") not in event_types:
                    continue
                if game_id and record.get("game_id") != game_id:
                    continue
                results.append(record)
    except Exception as err:
        print(f"[export_session_logs] read failed: {err}")
    return results


def evaluate_tile(tile: dict, game_board: dict, topic: str) -> dict:
    parent, siblings = get_context(tile, game_board)

    analysis = analysis_agent(tile, parent, siblings, topic)
    structure = analysis.get("structure")
    reasoning_raw = analysis.get("reasoning")
    clarify = analysis.get("clarify")
    pipeline_mode = "combined_analysis"

    if (
        not isinstance(structure, dict)
        or not isinstance(reasoning_raw, dict)
        or not isinstance(clarify, dict)
    ):
        pipeline_mode = "fallback_split"
        with ThreadPoolExecutor(max_workers=2) as executor:
            structure_future = executor.submit(structure_agent, tile, parent, siblings, topic)
            clarify_future = executor.submit(clarify_agent, tile, topic)
            structure = structure_future.result()
            clarify = clarify_future.result()
        reasoning_raw = reasoning_agent(tile, parent, topic, structure)

    structure = normalize_structure(structure)
    reasoning = normalize_reasoning(reasoning_raw)
    clarify = normalize_clarify(clarify)
    clarify = suppress_false_positive_clarify(tile, structure, reasoning, clarify)
    explanation = explanation_agent(tile, parent, structure, reasoning, clarify, topic)

    first_wave_categories = map_first_wave_categories(structure, reasoning, clarify)
    error_types = map_error_types(structure, reasoning, clarify)

    suggestion, suggestion_source, suggestion_confidence, suggestion_preserves_stance = select_suggestion(
        clarify, explanation,
    )

    # has_ui_issues drives display_feedback — only Big 5 violations surface in UI
    all_violations = reasoning.get("violations") or []
    ui_violations = [v for v in all_violations if v in UI_CHECK_KEYS]
    research_only_violations = [v for v in all_violations if v in RESEARCH_ONLY_CHECK_KEYS]

    has_ui_issues = bool(
        ui_violations
        or clarify.get("clarification_needed")
        or structure.get("relationship") == "IRRELEVANT"
    )

    # False-positive log: write all evaluations to JSONL for research analysis
    _append_eval_log(tile, structure, reasoning, clarify, ui_violations, research_only_violations)

    response = {
        "tileId": tile.get("tileId"),
        "schema_version": SCHEMA_VERSION,
        "evaluated_at": datetime.now(timezone.utc).isoformat(),
        "model_name": MODEL_NAME,
        "pipeline_mode": pipeline_mode,
        "prompt_versions": PROMPT_VERSIONS,
        "threshold_version": THRESHOLD_VERSION,
        "display_feedback": has_ui_issues,
        "display_reason": (
            "reasoning_issue"
            if ui_violations
            else "clarification_needed"
            if clarify.get("clarification_needed")
            else "irrelevant_to_parent"
            if structure.get("relationship") == "IRRELEVANT"
            else "no_feedback_needed"
        ),
        "structure": structure,
        "reasoning": reasoning,
        "clarify": clarify,
        "error_types": error_types,
        "first_wave_categories": first_wave_categories,
        "feedback": explanation.get("feedback"),
        "suggestion": suggestion,
        "suggestion_source": suggestion_source,
        "suggestion_confidence": suggestion_confidence,
        "suggestion_preserves_stance": suggestion_preserves_stance,
        "errors_found": has_ui_issues,
    }
    return AiEvaluationResponse.model_validate(response).model_dump()


# ─────────────────────────────────────────────────────────────────────────────
# CO-PLAYER AGENT PIPELINE  (DEV-206 / DEV-216)
# ─────────────────────────────────────────────────────────────────────────────

CO_PLAYER_MODEL = os.getenv("ANTHROPIC_COPLAYER_MODEL", "claude-haiku-4-5")
CO_PLAYER_PROMPT_VERSION = "2026-05-27-v1"
TILE_TEXT_MAX = 65  # ~3 lines at text-sm in a 272px tile — fits without clipping


def _serialize_board(game_board: dict, topic: str) -> str:
    """Render a human-readable board summary for co-player prompts."""
    lines = [f'Topic: "{topic}"', "", "Confirmed tiles on the board:"]
    confirmed = [
        t for t in game_board.values()
        if t.get("confirmed") and t.get("tileId") != "0" and t.get("text", "").strip()
    ]
    if not confirmed:
        lines.append("  (no arguments placed yet — only the root topic tile exists)")
        return "\n".join(lines)
    for t in confirmed:
        tid = t.get("tileId", "?")
        player = (t.get("player") or "?").upper()
        text = t.get("text", "").strip()
        parent_id = t.get("parentId")
        parent = game_board.get(parent_id, {}) if parent_id else {}
        parent_text = parent.get("text", "").strip() if parent.get("tileId") != "0" else ""
        label = f'responds to: "{parent_text}"' if parent_text else "responds to: root topic"
        lines.append(f'  [{tid}] {player}: "{text}"  ({label})')
    return "\n".join(lines)


def _strategy_agent(
    game_board: dict,
    topic: str,
    ai_role: str,
    viable_parent_ids: list[str] | None = None,
) -> dict:
    """Step 1 – Decide which tile to respond to and define the argument angle.

    viable_parent_ids: if provided by the frontend, only tiles in this list have a free
    edge and can accept a new child tile (game rules: branching only, no editing).
    """
    opponent = "minus" if ai_role == "plus" else "plus"
    side_label = "Plus (pro) — argue IN FAVOR of the topic" if ai_role == "plus" else "Minus (con) — argue AGAINST the topic"

    # Use frontend-supplied viable set if given; fall back to all confirmed tiles
    if viable_parent_ids:
        candidate_ids = [
            id_ for id_ in viable_parent_ids
            if id_ in game_board
            and game_board[id_].get("confirmed")
            and game_board[id_].get("text", "").strip()
        ] or viable_parent_ids or ["0"]
    else:
        candidate_ids = [
            t.get("tileId")
            for t in game_board.values()
            if t.get("confirmed") and t.get("text", "").strip()
        ] or ["0"]

    prompt = f"""You are playing a structured debate game called Point Taken.
Your role: {ai_role.upper()} — {side_label}
Opponent role: {opponent.upper()}

GAME RULES (follow strictly):
- You add a BRAND NEW argument tile branching off an existing tile. You never edit existing tiles.
- Each move creates exactly one new tile attached to a chosen parent tile.
- Your new tile argues {side_label.split(' — ')[1].strip()}.

{_serialize_board(game_board, topic)}

Tiles you may branch off (these have open slots): {candidate_ids}

Choose your best move:
- Prefer to REBUT the strongest {opponent.upper()} tile.
- If no opponent tiles exist yet, respond to the root topic tile "0".
- You may EXTEND your own chain by supporting a tile you already placed.
- You MUST pick a tile ID from the list above.

Return JSON only:
{{
  "target_tile_id": "<one ID from {candidate_ids}>",
  "strategy": "rebut_opponent" | "support_topic" | "extend_own_chain",
  "angle": "<one sentence: the specific argument angle you will take>"
}}"""

    resp = client.messages.create(
        model=CO_PLAYER_MODEL,
        max_tokens=256,
        messages=[{"role": "user", "content": prompt}],
    )
    return safe_json(resp.content[0].text)


def _content_agent(game_board: dict, topic: str, ai_role: str, target_tile_id: str, angle: str) -> dict:
    """Step 2 – Write the actual argument text (max 100 chars)."""
    target = game_board.get(target_tile_id, {})
    target_text = target.get("text", "").strip() or "the debate topic"
    side_label = "IN FAVOR of" if ai_role == "plus" else "AGAINST"

    prompt = f"""You are writing a single debate argument tile.
Topic: "{topic}"
You argue {side_label} the topic.
Responding to: "{target_text}"
Argument angle: {angle}

Rules:
- ONE grammatically complete sentence. Subject + verb + full object/complement. Period at the end.
- Hard limit: {TILE_TEXT_MAX} characters. Aim for 35–50 characters — SHORT sentences are safer.
- CRITICAL: Every sentence must be fully closed. When in doubt, write shorter.
  BAD: "Phones prevent essential digital"       ← dangling adjective, no noun
  BAD: "stricter discipline likely drives"      ← verb without object
  BAD: "phones skip the thinking that"          ← dangling relative clause
  GOOD: "Phone bans help students focus."       ← 33 chars ✓
  GOOD: "Clear rules turn phones into tools."   ← 35 chars ✓
  GOOD: "Bans remove distractions in class."    ← 34 chars ✓
- No question marks. No fallacies.
- Argue in good faith: make the strongest FAIR point for your side. No cheap shots,
  no straw-manning, no exaggeration — a reasonable sparring partner, not a troll.
- Sound like a thoughtful student, not a textbook.
- Return your argument text only — no quotes, no explanation.

Return JSON only:
{{
  "text": "<argument, max {TILE_TEXT_MAX} chars>"
}}"""

    resp = client.messages.create(
        model=CO_PLAYER_MODEL,
        max_tokens=128,
        messages=[{"role": "user", "content": prompt}],
    )
    data = safe_json(resp.content[0].text)
    text = (data.get("text") or "").strip()
    if len(text) > TILE_TEXT_MAX:
        # Truncate at last word boundary; strip trailing prepositions, conjunctions,
        # and adjectives-without-nouns so the result reads as a complete thought.
        _DANGLERS = {
            # prepositions / conjunctions
            "and","or","but","the","a","an","in","on","at","to","for","of","with",
            "by","from","because","so","yet","nor","as","into","onto","than","that",
            # adjectives that strandedly end sentences after truncation
            "essential","digital","critical","academic","social","important",
            "necessary","valuable","useful","effective","significant","educational",
            "personal","potential","harmful","negative","positive","additional",
        }
        text = text[:TILE_TEXT_MAX].rsplit(" ", 1)[0].rstrip(".,;:")
        words = text.split()
        while words and words[-1].lower() in _DANGLERS:
            words.pop()
        text = " ".join(words)
    return {"text": text}


def co_player_turn(
    game_board: dict,
    topic: str,
    ai_role: str,
    viable_parent_ids: list[str] | None = None,
) -> dict:
    """Two-step co-player pipeline: strategy → content.

    viable_parent_ids: tile IDs that have at least one free edge (game rules: branching only).
    Returns a dict ready for the /co-player/turn endpoint with parent_id
    and text for the frontend to place as a new tile.
    """
    # Step 1: strategy
    strategy = _strategy_agent(game_board, topic, ai_role, viable_parent_ids)

    target_tile_id = strategy.get("target_tile_id") or "0"
    if target_tile_id not in game_board:
        target_tile_id = "0"

    angle = strategy.get("angle") or (
        f"Make a strong opening argument {'for' if ai_role == 'plus' else 'against'} the topic."
    )

    # Step 2: content
    content = _content_agent(game_board, topic, ai_role, target_tile_id, angle)

    return CoPlayerTurnResponse.model_validate({
        "parent_id": target_tile_id,
        "text": content.get("text", ""),
        "strategy": strategy.get("strategy"),
        "angle": angle,
        "prompt_version": CO_PLAYER_PROMPT_VERSION,
        "model_name": CO_PLAYER_MODEL,
        "evaluated_at": datetime.now(timezone.utc).isoformat(),
    }).model_dump()
