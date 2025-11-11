output "cluster_name" {
  description = "Name of the ECS cluster."
  value       = aws_ecs_cluster.this.name
}

output "service_name" {
  description = "Name of the ECS service."
  value       = aws_ecs_service.this.name
}

output "load_balancer_dns_name" {
  description = "DNS name to reach the backend service."
  value       = aws_lb.this.dns_name
}
