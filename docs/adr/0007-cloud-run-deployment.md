# ADR 0007: Cloud Run over GKE/ECS

**Status**: Accepted  
**Date**: 2026-01-13  
**Deciders**: Platform Team

## Context

We needed a container hosting platform that:

- Auto-scales based on traffic
- Minimizes operational overhead
- Supports multi-region deployment
- Provides cost-effective scaling to zero

## Decision

We chose **Google Cloud Run** over GKE or AWS ECS.

## Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| **Cloud Run** | Serverless, auto-scale, simple | Less control |
| **GKE** | Full Kubernetes | High operational overhead |
| **AWS ECS** | AWS native | More configuration needed |
| **Fly.io** | Edge deployment | Smaller platform |

## Rationale

1. **Fully Managed**: No cluster management, automatic patching
2. **Scale to Zero**: Cost-effective for variable traffic
3. **Multi-Region**: Easy deployment across US, EU, Asia
4. **Container Native**: Standard Docker images work directly
5. **Global Load Balancer**: Built-in HTTPS and CDN integration

## Consequences

### Positive

- Minimal operational overhead
- Auto-scaling from 1-10 instances per region
- Canary deployments via traffic splitting
- Native GCP integration (Secret Manager, Cloud Build)

### Negative

- Less control than Kubernetes
- Cold starts can add latency
- Vendor lock-in to GCP (mitigated by standard containers)
