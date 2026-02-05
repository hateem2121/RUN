# Google Cloud API Gateway Configuration
# Provides edge-level traffic management, rate limiting, and API analytics

# API Gateway API Resource
resource "google_api_gateway_api" "run_api" {
  provider = google-beta
  api_id   = "run-apparel-api"
  project  = var.project_id
}

# API Gateway OpenAPI Config
resource "google_api_gateway_api_config" "run_config" {
  provider      = google-beta
  api           = google_api_gateway_api.run_api.api_id
  api_config_id = "run-apparel-config-${formatdate("YYYYMMDD", timestamp())}"
  project       = var.project_id

  openapi_documents {
    document {
      path = "openapi.yaml"
      contents = base64encode(templatefile("${path.module}/openapi-gateway.yaml", {
        backend_url = google_cloud_run_v2_service.app["us-central1"].uri
        project_id  = var.project_id
      }))
    }
  }

  gateway_config {
    backend_config {
      google_service_account = google_service_account.cloud_run.email
    }
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [google_project_service.api_gateway]
}

# API Gateway Instance
resource "google_api_gateway_gateway" "gateway" {
  provider     = google-beta
  gateway_id   = "run-apparel-gateway"
  api_config   = google_api_gateway_api_config.run_config.id
  region       = "us-central1"
  project      = var.project_id
  display_name = "RUN Apparel API Gateway"

  depends_on = [google_api_gateway_api_config.run_config]
}

# Enable API Gateway Service
resource "google_project_service" "api_gateway" {
  service            = "apigateway.googleapis.com"
  project            = var.project_id
  disable_on_destroy = false
}

resource "google_project_service" "service_control" {
  service            = "servicecontrol.googleapis.com"
  project            = var.project_id
  disable_on_destroy = false
}

# API Gateway IAM - Allow public access
resource "google_api_gateway_gateway_iam_member" "public_access" {
  provider = google-beta
  project  = var.project_id
  region   = "us-central1"
  gateway  = google_api_gateway_gateway.gateway.gateway_id
  role     = "roles/apigateway.viewer"
  member   = "allUsers"
}

# Output Gateway URL
output "api_gateway_url" {
  description = "API Gateway URL"
  value       = google_api_gateway_gateway.gateway.default_hostname
}
