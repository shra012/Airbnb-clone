#!/usr/bin/env bash
# Complete deployment: EKS Cluster + Kubernetes Resources + Application

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
echo "   Complete EKS Deployment Pipeline"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${NC}"
echo ""

# Stage 1: Deploy EKS Cluster with Terraform
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Stage 1: Deploying EKS Cluster${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Source environment variables
if [ -f ./environment.sh ]; then
    source ./environment.sh
    echo -e "${GREEN}Terraform env vars exported${NC}"
else
    echo -e "${YELLOW}Warning: environment.sh not found, skipping Terraform vars${NC}"
fi

# Initialize and apply Terraform
cd "$SCRIPT_DIR"
terraform init
terraform plan -out=tfplan
terraform apply tfplan

# Get cluster name from Terraform output or variables
CLUSTER_NAME=$(terraform output -raw cluster_name 2>/dev/null || grep "^cluster_name" terraform.tfvars | cut -d'"' -f2 || echo "data236-cluster")
AWS_REGION=$(terraform output -raw aws_region 2>/dev/null || grep "^aws_region" terraform.tfvars | cut -d'"' -f2 || echo "us-east-1")

echo ""
echo -e "${GREEN}✓ EKS Cluster deployed${NC}"
echo ""

# Stage 2: Configure kubectl
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Stage 2: Configuring kubectl${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${YELLOW}Waiting for cluster to be ready...${NC}"
aws eks wait cluster-active --name "$CLUSTER_NAME" --region "$AWS_REGION" || {
    echo -e "${YELLOW}Cluster may still be provisioning, continuing...${NC}"
}

echo -e "${YELLOW}Configuring kubectl...${NC}"
aws eks update-kubeconfig --region "$AWS_REGION" --name "$CLUSTER_NAME"

# Verify kubectl connection
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${RED}Error: Cannot connect to Kubernetes cluster${NC}"
    echo -e "${YELLOW}Waiting 30 seconds and retrying...${NC}"
    sleep 30
    aws eks update-kubeconfig --region "$AWS_REGION" --name "$CLUSTER_NAME"
    
    if ! kubectl cluster-info &> /dev/null; then
        echo -e "${RED}Error: Still cannot connect. Please check cluster status${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✓ kubectl configured${NC}"
echo ""

# Stage 3: Wait for nodes to be ready
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Stage 3: Waiting for worker nodes${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${YELLOW}Waiting for nodes to be ready...${NC}"
kubectl wait --for=condition=Ready nodes --all --timeout=600s || {
    echo -e "${YELLOW}Warning: Some nodes may not be ready yet${NC}"
    kubectl get nodes
}

echo -e "${GREEN}✓ Nodes ready${NC}"
echo ""

# Stage 4: Deploy Kafka
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Stage 4: Deploying Kafka${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

"${PROJECT_ROOT}/scripts/deploy-kafka.sh"

echo ""

# Stage 5: Build and push Docker images
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Stage 5: Building and pushing Docker images${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

"${PROJECT_ROOT}/scripts/build-and-push.sh"

echo ""

# Stage 6: Deploy application with Helm
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Stage 6: Deploying application to Kubernetes${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

"${PROJECT_ROOT}/scripts/deploy-helm.sh"

echo ""
echo -e "${CYAN}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   Deployment Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${NC}"
echo ""

# Get frontend URL
echo -e "${YELLOW}Getting frontend URL...${NC}"
sleep 10

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
echo -e "${YELLOW}Deployment Status:${NC}"
kubectl get pods -n airbnb-app
echo ""
kubectl get svc -n airbnb-app
echo ""

echo -e "${YELLOW}Useful commands:${NC}"
echo -e "  Watch pods:     ${BLUE}kubectl get pods -n airbnb-app -w${NC}"
echo -e "  View logs:      ${BLUE}kubectl logs -f deployment/traveler-service -n airbnb-app${NC}"
echo -e "  Get services:   ${BLUE}kubectl get svc -n airbnb-app${NC}"
echo ""
