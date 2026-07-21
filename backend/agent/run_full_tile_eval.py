import json
import time
from datetime import datetime
from pathlib import Path

from agents import MODEL_NAME, PROMPT_VERSIONS, evaluate_tile


BASE_DIR = Path(__file__).resolve().parent
CASES_PATH = BASE_DIR / "full_tile_eval_cases.json"
OUTPUT_DIR = BASE_DIR / "eval_outputs"
REQUEST_DELAY_SECONDS = 12


def load_cases() -> list[dict]:
    with CASES_PATH.open() as f:
        return json.load(f)


def evaluate_case(case: dict) -> dict:
    try:
        result = evaluate_tile(case["tile"], case["game_board"], case["topic"])
    except Exception as error:
        return {
            "id": case["id"],
            "label": case["label"],
            "expected": case["expected"],
            "actual": {"error": str(error)},
            "checks": {
                "display_feedback": False,
                "display_reason": False,
                "first_wave_categories": False,
                "stance_preserved": False,
                "overall": False,
            },
        }

    expected = case["expected"]

    first_wave_exact = expected.get("first_wave_categories")           # exact-match list
    first_wave_includes = expected.get("first_wave_categories_includes")  # subset check
    first_wave_actual = result.get("first_wave_categories", [])

    if first_wave_exact is not None:
        first_wave_ok = first_wave_actual == first_wave_exact
    elif first_wave_includes is not None:
        first_wave_ok = all(c in first_wave_actual for c in first_wave_includes)
    else:
        first_wave_ok = True

    checks = {
        "display_feedback": (
            result.get("display_feedback") == expected["display_feedback"]
            if "display_feedback" in expected
            else True
        ),
        "display_reason": (
            result.get("display_reason") == expected["display_reason"]
            if "display_reason" in expected
            else True
        ),
        "first_wave_categories": first_wave_ok,
        "stance_preserved": (
            result.get("suggestion_preserves_stance") is True
            if expected.get("must_preserve_stance")
            else True
        ),
    }

    checks["overall"] = all(checks.values())

    return {
        "id": case["id"],
        "label": case["label"],
        "expected": expected,
        "actual": {
            "display_feedback": result.get("display_feedback"),
            "display_reason": result.get("display_reason"),
            "first_wave_categories": first_wave_actual,
            "suggestion": result.get("suggestion"),
            "suggestion_source": result.get("suggestion_source"),
            "suggestion_confidence": result.get("suggestion_confidence"),
            "suggestion_preserves_stance": result.get("suggestion_preserves_stance"),
        },
        "checks": checks,
    }


def main():
    cases = load_cases()
    results = []
    for index, case in enumerate(cases):
        print(f"Running case {index + 1}/{len(cases)}: {case['id']}")
        results.append(evaluate_case(case))
        if index < len(cases) - 1:
            time.sleep(REQUEST_DELAY_SECONDS)

    passed = sum(1 for result in results if result["checks"]["overall"])
    failed = [result for result in results if not result["checks"]["overall"]]

    summary = {
        "evaluated_at": datetime.utcnow().isoformat() + "Z",
        "model_name": MODEL_NAME,
        "prompt_versions": PROMPT_VERSIONS,
        "case_count": len(results),
        "passed": passed,
        "failed": len(failed),
        "accuracy": round(passed / len(results), 4) if results else 0,
        "results": results,
    }

    OUTPUT_DIR.mkdir(exist_ok=True)
    timestamp = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
    output_path = OUTPUT_DIR / f"full_tile_eval_{timestamp}.json"
    output_path.write_text(json.dumps(summary, indent=2))

    markdown_path = OUTPUT_DIR / f"full_tile_eval_{timestamp}.md"
    lines = [
        "# Full Tile Evaluation Summary",
        "",
        f"- Evaluated at: {summary['evaluated_at']}",
        f"- Model: {summary['model_name']}",
        f"- Cases: {summary['case_count']}",
        f"- Passed: {summary['passed']}",
        f"- Failed: {summary['failed']}",
        f"- Accuracy: {summary['accuracy']:.2%}",
        "",
        "| Case | Label | Result |",
        "| --- | --- | --- |",
    ]
    for result in results:
        outcome = "PASS" if result["checks"]["overall"] else "FAIL"
        lines.append(f"| `{result['id']}` | {result['label']} | {outcome} |")

    if failed:
        lines.extend(["", "## Failing Cases", ""])
        for result in failed:
            lines.append(
                f"- `{result['id']}` expected {result['expected']} but got {result['actual']}"
            )

    markdown_path.write_text("\n".join(lines))

    print(f"Wrote {output_path}")
    print(f"Wrote {markdown_path}")

    if failed:
        print("\nFailing cases:")
        for result in failed:
            print(
                f"- {result['id']}: expected {result['expected']} "
                f"but got {result['actual']}"
            )


if __name__ == "__main__":
    main()
