#!/usr/bin/env bash
# Deploy the study frontend (Nuxt 3 static) to the live NU study bucket + CDN.
# Run ONLY after Matt's launch approval. It rebuilds the static site (picks up
# the round finish-gate change) and invalidates CloudFront so it goes live.
#
#   ./scripts/deploy_frontend.sh
#
set -euo pipefail

PROFILE="nu"
REGION="us-east-1"
BUCKET="pt-study-frontend-225317159017"
DISTRIBUTION="E1BE6PWOOEFTIS"
FRONTEND_DIR="$(cd "$(dirname "$0")/../frontend" && pwd)"

echo "==> AWS SSO (approve in browser if prompted)"
aws sts get-caller-identity --profile "$PROFILE" >/dev/null 2>&1 || aws sso login --profile "$PROFILE"

echo "==> Building static site from $FRONTEND_DIR"
cd "$FRONTEND_DIR"
npm ci
npx nuxt generate            # -> .output/public

echo "==> Syncing to s3://$BUCKET"
aws s3 sync .output/public "s3://$BUCKET" --delete --profile "$PROFILE" --region "$REGION"

echo "==> Invalidating CloudFront $DISTRIBUTION"
aws cloudfront create-invalidation \
  --distribution-id "$DISTRIBUTION" --paths "/*" \
  --profile "$PROFILE" --region "$REGION" \
  --query 'Invalidation.{Id:Id,Status:Status}' --output table

echo "==> Done. Verify: open the study URL and confirm the finish button now"
echo "    requires a reply to the opponent (not just 3 tiles)."
