variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "app_name" {
  type    = string
  default = "route-explorer"
}

variable "environment" {
  type    = string
  default = "prod"
}

variable "domain_name" {
  type = string
}

variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "availability_zones" {
  type    = list(string)
  default = ["us-east-1a", "us-east-1b"]
}

variable "db_name" {
  type    = string
  default = "routeexplorer"
}

variable "db_username" {
  type    = string
  default = "routeexplorer"
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "db_instance_class" {
  type    = string
  default = "db.t3.micro"
}

variable "redis_node_type" {
  type    = string
  default = "cache.t3.micro"
}

variable "task_cpu" {
  type    = number
  default = 256
}

variable "task_memory" {
  type    = number
  default = 512
}

variable "desired_count" {
  type    = number
  default = 1
}

variable "jwt_secret" {
  type      = string
  sensitive = true
}