# Point Taken — Study Deployment Checklist (for HAIC / Matt's setup)

This is what Aakriti needs to stand up the study on a fresh environment. The
demo currently runs on AWS Elastic Beanstalk (account 383996694808), but the
architecture is host-agnostic — anything that can run a Node process, a Python
process, and serve static files works.

---

## 1. Architecture (3 components, must be co-located)

```
                    ┌─────────────────────────────┐
  participant  ──►  │  Frontend (Nuxt 3 SPA)      │   static files (S3/CDN/any host)
  browser           │  /study/[gameCode]          │
                    └──────────────┬──────────────┘
                                   │  /api/*  and  /socket.io/*
                    ┌──────────────▼──────────────┐
                    │  Backend (Node/Express +     │   port 8080
                    │  Socket.io)  point-taken-    │
                    │  backend                     │
                    └──────────────┬──────────────┘
                                   │  http://127.0.0.1:8000/evaluate
                    ┌──────────────▼──────────────┐
                    │  AI agent (Python FastAPI)   │   port 8000, localhost only
                    │  point-taken-backend/agent   │
                    └─────────────────────────────┘
```

**Critical:** the Node backend calls the Python agent at `http://127.0.0.1:8000`,
so the two **must run on the same host**. The agent is not exposed publicly.

---

## 2. Prerequisites

- **Node.js 20+** (backend)
- **Python 3.11+** — REQUIRED. The agent uses `X | None` union syntax (PEP 604);
  Python 3.9 crashes on import. On Amazon Linux 2023: `dnf install python3.11 python3.11-pip`.
- An **Anthropic API key** with access to `claude-sonnet-4-5`.
- AWS account with DynamoDB + (optionally) Cognito.

---

## 3. DynamoDB tables (create before first run)

| Table | Partition key | Notes |
|-------|--------------|-------|
| `Games` | `gameId` (S) | Needs a GSI **`GameCodeIndex`** on attribute **`code`** (S). This is easy to miss — join/lookup breaks without it. |
| `Users` | `userId` (S) | |
| `StudySurveys` | `pid` (S) | Pre/post survey responses. |

Create `StudySurveys` (PAY_PER_REQUEST):
```bash
aws dynamodb create-table --table-name StudySurveys \
  --attribute-definitions AttributeName=pid,AttributeType=S \
  --key-schema AttributeName=pid,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST --region <REGION>
```

Create the `GameCodeIndex` GSI on `Games` (hash key `code`) if it doesn't exist.

---

## 4. Environment variables (backend)

| Var | Purpose |
|-----|---------|
| `AWS_REGION` | e.g. `us-east-1` |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | DynamoDB access (or use an instance role) |
| `COGNITO_USER_POOL_ID` | **Must be a real, valid pool id.** The socket auth builds a Cognito verifier at startup; a fake value (e.g. `demo`) crashes the process with a 502. Study routes don't use Cognito (they auth by `pid`), but the verifier is still constructed. |
| `COGNITO_APP_CLIENT_ID` | matching app client |
| `ANTHROPIC_API_KEY` | for the Python agent |
| `ANTHROPIC_MODEL` | `claude-sonnet-4-5` |
| `CORS_ORIGIN` | comma-separated allowed origins, e.g. the frontend URL. Both Express and Socket.io read this. |
| `PRIVATEKEY` | JWT signing key (existing) |

The Python agent reads `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL` from its own
`agent/.env` (via `python-dotenv`) or from the process environment.

---

## 5. Build & run

**Agent (Python):**
```bash
cd point-taken-backend/agent
python3.11 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000
```

**Backend (Node):**
```bash
cd point-taken-backend
npm ci
npm run build            # tsc -> dist/
node dist/server.js      # listens on 8080
```

**Frontend (Nuxt, static):**
```bash
cd point-taken-frontend/app
npm ci
npx nuxt generate        # -> .output/public
# serve .output/public from any static host / CDN
```
The frontend auto-detects its backend: on a non-localhost host it uses
`window.location.origin`, so route `/api/*` and `/socket.io/*` to the Node
backend (e.g. via a reverse proxy or CDN behavior). On localhost it uses
`http://localhost:8080`.

---

## 6. If deploying on Elastic Beanstalk (like the current demo)

The repo already contains the glue:
- `.ebextensions/02-python-agent.config` — installs Python 3.11 + the agent venv.
  It **skips the venv rebuild when it already exists**, so redeploys are fast
  (a full reinstall every deploy previously timed out the command).
- `.platform/hooks/predeploy/01_start_uvicorn.sh` — registers uvicorn as a
  systemd service (`uvicorn-agent`) reading env from the EB deployment env file.

The deploy bundle must include: `dist/`, `node_modules/`, `package.json`,
`Procfile`, `.ebextensions/`, `.platform/`, and `agent/` (excluding
`agent/.venv`, `__pycache__`, `eval_outputs`).

Front the backend with a CDN/proxy that forwards `/api/*` and `/socket.io/*`
(disable caching + forward all headers; Socket.io needs
`transports: ['polling','websocket']` because HTTP/2 CDNs don't upgrade WS).

---

## 7. Smoke test (after deploy)

```bash
# backend
curl https://<HOST>/api/health                      # -> OK

# real AI pipeline (should flag "everyone" as overgeneralization)
curl -s -X POST https://<HOST>/api/ai/evaluate -H 'Content-Type: application/json' \
  -d '{"tile":{"tileId":"1","text":"Everyone knows this is bad","player":"minus","parentId":"0","confirmed":true},
       "game_board":{"0":{"tileId":"0","text":"topic","children":["1"]}},
       "topic":"The US should implement ranked-choice voting"}'
# -> JSON with model_name: claude-sonnet-4-5 and first_wave_categories populated

# create a study game
curl -s -X POST https://<HOST>/api/study/games -H 'Content-Type: application/json' \
  -H 'X-Study-Pid: SMOKE-P1' \
  -d '{"topic":"...","condition":"AI_FEEDBACK","role":"plus"}'
```

Then open two browser windows at
`https://<HOST>/study/<gameCode>?pid=SMOKE-P1&condition=AI_FEEDBACK`
and `...?pid=SMOKE-P2&...`. The board should only start once **both** are
connected (live-presence gate).

---

## 8. Pulling data out

`analysis/export_study_data.py` joins Games + StudySurveys into a
one-row-per-participant CSV (pre/post stance, condition, AI flags, etc.):
```bash
python3 analysis/export_study_data.py --region <REGION> --out study_export.csv
```

---

## Gotchas we already hit (so you don't have to)

- **Python 3.9 vs 3.11** — agent won't import on 3.9.
- **`GameCodeIndex` on `code`** (not `gameCode`) — the attribute is literally `code`.
- **Fake Cognito id → 502** at startup; use a real pool.
- **Mixed content** — HTTPS frontend → HTTP backend is blocked; terminate TLS at the proxy.
- **WebSocket over HTTP/2** — CDNs don't upgrade; keep `transports: ['polling','websocket']`.
- **EB deploy timeout** — don't reinstall the venv every deploy (already fixed here).
