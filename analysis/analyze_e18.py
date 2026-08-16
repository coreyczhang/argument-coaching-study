#!/usr/bin/env python3
"""
Analyze the e18 argument-coaching study export.

Pulls the token-protected JSON export from the live study (or reads a local
file) and produces the primary result: does the AICoach arm improve argument
quality across rounds more than the Control arm?

Outcome measures (per round, per participant):
  - composite       = mean of the 3 SHOWN helpful dims (reasoning, engagement,
                      constructive stance), 1-5 scale
  - analysis_overall= sum(3 helpful) - sum(3 counterproductive), the full
                      6-dim preregistered measure (from the rationale JSON)

Primary test: difference-in-differences. Change from round 1 -> last round,
AICoach vs Control. Reported with a two-sample t-test (Welch) plus per-cell
means so it drops straight into the report.

Usage:
  python analyze_e18.py --url https://dp5wkeqgw25kj.cloudfront.net --token XXXX
  python analyze_e18.py --file e18_export.json          # analyze a saved export
  # writes: participants.csv, round_means.csv, trajectory.png (if matplotlib)

Only stdlib is required; numpy/scipy/matplotlib are used if present.
"""
import argparse
import json
import os
import sys
import urllib.request
from collections import defaultdict


def load_export(args):
    if args.file:
        with open(args.file) as f:
            return json.load(f)
    if not args.url or not args.token:
        sys.exit("Provide --file, or both --url and --token (or E18_EXPORT_TOKEN env).")
    u = args.url.rstrip("/") + "/argument-coach/export?token=" + args.token
    with urllib.request.urlopen(u, timeout=60) as r:
        if r.status != 200:
            sys.exit(f"export returned {r.status}")
        return json.load(r)


def parse_json_field(v):
    if isinstance(v, (dict, list)):
        return v
    if not v:
        return {}
    try:
        return json.loads(v)
    except Exception:
        return {}


def build_participants(data):
    """Return {user_id: {condition, rounds: {n: {composite, overall}}}} for
    participants who have at least one scored round."""
    cond = {c["user_id"]: c.get("condition") for c in data.get("conditions", [])}
    parts = defaultdict(lambda: {"condition": None, "rounds": {}})
    for s in data.get("round_scores", []):
        uid = s["user_id"]
        rn = int(s["round_number"])
        rat = parse_json_field(s.get("rationale"))
        # full 6-dim overall if present, else recompute from the 3 shown
        overall = rat.get("analysis_overall")
        helpful = [s.get("reasoning_quality"), s.get("engagement"), s.get("constructive_stance")]
        helpful = [h for h in helpful if h is not None]
        composite = s.get("composite")
        if composite is None and helpful:
            composite = sum(helpful) / len(helpful)
        parts[uid]["condition"] = cond.get(uid)
        parts[uid]["rounds"][rn] = {"composite": composite, "overall": overall}
    return parts


def mean(xs):
    xs = [x for x in xs if x is not None]
    return sum(xs) / len(xs) if xs else None


