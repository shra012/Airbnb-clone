#!/usr/bin/env bash
set -euo pipefail

# Stage 1: Deploy EKS Cluster Only (no Kubernetes resources that need the cluster)
echo "==================================="
echo "Stage 1: Creating EKS Cluster"
echo "==================================="

# Source environment variables
source ./environment.sh

# Backup original main.tf
if [ ! -f main.tf.full ]; then
  mv main.tf main.tf.full
  echo "Backed up main.tf to main.tf.full"
fi

# Use EKS-only configuration
cp main-eks-only.tf main.tf

# Clean up old state if needed
if [ -f terraform.tfstate ]; then
  echo "Removing old terraform state..."
  rm -f terraform.tfstate terraform.tfstate.backup
fi

# Initialize and apply
terraform init -reconfigure
terraform plan -out=tfplan-stage1
terraform apply tfplan-stage1

echo ""
echo "==================================="
echo "Stage 1 Complete!"
echo "==================================="
echo ""
echo "EKS Cluster created successfully!"
echo ""
echo "Configure kubectl with:"
terraform output -raw configure_kubectl
echo ""
echo ""
echo "Next steps:"
echo "1. Wait for cluster to be fully ready (5-10 minutes)"
echo "2. Configure kubectl using the command above"
echo "3. Restore main.tf.full and apply Kubernetes resources"
echo ""
