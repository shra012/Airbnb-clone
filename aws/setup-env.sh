#!/usr/bin/env bash
# Setup script for Terraform environment variables
# Usage: source aws/setup-env.sh

# Set this to the path of your backend .env file if you want to auto-load secrets
ENV_FILE="${ENV_FILE:-../backend/.env}"

echo "Setting up Terraform environment variables..."

# Try to load from backend .env if it exists
if [[ -f "$ENV_FILE" ]]; then
  echo "Loading secrets from $ENV_FILE"
  
  # Export MongoDB URI
  if grep -q "^MONGO_SESSION_URI=" "$ENV_FILE"; then
    export TF_VAR_mongo_session_uri=$(grep "^MONGO_SESSION_URI=" "$ENV_FILE" | cut -d '=' -f2- | tr -d '"' | tr -d "'")
    echo "✓ Loaded TF_VAR_mongo_session_uri"
  fi
  
  # Export Supabase URL
  if grep -q "^SUPABASE_POSTGRES_URL=" "$ENV_FILE"; then
    export TF_VAR_supabase_postgres_url=$(grep "^SUPABASE_POSTGRES_URL=" "$ENV_FILE" | cut -d '=' -f2- | tr -d '"' | tr -d "'")
    echo "✓ Loaded TF_VAR_supabase_postgres_url"
  fi
  
  # Export Session Secret
  if grep -q "^SESSION_SECRET=" "$ENV_FILE"; then
    export TF_VAR_session_secret=$(grep "^SESSION_SECRET=" "$ENV_FILE" | cut -d '=' -f2- | tr -d '"' | tr -d "'")
    echo "✓ Loaded TF_VAR_session_secret"
  fi
else
  echo "WARNING: Backend .env file not found at $ENV_FILE"
  echo "Please set these environment variables manually:"
  echo "  export TF_VAR_mongo_session_uri='your-mongodb-uri'"
  echo "  export TF_VAR_supabase_postgres_url='your-supabase-url'"
  echo "  export TF_VAR_session_secret='your-session-secret'"
fi

# Verify AWS credentials
echo ""
echo "Verifying AWS credentials..."
if aws sts get-caller-identity &>/dev/null; then
  ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
  echo "✓ AWS Account: $ACCOUNT_ID"
else
  echo "✗ AWS credentials not configured. Run 'aws configure' first."
  return 1
fi

echo ""
echo "Environment setup complete! You can now run:"
echo "  terraform plan"
echo "  terraform apply"

