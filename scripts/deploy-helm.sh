#!/usr/bin/env bash
# Deploy Airbnb application to Kubernetes using Helm

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${PROJECT_ROOT}/backend/.env"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Deploying Airbnb to Kubernetes${NC}"
echo ""

# Check if .env file exists
if [[ ! -f "$ENV_FILE" ]]; then
  echo -e "${RED}Error: .env file not found at $ENV_FILE${NC}"
  echo -e "${YELLOW}Current directory: $(pwd)${NC}"
  echo -e "${YELLOW}Script directory: ${SCRIPT_DIR}${NC}"
  echo -e "${YELLOW}Project root: ${PROJECT_ROOT}${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Found .env file at $ENV_FILE${NC}"

# Extract environment variables
extract_env_value() {
  local key="$1"
  grep -E "^${key}=" "$ENV_FILE" | tail -n 1 | cut -d= -f2- | tr -d '"'
}

MONGO_SESSION_URI=$(extract_env_value "MONGO_SESSION_URI")
DATABASE_URL=$(extract_env_value "DATABASE_URL")
SESSION_SECRET=$(extract_env_value "SESSION_SECRET")

# ECR Registry
ECR_REGISTRY="171158266231.dkr.ecr.us-east-1.amazonaws.com"

# Login to ECR
echo -e "${YELLOW}Logging in to ECR...${NC}"
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_REGISTRY

# Ensure namespace exists and has proper Helm labels
if ! kubectl get namespace airbnb-app &> /dev/null; then
  echo -e "${YELLOW}Creating namespace airbnb-app with Helm labels...${NC}"
  kubectl create namespace airbnb-app
  kubectl label namespace airbnb-app app.kubernetes.io/managed-by=Helm
  kubectl annotate namespace airbnb-app meta.helm.sh/release-name=airbnb meta.helm.sh/release-namespace=airbnb-app
fi

# Install/Upgrade the Helm release
echo -e "${YELLOW}Installing Helm chart...${NC}"

helm upgrade --install airbnb ./k8s/helm/airbnb \
  --namespace airbnb-app \
  --set secrets.mongo.sessionUri="$MONGO_SESSION_URI" \
  --set secrets.supabase.databaseUrl="$DATABASE_URL" \
  --set secrets.session.secret="$SESSION_SECRET" \
  --set global.imageRegistry="$ECR_REGISTRY" \
  --wait \
  --timeout 10m

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo -e "${YELLOW}Check deployment status:${NC}"
echo "  kubectl get pods -n airbnb-app"
echo "  kubectl get svc -n airbnb-app"
echo "  kubectl get ingress -n airbnb-app"
echo ""
echo -e "${YELLOW}Get Load Balancer URL:${NC}"
echo "  kubectl get svc frontend -n airbnb-app -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'"
