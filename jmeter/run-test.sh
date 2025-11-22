#!/usr/bin/env bash
# Quick JMeter load test with configurable users and duration

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Use local JMeter installation
JMETER_HOME="${SCRIPT_DIR}/apache-jmeter-5.6.3"
JMETER_BIN="${JMETER_HOME}/bin/jmeter"

# Check if local JMeter exists
if [ ! -f "$JMETER_BIN" ]; then
  echo -e "${RED}Error: JMeter binary not found at ${JMETER_BIN}${NC}"
  exit 1
fi

# Default values
USERS=${1:-30}
DURATION=${2:-60}
RAMP_UP=$((DURATION / 3))

# Validate inputs
if ! [[ "$USERS" =~ ^[0-9]+$ ]] || [ "$USERS" -lt 1 ]; then
  echo -e "${RED}Error: Users must be a positive integer${NC}"
  exit 1
fi

if ! [[ "$DURATION" =~ ^[0-9]+$ ]] || [ "$DURATION" -lt 1 ]; then
  echo -e "${RED}Error: Duration must be a positive integer (seconds)${NC}"
  exit 1
fi

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Airbnb Load Test${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Configuration:${NC}"
echo -e "  Users: ${BLUE}${USERS}${NC}"
echo -e "  Duration: ${BLUE}${DURATION} seconds${NC}"
echo -e "  Ramp-up: ${BLUE}${RAMP_UP} seconds${NC}"
echo ""

# Get AWS Load Balancer URL
if command -v kubectl &>/dev/null && kubectl cluster-info &>/dev/null 2>&1; then
  FRONTEND_URL=$(kubectl get svc frontend -n airbnb-app -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "")
  if [ -n "$FRONTEND_URL" ]; then
    echo -e "${YELLOW}Target: ${BLUE}http://${FRONTEND_URL}${NC}"
  fi
fi
echo ""

# Create results directory
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
RESULTS_DIR="${SCRIPT_DIR}/results"
mkdir -p "${RESULTS_DIR}"

# Test plan file
TEST_PLAN="${SCRIPT_DIR}/airbnb-load-test.jmx"

if [ ! -f "$TEST_PLAN" ]; then
  echo -e "${RED}Error: Test plan not found at ${TEST_PLAN}${NC}"
  exit 1
fi

# Output files
JTL_FILE="${RESULTS_DIR}/quick-test-${USERS}users-${DURATION}s-${TIMESTAMP}.jtl"
HTML_DIR="${RESULTS_DIR}/html-quick-${USERS}users-${DURATION}s-${TIMESTAMP}"

echo -e "${BLUE}Starting load test...${NC}"
echo -e "${YELLOW}This will run for ${DURATION} seconds...${NC}"
echo ""

# Run JMeter with parameters
"$JMETER_BIN" -n -t "$TEST_PLAN" \
  -Jusers=${USERS} \
  -Jduration=${DURATION} \
  -Jrampup=${RAMP_UP} \
  -l "$JTL_FILE" \
  -e -o "$HTML_DIR"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Load test complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Results saved to:${NC}"
echo -e "  JTL File: ${BLUE}${JTL_FILE}${NC}"
echo -e "  HTML Report: ${BLUE}${HTML_DIR}/index.html${NC}"
echo ""
echo -e "${YELLOW}Quick Stats:${NC}"

# Extract some quick stats from JTL file
if [ -f "$JTL_FILE" ]; then
  TOTAL_REQUESTS=$(grep -c "^[0-9]" "$JTL_FILE" || echo "0")
  FAILED_REQUESTS=$(grep ",false," "$JTL_FILE" | wc -l | tr -d ' ' || echo "0")
  SUCCESS_REQUESTS=$((TOTAL_REQUESTS - FAILED_REQUESTS))
  
  if [ "$TOTAL_REQUESTS" -gt 0 ]; then
    SUCCESS_RATE=$(awk "BEGIN {printf \"%.2f\", ($SUCCESS_REQUESTS / $TOTAL_REQUESTS) * 100}")
    THROUGHPUT=$(awk "BEGIN {printf \"%.2f\", $TOTAL_REQUESTS / $DURATION}")
    
    echo -e "  Total Requests: ${BLUE}${TOTAL_REQUESTS}${NC}"
    echo -e "  Successful: ${GREEN}${SUCCESS_REQUESTS}${NC}"
    echo -e "  Failed: ${RED}${FAILED_REQUESTS}${NC}"
    echo -e "  Success Rate: ${GREEN}${SUCCESS_RATE}%${NC}"
    echo -e "  Throughput: ${BLUE}${THROUGHPUT} req/sec${NC}"
  fi
fi

echo ""
echo -e "${YELLOW}Open HTML report:${NC}"
echo -e "  ${BLUE}open ${HTML_DIR}/index.html${NC}"
echo ""

# Ask if user wants to open the report
read -p "Open HTML report now? [y/N]: " open_report
if [[ $open_report =~ ^[Yy]$ ]]; then
  open "${HTML_DIR}/index.html"
fi

echo ""
echo -e "${YELLOW}Monitor backend:${NC}"
echo -e "  ${BLUE}kubectl get pods -n airbnb-app${NC}"
echo -e "  ${BLUE}kubectl top pods -n airbnb-app${NC}"
echo ""

