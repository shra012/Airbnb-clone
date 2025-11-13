#!/usr/bin/env bash
# Bootstrap Kafka topics for both Docker Compose (local) and EKS (Kubernetes)

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Topic configuration
TOPICS=(
  "booking.requests"
  "booking.status"
  "property.notifications"
)
PARTITIONS=3
REPLICATION_FACTOR=1

# Detect environment
detect_environment() {
  # Check if kubectl is available and can connect to a cluster
  if command -v kubectl &>/dev/null && kubectl cluster-info &>/dev/null 2>&1; then
    # Check if Kafka is running in EKS
    if kubectl get pods -n airbnb-kafka -l app=kafka 2>/dev/null | grep -q "Running"; then
      echo "eks"
      return
    fi
  fi
  
  # Check if Docker Compose Kafka is running
  if command -v docker &>/dev/null && docker compose ps kafka 2>/dev/null | grep -q "Up"; then
    echo "docker"
    return
  fi
  
  echo "none"
}

# Create topics in Docker Compose
create_topics_docker() {
  echo -e "${BLUE}Creating topics in Docker Compose Kafka...${NC}"
  
  for TOPIC in "${TOPICS[@]}"; do
    echo -e "${YELLOW}Ensuring topic '${TOPIC}' exists...${NC}"
    docker compose exec -T kafka kafka-topics \
      --create \
      --if-not-exists \
      --bootstrap-server kafka:9092 \
      --replication-factor ${REPLICATION_FACTOR} \
      --partitions ${PARTITIONS} \
      --topic "${TOPIC}"
  done
  
  echo -e "${GREEN}OK Docker Compose Kafka topics ready${NC}"
}

# Create topics in EKS
create_topics_eks() {
  echo -e "${BLUE}Creating topics in EKS Kafka...${NC}"
  
  # Get Kafka pod name
  KAFKA_POD=$(kubectl get pods -n airbnb-kafka -l app=kafka -o jsonpath='{.items[0].metadata.name}')
  
  if [ -z "$KAFKA_POD" ]; then
    echo -e "${RED}Error: No Kafka pod found in EKS${NC}"
    exit 1
  fi
  
  echo -e "${YELLOW}Using Kafka pod: ${KAFKA_POD}${NC}"
  
  for TOPIC in "${TOPICS[@]}"; do
    echo -e "${YELLOW}Ensuring topic '${TOPIC}' exists...${NC}"
    kubectl exec -n airbnb-kafka "${KAFKA_POD}" -- kafka-topics \
      --create \
      --if-not-exists \
      --bootstrap-server airbnb-kafka.airbnb-kafka.svc.cluster.local:9092 \
      --replication-factor ${REPLICATION_FACTOR} \
      --partitions ${PARTITIONS} \
      --topic "${TOPIC}"
  done
  
  echo ""
  echo -e "${YELLOW}Listing all topics:${NC}"
  kubectl exec -n airbnb-kafka "${KAFKA_POD}" -- kafka-topics \
    --list \
    --bootstrap-server airbnb-kafka.airbnb-kafka.svc.cluster.local:9092
  
  echo ""
  echo -e "${GREEN}OK EKS Kafka topics ready${NC}"
}

# Main
pushd "$PROJECT_ROOT" >/dev/null

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Kafka Topics Bootstrap${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Detect environment
ENV=$(detect_environment)

case "$ENV" in
  eks)
    echo -e "${BLUE}Detected: EKS Kubernetes cluster${NC}"
    echo ""
    create_topics_eks
    ;;
  docker)
    echo -e "${BLUE}Detected: Docker Compose${NC}"
    echo ""
    create_topics_docker
    ;;
  none)
    echo -e "${RED}Error: No Kafka instance detected${NC}"
    echo ""
    echo -e "${YELLOW}Please ensure one of the following:${NC}"
    echo -e "  1. Docker Compose Kafka is running: ${BLUE}docker compose up -d kafka${NC}"
    echo -e "  2. EKS Kafka is deployed: ${BLUE}kubectl get pods -n airbnb-kafka${NC}"
    exit 1
    ;;
esac

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}DONE Topics bootstrap complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

popd >/dev/null
