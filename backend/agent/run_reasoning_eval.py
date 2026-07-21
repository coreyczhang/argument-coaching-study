import json
import time
from datetime import datetime
from pathlib import Path
from collections import defaultdict

from agents import MODEL_NAME, PROMPT_VERSIONS, reasoning_agent


BASE_DIR = Path(__file__).resolve().parent
CASES_PATH = BASE_DIR / "reasoning_test_cases.json"
OUTPUT_DIR = BASE_DIR / "eval_outputs"
REQUEST_DELAY_SECONDS = 12
MAX_RETRIES = 5
BENCHMARKS = {
    "minimum_accuracy": 0.85,
    "maximum_false_positive_rate": 0.15,
}


def load_cases() -> list[dict]:
    with CASES_PATH.open() as f:
        return json.load(f)


def evaluate_case(case: dict) -> dict:
    tile = {"text": case["tile_text"]}
    parent = {"text": case["parent_text"]}
    attempt = 0
    while True:
        try:
            result = reasoning_agent(
                tile=tile,
                parent=parent,
                topic=case["topic"],
                structure=case["structure"],
            )
            break
        except Exception as error:
            attempt += 1
            if attempt > MAX_RETRIES:
                raise error

            retry_delay = max(REQUEST_DELAY_SECONDS, 2 * attempt)
            print(
                f"Retrying {case['id']} after API error "
                f"(attempt {attempt}/{MAX_RETRIES}): {error}"
            )
            time.sleep(retry_delay)

    expected = case["expected"]
    overgeneralization_match = (
        bool(result.get("overgeneralization")) == expected["overgeneralization"]
    )
    false_causation_match = (
        bool(result.get("false_causation")) == expected["false_causation"]
    )

    return {
      "id": case["id"],
      "category": case["category"],
      "tile_text": case["tile_text"],
      "expected": expected,
      "actual": {
          "overgeneralization": bool(result.get("overgeneralization")),
          "false_causation": bool(result.get("false_causation")),
          "errors_found": bool(result.get("errors_found")),
          "reason": result.get("reason"),
      },
      "matches": {
          "overgeneralization": overgeneralization_match,
          "false_causation": false_causation_match,
          "overall": overgeneralization_match and false_causation_match,
      },
    }


def main():
    cases = load_cases()
    results = []
    for index, case in enumerate(cases):
        print(f"Running case {index + 1}/{len(cases)}: {case['id']}")
        results.append(evaluate_case(case))
        if index < len(cases) - 1:
            time.sleep(REQUEST_DELAY_SECONDS)

    passed = sum(1 for result in results if result["matches"]["overall"])
    failed = [result for result in results if not result["matches"]["overall"]]
    false_positive_cases = [
        result
        for result in results
        if (
            (not result["expected"]["overgeneralization"] and result["actual"]["overgeneralization"])
            or (not result["expected"]["false_causation"] and result["actual"]["false_causation"])
        )
    ]

    category_summary: dict[str, dict] = defaultdict(
        lambda: {"case_count": 0, "passed": 0, "failed": 0}
    )
    for result in results:
        category = result["category"]
        category_summary[category]["case_count"] += 1
        if result["matches"]["overall"]:
            category_summary[category]["passed"] += 1
        else:
            category_summary[category]["failed"] += 1

    false_positive_rate = (
        round(len(false_positive_cases) / len(results), 4) if results else 0
    )

    summary = {
        "evaluated_at": datetime.utcnow().isoformat() + "Z",
        "model_name": MODEL_NAME,
        "prompt_versions": PROMPT_VERSIONS,
        "case_count": len(results),
        "passed": passed,
        "failed": len(failed),
        "accuracy": round(passed / len(results), 4) if results else 0,
        "false_positive_count": len(false_positive_cases),
        "false_positive_rate": false_positive_rate,
        "benchmarks": {
            "minimum_accuracy": BENCHMARKS["minimum_accuracy"],
            "maximum_false_positive_rate": BENCHMARKS["maximum_false_positive_rate"],
            "passed_accuracy": (round(passed / len(results), 4) if results else 0) >= BENCHMARKS["minimum_accuracy"],
            "passed_false_positive_rate": false_positive_rate <= BENCHMARKS["maximum_false_positive_rate"],
        },
        "categories": category_summary,
        "results": results,
    }

    OUTPUT_DIR.mkdir(exist_ok=True)
    timestamp = datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')
    output_path = OUTPUT_DIR / f"reasoning_eval_{timestamp}.json"
    output_path.write_text(json.dumps(summary, indent=2))
    markdown_path = OUTPUT_DIR / f"reasoning_eval_{timestamp}.md"
    markdown_lines = [
        "# Reasoning Evaluation Summary",
        "",
        f"- Evaluated at: {summary['evaluated_at']}",
        f"- Model: {summary['model_name']}",
        f"- Cases: {summary['case_count']}",
        f"- Passed: {summary['passed']}",
        f"- Failed: {summary['failed']}",
        f"- Accuracy: {summary['accuracy']:.2%}",
        f"- False positive rate: {summary['false_positive_rate']:.2%}",
        f"- Prompt versions: {summary['prompt_versions']}",
        "",
        "## Benchmarks",
        "",
        f"- Minimum accuracy ({BENCHMARKS['minimum_accuracy']:.0%}): {'PASS' if summary['benchmarks']['passed_accuracy'] else 'FAIL'}",
        f"- Maximum false positive rate ({BENCHMARKS['maximum_false_positive_rate']:.0%}): {'PASS' if summary['benchmarks']['passed_false_positive_rate'] else 'FAIL'}",
        "",
        "## Category Breakdown",
        "",
        "| Category | Cases | Passed | Failed |",
        "| --- | ---: | ---: | ---: |",
    ]
    for category, category_result in sorted(category_summary.items()):
        markdown_lines.append(
            f"| {category} | {category_result['case_count']} | {category_result['passed']} | {category_result['failed']} |"
        )
    if failed:
        markdown_lines.extend(["", "## Mismatches", ""])
        for result in failed:
            markdown_lines.append(
                f"- `{result['id']}` ({result['category']}): expected {result['expected']} but got {result['actual']}"
            )
    markdown_path.write_text("\n".join(markdown_lines))

    print(f"Evaluated {len(results)} cases")
    print(f"Passed: {passed}")
    print(f"Failed: {len(failed)}")
    print(f"Accuracy: {summary['accuracy']:.2%}")
    print(f"False positive rate: {summary['false_positive_rate']:.2%}")
    print(f"Wrote {output_path}")
    print(f"Wrote {markdown_path}")

    if failed:
        print("\nMismatches:")
        for result in failed:
            print(
                f"- {result['id']} ({result['category']}): "
                f"expected {result['expected']} but got {result['actual']}"
            )


if __name__ == "__main__":
    main()
