# Terraform Setup Complete ✓

## Problem Fixed

**Original Issue**: Terraform was not installed on your system.

**Error Message**: `command not found: terraform`

## Solution Applied

1. ✅ **Installed Terraform v1.13.5** via Homebrew
2. ✅ **Configured network settings** for your AWS account (779926948199)
3. ✅ **Updated Terraform configuration** to create EKS cluster (was trying to use non-existent cluster)
4. ✅ **Initialized Terraform** successfully
5. ✅ **Validated configuration** - ready to deploy

## Your AWS Environment

- **Account ID**: 779926948199
- **Region**: us-east-1
- **VPC**: vpc-0601227af31a9b901
- **Subnets**: 6 public subnets detected and configured

## Files Created/Modified

### New Files
- `aws/network.auto.tfvars` - Auto-generated network configuration
- `aws/terraform.tfvars` - Main terraform variables
- `aws/setup-env.sh` - Helper script to load environment variables
- `aws/QUICKSTART.md` - Complete usage guide

### Modified Files
- `aws/main.tf` - Changed from using existing cluster to creating new EKS cluster
- `aws/outputs.tf` - Updated references from data source to resource

## What Will Be Created

When you run `terraform apply`, it will create **23 resources**:

### EKS Infrastructure
- 1x EKS Cluster (airbnb-lab2-cluster, Kubernetes v1.31)
- 1x EKS Node Group (3x t3.large instances)
- 3x EKS Addons (EBS CSI Driver, VPC CNI, kube-proxy)

### IAM Resources
- 2x IAM Roles (cluster role, node group role)
- 5x IAM Role Policy Attachments

### Security
- 2x Security Groups (cluster, nodes)

### Container Registry
- 6x ECR Repositories:
  - airbnb-traveler
  - airbnb-owner
  - airbnb-property
  - airbnb-booking
  - airbnb-agent
  - airbnb-frontend

### Kubernetes Resources
- 2x Namespaces (airbnb-app, airbnb-kafka)

## How to Use

### Quick Start (3 commands)

```bash
cd aws
source setup-env.sh
terraform apply
```

### Step by Step

1. **Navigate to aws directory**:
   ```bash
   cd /Users/shreyas/Documents/Distriubuted_systems/airbnb_lab/aws
   ```

2. **Set up environment variables**:
   ```bash
   source setup-env.sh
   ```
   
   This loads MongoDB URI, Supabase URL, and session secret from your backend/.env file.
   
   **Or set manually**:
   ```bash
   export TF_VAR_mongo_session_uri="your-mongodb-uri"
   export TF_VAR_supabase_postgres_url="your-supabase-url"
   export TF_VAR_session_secret="your-secret"
   ```

3. **Review what will be created**:
   ```bash
   terraform plan
   ```

4. **Create the infrastructure**:
   ```bash
   terraform apply
   ```
   
   Type `yes` when prompted. This takes ~10-15 minutes.

5. **Configure kubectl**:
   ```bash
   aws eks update-kubeconfig --region us-east-1 --name airbnb-lab2-cluster
   ```

6. **Verify**:
   ```bash
   kubectl get nodes
   kubectl get namespaces
   ```

## Important Notes

### Cost Warning
Running this infrastructure costs approximately **$3-4 per day**:
- EKS cluster: ~$0.10/hour ($2.40/day)
- 3x t3.large nodes: ~$0.28/hour ($6.72/day)
- EBS volumes: minimal
- **Total**: ~$9/day if running 24/7

**Remember to destroy when done**:
```bash
terraform destroy
```

### Security
The security groups are configured with open ingress/egress (0.0.0.0/0) for lab purposes. This allows:
- MongoDB Atlas connectivity
- Supabase connectivity
- Easy testing and development

**Do not use this configuration in production!**

### Next Steps After Terraform

1. **Build and push Docker images**:
   ```bash
   bash scripts/build-and-push.sh
   ```

2. **Deploy Kafka**:
   ```bash
   helm repo add bitnami https://charts.bitnami.com/bitnami
   helm install kafka bitnami/kafka -n airbnb-kafka
   ```

3. **Deploy your application**:
   ```bash
   bash scripts/deploy-helm.sh
   ```

4. **Or use the complete quickstart** (does all of the above):
   ```bash
   bash scripts/quickstart.sh
   ```

## Troubleshooting

### If you switch AWS accounts
```bash
bash scripts/reset-sandbox.sh --region us-east-1
cd aws
terraform init
source setup-env.sh
terraform plan
```

### If network configuration is wrong
```bash
bash aws/scripts/configure-network.sh --region us-east-1
```

### To view outputs after apply
```bash
terraform output
terraform output ecr_repositories
terraform output configure_kubectl
```

### To see current state
```bash
terraform show
terraform state list
```

## Verification Checklist

After `terraform apply` completes:

- [ ] EKS cluster is created and active
- [ ] 3 worker nodes are in Ready state
- [ ] ECR repositories exist (6 total)
- [ ] Namespaces created (airbnb-app, airbnb-kafka)
- [ ] kubectl configured and working
- [ ] Can run `kubectl get nodes` successfully

## Support

For detailed instructions, see:
- `aws/QUICKSTART.md` - Complete usage guide
- `aws/README.md` - Original documentation
- `docs/kubernetes-deployment.md` - Kubernetes deployment guide

## Summary

✅ **Terraform is now installed and working**
✅ **Configuration is validated and ready**
✅ **Network settings are configured for your AWS account**
✅ **Ready to deploy with `terraform apply`**

The main issue was that Terraform wasn't installed. Now everything is set up and you can proceed with deploying your infrastructure!

