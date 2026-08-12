# Prolific deployment — e18 argument-coaching study

The study runs end to end on the live model (AI opponent + coach). This is the checklist
to launch a pilot on Prolific.

## Study URL (paste into Prolific)

Prolific passes participant IDs as URL params. Use:

```
https://dp5wkeqgw25kj.cloudfront.net/argument-coach?PROLIFIC_PID={{%PROLIFIC_PID%}}&STUDY_ID={{%STUDY_ID%}}&SESSION_ID={{%SESSION_ID%}}
```

The landing route captures those IDs and stores them with the participant's condition.
Participants are randomized **50/50** to Control (rounds only) vs. AICoach (rounds + coach).

## Completion

On finish, the participant is sent to
`https://app.prolific.com/submissions/complete?cc=<CODE>`. Set the code once you've created
the Prolific study:

```
aws elasticbeanstalk update-environment --environment-name e18-coach-env \
  --option-settings Namespace=aws:elasticbeanstalk:application:environment,OptionName=E18_PROLIFIC_COMPLETION_CODE,Value=<YOUR_CODE>
```

(Currently a placeholder — `REPLACE_WITH_PROLIFIC_CODE`.)

## Testing before launch

Force a condition (bypasses randomization) with `?arm=`:
- Coach arm: `…/argument-coach?arm=AICoach`
- Control arm: `…/argument-coach?arm=Control`

Real participants (no `arm` param) are randomized.

## Pulling the data

Token-protected JSON export of every table (conditions, baseline, per-round arguments +
scores, coach feedback, participant rewrites, exit survey):

```
https://dp5wkeqgw25kj.cloudfront.net/argument-coach/export?token=<E18_EXPORT_TOKEN>
```

The token is set as the `E18_EXPORT_TOKEN` env var on `e18-coach-env` (ask Corey / check the
EB config). Export early and often — it's also the backup path.

The game-side data (boards, tiles, per-tile AI evaluations) lives in DynamoDB on the game
backend; `analysis/export_study_data.py` joins it.

## Costs

Every round makes live LLM calls (opponent moves + per-tile evaluation), and the coach adds
the rubric judge + per-argument feedback + ask/rewrite. Budget roughly a few $ of Anthropic
usage per participant; a 30-person pilot is small but watch the key's balance.

## Data durability — read before a large run

The coach host writes SQLite to a **persistent on-disk path** (`/var/lib/e18/e18.db`, WAL
mode), so data survives reboots and redeploys. It does **not** survive instance replacement
(rare for this single-instance environment). **For a small pilot this is fine with regular
exports. For a full/large launch, move to RDS Postgres** — the app already reads a
`DATABASE_URL` env (`postgresql+pg8000://…`) and `pg8000` is bundled, so it's a config
change, not a code change. Ask Corey to provision RDS before scaling up.

## Before you launch

- [ ] IRB approval in place (consent is shown in full inline; confirm final wording)
- [ ] `E18_PROLIFIC_COMPLETION_CODE` set to the real Prolific code
- [ ] Anthropic key balance funded for the expected N
- [ ] Walk both arms once via `?arm=AICoach` and `?arm=Control`
- [ ] Confirm the export URL returns your test rows
- [ ] (Large run only) RDS Postgres provisioned and `DATABASE_URL` set
