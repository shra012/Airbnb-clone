variable "aws_region" {
  description = "AWS region to deploy into."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project identifier used in resource names."
  type        = string
  default     = "airbnb"
}

variable "environment" {
  description = "Environment name, e.g., dev, staging, prod."
  type        = string
  default     = "backend"
}

variable "vpc_id" {
  description = "ID of the existing VPC where resources will be created."
  type        = string
}

variable "subnet_ids" {
  description = "Subnet IDs for running the ECS service (must belong to the provided VPC)."
  type        = list(string)
}

variable "alb_subnet_ids" {
  description = "Subnet IDs for the Application Load Balancer (defaults to subnet_ids when empty)."
  type        = list(string)
  default     = []
}

variable "image_url" {
  description = "Full ECR image URI for the backend container."
  type        = string
  default     = "392455956374.dkr.ecr.us-east-1.amazonaws.com/shra012/airbnb-backend:latest"
}

variable "container_port" {
  description = "Port the backend container listens on."
  type        = number
  default     = 4000
}

variable "desired_count" {
  description = "Number of Fargate tasks to run."
  type        = number
  default     = 1
}

variable "task_cpu" {
  description = "Fargate task CPU units."
  type        = number
  default     = 512
}

variable "task_memory" {
  description = "Fargate task memory in MiB."
  type        = number
  default     = 1024
}

variable "health_check_path" {
  description = "HTTP path used by the target group health check."
  type        = string
  default     = "/health"
}

variable "container_env" {
  description = "Additional environment variables for the backend container."
  type        = map(string)
  default     = {}
}

variable "log_retention_in_days" {
  description = "Retention period for application logs."
  type        = number
  default     = 30
}

variable "enable_execute_command" {
  description = "Enable ECS Exec for troubleshooting."
  type        = bool
  default     = false
}
