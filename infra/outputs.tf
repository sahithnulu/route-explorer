output "ecr_repository_url" {
  description = "ECR URL to push backend Docker images to"
  value       = module.ecs.ecr_repository_url
}

output "frontend_url" {
  description = "Custom domain URL for the frontend"
  value       = "https://${var.domain_name}"
}

output "backend_url" {
  description = "Custom domain URL for the backend API"
  value       = "https://api.${var.domain_name}"
}

output "alb_dns_name" {
  description = "ALB DNS name"
  value       = module.ecs.alb_dns_name
}

output "rds_endpoint" {
  description = "RDS endpoint (private)"
  value       = module.rds.db_endpoint
  sensitive   = true
}

output "s3_bucket_name" {
  description = "S3 bucket holding the frontend build"
  value       = module.frontend.s3_bucket_name
}

output "cloudfront_id" {
  description = "CloudFront distribution ID (needed for cache invalidation)"
  value       = module.frontend.cloudfront_id
}

output "name_servers" {
  description = "Route 53 name servers: update these at your registrar"
  value       = module.dns.name_servers
}