# Backend Fargate Deployment

This directory contains a Terraform configuration that provisions an AWS Fargate deployment of the backend container image `392455956374.dkr.ecr.us-east-1.amazonaws.com/shra012/airbnb-backend:latest`.

## Prerequisites

- Terraform `>= 1.4.0`
- AWS credentials with permissions to create VPC, IAM, ECS, and ALB resources

## Usage

```bash
cd aws
terraform init
terraform apply
```

Set `vpc_id` and `subnet_ids` to point at your existing networking resources (subnets must belong to the supplied VPC and span at least two Availability Zones for the load balancer).

Common variables can be overridden with a `terraform.tfvars` file or `-var` flags. Example:

```hcl
project_name          = "airbnb"
environment           = "prod"
vpc_id                = "vpc-0123456789abcdef0"
subnet_ids            = ["subnet-aaa", "subnet-bbb"]
# Optional if different from service subnets:
alb_subnet_ids        = ["subnet-ccc", "subnet-ddd"]
desired_count         = 2
enable_execute_command = true
container_env = {
  DATABASE_URL = "postgres://..."
}
```

After `terraform apply` completes, the output `load_balancer_dns_name` exposes the public endpoint for the backend service.
