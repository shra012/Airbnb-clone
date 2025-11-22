#!/usr/bin/env bash
# Quick start script - Complete deployment from scratch

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   Airbnb Clone - Complete Deployment Pipeline"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${NC}"
echo ""

# Step 1: Verify prerequisites
echo -e "${BLUE}Step 1: Verifying prerequisites...${NC}"
echo ""

# Check kubectl
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}ERROR kubectl not found${NC}"
    exit 1
fi
echo -e "${GREEN}OK kubectl installed${NC}"

# Check helm
if ! command -v helm &> /dev/null; then
    echo -e "${RED}ERROR helm not found${NC}"
    exit 1
fi
echo -e "${GREEN}OK helm installed${NC}"

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}ERROR aws CLI not found${NC}"
    exit 1
fi
echo -e "${GREEN}OK AWS CLI installed${NC}"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}ERROR docker not found${NC}"
    exit 1
fi
echo -e "${GREEN}OK Docker installed${NC}"

# Check cluster access
# if ! kubectl cluster-info &> /dev/null; then
#     echo -e "${RED}ERROR Cannot connect to Kubernetes cluster${NC}"
#     exit 1
# fi
# echo -e "${GREEN}OK Kubernetes cluster accessible${NC}"

# Check .env file
if [ ! -f "${PROJECT_ROOT}/backend/.env" ]; then
    echo -e "${RED}ERROR backend/.env file not found${NC}"
    echo -e "${YELLOW}Please create backend/.env with required secrets${NC}"
    exit 1
fi
echo -e "${GREEN}OK backend/.env file found${NC}"

echo ""
echo -e "${GREEN}All prerequisites met!${NC}"
echo ""

# Confirmation
echo -e "${YELLOW}This script will:${NC}"
echo "  1. Build all Docker images"
echo "  2. Push images to AWS ECR"
echo "  3. Deploy to Kubernetes using Helm"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi
echo ""

# Step 2: Build and push images
echo -e "${BLUE}Step 2: Building and pushing Docker images...${NC}"
echo ""
${SCRIPT_DIR}/build-and-push.sh

if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR Failed to build and push images${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}OK All images built and pushed${NC}"
echo ""

# Step 3: Deploy Kafka
echo -e "${BLUE}Step 3: Deploying Kafka...${NC}"
echo ""
${SCRIPT_DIR}/deploy-kafka.sh

if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR Failed to deploy Kafka${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}OK Kafka deployed${NC}"
echo ""

# Step 4: Deploy to Kubernetes
echo -e "${BLUE}Step 4: Deploying application to Kubernetes...${NC}"
echo ""
${SCRIPT_DIR}/deploy-helm.sh

if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR Failed to deploy to Kubernetes${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}OK Deployment complete${NC}"
echo ""

# Step 5: Get status
echo -e "${BLUE}Step 5: Deployment status${NC}"
echo ""

echo -e "${YELLOW}Pods:${NC}"
kubectl get pods -n airbnb-app

echo ""
echo -e "${YELLOW}Services:${NC}"
kubectl get svc -n airbnb-app

echo ""
echo -e "${YELLOW}HPA:${NC}"
kubectl get hpa -n airbnb-app 2>/dev/null || echo "HPA not yet available"

echo ""
echo -e "${CYAN}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   Deployment Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${NC}"
echo ""

# Get frontend URL
echo -e "${YELLOW}Getting frontend URL...${NC}"
sleep 5

FRONTEND_LB=$(kubectl get svc frontend -n airbnb-app -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "")

if [ -z "$FRONTEND_LB" ]; then
    echo -e "${YELLOW}LoadBalancer is provisioning... This may take 2-3 minutes${NC}"
    echo ""
    echo -e "${YELLOW}Run this command to get the URL when ready:${NC}"
    echo -e "${BLUE}kubectl get svc frontend -n airbnb-app${NC}"
else
    echo ""
    echo -e "${GREEN}Application URL:${NC}"
    echo -e "${CYAN}http://${FRONTEND_LB}${NC}"
fi

echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo -e "  Watch pods:     ${BLUE}kubectl get pods -n airbnb-app -w${NC}"
echo -e "  View logs:      ${BLUE}kubectl logs -f deployment/traveler-service -n airbnb-app${NC}"
echo -e "  Get services:   ${BLUE}kubectl get svc -n airbnb-app${NC}"
echo -e "  Scale service:  ${BLUE}kubectl scale deployment traveler-service --replicas=5 -n airbnb-app${NC}"
echo ""
echo -e "${YELLOW}For more information, see:${NC}"
echo -e "  ${BLUE}docs/kubernetes-deployment.md${NC}"
echo ""
