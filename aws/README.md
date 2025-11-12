# Lab 2 AWS Infrastructure

Terraform in this directory provisions the cloud footprint required for the Lab 2 assignment:

- **Amazon EKS** cluster + managed node group (`t3.large`, desired=3) inside the default `us-east-1` VPC (`vpc-0c8157c0c192da586`) and its public subnets.
- **ECR repositories** for each service (traveler, owner, property, booking, agent, frontend).
- **AWS Load Balancer Controller** for HTTP ingress (HTTPS can be added later with ACM).
- **Bitnami Kafka** Helm release (gp3-backed storage), running directly inside the EKS cluster.
- **Kubernetes namespaces/secrets** for Mongo Atlas sessions, Supabase Postgres, and the session secret shared with the backend.

## Prerequisites

- Terraform `>= 1.6.0`
- AWS credentials with permissions for EKS, EC2, IAM, ECR, and ALB
- (Optional) `kubectl` and `helm` installed locally for post-provisioning tasks
- An existing EKS cluster (create via console Quick Config / Auto Mode). Update `cluster_name` in `aws/variables.tf` if you pick a different name.

## Secrets Helper

Copy and source the helper so Terraform picks up the sensitive values from `../backend/.env` (or override `ENV_FILE` if needed):

```bash
cp aws/environment.example.sh aws/environment.sh
source aws/environment.sh
```

This exports the three Terraform variables required at plan/apply time:

- `TF_VAR_mongo_session_uri`
- `TF_VAR_supabase_postgres_url`
- `TF_VAR_session_secret`

## Deploy

Recommended workflow when switching sandbox accounts:

```bash
# regenerate network variables and clear previous TF state
bash scripts/reset-sandbox.sh --region us-east-1

# re-export secrets
source aws/environment.sh
```

```bash
cd aws
terraform init
terraform plan
terraform apply
```

After `apply` completes:

1. Save the generated kubeconfig snippet: `terraform output kubeconfig > kubeconfig-airbnb`.
2. Push Docker images to the printed ECR repositories (`terraform output ecr_repositories`).
3. Apply your Kubernetes manifests/Helm charts for traveler/owner/property/booking/agent/frontend, referencing the secrets and the in-cluster Kafka service (e.g., `kafka.airbnb-kafka.svc:9092`).

### Additional Notes

- **Networking**: Security groups are intentionally open (0.0.0.0/0 ingress/egress) per the simplified lab requirements so Atlas/Supabase are reachable. Lock them down for production.
- **Switching AWS accounts**: Use `bash scripts/reset-sandbox.sh --region <aws-region>` to regenerate VPC/subnet settings and delete previous `.terraform`/state files before running `terraform init` again.
- **Existing cluster**: If you spin up a different console-managed EKS cluster, update `cluster_name` in `aws/variables.tf` or pass `-var="cluster_name=..."` so Terraform targets that cluster for ALB controller/Kafka/secret installation.
- **Kafka**: Bitnami Kafka is the low-cost default. You can swap to Strimzi or Amazon MSK later if you need managed brokers or replication guarantees.
- **Mongo/Supabase**: Since Atlas and Supabase remain external, keep their allowlists permissive until you’re ready to tighten CIDRs.
- **Evidence**: Remember to capture AWS console screenshots (EKS, Kafka, services), Kafka flow diagrams, Redux DevTools captures, and upcoming JMeter results for the Lab 2 report.
