# Terraform Variables for RUN Apparel Platform

variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "regions" {
  description = "Regions for multi-region deployment"
  type        = list(string)
  default     = ["us-central1", "europe-west1", "asia-east1"]
}

variable "environment" {
  description = "Environment name (staging, production)"
  type        = string
  default     = "production"
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

variable "domain" {
  description = "Primary domain for the application"
  type        = string
  default     = "runapparel.com"
}

variable "enable_cdn" {
  description = "Enable Cloud CDN for static assets"
  type        = bool
  default     = true
}
