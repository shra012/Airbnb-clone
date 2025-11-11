#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

if ! command -v docker &>/dev/null; then
  echo "docker is required to run this script" >&2
  exit 1
fi

pushd "$PROJECT_ROOT" >/dev/null

TOPICS=(
  "booking.requests"
  "booking.status"
  "property.notifications"
)

for TOPIC in "${TOPICS[@]}"; do
  echo "Ensuring topic '${TOPIC}' exists..."
  docker compose exec -T kafka kafka-topics \
    --create \
    --if-not-exists \
    --bootstrap-server kafka:9092 \
    --replication-factor 1 \
    --partitions 3 \
    --topic "${TOPIC}"
done

echo "Kafka topics ready."

popd >/dev/null
