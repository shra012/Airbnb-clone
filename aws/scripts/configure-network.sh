#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Configure Terraform network variables for the current AWS account.

Usage:
  aws/scripts/configure-network.sh [--region us-east-1] [--vpc-id vpc-123] [--subnets subnet-a,subnet-b,...]

If flags are omitted the script will detect the default VPC and its subnets.
The resulting values are written to aws/network.auto.tfvars (git-ignored).
EOF
}

REGION="${AWS_REGION:-us-east-1}"
VPC_ID=""
SUBNETS=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --region)
      REGION="$2"
      shift 2
      ;;
    --vpc-id)
      VPC_ID="$2"
      shift 2
      ;;
    --subnets)
      SUBNETS="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown flag: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ -z "$VPC_ID" ]]; then
  echo "Detecting default VPC in ${REGION}..."
  VPC_ID="$(aws ec2 describe-vpcs \
    --region "${REGION}" \
    --filters Name=isDefault,Values=true \
    --query 'Vpcs[0].VpcId' \
    --output text)"
fi

if [[ -z "$SUBNETS" ]]; then
  echo "Collecting subnets for ${VPC_ID}..."
  while IFS= read -r subnet; do
    [[ -n "$subnet" ]] && SUBNET_ARRAY+=("$subnet")
  done < <(aws ec2 describe-subnets \
    --region "${REGION}" \
    --filters Name=vpc-id,Values="${VPC_ID}" \
    --query 'Subnets[].SubnetId' \
    --output text | tr '\t' '\n')
else
  IFS=',' read -r -a SUBNET_ARRAY <<< "$SUBNETS"
fi

if [[ ${#SUBNET_ARRAY[@]} -lt 2 ]]; then
  echo "Need at least two subnet IDs; found: ${SUBNET_ARRAY[*]}" >&2
  exit 1
fi

TFVARS_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/network.auto.tfvars"

cat > "${TFVARS_PATH}" <<EOF
aws_region           = "${REGION}"
vpc_id               = "${VPC_ID}"
public_subnet_ids    = [
$(for subnet in "${SUBNET_ARRAY[@]}"; do printf '  "%s",\n' "$subnet"; done)
]
EOF

echo "Updated ${TFVARS_PATH} with:"
echo "  aws_region        = ${REGION}"
echo "  vpc_id            = ${VPC_ID}"
echo "  public_subnet_ids = ${SUBNET_ARRAY[*]}"
