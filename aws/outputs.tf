############################################################
# EKS Cluster Outputs
############################################################

output "cluster_name" {
  description = "EKS cluster name"
  value       = aws_eks_cluster.main.name
}

output "cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = aws_eks_cluster.main.endpoint
}

output "cluster_version" {
  description = "EKS cluster Kubernetes version"
  value       = aws_eks_cluster.main.version
}

output "cluster_arn" {
  description = "EKS cluster ARN"
  value       = aws_eks_cluster.main.arn
}

output "cluster_security_group_id" {
  description = "Security group ID attached to the EKS cluster"
  value       = aws_eks_cluster.main.vpc_config[0].cluster_security_group_id
}

# output "oidc_provider_arn" {
#   description = "ARN of the OIDC Provider for EKS"
#   value       = aws_iam_openid_connect_provider.eks.arn
# }

############################################################
# Node Group Outputs
############################################################

output "node_group_id" {
  description = "EKS node group ID"
  value       = aws_eks_node_group.main.id
}

output "node_group_arn" {
  description = "ARN of the EKS node group"
  value       = aws_eks_node_group.main.arn
}

output "node_group_status" {
  description = "Status of the EKS node group"
  value       = aws_eks_node_group.main.status
}

############################################################
# ECR Outputs
############################################################

output "ecr_repositories" {
  description = "Map of ECR repository URLs"
  value = {
    for name, repo in aws_ecr_repository.services : name => repo.repository_url
  }
}

output "ecr_registry_id" {
  description = "ECR registry ID"
  value       = data.aws_caller_identity.current.account_id
}

output "ecr_registry_url" {
  description = "ECR registry URL"
  value       = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${data.aws_region.current.name}.amazonaws.com"
}

############################################################
# Kubernetes Namespace Outputs
############################################################

output "kubernetes_namespaces" {
  description = "Kubernetes namespaces created for the application"
  value = {
    app   = kubernetes_namespace.airbnb_app.metadata[0].name
    kafka = kubernetes_namespace.kafka.metadata[0].name
  }
}

############################################################
# kubectl Configuration
############################################################

output "configure_kubectl" {
  description = "Command to configure kubectl"
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${aws_eks_cluster.main.name}"
}

############################################################
# Deployment Script Paths
############################################################

output "deployment_scripts" {
  description = "Paths to deployment scripts relative to project root"
  value = {
    build_and_push = "scripts/build-and-push.sh - Build and push Docker images to ECR"
    deploy_helm    = "scripts/deploy-helm.sh - Deploy Helm chart with secrets"
    quickstart     = "scripts/quickstart.sh - Complete end-to-end deployment"
  }
}

output "helm_chart_path" {
  description = "Path to Helm chart"
  value       = "k8s/helm/airbnb"
}

############################################################
# Data Sources for Outputs
############################################################

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
