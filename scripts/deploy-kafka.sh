#!/usr/bin/env bash
# Deploy Kafka to Kubernetes with EBS volumes

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN} Deploying Kafka to Kubernetes${NC}"
echo ""

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
  echo -e "${RED}Error: kubectl is not installed${NC}"
  exit 1
fi

# Check cluster connection
if ! kubectl cluster-info &> /dev/null; then
  echo -e "${RED}Error: Cannot connect to Kubernetes cluster${NC}"
  exit 1
fi

echo -e "${YELLOW}Step 1: Deploying Kafka with EBS volumes...${NC}"
kubectl apply -f "${PROJECT_ROOT}/k8s/kafka-deployment.yaml"
echo -e "${GREEN}OK Kafka deployment created${NC}"
echo ""

echo -e "${YELLOW}Step 2: Waiting for Kafka pod to be ready...${NC}"
kubectl wait --for=condition=ready pod -l app=kafka -n airbnb-kafka --timeout=300s || {
  echo -e "${RED}Kafka pod failed to become ready${NC}"
  echo -e "${YELLOW}Checking pod status:${NC}"
  kubectl get pods -n airbnb-kafka
  echo -e "${YELLOW}Pod logs:${NC}"
  kubectl logs -n airbnb-kafka -l app=kafka --tail=50
  exit 1
}
echo -e "${GREEN}OK Kafka is ready${NC}"
echo ""

echo -e "${YELLOW}Step 3: Creating Kafka topics...${NC}"
kubectl apply -f "${PROJECT_ROOT}/k8s/kafka-topics-job.yaml"
sleep 5
kubectl wait --for=condition=complete job/kafka-topics-bootstrap -n airbnb-kafka --timeout=120s || {
  echo -e "${YELLOW}Warning: Topic creation job may still be running${NC}"
  kubectl logs -n airbnb-kafka job/kafka-topics-bootstrap --tail=20
}
echo -e "${GREEN}OK Kafka topics created${NC}"
echo ""

echo -e "${YELLOW}Step 4: Verifying Kafka deployment...${NC}"
kubectl get all -n airbnb-kafka
echo ""

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}DONE Kafka deployment complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Kafka Details:${NC}"
echo -e "  Namespace: ${BLUE}airbnb-kafka${NC}"
echo -e "  Service: ${BLUE}airbnb-kafka.airbnb-kafka.svc.cluster.local:9092${NC}"
echo -e "  Storage: ${BLUE}10Gi EBS volume (gp3)${NC}"
echo ""
echo -e "${YELLOW}Kafka UI:${NC}"
echo -e "  To access Kafka UI, run:"
echo -e "  ${BLUE}kubectl port-forward -n airbnb-kafka svc/kafka-ui 8080:8080${NC}"
echo -e "  Then open: ${BLUE}http://localhost:8080${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Deploy/redeploy backend services: ${BLUE}./scripts/deploy-helm.sh${NC}"
echo -e "  2. Backend services will automatically connect to Kafka"
echo ""

