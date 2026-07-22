# Migration runbook: study → Northwestern AWS account (225317159017)

Jira: *Migrate the AI Feedback Study to the Northwestern AWS account and its own repo.*
Repo half is done (this repo). This is the AWS half.

Scope is the **study only**. The production game stays on its own account and
keeps evolving; nothing here touches it.

---

## 0. Prerequisites (get these before starting)

- [ ] **Credentials for 225317159017** with PowerUserAccess (from Steve).
- [ ] **IAM help** — PowerUser does *not* include IAM admin, so these must be
      created by someone with IAM rights. Ask for all of it in one message:
  - `aws-elasticbeanstalk-service-role` (EB service role)
  - `aws-elasticbeanstalk-ec2-role` + matching **instance profile**
  - An IAM user/role for the app with DynamoDB read/write, or attach a policy to
    the EC2 instance profile so the backend can use the instance role instead of
    static keys (preferred — avoids long-lived keys in env vars).
- [ ] **Anthropic API key with credits.** If the balance hits zero the coach
      silently stops firing (the API returns 400 and no feedback ever appears).

Set up a named profile so nothing accidentally runs against the old account:

```bash
aws configure --profile nu-study      # keys for 225317159017
export AWS_PROFILE=nu-study
aws sts get-caller-identity           # MUST print 225317159017
```

> Every command below assumes `AWS_PROFILE=nu-study` and `--region us-east-1`.
> Confirm the account id before each destructive or creating step.

---

## 1. DynamoDB tables

Three tables. The GSI is the one people miss.

```bash
# Games — note the GSI is on `code`, NOT `gameCode`
aws dynamodb create-table --table-name Games \
  --attribute-definitions AttributeName=gameId,AttributeType=S AttributeName=code,AttributeType=S \
  --key-schema AttributeName=gameId,KeyType=HASH \
  --global-secondary-indexes \
    'IndexName=GameCodeIndex,KeySchema=[{AttributeName=code,KeyType=HASH}],Projection={ProjectionType=ALL}' \
  --billing-mode PAY_PER_REQUEST --region us-east-1

aws dynamodb create-table --table-name Users \
  --attribute-definitions AttributeName=userId,AttributeType=S \
  --key-schema AttributeName=userId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST --region us-east-1

aws dynamodb create-table --table-name StudySurveys \
  --attribute-definitions AttributeName=pid,AttributeType=S \
  --key-schema AttributeName=pid,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST --region us-east-1
```

Verify before moving on:

```bash
aws dynamodb describe-table --table-name Games --region us-east-1 \
  --query 'Table.GlobalSecondaryIndexes[].IndexName'   # -> ["GameCodeIndex"]
```

**Do we migrate existing data?** Probably not. The study data on the old account
is only test games from development. Start clean unless real pilot data exists.

---

## 2. Cognito

Study routes authenticate by participant id (`X-Study-Pid`), **not** Cognito — but
the server still builds a Cognito verifier at boot, so a missing/fake pool id
crashes the backend with a 502. Create a real pool and client:

```bash
aws cognito-idp create-user-pool --pool-name pt-study --region us-east-1
# note the Id, then:
aws cognito-idp create-user-pool-client --user-pool-id <POOL_ID> \
  --client-name pt-study-client --region us-east-1
```

Record `<POOL_ID>` and `<CLIENT_ID>` for the env vars below.

---

## 3. Backend + AI agent on Elastic Beanstalk

The agent (Python) must run on the **same host** as the Node backend — the backend
calls it at `127.0.0.1:8000`. The repo's `.ebextensions` and `.platform` hooks
already do this.

```bash
cd backend
npm ci && npm run build

zip -rq deploy.zip dist/ package.json package-lock.json Procfile node_modules/ \
  .ebextensions/ .platform/ agent/ \
  -x 'agent/.venv*' 'agent/venv/*' 'agent/__pycache__/*' 'agent/eval_outputs/*' 'agent/eval_log.jsonl'
```

Create the app/environment on **Node.js 20, Amazon Linux 2023**, upload
`deploy.zip`, and set the environment properties:

