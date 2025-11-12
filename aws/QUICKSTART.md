# AWS Terraform Quick Start Guide

## Account Information
- **AWS Account ID**: 779926948199
- **Region**: us-east-1
- **VPC**: vpc-0601227af31a9b901

## Prerequisites ✓
- [x] Terraform installed (v1.13.5)
- [x] AWS credentials configured
- [x] Network configuration generated

## Quick Start

### 1. Set up environment variables

```bash
cd aws
source setup-env.sh
```

This will automatically load your MongoDB, Supabase, and session secret from `backend/.env` if available.

**Or manually set them:**

```bash
export TF_VAR_mongo_session_uri="your-mongodb-atlas-uri"
export TF_VAR_supabase_postgres_url="your-supabase-postgres-url"
export TF_VAR_session_secret="your-session-secret"
```

### 2. Review the plan

```bash
terraform plan
```

This will show you what resources Terraform will create:
- EKS cluster (`airbnb-lab2-cluster`)
- EKS node group (3x t3.large instances)
- ECR repositories for all services
- Security groups
- IAM roles
- Kubernetes namespaces
- EKS addons (EBS CSI, VPC CNI, kube-proxy)

### 3. Apply the configuration

```bash
terraform apply
```

Type `yes` when prompted to create the resources.

**Note**: This will take approximately 10-15 minutes to complete as EKS cluster creation is a lengthy process.

### 4. Configure kubectl

After Terraform completes, configure kubectl to access your cluster:

```bash
aws eks update-kubeconfig --region us-east-1 --name airbnb-lab2-cluster
```

### 5. Verify the cluster

```bash
kubectl get nodes
kubectl get namespaces
```

You should see:
- 3 worker nodes in Ready state
- `airbnb-app` namespace
- `airbnb-kafka` namespace

## What Gets Created

### EKS Cluster
- **Name**: airbnb-lab2-cluster
- **Version**: 1.31
- **Node Group**: 3x t3.large instances
- **Networking**: Uses your default VPC and all 6 public subnets

### ECR Repositories
- airbnb-traveler
- airbnb-owner
- airbnb-property
- airbnb-booking
- airbnb-agent
- airbnb-frontend

### Kubernetes Resources
- Namespace: `airbnb-app` (for your microservices)
- Namespace: `airbnb-kafka` (for Kafka deployment)

### Security
- Security groups with open ingress/egress (for lab purposes)
- IAM roles for cluster and node groups
- EBS CSI driver for persistent volumes

## Troubleshooting

### If you need to regenerate network configuration:

```bash
bash aws/scripts/configure-network.sh --region us-east-1
```

### If you switch AWS accounts:

```bash
bash scripts/reset-sandbox.sh --region us-east-1
cd aws
terraform init
source setup-env.sh
terraform plan
```

### To destroy all resources:

```bash
terraform destroy
```

**Warning**: This will delete the EKS cluster and all associated resources.

## Next Steps

After Terraform completes:

1. **Build and push Docker images**:
   ```bash
   bash scripts/build-and-push.sh
   ```

2. **Deploy Kafka**:
   ```bash
   helm install kafka bitnami/kafka -n airbnb-kafka
   ```

3. **Deploy your application**:
   ```bash
   bash scripts/deploy-helm.sh
   ```

4. **Or use the complete quickstart**:
   ```bash
   bash scripts/quickstart.sh
   ```

## Outputs

After `terraform apply`, you can view outputs:

```bash
terraform output
terraform output -json
terraform output ecr_repositories
terraform output configure_kubectl
```

## Cost Considerations

Running this infrastructure will incur AWS costs:
- EKS cluster: ~$0.10/hour
- 3x t3.large nodes: ~$0.28/hour
- EBS volumes: ~$0.10/GB/month
- Data transfer: varies

**Estimated cost**: ~$3-4/day if running 24/7

Remember to run `terraform destroy` when you're done with the lab!

