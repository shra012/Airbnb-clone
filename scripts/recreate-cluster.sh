#!/usr/bin/env bash
# Destroy and recreate entire AWS EKS cluster with all configurations

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
echo "   Airbnb Cluster Recreation Script"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${NC}"
echo ""

# Confirmation
echo -e "${RED}WARNING: This will DESTROY and RECREATE your entire cluster!${NC}"
echo ""
echo -e "${YELLOW}This script will:${NC}"
echo "  1. Destroy all Kubernetes resources"
echo "  2. Destroy EKS cluster and infrastructure (Terraform)"
echo "  3. Recreate EKS cluster with Terraform"
echo "  4. Deploy Kafka to the new cluster"
echo "  5. Build and push Docker images to ECR"
echo "  6. Deploy application with Helm"
echo "  7. Update kubeconfig and display access URLs"
echo ""
read -p "Are you sure you want to continue? (type 'yes' to confirm): " confirm

if [ "$confirm" != "yes" ]; then
  echo -e "${YELLOW}Aborted.${NC}"
  exit 0
fi

echo ""
echo -e "${BLUE}Starting cluster recreation...${NC}"
echo ""

# Step 1: Destroy Kubernetes resources
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}Step 1/7: Destroying Kubernetes resources${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if command -v kubectl &>/dev/null && kubectl cluster-info &>/dev/null 2>&1; then
  echo -e "${YELLOW}Deleting Helm releases...${NC}"
  helm uninstall airbnb -n airbnb-app 2>/dev/null || echo "  No Helm release found"
  
  echo -e "${YELLOW}Deleting Kafka resources...${NC}"
  kubectl delete -f "${PROJECT_ROOT}/k8s/kafka-deployment.yaml" 2>/dev/null || echo "  No Kafka resources found"
  
  echo -e "${YELLOW}Deleting namespaces...${NC}"
  kubectl delete namespace airbnb-app 2>/dev/null || echo "  Namespace airbnb-app not found"
  kubectl delete namespace airbnb-kafka 2>/dev/null || echo "  Namespace airbnb-kafka not found"
  
  echo -e "${GREEN}OK Kubernetes resources cleaned up${NC}"
else
  echo -e "${YELLOW}kubectl not connected to cluster, skipping K8s cleanup${NC}"
fi

echo ""
sleep 2

# Step 2: Destroy Terraform infrastructure
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}Step 2/7: Destroying Terraform infrastructure${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd "${PROJECT_ROOT}/aws"

# Source environment variables
if [ -f "setup-env.sh" ]; then
  echo -e "${YELLOW}Loading environment variables...${NC}"
  export TF_VAR_supabase_postgres_url="dummy"
  source setup-env.sh
fi

echo -e "${YELLOW}Running terraform destroy...${NC}"
terraform destroy \
  -var-file=terraform.tfvars \
  -var-file=network.auto.tfvars \
  -auto-approve

echo -e "${GREEN}OK Infrastructure destroyed${NC}"
echo ""
sleep 2

# Step 3: Create new infrastructure
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}Step 3/7: Creating new EKS cluster${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${YELLOW}Configuring network...${NC}"
bash "${PROJECT_ROOT}/aws/scripts/configure-network.sh"

echo -e "${YELLOW}Running terraform apply...${NC}"
terraform apply \
  -var-file=terraform.tfvars \
  -var-file=network.auto.tfvars \
  -auto-approve

echo -e "${GREEN}OK Infrastructure created${NC}"
echo ""
sleep 2

# Step 4: Update kubeconfig
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}Step 4/7: Updating kubeconfig${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

CLUSTER_NAME=$(terraform output -raw cluster_name 2>/dev/null || echo "airbnb-lab2-cluster")
AWS_REGION=$(terraform output -raw region 2>/dev/null || echo "us-east-1")

echo -e "${YELLOW}Updating kubeconfig for cluster: ${CLUSTER_NAME}${NC}"
aws eks update-kubeconfig \
  --name "${CLUSTER_NAME}" \
  --region "${AWS_REGION}"

# Wait for cluster to be ready
echo -e "${YELLOW}Waiting for cluster to be ready...${NC}"
sleep 30

# Verify connection
if kubectl cluster-info &>/dev/null; then
  echo -e "${GREEN}OK Connected to cluster${NC}"
else
  echo -e "${RED}ERROR Failed to connect to cluster${NC}"
  exit 1
fi

echo ""
sleep 2

# Step 5: Deploy Kafka
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}Step 5/7: Deploying Kafka${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd "${PROJECT_ROOT}"
bash "${SCRIPT_DIR}/deploy-kafka.sh"

echo -e "${GREEN}OK Kafka deployed${NC}"
echo ""
sleep 2

# Step 6: Build and push images
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}Step 6/7: Building and pushing Docker images${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

bash "${SCRIPT_DIR}/build-and-push.sh"

echo -e "${GREEN}OK Images built and pushed${NC}"
echo ""
sleep 2

# Step 7: Deploy application
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}Step 7/7: Deploying application${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

bash "${SCRIPT_DIR}/deploy-helm.sh"

echo -e "${GREEN}OK Application deployed${NC}"
echo ""
sleep 2

# Final status
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}Deployment Status${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${YELLOW}Pods:${NC}"
kubectl get pods -n airbnb-app
echo ""

echo -e "${YELLOW}Services:${NC}"
kubectl get svc -n airbnb-app
echo ""

echo -e "${YELLOW}Kafka:${NC}"
kubectl get pods,svc -n airbnb-kafka
echo ""

# Get URLs
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}Access URLs${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

bash "${SCRIPT_DIR}/get-urls.sh"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}DONE Cluster recreation complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Wait 2-3 minutes for Load Balancers to provision"
echo "  2. Run: ${BLUE}./scripts/get-urls.sh${NC} to get access URLs"
echo "  3. Test the deployment: ${BLUE}cd jmeter && ./run-test.sh 10 30${NC}"
echo ""
echo -e "${YELLOW}Monitor:${NC}"
echo "  ${BLUE}kubectl get pods -n airbnb-app -w${NC}"
echo "  ${BLUE}kubectl top pods -n airbnb-app${NC}"
echo ""