| Var | Value |
|---|---|
| `AWS_REGION` | `us-east-1` |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | app credentials (or omit if using the instance role) |
| `COGNITO_USER_POOL_ID` | from step 2 |
| `COGNITO_APP_CLIENT_ID` | from step 2 |
| `ANTHROPIC_API_KEY` | funded key |
| `ANTHROPIC_MODEL` | `claude-sonnet-4-5` |
| `CORS_ORIGIN` | the CloudFront URL from step 4 (comma-separated if several) |
| `PRIVATEKEY` | JWT signing key |

Verify:

```bash
curl http://<EB-CNAME>/api/health          # -> OK
```

---

## 4. Frontend: S3 + CloudFront

```bash
cd frontend
npm ci && npx nuxt generate                # -> .output/public
aws s3 mb s3://<bucket> --region us-east-1
aws s3 sync .output/public s3://<bucket> --delete
```

CloudFront distribution with the S3 bucket as default origin, **plus two extra
origins/behaviors pointing at the EB backend**:

- `/api/*` → EB origin
- `/socket.io/*` → EB origin

For both behaviors: **CachingDisabled** policy and **AllViewer** origin request
policy (headers must pass through). Default behavior (the SPA) can cache normally.

Add an error response mapping **403 and 404 → `/index.html` (200)** so SPA deep
links like `/study/ABC123` resolve.

Then set `CORS_ORIGIN` on the EB env to the CloudFront domain and redeploy.

---

## 5. Smoke test (do all of it)

```bash
CF=https://<cloudfront-domain>

curl -s -o /dev/null -w "%{http_code}\n" $CF/api/health        # 200
curl -s -o /dev/null -w "%{http_code}\n" $CF/study/TEST        # 200

# real AI coach — should flag "everyone knows" as overgeneralization
curl -s -X POST $CF/api/ai/evaluate -H 'Content-Type: application/json' -d '{
  "tile":{"tileId":"1","text":"Everyone knows this is crushing an entire generation",
          "player":"plus","parentId":"0","confirmed":true},
  "game_board":{"0":{"tileId":"0","text":"Should student loan debt be forgiven?","children":["1"]}},
  "topic":"Should student loan debt be forgiven?"}'
# expect display_feedback: true, model_name: claude-sonnet-4-5, categories populated

# create a game and play it in two browser windows
curl -s -X POST $CF/api/study/games -H 'Content-Type: application/json' \
  -H 'X-Study-Pid: SMOKE-P1' \
  -d '{"topic":"Should student loan debt be forgiven?","condition":"AI_FEEDBACK","role":"plus"}'
```

Open `$CF/study/<code>?pid=SMOKE-P1&condition=AI_FEEDBACK` and the same with
`SMOKE-P2`. The board must not start until **both** are connected (presence gate).

---

## 6. Cut over

- [ ] Point the HAIC wrapper at the new stack: set `POINT_TAKEN_URL` (CloudFront)
      and `PT_BACKEND_URL` (EB CNAME) in the HAIC env. These are the two vars that
      broke last time when they pointed at a decommissioned backend.
- [ ] Update any demo links you've shared.
- [ ] Only after the smoke test passes, retire the study stack on the old account.

---

## Gotchas already hit once (don't relearn these)

| Symptom | Cause |
|---|---|
| Backend 502s at boot | Fake/missing `COGNITO_USER_POOL_ID` — the verifier throws on startup |
| "table does not have specified index: GameCodeIndex" | GSI missing, or built on `gameCode` instead of **`code`** |
| Agent won't start, `TypeError: unsupported operand type(s) for \|` | Python 3.9 on the box. The agent needs **3.11+** (PEP 604 syntax) |
| EB deploy times out / instance stops responding | venv rebuilt on every deploy. The `.ebextensions` here skips it when present |
| Mixed-content errors in the browser | HTTPS frontend calling an HTTP backend — must go through CloudFront |
| WebSocket 400s | CloudFront uses HTTP/2, which won't upgrade WS. Client uses `['polling','websocket']` — keep it |
| Coach silently never appears | Anthropic credit balance is zero. Check the agent logs for a 400 |
| Blank page after deploy | A stale `nuxt dev` process raced `nuxt generate` and wrote a dev-mode `index.html`. Kill dev servers before building |

---

## Data export (after collection)

```bash
python3 backend/analysis/export_study_data.py --region us-east-1 --out study_export.csv
```

One row per participant: condition, pre/post stance, derived `stance_change`,
plus behavioral measures (arguments written, AI evaluations, coach exposure).
