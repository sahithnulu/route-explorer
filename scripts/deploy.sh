#!/usr/bin/env bash
# deploy.sh: build + push backend image, deploy new ECS task, sync frontend to S3
# Usage: ./scripts/deploy.sh [--backend-only | --frontend-only]
set -euo pipefail

# ---- Config (edit these or set as env vars) ----
AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:?Set AWS_ACCOUNT_ID}"
APP_NAME="route-explorer"
ENVIRONMENT="prod"
ECR_REPO="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${APP_NAME}-${ENVIRONMENT}-backend"
ECS_CLUSTER="${APP_NAME}-${ENVIRONMENT}"
ECS_SERVICE="${APP_NAME}-${ENVIRONMENT}-backend"
S3_BUCKET="${APP_NAME}-${ENVIRONMENT}-frontend"
CF_DISTRIBUTION_ID="${CF_DISTRIBUTION_ID:?Set CF_DISTRIBUTION_ID}"
VITE_API_URL="https://api.${DOMAIN_NAME:?Set DOMAIN_NAME}"

DEPLOY_BACKEND=true
DEPLOY_FRONTEND=true

for arg in "$@"; do
  case $arg in
    --backend-only)  DEPLOY_FRONTEND=false ;;
    --frontend-only) DEPLOY_BACKEND=false ;;
  esac
done

# ---- Backend: build, tag, push, force ECS redeploy ----
if [ "$DEPLOY_BACKEND" = true ]; then
  echo "==> Logging into ECR"
  aws ecr get-login-password --region "$AWS_REGION" \
    | docker login --username AWS --password-stdin \
        "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

  echo "==> Building backend image"
  docker build --platform linux/amd64 -t "${ECR_REPO}:latest" ./backend

  echo "==> Pushing to ECR"
  docker push "${ECR_REPO}:latest"

  echo "==> Forcing ECS service redeploy"
  aws ecs update-service \
    --region "$AWS_REGION" \
    --cluster "$ECS_CLUSTER" \
    --service "$ECS_SERVICE" \
    --force-new-deployment \
    --query "service.deployments[0].id" \
    --output text

  echo "==> Waiting for ECS service to stabilize"
  aws ecs wait services-stable \
    --region "$AWS_REGION" \
    --cluster "$ECS_CLUSTER" \
    --services "$ECS_SERVICE"

  echo "==> Backend deployed"
fi

# ---- Frontend: build Vite, sync to S3, invalidate CloudFront ----
if [ "$DEPLOY_FRONTEND" = true ]; then
  echo "==> Building frontend"
  cd frontend
  VITE_API_URL="$VITE_API_URL" npm run build
  cd ..

  echo "==> Syncing frontend to S3"
  aws s3 sync frontend/dist/ "s3://${S3_BUCKET}/" \
    --exclude "index.html" \
    --cache-control "public,max-age=31536000,immutable" \
    --delete

  aws s3 cp frontend/dist/index.html "s3://${S3_BUCKET}/index.html" \
    --cache-control "no-cache,no-store,must-revalidate"

  echo "==> Invalidating CloudFront cache"
  aws cloudfront create-invalidation \
    --distribution-id "$CF_DISTRIBUTION_ID" \
    --paths "/*" \
    --query "Invalidation.Id" \
    --output text

  echo "==> Frontend deployed"
fi

echo "==> Done"