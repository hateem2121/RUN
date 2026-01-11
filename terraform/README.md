# Terraform Infrastructure

Multi-region Cloud Run deployment configuration for the RUN Apparel B2B Platform.

## Overview

This Terraform configuration deploys the platform across 3 regions with a global load balancer:
- `us-central1` (Primary)
- `europe-west1` (EU)
- `asia-east1` (APAC)

## Prerequisites

- Terraform >= 1.7.0
- Google Cloud SDK configured
- GCP Project with required APIs enabled

## Quick Start

```bash
# Initialize Terraform
terraform init

# Preview changes
terraform plan -var="project_id=YOUR_PROJECT_ID"

# Apply changes
terraform apply -var="project_id=YOUR_PROJECT_ID"
```

## Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `project_id` | GCP Project ID | Required |
| `regions` | Deployment regions | `["us-central1", "europe-west1", "asia-east1"]` |
| `min_instances` | Min instances per region | `1` |
| `max_instances` | Max instances per region | `10` |
| `image_tag` | Docker image tag | `latest` |

## Outputs

| Output | Description |
|--------|-------------|
| `global_ip` | Global Load Balancer IP |
| `service_urls` | Cloud Run URLs by region |
| `load_balancer_url` | Production URL |

## Architecture

```
                    ┌─────────────────┐
                    │  Global LB      │
                    │  (HTTPS/SSL)    │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  us-central1    │ │  europe-west1   │ │  asia-east1     │
│  Cloud Run      │ │  Cloud Run      │ │  Cloud Run      │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

## Files

| File | Purpose |
|------|---------|
| `main.tf` | Main resources (Cloud Run, LB, SSL) |
| `variables.tf` | Input variables |
| `outputs.tf` | Output values |

## Related Documentation

- [Deployment Guide](../docs/operations/environment.md)
- [SLO Definitions](../docs/operations/slo-definitions.md)
- [Horizontal Scaling](../docs/core/HORIZONTAL_SCALING.md)
