# Database Read Replica Configuration

This document describes how to configure Neon PostgreSQL read replicas for global distribution.

## Overview

To reduce latency for global users, we deploy read replicas in multiple regions:

- **Primary**: us-east-1 (writes + reads)
- **Replica 1**: eu-west-1 (reads only)
- **Replica 2**: ap-southeast-1 (reads only)

## Neon Configuration

### 1. Create Read Replicas

In the Neon Console:

1. Navigate to your project
2. Go to **Branches** → **Create Branch**
3. Select **Read Replica** type
4. Choose region (e.g., `eu-west-1`)
5. Copy the connection string

### 2. Environment Variables

Add replica connection strings to your environment:

```bash
# Primary (read-write)
DATABASE_URL=postgresql://user:pass@ep-xxx-pooler.us-east-1.aws.neon.tech/neondb

# Read replicas
DATABASE_READ_URL_EU=postgresql://user:pass@ep-xxx-pooler.eu-west-1.aws.neon.tech/neondb
DATABASE_READ_URL_ASIA=postgresql://user:pass@ep-xxx-pooler.ap-southeast-1.aws.neon.tech/neondb
```

### 3. Secret Manager Configuration

Store replica URLs in GCP Secret Manager:

```bash
gcloud secrets create database-read-url-eu \
  --data-file=- <<< "$DATABASE_READ_URL_EU"

gcloud secrets create database-read-url-asia \
  --data-file=- <<< "$DATABASE_READ_URL_ASIA"
```

## Application Changes

### Read/Write Routing

Update `server/lib/db/connection.ts`:

```typescript
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

// Write connection (always primary)
const writeDb = neon(process.env.DATABASE_URL);

// Read connection (region-specific)
const getReadUrl = () => {
  const region = process.env.REGION || "us";
  switch (region) {
    case "eu":
      return process.env.DATABASE_READ_URL_EU || process.env.DATABASE_URL;
    case "asia":
      return process.env.DATABASE_READ_URL_ASIA || process.env.DATABASE_URL;
    default:
      return process.env.DATABASE_URL;
  }
};

const readDb = neon(getReadUrl());

export const db = drizzle(writeDb, { schema });
export const readOnlyDb = drizzle(readDb, { schema });
```

### Usage in Services

```typescript
import { db, readOnlyDb } from "../lib/db/connection.js";

// Writes go to primary
await db.insert(products).values(newProduct);

// Reads can go to replica
const products = await readOnlyDb.select().from(products);
```

## Terraform Configuration

Add to `terraform/main.tf`:

```hcl
resource "google_cloud_run_v2_service" "app" {
  template {
    containers {
      env {
        name = "DATABASE_READ_URL"
        value_source {
          secret_key_ref {
            secret  = "database-read-url-${each.value}"
            version = "latest"
          }
        }
      }
    }
  }
}
```

## Verification

Test read replica routing:

```bash
# Check which database is being used
curl https://eu.runapparel.com/api/debug/db-info
# Should return: { "region": "eu", "type": "read-replica" }
```

## Monitoring

Monitor replica lag in Neon Console:

- **Replica Lag**: Should be < 100ms under normal conditions
- **Connections**: Monitor connection count per replica
- **Query Distribution**: Verify reads are balanced

## Rollback

If replicas cause issues:

1. Set `DATABASE_READ_URL` to primary URL
2. Redeploy affected regions
3. Investigate replica health in Neon Console
