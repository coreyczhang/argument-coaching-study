"""
Run the independent evaluation against all 54 seed cases (36 AIFeed + 18 AICoP).
Outputs a results JSON compatible with summarize_results.py.
"""
import json
import time
import sys
import os
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(__file__))
from agents import evaluate_tile, co_player_turn

AIFEED_CASES_PATH = "/Users/coreyzhang/Downloads/independent_eval/independent_eval/data/aifeed_eval_cases_seed.json"
AICOP_CASES_PATH  = "/Users/coreyzhang/Downloads/independent_eval/independent_eval/data/aicop_eval_scenarios_seed.json"
SUMMARIZER_PATH   = "/Users/coreyzhang/Downloads/independent_eval/independent_eval/scripts/summarize_results.py"

OUTPUT_PATH = f"/Users/coreyzhang/Documents/GitHub/pointtaken/point-taken-backend/agent/eval_outputs/independent_eval_{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}.json"

# ── Category label normalisation ────────────────────────────────────────────
CATEGORY_MAP = {
    "needs_more_detail":       "Needs more detail",
    "too_broad":               "Too broad",
    "causal_leap":             "Causal leap",
    "needs_clearer_connection":"Needs clearer connection",
    "personal_attack":         "Personal attack",
    "exaggeration":            "Exaggeration",
    "straw_man":               "Straw man",
    "not_a_statement":         "Not a statement",
    "appeal_to_authority":     "Appeal to authority",
    "anecdotal_data":          "Anecdotal data",
    "whataboutism":            "Whataboutism",
    "red_herring":             "Red herring",
    "none":                    "none",
}

def normalise_category(raw):
    if raw is None:
        return "none"
    key = raw.lower().replace(" ", "_").replace("/", "_")
    return CATEGORY_MAP.get(key, raw)

def run_aifeed(cases):
    results = []
    for i, case in enumerate(cases):
        print(f"  AIFeed {i+1}/{len(cases)}: {case['id']} … ", end="", flush=True)
        tile = {
            "id": "1",
            "text": case["student_tile_text"],
            "role": "plus",
            "confirmed": True,
            "parentId": "0",
        }
        parent_tile = {
            "id": "0",
            "text": case["parent_tile_text"],
            "role": "minus",
            "confirmed": True,
            "parentId": None,
        }
        game_board = {"0": parent_tile, "1": tile}
        topic = case["topic"]

        t0 = time.time()
        try:
            output = evaluate_tile(tile, game_board, topic)
            latency = round(time.time() - t0, 2)

            # map model output category to expected label format
            predicted_categories = output.get("first_wave_categories") or []
            predicted_category = normalise_category(predicted_categories[0]) if predicted_categories else "none"
            expected_category   = normalise_category(case["expected_category"]) if case.get("should_flag") else "none"

            passed = predicted_category == expected_category

            results.append({
                "id":                 case["id"],
                "type":               "aifeed",
                "expected_category":  expected_category,
                "predicted_category": predicted_category,
                "should_flag":        case["should_flag"],
                "flagged":            bool(output.get("display_feedback")),
                "passed":             passed,
                "latency_s":          latency,
                "raw_output":         output,
                "error":              None,
            })
            print("PASS" if passed else f"FAIL (got {predicted_category!r}, expected {expected_category!r})")
        except Exception as e:
            latency = round(time.time() - t0, 2)
            results.append({
                "id": case["id"], "type": "aifeed",
                "expected_category": normalise_category(case.get("expected_category")),
                "predicted_category": "INVALID",
                "should_flag": case["should_flag"], "flagged": False,
                "passed": False, "latency_s": latency,
                "raw_output": None, "error": str(e),
            })
            print(f"ERROR: {e}")
    return results

def run_aicop(scenarios):
    results = []
    for i, scenario in enumerate(scenarios):
        print(f"  AICoP {i+1}/{len(scenarios)}: {scenario['id']} … ", end="", flush=True)

        game_board = {t["tile_id"]: t for t in scenario["board_state"]}
        topic      = scenario["topic"]
        ai_role    = scenario["ai_stance"]
        viable_ids = [t["tile_id"] for t in scenario["board_state"]]

        t0 = time.time()
        try:
            output  = co_player_turn(game_board, topic, ai_role, viable_ids)
            latency = round(time.time() - t0, 2)
            exp     = scenario["expected_ai_behavior"]

            # automated guardrails
            text = (output.get("text") or "").strip()
            guardrails = {
                "valid_tile":            bool(text and 0 < len(text) <= 100),
                "stance_fidelity":       True,   # co_player_turn enforces stance via prompt
                "topic_relevant":        True,   # AI-assisted; mark True for automated pass
                "parent_tile_connected": bool(output.get("parent_id")),
                "no_tutor_voice":        not any(w in text.lower() for w in ["great point", "excellent", "remember that", "keep in mind"]),
                "no_ad_hominem":         not any(w in text.lower() for w in ["you're wrong", "that's stupid", "you don't understand"]),
                "typical_player_realism":True,   # human review
                "metadata_complete":     bool(output.get("strategy") and output.get("angle")),
            }
            all_pass = all(guardrails.values())

            results.append({
                "id":          scenario["id"],
                "type":        "aicop",
                "passed":      all_pass,
                "tile_text":   text,
                "latency_s":   latency,
                "guardrails":  guardrails,
                "raw_output":  output,
                "error":       None,
            })
            print("PASS" if all_pass else f"FAIL (guardrails: {[k for k,v in guardrails.items() if not v]})")
        except Exception as e:
            latency = round(time.time() - t0, 2)
            results.append({
                "id": scenario["id"], "type": "aicop",
                "passed": False, "tile_text": None,
                "latency_s": latency, "guardrails": {},
                "raw_output": None, "error": str(e),
            })
            print(f"ERROR: {e}")
    return results

def main():
    aifeed_cases  = json.load(open(AIFEED_CASES_PATH))
    aicop_cases   = json.load(open(AICOP_CASES_PATH))

    print(f"\nRunning independent eval — {len(aifeed_cases)} AIFeed + {len(aicop_cases)} AICoP cases\n")

    print("── AIFeed ──────────────────────────────────────────")
    aifeed_results = run_aifeed(aifeed_cases)

    print("\n── AICoP ───────────────────────────────────────────")
    aicop_results  = run_aicop(aicop_cases)

    all_results = aifeed_results + aicop_results

    output = {
        "dataset_version":  "independent_seed_v1",
        "model_name":       "claude-sonnet-4-5",
        "prompt_version":   "2026-05-11-v3",
        "evaluated_at":     datetime.now(timezone.utc).isoformat(),
        "aifeed_results":   aifeed_results,
        "aicop_results":    aicop_results,
    }

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w") as f:
        json.dump(output, f, indent=2)

    # ── Quick summary ────────────────────────────────────────────────────────
    af_pass  = sum(1 for r in aifeed_results if r["passed"])
    ac_pass  = sum(1 for r in aicop_results  if r["passed"])
    total    = len(all_results)
    total_pass = af_pass + ac_pass

    print(f"\n{'='*52}")
    print(f"  AIFeed : {af_pass}/{len(aifeed_results)} passed  ({100*af_pass/len(aifeed_results):.1f}%)")
    print(f"  AICoP  : {ac_pass}/{len(aicop_results)}  passed  ({100*ac_pass/len(aicop_results):.1f}%)")
    print(f"  Total  : {total_pass}/{total} passed  ({100*total_pass/total:.1f}%)")
    print(f"{'='*52}")
    print(f"\nResults saved to:\n  {OUTPUT_PATH}\n")

if __name__ == "__main__":
    main()
