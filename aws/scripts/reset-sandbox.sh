#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Reset Terraform state for a new sandbox session and regenerate network settings.

Usage:
  aws/scripts/reset-sandbox.sh [configure args]

Any flags you pass are forwarded to configure-network.sh (e.g. --region, --vpc-id, --subnets).
USAGE
}

if [[ $# -gt 0 ]]; then
  case "$1" in
    -h|--help)
      usage
      exit 0
      ;;
  esac
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
AWS_DIR="$(cd "${SCRIPT_DIR}/.." && pwd -P)"
CONFIG_SCRIPT="${SCRIPT_DIR}/configure-network.sh"

if [[ ! -x "$CONFIG_SCRIPT" ]]; then
  echo "Missing configure script at $CONFIG_SCRIPT" >&2
  exit 1
fi

echo "[reset] Updating network variables..."
bash "$CONFIG_SCRIPT" "$@"

echo "[reset] Removing previous Terraform state..."
rm -rf \
  "${AWS_DIR}/.terraform" \
  "${AWS_DIR}/.terraform.lock.hcl" \
  "${AWS_DIR}/terraform.tfstate" \
  "${AWS_DIR}/terraform.tfstate.backup" \
  "${AWS_DIR}/terraform.tfstate.d"

echo "[reset] Complete. Run 'cd aws && terraform init' before planning/applying."
