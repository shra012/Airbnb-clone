#!/usr/bin/env bash
# Build and push all Docker images to ECR

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Configuration
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID="171158266231"
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
IMAGE_TAG="${IMAGE_TAG:-latest}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}🐳 Building and pushing Docker images to ECR${NC}"
echo ""

# Login to ECR
echo -e "${YELLOW}Logging in to ECR...${NC}"
aws ecr get-login-password --region ${AWS_REGION} | \
  docker login --username AWS --password-stdin ${ECR_REGISTRY}

if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to login to ECR${NC}"
  exit 1
fi

echo -e "${GREEN}✓ ECR login successful${NC}"
echo ""

# Setup buildx for multi-platform builds
echo -e "${YELLOW}Setting up Docker buildx...${NC}"
docker buildx create --name airbnb-builder --use --bootstrap 2>/dev/null || docker buildx use airbnb-builder
echo -e "${GREEN}✓ Buildx ready${NC}"
echo ""

# Build and push backend services (all use same Dockerfile)
BACKEND_SERVICES=("traveler" "owner" "property" "booking")

for service in "${BACKEND_SERVICES[@]}"; do
  echo -e "${BLUE}Building ${service} service for linux/amd64...${NC}"
  
  docker buildx build \
    --platform linux/amd64 \
    -t ${ECR_REGISTRY}/airbnb-${service}:${IMAGE_TAG} \
    -f ${PROJECT_ROOT}/backend/Dockerfile \
    --push \
    ${PROJECT_ROOT}/backend
  
  if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to build and push ${service} service${NC}"
    exit 1
  fi
  
  echo -e "${GREEN}✓ ${service} pushed successfully${NC}"
  echo ""
done

# Build and push agent service
echo -e "${BLUE}Building agent service for linux/amd64...${NC}"
docker buildx build \
  --platform linux/amd64 \
  -t ${ECR_REGISTRY}/airbnb-agent:${IMAGE_TAG} \
  -f ${PROJECT_ROOT}/agent-service/Dockerfile \
  --push \
  ${PROJECT_ROOT}/agent-service

if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to build and push agent service${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Agent service pushed successfully${NC}"
echo ""

# Build and push frontend
echo -e "${BLUE}Building frontend for linux/amd64...${NC}"
docker buildx build \
  --platform linux/amd64 \
  -t ${ECR_REGISTRY}/airbnb-frontend:${IMAGE_TAG} \
  -f ${PROJECT_ROOT}/frontend/Dockerfile \
  --push \
  ${PROJECT_ROOT}/frontend

if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to build and push frontend${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Frontend pushed successfully${NC}"
echo ""

# Summary
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ All images built and pushed successfully!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Images in ECR:${NC}"
for service in "${BACKEND_SERVICES[@]}" "agent" "frontend"; do
  echo -e "  ${ECR_REGISTRY}/airbnb-${service}:${IMAGE_TAG}"
done
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Deploy to Kubernetes: ${BLUE}./scripts/deploy-helm.sh${NC}"
echo -e "  2. Check deployment: ${BLUE}kubectl get pods -n airbnb-app${NC}"
