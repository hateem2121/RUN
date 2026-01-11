# Terraform Outputs for RUN Apparel Platform

output "global_ip" {
  description = "Global Load Balancer IP address"
  value       = google_compute_global_address.default.address
}

output "service_urls" {
  description = "Cloud Run service URLs by region"
  value = {
    for region in var.regions :
    region => google_cloud_run_v2_service.app[region].uri
  }
}

output "load_balancer_url" {
  description = "Global Load Balancer URL"
  value       = "https://${var.domain}"
}

output "service_account_email" {
  description = "Cloud Run service account email"
  value       = google_service_account.cloud_run.email
}

output "regions_deployed" {
  description = "List of regions where services are deployed"
  value       = var.regions
}
