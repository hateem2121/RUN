# Deployment Troubleshooting Guide

## 1. Overview

This guide provides solutions for common deployment failures in the **RUN Remix** system, specifically targeting Cloud Build and Cloud Run environments.

## 2. Common Issues & Solutions

### 2.1 Cloud Build Failures

- **Issue**: Build times out during `npm install`.
  - **Solution**: Check network availability or use a warmer cache. Verify `package-lock.json` is healthy.
- **Issue**: `verify:tech-integrity` fails.
  - **Solution**: Run `npm run check:apply` locally to fix linting errors before pushing. Check for circular dependencies using `knip`.
- **Issue**: Secret Manager access denied.
  - **Solution**: Ensure the Cloud Build Service Account has `Secret Manager Secret Accessor` role.

### 2.2 Cloud Run Failures

- **Issue**: `Container failed to start. Failed to listen on PORT 5002`.
  - **Solution**: Verify `PORT` environment variable is correctly set and the server is actually using the `PORT` variable from process.env.
- **Issue**: `Database connection timeout` during startup.
  - **Solution**: Check if the Neon database endpoint is active. Ensure the `-pooler` endpoint is used for production.
- **Issue**: SSL/TLS errors with Redis/Upstash.
  - **Solution**: Verify `UPSTASH_REDIS_REST_URL` uses `https` and the token is valid.

### 2.3 Migration Failures

- **Issue**: Schema synchronization conflicts.
  - **Solution**: Do not use `db:push` in production. Always generate a migration using `drizzle-kit generate` and apply using `db:migrate`.

## 3. Logs and Monitoring

- **GCP Logs**: View detailed logs in Google Cloud Logging using filter `resource.type="cloud_run_revision" AND severity>=DEFAULT`.
- **Sentry**: Check the Sentry dashboard for runtime exceptions and stack traces.
