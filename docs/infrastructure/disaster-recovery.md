# Disaster Recovery & Business Continuity 🆘

**Last Updated:** May 2026  
**Status:** Defined  
**RTO (Recovery Time Objective):** < 1 Hour  
**RPO (Recovery Point Objective):** < 1 Minute (Neon PITR)

This document outlines the procedures for recovering the RUN Remix platform from catastrophic failures.

## 1. Data Recovery (Neon Postgres)

We rely on **Neon Serverless PostgreSQL** for primary data storage.

-   **Point-in-Time Recovery (PITR)**: Neon automatically supports PITR. We can restore the database to any state within the last 30 days.
-   **Procedure**:
    1.  Access Neon Console.
    2.  Select the Branch/Database.
    3.  Select "Restore to Point in Time".
    4.  Create a new branch from the selected timestamp.
    5.  Update the `DATABASE_URL` in Google Cloud Run to point to the new branch.

## 2. Session & Cache Recovery (Upstash Redis)

-   **Persistence**: Upstash Redis persists data to disk.
-   **Failure Scenario**: If Redis fails, the application will degrade gracefully. Sessions are isolated directly to Neon PostgreSQL via DrizzleSessionStore, so sessions will not be lost. The cache will bypass.
-   **Recovery**: Once Upstash is restored, the `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` will be automatically used again.

## 3. Media Assets (Google Cloud Storage)

-   **Redundancy**: Assets are stored in GCS with multi-region replication (Standard).
-   **Versioning**: GCS Object Versioning is enabled to recover from accidental deletions.
-   **Procedure**: Use `gsutil versioning set on gs://[BUCKET_NAME]` to verify. Use `gsutil ls -a` to find deleted versions.

## 4. Infrastructure Recovery (Google Cloud Run)

-   **IaC**: The environment is defined via GitHub Actions and Cloud Build.
-   **Re-deployment**:
    1.  Trigger a new build in GitHub Actions for the `main` branch.
    2.  Cloud Build will build the Docker image and push it to Artifact Registry.
    3.  Cloud Run will deploy the new revision.

## 5. Emergency Contacts

| Role | Name | Contact |
| :--- | :--- | :--- |
| **Technical Lead** | M. Hateem Jamshaid | [Contact Info Redacted] |
| **Cloud Provider** | Google Cloud Support | [Enterprise Support Dashboard] |
| **Database** | Neon Support | [Support Ticket System] |
