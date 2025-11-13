#!/usr/bin/env bash
# Get all external access URLs for the deployed services

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Airbnb Lab - Access URLs${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if kubectl is available
if ! command -v kubectl &>/dev/null; then
  echo -e "${RED}Error: kubectl is not installed${NC}"
  exit 1
fi

# Check cluster connection
if ! kubectl cluster-info &>/dev/null; then
  echo -e "${RED}Error: Cannot connect to Kubernetes cluster${NC}"
  exit 1
fi

# Get Frontend URL
echo -e "${YELLOW}Frontend (Airbnb Application):${NC}"
FRONTEND_URL=$(kubectl get svc frontend -n airbnb-app -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "")
if [ -z "$FRONTEND_URL" ]; then
  echo -e "  ${RED}Not available (LoadBalancer pending)${NC}"
else
  echo -e "  HTTP:  ${BLUE}http://${FRONTEND_URL}${NC}"
  echo -e "  HTTPS: ${BLUE}https://${FRONTEND_URL}${NC}"
fi
echo ""

# Get Kafka UI URL
echo -e "${YELLOW}Kafka UI (Event Monitoring):${NC}"
KAFKA_UI_URL=$(kubectl get svc kafka-ui -n airbnb-kafka -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "")
if [ -z "$KAFKA_UI_URL" ]; then
  echo -e "  ${RED}Not available (LoadBalancer pending)${NC}"
  echo -e "  ${YELLOW}Tip: Use port-forward instead:${NC}"
  echo -e "  ${BLUE}kubectl port-forward -n airbnb-kafka svc/kafka-ui 8080:8080${NC}"
  echo -e "  ${BLUE}Then open: http://localhost:8080${NC}"
else
  echo -e "  ${BLUE}http://${KAFKA_UI_URL}:8080${NC}"
fi
echo ""

# Get Kafka broker URL (internal)
echo -e "${YELLOW}Kafka Broker (Internal):${NC}"
KAFKA_BROKER=$(kubectl get svc airbnb-kafka -n airbnb-kafka -o jsonpath='{.metadata.name}.{.metadata.namespace}.svc.cluster.local:{.spec.ports[0].port}' 2>/dev/null || echo "")
if [ -z "$KAFKA_BROKER" ]; then
  echo -e "  ${RED}Not available${NC}"
else
  echo -e "  ${BLUE}${KAFKA_BROKER}${NC}"
  echo -e "  ${YELLOW}(Only accessible from within the cluster)${NC}"
fi
echo ""

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Quick Commands:${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Check pod status:${NC}"
echo -e "  ${BLUE}kubectl get pods -n airbnb-app${NC}"
echo -e "  ${BLUE}kubectl get pods -n airbnb-kafka${NC}"
echo ""
echo -e "${YELLOW}View logs:${NC}"
echo -e "  ${BLUE}kubectl logs -n airbnb-app -l app=booking-service --tail=50${NC}"
echo -e "  ${BLUE}kubectl logs -n airbnb-kafka -l app=kafka --tail=50${NC}"
echo ""
echo -e "${YELLOW}Port-forward Kafka UI (if LoadBalancer not available):${NC}"
echo -e "  ${BLUE}kubectl port-forward -n airbnb-kafka svc/kafka-ui 8080:8080${NC}"
echo ""

