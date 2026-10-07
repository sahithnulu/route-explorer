terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Second provider for us-east-1: ACM certs for CloudFront must live there
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

module "vpc" {
  source = "./modules/vpc"

  app_name           = var.app_name
  environment        = var.environment
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
}

module "rds" {
  source = "./modules/rds"

  app_name             = var.app_name
  environment          = var.environment
  vpc_id               = module.vpc.vpc_id
  private_subnet_ids   = module.vpc.private_subnet_ids
  db_security_group_id = module.vpc.db_security_group_id
  db_name              = var.db_name
  db_username          = var.db_username
  db_password          = var.db_password
  db_instance_class    = var.db_instance_class
}

module "redis" {
  source = "./modules/redis"

  app_name                = var.app_name
  environment             = var.environment
  vpc_id                  = module.vpc.vpc_id
  private_subnet_ids      = module.vpc.private_subnet_ids
  redis_security_group_id = module.vpc.redis_security_group_id
  redis_node_type         = var.redis_node_type
}

module "ecs" {
  source = "./modules/ecs"

  app_name              = var.app_name
  environment           = var.environment
  aws_region            = var.aws_region
  vpc_id                = module.vpc.vpc_id
  public_subnet_ids     = module.vpc.public_subnet_ids
  private_subnet_ids    = module.vpc.private_subnet_ids
  alb_security_group_id = module.vpc.alb_security_group_id
  ecs_security_group_id = module.vpc.ecs_security_group_id
  database_url          = "postgresql://${var.db_username}:${var.db_password}@${module.rds.db_endpoint}/${var.db_name}?sslmode=no-verify"
  redis_url             = "redis://${module.redis.redis_endpoint}:6379"
  jwt_secret            = var.jwt_secret
  allowed_origin        = "https://${var.domain_name}"
  container_image       = "${module.ecs.ecr_repository_url}:latest"
  task_cpu              = var.task_cpu
  task_memory           = var.task_memory
  desired_count         = var.desired_count
  certificate_arn       = module.dns.backend_certificate_arn
}

module "frontend" {
  source = "./modules/frontend"

  app_name        = var.app_name
  environment     = var.environment
  domain_name     = var.domain_name
  certificate_arn = module.dns.frontend_certificate_arn

  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }
}

module "dns" {
  source = "./modules/dns"

  app_name           = var.app_name
  environment        = var.environment
  domain_name        = var.domain_name
  alb_dns_name       = module.ecs.alb_dns_name
  alb_zone_id        = module.ecs.alb_zone_id
  cloudfront_domain  = module.frontend.cloudfront_domain
  cloudfront_zone_id = module.frontend.cloudfront_zone_id
  aws_region         = var.aws_region

  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }
}