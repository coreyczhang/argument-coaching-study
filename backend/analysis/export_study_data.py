#!/usr/bin/env python3
"""
Export Point Taken study data into an analysis-ready, one-row-per-participant CSV.

Joins three DynamoDB tables:
  - StudySurveys : pre/post survey responses, keyed by participant id (pid)
  - Games        : game state, gameLog, and aiEvaluations (study games only)
  - Users        : (optional) participant records

Each output row is one participant, with their survey responses, the
condition/topic they saw, derived outcome measures (e.g. stance change), and
game-derived behavioral measures (arguments written, AI flags received,
suggestions offered/shown).

Usage:
    python export_study_data.py                       # -> study_export_<date>.csv
    python export_study_data.py --region us-east-1 --out mydata.csv
    python export_study_data.py --profile default     # use a named AWS profile

Requires: boto3  (pip install boto3)
Credentials resolve via the standard AWS chain (env vars, --profile, or ~/.aws).
"""

import argparse
import csv
import datetime as dt
import sys
from collections import defaultdict

try:
    import boto3
    from boto3.dynamodb.types import TypeDeserializer
except ImportError:
    sys.exit("boto3 is required:  pip install boto3")

_DESER = TypeDeserializer()


def unwrap(item):
    """Convert a raw DynamoDB item into plain Python."""
    return {k: _DESER.deserialize(v) for k, v in item.items()}


def scan_all(client, table, **kwargs):
    """Yield every unwrapped item from a table, following pagination."""
    start_key = None
    while True:
        if start_key:
            kwargs["ExclusiveStartKey"] = start_key
        resp = client.scan(TableName=table, **kwargs)
        for it in resp.get("Items", []):
            yield unwrap(it)
        start_key = resp.get("LastEvaluatedKey")
        if not start_key:
            break


def num(v, default=""):
    """Coerce Decimal/str to a plain number for CSV, else default."""
    if v is None:
        return default
    try:
        f = float(v)
        return int(f) if f.is_integer() else f
    except (TypeError, ValueError):
        return default


def build_game_index(client):
    """
    Map pid -> per-participant game facts, derived from study Games.

    Returns { pid: { gameId, code, condition, topic, role,
                     tiles_confirmed, ai_evals, ai_shown, ai_flagged,
                     error_categories } }
    """
    idx = {}
    for g in scan_all(client, "Games"):
        if not g.get("isStudyGame"):
            continue
        game_id = g.get("gameId")
        code = g.get("code")
        condition = (g.get("aiConfig") or {}).get("condition")
        topic = (g.get("topic") or {}).get("text")
        players = g.get("players") or []
        role_by_pid = {p.get("userId"): p.get("role") for p in players}

        log = g.get("gameLog") or []
        confirms = defaultdict(int)
        for entry in log:
            if entry.get("type") == "CONFIRM_TILE":
                confirms[entry.get("actorRole")] += 1

        evals = g.get("aiEvaluations") or []
        ai_by_pid = defaultdict(lambda: {"n": 0, "shown": 0, "flagged": 0, "cats": []})
        for e in evals:
            pid = e.get("userId")
            slot = ai_by_pid[pid]
            slot["n"] += 1
            if e.get("feedbackShown"):
                slot["shown"] += 1
            if e.get("errorsFound"):
                slot["flagged"] += 1
            slot["cats"].extend(e.get("firstWaveCategories") or [])

        for pid, role in role_by_pid.items():
            ai = ai_by_pid.get(pid, {"n": 0, "shown": 0, "flagged": 0, "cats": []})
            idx[pid] = {
                "gameId": game_id,
                "gameCode": code,
                "game_condition": condition,
                "game_topic": topic,
                "role": role,
                "tiles_confirmed": confirms.get(role, 0),
                "ai_evals": ai["n"],
                "ai_shown": ai["shown"],
                "ai_flagged": ai["flagged"],
                "error_categories": ";".join(sorted(set(ai["cats"]))),
            }
    return idx


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--region", default="us-east-1")
    ap.add_argument("--profile", default=None, help="AWS named profile")
    ap.add_argument("--out", default=None, help="output CSV path")
    args = ap.parse_args()

    session = boto3.Session(profile_name=args.profile, region_name=args.region)
    client = session.client("dynamodb")

    print("Reading study Games …", file=sys.stderr)
    game_idx = build_game_index(client)

    print("Reading StudySurveys …", file=sys.stderr)
    surveys = {}
    try:
        for s in scan_all(client, "StudySurveys"):
            surveys[s.get("pid")] = s
    except client.exceptions.ResourceNotFoundException:
        print("  (StudySurveys table not found — exporting game data only)", file=sys.stderr)

    # union of everyone we know about
    pids = sorted(set(game_idx) | set(surveys))

    cols = [
        "pid", "condition", "gameCode", "gameId", "topic", "role",
        # pre-survey
        "age_range", "political_leaning", "topic_familiarity",
        "initial_stance", "discussion_frequency",
        # post-survey
        "final_stance", "partner_convincing", "ai_helpfulness",
        "fairness", "open_feedback",
        # derived outcome
        "stance_change", "abs_stance_change",
        # behavioral
        "tiles_confirmed", "ai_evals", "ai_feedback_shown",
        "ai_flagged", "error_categories",
        "has_survey", "has_game",
    ]

    out_path = args.out or f"study_export_{dt.date.today():%Y%m%d}.csv"
    rows = 0
    with open(out_path, "w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=cols)
        w.writeheader()
        for pid in pids:
            g = game_idx.get(pid, {})
            s = surveys.get(pid, {})
            pre = s.get("preSurvey") or {}
            post = s.get("postSurvey") or {}

            init_stance = num(pre.get("initialStance"))
            final_stance = num(post.get("finalStance"))
            change = ""
            if isinstance(init_stance, (int, float)) and isinstance(final_stance, (int, float)):
                change = final_stance - init_stance

            w.writerow({
                "pid": pid,
                "condition": s.get("condition") or g.get("game_condition") or "",
                "gameCode": s.get("gameCode") or g.get("gameCode") or "",
                "gameId": g.get("gameId", ""),
                "topic": g.get("game_topic", ""),
                "role": g.get("role", ""),
                "age_range": pre.get("ageRange", ""),
                "political_leaning": num(pre.get("politicalLeaning")),
                "topic_familiarity": num(pre.get("topicFamiliarity")),
                "initial_stance": init_stance,
                "discussion_frequency": pre.get("discussionFrequency", ""),
                "final_stance": final_stance,
                "partner_convincing": num(post.get("partnerConvincing")),
                "ai_helpfulness": num(post.get("aiHelpfulness")),
                "fairness": num(post.get("fairness")),
                "open_feedback": (post.get("openFeedback") or "").replace("\n", " ").strip(),
                "stance_change": change,
                "abs_stance_change": abs(change) if isinstance(change, (int, float)) else "",
                "tiles_confirmed": g.get("tiles_confirmed", ""),
                "ai_evals": g.get("ai_evals", ""),
                "ai_feedback_shown": g.get("ai_shown", ""),
                "ai_flagged": g.get("ai_flagged", ""),
                "error_categories": g.get("error_categories", ""),
                "has_survey": bool(s),
                "has_game": bool(g),
            })
            rows += 1

    print(f"Wrote {rows} participant rows -> {out_path}", file=sys.stderr)


if __name__ == "__main__":
    main()
