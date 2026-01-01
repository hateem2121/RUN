# Secret Rotation Strategy

## Overview

Regular rotation of secrets is a critical security practice to minimize the impact of compromised credentials. This document outlines the procedures for rotating keys and tokens used in the RUN Apparel system.

## Schedule

| Secret Type    | Frequency | Automatic? | Procedure               |
| -------------- | --------- | ---------- | ----------------------- |
| Database Creds | 90 Days   | No         | Manual via Neon Console |
| JWT Secrets    | 180 Days  | No         | Env Config Update       |
| Service Accts  | 90 Days   | Yes        | GCP IAM Policy          |

## Rotation Procedures

### 1. Database Credentials (Neon)

1.  **Create New Role**: Login to Neon Console and create a new role/user `run_app_v2`.
2.  **Update Staging**: Update `DATABASE_URL` in Staging environment. Verify connectivity.
3.  **Update Production**: Update `DATABASE_URL` in Production environment.
4.  **Redeploy**: Trigger a deployment to pick up new env vars.
5.  **Revoke Old**: Verify all connections are using new user, then delete old role.

### 2. JWT Secrets (`SESSION_SECRET`)

To support rotation without logging out all users, the application should support multiple secrets (current and previous).

1.  **Generate**: `openssl rand -hex 32`
2.  **Config**: Append new secret to comma-separated list in `SESSION_SECRET` (if supported) or replace.
    - _Note: Current implementation supports single secret. Rotation causes logout._
3.  **Deploy**: Update env var and redeploy.

### 3. Google Service Accounts

1.  **GCP Console**: IAM & Admin > Service Accounts.
2.  **Create Key**: Add new JSON key.
3.  **Update Secrets**: Update `GOOGLE_APPLICATION_CREDENTIALS` content in GitHub Secrets / Cloud Run.
4.  **Verify**: Check GCS uploads / Cloud Build.
5.  **Disable Old**: Disable the old key (don't delete immediately).
6.  **Delete**: After 24h, delete the old key.

## Emergency Rotation

In case of leaked credentials:

1.  **Revoke Immediately**: Delete/Disable the compromised key.
2.  **Update Env**: Push new credentials immediately.
3.  **Redeploy**: Force new deployment.
4.  **Audit**: Check logs for unauthorized access during the exposure window.
