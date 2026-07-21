# Argument coaching study

Standalone repo for the research study. Forked from the production game so the
study has a **stable instrument**: the production game keeps evolving, this copy
stays frozen during data collection.

> Bug fixes to the game engine upstream do **not** flow here automatically. If a
> correctness or security fix lands upstream, decide deliberately whether to pull it.

## What's in here

| Path | What it is |
|---|---|
| `frontend/` | Nuxt 3 SPA (`ssr: false`). The study route is `pages/study/[gameCode].vue`. Built static and served from S3 + CloudFront. |
| `backend/` | Node + Express + Socket.io (TypeScript). Real-time gameplay, study routes, DynamoDB access. Runs on port 8080. |
| `backend/agent/` | Python FastAPI service (the AI coach). Multi-agent pipeline that screens each argument for reasoning fallacies via the Anthropic API. Runs on `127.0.0.1:8000`. |
| `backend/analysis/` | `export_study_data.py` — joins the tables into a one-row-per-participant CSV for analysis. |
| `DEPLOY.md` | Full deploy checklist: env vars, DynamoDB tables, the Python 3.11 requirement, and the gotchas already hit once. |

## Architecture in one picture

```
browser ──► frontend (static, S3/CloudFront)
              │  /api/*  and  /socket.io/*  proxied to:
              ▼
            backend (Node, EB, :8080) ──► DynamoDB
              │  http://127.0.0.1:8000/evaluate
              ▼
            agent (Python FastAPI) ──► Anthropic API
```

The backend calls the agent over localhost, so **the two must run on the same host**.
The agent is never exposed publicly.

## Running locally

```bash
# 1. AI coach
cd backend/agent
python3.11 -m venv .venv && .venv/bin/pip install -r requirements.txt
cp .env.example .env      # add your ANTHROPIC_API_KEY
.venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000

# 2. backend
cd backend
cp .env.example .env      # fill in AWS + Cognito
npm ci && npm run build && node dist/server.js

# 3. frontend
cd frontend
npm ci && npm run dev     # http://localhost:3000
```

Then create a study game and open it in two windows (one incognito):

```bash
curl -s -X POST http://localhost:8080/api/study/games \
  -H 'Content-Type: application/json' -H 'X-Study-Pid: P1' \
  -d '{"topic":"YOUR TOPIC","condition":"AI_FEEDBACK","role":"plus"}'
# -> http://localhost:3000/study/<code>?pid=P1&condition=AI_FEEDBACK
#    http://localhost:3000/study/<code>?pid=P2&condition=AI_FEEDBACK
```

Both players must be connected before the board starts (live presence gate).

## Requirements

- **Node 20+**
- **Python 3.11+** for the agent. It uses `X | None` syntax, so 3.9 fails on import.
- **DynamoDB** tables: `Games` (needs a `GameCodeIndex` GSI on the attribute **`code`**, not `gameCode`), `Users`, `StudySurveys` (hash key `pid`).
- **Anthropic API key with credits.** If the balance hits zero the coach silently stops appearing.

See `DEPLOY.md` before standing up a new environment.
