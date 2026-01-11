# Terraform Configuration for RUN Apparel Platform
# Multi-Region Cloud Run Deployment

terraform {
  required_version = ">= 1.7.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.0"
    }
  }

  backend "gcs" {
    bucket = "run-apparel-terraform-state"
    prefix = "terraform/state"
  }
}

# Variables
variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "regions" {
  description = "Regions for multi-region deployment"
  type        = list(string)
  default     = ["us-central1", "europe-west1", "asia-east1"]
}

variable "image_tag" {
  description = "Docker image tag to deploy"
  type        = string
  default     = "latest"
}

variable "min_instances" {
  description = "Minimum number of instances per region"
  type        = number
  default     = 1
}

variable "max_instances" {
  description = "Maximum number of instances per region"
  type        = number
  default     = 10
}

# Provider configuration
provider "google" {
  project = var.project_id
}

provider "google-beta" {
  project = var.project_id
}

# Enable required APIs
resource "google_project_service" "services" {
  for_each = toset([
    "run.googleapis.com",
    "secretmanager.googleapis.com",
    "compute.googleapis.com",
    "cloudresourcemanager.googleapis.com",
  ])
  service            = each.key
  disable_on_destroy = false
}

# Service Account for Cloud Run
resource "google_service_account" "cloud_run" {
  account_id   = "run-remix-cloud-run"
  display_name = "RUN Remix Cloud Run Service Account"
}

# Grant Secret Manager access
resource "google_project_iam_member" "secret_accessor" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.cloud_run.email}"
}

# Cloud Run service in each region
resource "google_cloud_run_v2_service" "app" {
  for_each = toset(var.regions)

  name     = "run-remix-${each.value}"
  location = each.value

  template {
    service_account = google_service_account.cloud_run.email

    scaling {
      min_instance_count = var.min_instances
      max_instance_count = var.max_instances
    }

    containers {
      image = "gcr.io/${var.project_id}/run-remix:${var.image_tag}"

      ports {
        container_port = 5001
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "1Gi"
        }
      }

      env {
        name  = "NODE_ENV"
        value = "production"
      }

      env {
        name  = "REGION"
        value = each.value
      }

      # Database URL from Secret Manager
      env {
        name = "DATABASE_URL"
        value_source {
          secret_key_ref {
            secret  = "database-url"
            version = "latest"
          }
        }
      }

      # Session Secret from Secret Manager
      env {
        name = "SESSION_SECRET"
        value_source {
          secret_key_ref {
            secret  = "session-secret"
            version = "latest"
          }
        }
      }

      startup_probe {
        http_get {
          path = "/api/health"
          port = 5001
        }
        initial_delay_seconds = 5
        period_seconds        = 10
        failure_threshold     = 3
      }

      liveness_probe {
        http_get {
          path = "/api/health"
          port = 5001
        }
        period_seconds    = 30
        failure_threshold = 3
      }
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  depends_on = [google_project_service.services["run.googleapis.com"]]
}

# Allow unauthenticated access
resource "google_cloud_run_v2_service_iam_member" "public" {
  for_each = toset(var.regions)

  project  = var.project_id
  location = each.value
  name     = google_cloud_run_v2_service.app[each.value].name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Global Load Balancer
resource "google_compute_global_address" "default" {
  name = "run-remix-global-ip"
}

# Serverless Network Endpoint Groups for each region
resource "google_compute_region_network_endpoint_group" "neg" {
  for_each = toset(var.regions)

  name                  = "run-remix-neg-${each.value}"
  network_endpoint_type = "SERVERLESS"
  region                = each.value

  cloud_run {
    service = google_cloud_run_v2_service.app[each.value].name
  }
}

# Backend Service
resource "google_compute_backend_service" "default" {
  name                  = "run-remix-backend"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  protocol              = "HTTPS"
  enable_cdn            = true

  cdn_policy {
    cache_mode = "CACHE_ALL_STATIC"
    default_ttl = 3600
    max_ttl     = 86400
  }

  dynamic "backend" {
    for_each = toset(var.regions)
    content {
      group = google_compute_region_network_endpoint_group.neg[backend.value].id
    }
  }
}

# URL Map
resource "google_compute_url_map" "default" {
  name            = "run-remix-url-map"
  default_service = google_compute_backend_service.default.id
}

# Managed SSL Certificate
resource "google_compute_managed_ssl_certificate" "default" {
  name = "run-remix-ssl-cert"

  managed {
    domains = ["runapparel.com", "www.runapparel.com"]
  }
}

# HTTPS Proxy
resource "google_compute_target_https_proxy" "default" {
  name             = "run-remix-https-proxy"
  url_map          = google_compute_url_map.default.id
  ssl_certificates = [google_compute_managed_ssl_certificate.default.id]
}

# Global Forwarding Rule
resource "google_compute_global_forwarding_rule" "default" {
  name                  = "run-remix-forwarding-rule"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  target                = google_compute_target_https_proxy.default.id
  ip_address            = google_compute_global_address.default.address
  port_range            = "443"
}

# HTTP to HTTPS redirect
resource "google_compute_url_map" "http_redirect" {
  name = "run-remix-http-redirect"

  default_url_redirect {
    https_redirect = true
    strip_query    = false
  }
}

resource "google_compute_target_http_proxy" "http_redirect" {
  name    = "run-remix-http-proxy"
  url_map = google_compute_url_map.http_redirect.id
}

resource "google_compute_global_forwarding_rule" "http_redirect" {
  name                  = "run-remix-http-forwarding-rule"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  target                = google_compute_target_http_proxy.http_redirect.id
  ip_address            = google_compute_global_address.default.address
  port_range            = "80"
}

# Outputs
output "global_ip" {
  description = "Global Load Balancer IP"
  value       = google_compute_global_address.default.address
}

output "service_urls" {
  description = "Cloud Run service URLs by region"
  value = {
    for region in var.regions :
    region => google_cloud_run_v2_service.app[region].uri
  }
}
