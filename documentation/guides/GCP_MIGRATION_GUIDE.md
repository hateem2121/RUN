# GCP Migration Guide for RUN-Remix

This guide outlines the steps to migrate your Replit-hosted application to Google Cloud Platform (GCP) using Cloud Run, while keeping your NEON database.

## 1. Architecture Overview

- **Compute**: Google Cloud Run (Serverless, scales to zero, cost-effective).
- **Database**: NEON (PostgreSQL) - *Retained as requested*.
- **Storage**: Google Cloud Storage (GCS) - *Already integrated in code*.
- **Authentication**: Google OAuth 2.0 - *Already configured*.

## 2. Prerequisites

1. **Google Cloud Project**: Create a new project in the [Google Cloud Console](https://console.cloud.google.com/).
2. **Billing**: Enable billing for the project.
3. **APIs**: Enable the following APIs:
    - Cloud Run Admin API
    - Cloud Build API
    - Google Container Registry API (or Artifact Registry)
    - Google Cloud Storage JSON API

## 3. Configuration

### Environment Variables

You will need to set the following environment variables in your Cloud Run service:

| Variable | Description | Example |
| :--- | :--- | :--- |
| `NODE_ENV` | Environment mode | `production` |
| `DATABASE_URL` | Connection string for NEON | `postgresql://user:pass@host/db?sslmode=require` |
| `GCS_BUCKET_NAME` | Name of your GCS bucket | `my-app-storage` |
| `GOOGLE_CLIENT_ID` | OAuth Client ID | `...` |
| `GOOGLE_CLIENT_SECRET` | OAuth Client Secret | `...` |
| `SESSION_SECRET` | Secret for session cookies | `long-random-string` |
| `INITIAL_ADMIN_EMAIL` | Email to promote to admin | `you@example.com` |
| `CORS_ALLOWED_ORIGINS` | Allowed origins for CORS | `https://your-cloud-run-url.a.run.app` |

### Google Cloud Storage

1. Create a bucket in GCS (e.g., `run-remix-assets`).
2. Ensure the service account used by Cloud Run has `Storage Object Admin` role on this bucket.

## 4. Deployment Steps

### Option A: Using Google Cloud Build (Automated)

I have created a `cloudbuild.yaml` file. You can trigger a build using the gcloud CLI:

```bash
# Replace with your project ID
gcloud builds submit --config cloudbuild.yaml --project YOUR_PROJECT_ID
```

### Option B: Manual Deployment

1. **Build the Docker image**:

    ```bash
    docker build -t gcr.io/YOUR_PROJECT_ID/run-remix .
    ```

2. **Push to Container Registry**:

    ```bash
    docker push gcr.io/YOUR_PROJECT_ID/run-remix
    ```

3. **Deploy to Cloud Run**:

    ```bash
    gcloud run deploy run-remix \
      --image gcr.io/YOUR_PROJECT_ID/run-remix \
      --platform managed \
      --region us-central1 \
      --allow-unauthenticated \
      --set-env-vars NODE_ENV=production,DATABASE_URL=...,GCS_BUCKET_NAME=...
    ```

## 5. Cost Optimization Analysis

- **Cloud Run**: You only pay when your code is running (handling requests). It scales to zero when unused.
- **NEON**: You are already using this. It is serverless and cost-effective.
- **GCS**: Low cost for storage. The application uses signed URLs to serve content directly to users, reducing load on your server (saving compute costs).
- **Caching**: The application currently uses an in-memory cache (`UnifiedReplitCache`). This is free (uses container memory) but clears on restart. For a low-traffic site, this is the most cost-effective option. If you need persistence across restarts, you can add Cloud Memorystore (Redis), but that adds cost (~$30/mo min).

## 6. Codebase Changes Made

- **Dockerfile**: Created a multi-stage Dockerfile for optimized production builds.
- **.dockerignore**: Added to exclude unnecessary files from the build.
- **cloudbuild.yaml**: Added for CI/CD pipeline support.

## 7. Next Steps

1. **Database**: Ensure your NEON database allows connections from anywhere (0.0.0.0/0) or configure it to allow Google Cloud IPs.
2. **OAuth**: Update your Google OAuth Consent Screen and Credentials to add your new Cloud Run URL to the "Authorized Redirect URIs" (e.g., `https://your-app-url.a.run.app/api/callback`).
3. **Testing**: After deployment, verify that file uploads work (they should go to GCS) and that the site loads correctly.
