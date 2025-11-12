variable "project_name" {
  description = "Project prefix used for tagging/naming."
  type        = string
  default     = "airbnb"
}

variable "environment" {
  description = "Deployment environment name (e.g., dev, prod)."
  type        = string
  default     = "lab2"
}

variable "aws_region" {
  description = "AWS region to deploy resources."
  type        = string
  default     = "us-east-1"
}

variable "vpc_id" {
  description = "Existing VPC ID to reuse."
  type        = string
  default     = "vpc-0c8157c0c192da586"
}

variable "public_subnet_ids" {
  description = "Public subnets for EKS nodes and ALB."
  type        = list(string)
  default = [
    "subnet-09ea37eec7b2acfbb",
    "subnet-04d5d1b950dbf81c8",
    "subnet-0f30faff07758042c",
    "subnet-02dda1df5a27e8cc5"
  ]
}

variable "node_instance_type" {
  description = "Instance type for EKS managed node group."
  type        = string
  default     = "t3.large"
}

variable "node_desired_capacity" {
  description = "Desired node count."
  type        = number
  default     = 3
}

variable "cluster_name" {
  description = "EKS cluster name to use."
  type        = string
  default     = "airbnb-lab2-cluster"
}

variable "mongo_session_uri" {
  description = "MongoDB Atlas connection string for session/notification storage."
  type        = string
  sensitive   = true
}

variable "supabase_postgres_url" {
  description = "Supabase/Postgres connection string."
  type        = string
  sensitive   = true
}

variable "session_secret" {
  description = "Session secret shared with backend."
  type        = string
  sensitive   = true
}

variable "kafka_storage_size" {
  description = "Persistent volume size for Kafka brokers (GiB)."
  type        = number
  default     = 20
}

variable "kafka_replica_count" {
  description = "Kafka broker replica count."
  type        = number
  default     = 3
}

variable "tags" {
  description = "Additional tags."
  type        = map(string)
  default     = {}
}
