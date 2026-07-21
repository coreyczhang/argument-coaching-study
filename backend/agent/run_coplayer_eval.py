"""
Co-player eval harness — DEV-206
Runs each case in coplayer_eval_cases.json through co_player_turn()
and checks output quality: parent_id validity, text length, strategy field.
"""
import json
import time
from datetime import datetime
from pathlib import Path

from agents import CO_PLAYER_MODEL, CO_PLAYER_PROMPT_VERSION, co_player_turn

BASE_DIR = Path(__file__).resolve().parent
CASES_PATH = BASE_DIR / "coplayer_eval_cases.json"
OUTPUT_DIR = BASE_DIR / "eval_outputs"
REQUEST_DELAY_SECONDS = 3

VALID_STRATEGIES = {"rebut_opponent", "support_topic", "extend_own_chain"}


def load_cases() -> list[dict]:
    with CASES_PATH.open() as f:
        return json.load(f)


def evaluate_case(case: dict) -> dict:
    try:
        result = co_player_turn(case["game_board"], case["topic"], case["ai_role"])
    except Exception as error:
        return {
            "id": case["id"],
            "label": case["label"],
            "ai_role": case["ai_role"],
            "expected": case["expected"],
            "actual": {"error": str(error)},
            "checks": {
                "parent_id_valid": False,
                "text_non_empty": False,
                "text_within_limit": False,
                "strategy_valid": False,
                "overall": False,
            },
        }

    expected = case["expected"]
    text = result.get("text", "")
    parent_id = result.get("parent_id", "")
    strategy = result.get("strategy", "")

    # Checks
    parent_id_valid = (
        expected.get("parent_id") is None
        or parent_id == expected["parent_id"]
    ) and parent_id in case["game_board"]

    text_non_empty = bool(text.strip()) if expected.get("text_non_empty") else True
    text_within_limit = len(text) <= expected.get("text_max_chars", 100)
    strategy_valid = strategy in VALID_STRATEGIES if expected.get("strategy_valid") else True

    preferred = expected.get("preferred_strategy")
    preferred_hit = (strategy == preferred) if preferred else None

    overall = parent_id_valid and text_non_empty and text_within_limit and strategy_valid

    return {
        "id": case["id"],
        "label": case["label"],
        "ai_role": case["ai_role"],
        "expected": expected,
        "actual": {
            "parent_id": parent_id,
            "text": text,
            "text_len": len(text),
            "strategy": strategy,
            "angle": result.get("angle"),
            "model_name": result.get("model_name"),
            "prompt_version": result.get("prompt_version"),
        },
        "checks": {
            "parent_id_valid": parent_id_valid,
            "text_non_empty": text_non_empty,
            "text_within_limit": text_within_limit,
            "strategy_valid": strategy_valid,
            "preferred_strategy_hit": preferred_hit,
            "overall": overall,
        },
    }


def print_result(r: dict) -> None:
    checks = r["checks"]
    icon = "✅" if checks["overall"] else "❌"
    print(f"\n{icon} [{r['id']}] {r['label']} (role={r['ai_role']})")
    if "error" in r.get("actual", {}):
        print(f"   ERROR: {r['actual']['error']}")
        return
    a = r["actual"]
    print(f"   parent_id : {a['parent_id']}  ({'✓' if checks['parent_id_valid'] else '✗'})")
    print(f"   strategy  : {a['strategy']}  ({'✓' if checks['strategy_valid'] else '✗'})", end="")
    if r["checks"].get("preferred_strategy_hit") is not None:
        pref = r["expected"].get("preferred_strategy")
        hit = r["checks"]["preferred_strategy_hit"]
        print(f"  [preferred={pref}: {'hit' if hit else 'MISS'}]", end="")
    print()
    print(f"   text ({a['text_len']} chars {'✓' if checks['text_within_limit'] else '✗'}): \"{a['text']}\"")
    print(f"   angle: {a['angle']}")


def main() -> None:
    cases = load_cases()
    OUTPUT_DIR.mkdir(exist_ok=True)

    print(f"Co-Player Eval — model={CO_PLAYER_MODEL}  prompt={CO_PLAYER_PROMPT_VERSION}")
    print(f"Running {len(cases)} cases...\n{'─' * 60}")

    results = []
    for i, case in enumerate(cases):
        if i > 0:
            time.sleep(REQUEST_DELAY_SECONDS)
        r = evaluate_case(case)
        results.append(r)
        print_result(r)

    # Summary
    passed = sum(1 for r in results if r["checks"]["overall"])
    total = len(results)
    pref_cases = [r for r in results if r["checks"].get("preferred_strategy_hit") is not None]
    pref_hit = sum(1 for r in pref_cases if r["checks"]["preferred_strategy_hit"])

    print(f"\n{'─' * 60}")
    print(f"Overall: {passed}/{total} passed")
    if pref_cases:
        print(f"Preferred strategy hit: {pref_hit}/{len(pref_cases)}")

    # Save output
    ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    out_path = OUTPUT_DIR / f"coplayer_eval_{ts}.json"
    with out_path.open("w") as f:
        json.dump({
            "model": CO_PLAYER_MODEL,
            "prompt_version": CO_PLAYER_PROMPT_VERSION,
            "timestamp": ts,
            "summary": {"passed": passed, "total": total},
            "results": results,
        }, f, indent=2)
    print(f"Results saved to {out_path}")


if __name__ == "__main__":
    main()