def welch_t(a, b):
    """Welch's t-test; returns (t, df, p) using scipy if available, else t only."""
    a = [x for x in a if x is not None]
    b = [x for x in b if x is not None]
    if len(a) < 2 or len(b) < 2:
        return None, None, None
    try:
        from scipy import stats
        t, p = stats.ttest_ind(a, b, equal_var=False)
        return float(t), None, float(p)
    except Exception:
        import statistics as st
        ma, mb = st.mean(a), st.mean(b)
        va, vb = st.variance(a), st.variance(b)
        na, nb = len(a), len(b)
        se = (va / na + vb / nb) ** 0.5
        t = (ma - mb) / se if se else 0.0
        return t, None, None  # p needs scipy


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--url")
    ap.add_argument("--token", default=os.getenv("E18_EXPORT_TOKEN"))
    ap.add_argument("--file")
    ap.add_argument("--measure", choices=["composite", "overall"], default="composite")
    ap.add_argument("--outdir", default=".")
    args = ap.parse_args()

    data = load_export(args)
    parts = build_participants(data)
    if not parts:
        sys.exit("No scored rounds in export yet. Launch + collect data first.")

    m = args.measure
    max_round = max((rn for p in parts.values() for rn in p["rounds"]), default=0)

    # ---- per-participant table + change (round 1 -> last completed round) ----
    rows = []
    for uid, p in sorted(parts.items()):
        r = p["rounds"]
        first = r.get(1, {}).get(m)
        completed = sorted(k for k in r if r[k].get(m) is not None)
        last = r.get(completed[-1], {}).get(m) if completed else None
        change = (last - first) if (first is not None and last is not None) else None
        rows.append({
            "user_id": uid, "condition": p["condition"] or "UNKNOWN",
            "n_rounds": len(completed),
            **{f"r{n}_{m}": r.get(n, {}).get(m) for n in range(1, max_round + 1)},
            "first": first, "last": last, "change": change,
        })

    csv_path = os.path.join(args.outdir, "participants.csv")
    with open(csv_path, "w") as f:
        cols = ["user_id", "condition", "n_rounds"] + \
               [f"r{n}_{m}" for n in range(1, max_round + 1)] + ["first", "last", "change"]
        f.write(",".join(cols) + "\n")
        for r in rows:
            f.write(",".join("" if r.get(c) is None else str(r.get(c)) for c in cols) + "\n")

    # ---- per-condition, per-round means ----
    by_cond = defaultdict(list)
    for r in rows:
        by_cond[r["condition"]].append(r)
    conds = sorted(by_cond)

    print(f"\n=== e18 results | measure = {m} | {sum(len(v) for v in by_cond.values())} participants ===")
    rm_path = os.path.join(args.outdir, "round_means.csv")
    with open(rm_path, "w") as f:
        f.write("condition," + ",".join(f"round{n}" for n in range(1, max_round + 1)) + ",n\n")
        for c in conds:
            ppl = by_cond[c]
            line = [c]
            print(f"\n{c}  (n={len(ppl)})")
            for n in range(1, max_round + 1):
                mm = mean([parts[p['user_id']]['rounds'].get(n, {}).get(m) for p in ppl])
                line.append("" if mm is None else f"{mm:.3f}")
                print(f"  round {n}: {'--' if mm is None else f'{mm:.3f}'}")
            f.write(",".join(line) + f",{len(ppl)}\n")

    # ---- primary result: difference-in-differences ----
    print("\n=== PRIMARY: improvement round 1 -> last, AICoach vs Control ===")
    changes = {c: [r["change"] for r in by_cond[c] if r["change"] is not None] for c in conds}
    for c in conds:
        avg = mean(changes[c])
        print(f"  {c}: mean change = {'--' if avg is None else f'{avg:+.3f}'} (n={len(changes[c])})")
    if "AICoach" in changes and "Control" in changes:
        did = None
        if mean(changes["AICoach"]) is not None and mean(changes["Control"]) is not None:
            did = mean(changes["AICoach"]) - mean(changes["Control"])
        t, _, p = welch_t(changes["AICoach"], changes["Control"])
        print(f"\n  difference-in-differences (AICoach - Control) = "
              f"{'--' if did is None else f'{did:+.3f}'}")
        if t is not None:
            print(f"  Welch t = {t:.3f}" + (f", p = {p:.4f}" if p is not None else " (install scipy for p-value)"))
        print("\n  Interpretation: DiD > 0 means the coached arm improved more across "
              "rounds than control. With a pilot n this is directional; report the "
              "effect size and CI, not just significance.")

    # ---- plot ----
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        plt.figure(figsize=(6, 4))
        for c in conds:
            ppl = by_cond[c]
            ys = [mean([parts[p['user_id']]['rounds'].get(n, {}).get(m) for p in ppl])
                  for n in range(1, max_round + 1)]
            xs = [n for n, y in zip(range(1, max_round + 1), ys) if y is not None]
            ys = [y for y in ys if y is not None]
            plt.plot(xs, ys, marker="o", label=f"{c} (n={len(ppl)})")
        plt.xlabel("Round"); plt.ylabel(f"{m} score")
        plt.title("Argument quality across rounds by condition")
        plt.xticks(range(1, max_round + 1)); plt.legend(); plt.tight_layout()
        png = os.path.join(args.outdir, "trajectory.png")
        plt.savefig(png, dpi=150)
        print(f"\n  wrote {png}")
    except Exception as e:
        print(f"\n  (plot skipped: {e})")

    print(f"\n  wrote {csv_path}\n  wrote {rm_path}\n")


if __name__ == "__main__":
    main()
