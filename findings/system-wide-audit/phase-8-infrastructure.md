# System-Wide Audit: Phase 8 - Infrastructure

## INFRA-01: K8s image tags
- **Severity**: P0 (Critical)
- **File Path**: `k8s/argocd/base/deployment.yaml`, `ops/docker-compose.observability.yml`
- **Grep Evidence**: `image: gcr.io/PROJECT_ID/run-remix:latest`
- **Description**: The ArgoCD base deployment manifest uses the `latest` tag for the core application container. This bypasses immutability, compromises rollback capability, and makes deployment states non-deterministic.

## INFRA-02: Cloud Build steps
- **Severity**: P0 (Critical)
- **File Path**: `cloudbuild-staging.yaml`, `cloudbuild-multiregion.yaml`
- **Grep Evidence**: Missing `verify:tech-integrity`
- **Description**: While the primary `cloudbuild.yaml` properly executes the `verify:tech-integrity` script, the staging and multi-region pipelines completely bypass this step. Code can hit staging or multiregion deployments without linting, type-checking, or auditing being enforced.

## INFRA-03: ArgoCD manifests
- **Severity**: P1 (Major)
- **File Path**: `k8s/argocd/application.yaml`
- **Grep Evidence**: `targetRevision: HEAD`
- **Description**: The ArgoCD target revision is floating on `HEAD` instead of pinning a specific branch or commit hash. This makes cluster state extremely fragile to unverified or unintentional commits landing on the HEAD branch.

## INFRA-04: Env schema validation
- **Severity**: P1 (Major)
- **File Path**: `client/app/routes/products.tsx`, `client/app/services/inquiry.server.ts`
- **Grep Evidence**: `const port = process.env.PORT || "5002";`
- **Description**: Critical server constants are falling back to manual assignment via `process.env` directly in the route handlers and services, completely bypassing the `env.schema.ts` strict validation layer which should be the only source of truth.
