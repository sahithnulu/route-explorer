output "frontend_certificate_arn" { value = aws_acm_certificate_validation.frontend.certificate_arn }
output "backend_certificate_arn"  { value = aws_acm_certificate_validation.backend.certificate_arn }
output "name_servers"             { value = aws_route53_zone.main.name_servers }
output "hosted_zone_id"           { value = aws_route53_zone.main.zone_id }