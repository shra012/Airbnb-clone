#!/usr/bin/env bash
# shellcheck disable=SC1090
#
# Usage:
#   cp aws/environment.example.sh aws/environment.sh
#   source aws/environment.sh
# The script exports Terraform variables by reading values from ../backend/.env.

# Enable strict mode only when executed directly (not when sourced)
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  set -euo pipefail
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}" && git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "$PROJECT_ROOT" ]]; then
  PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd -P)"
fi
ENV_FILE="${ENV_FILE:-${PROJECT_ROOT}/backend/.env}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Cannot locate backend .env file at: $ENV_FILE" >&2
  echo "Set ENV_FILE before sourcing this script if your .env lives elsewhere." >&2
  return 1 2>/dev/null || exit 1
fi

extract_env_value() {
  local key="$1"
  local value
  value=$(grep -E "^${key}=" "$ENV_FILE" | tail -n 1 | cut -d= -f2-)
  if [[ -z "$value" ]]; then
    echo "Missing ${key} in $ENV_FILE" >&2
    return 1
  fi
  printf "%s" "$value"
}

export TF_VAR_mongo_session_uri="${TF_VAR_mongo_session_uri:-$(extract_env_value "MONGO_SESSION_URI")}"
export TF_VAR_supabase_postgres_url="${TF_VAR_supabase_postgres_url:-$(extract_env_value "DATABASE_URL")}"
export TF_VAR_session_secret="${TF_VAR_session_secret:-$(extract_env_value "SESSION_SECRET")}"

echo "Terraform env vars exported:"
echo "  TF_VAR_mongo_session_uri"
echo "  TF_VAR_supabase_postgres_url"
echo "  TF_VAR_session_secret"
