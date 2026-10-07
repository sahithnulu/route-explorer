resource "aws_db_subnet_group" "main" {
  name       = "${var.app_name}-${var.environment}-db-subnet-group"
  subnet_ids = var.private_subnet_ids

  tags = { Name = "${var.app_name}-${var.environment}-db-subnet-group" }
}

resource "aws_db_parameter_group" "postgis" {
  name   = "${var.app_name}-${var.environment}-postgis16"
  family = "postgres16"

  tags = { Name = "${var.app_name}-${var.environment}-postgis16" }
}

resource "aws_db_instance" "main" {
  identifier        = "${var.app_name}-${var.environment}-db"
  engine            = "postgres"
  engine_version    = "16.3"
  instance_class    = var.db_instance_class
  allocated_storage = 20
  storage_type      = "gp3"
  storage_encrypted = true

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [var.db_security_group_id]
  parameter_group_name   = aws_db_parameter_group.postgis.name

  backup_retention_period   = 0
  skip_final_snapshot       = false
  final_snapshot_identifier = "${var.app_name}-${var.environment}-final-snapshot"
  deletion_protection       = true

  tags = { Name = "${var.app_name}-${var.environment}-db" }
}