# Environment Setup Guide

## Database Configuration

### NEON PostgreSQL Connection Pooling

The application uses NEON PostgreSQL with HTTP-based serverless connections for optimal performance and reliability. Proper configuration is **critical** for production deployments.

#### Required DATABASE_URL Format

**✅ Correct (with pooler):**

```bash
postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech:5432/dbname
```

**❌ Incorrect (without pooler):**

```bash
postgresql://user:password@ep-xxx.region.aws.neon.tech:5432/dbname
```

#### Why the `-pooler` Suffix is Required

1. **Connection Pooling**: NEON uses PgBouncer for connection pooling. The `-pooler` suffix routes connections through the pooler instead of directly to the database.
2. **Serverless Compatibility**: Without pooling, serverless environments can quickly exhaust connection limits.

#### Validation

The application automatically validates your DATABASE_URL on startup.

---

## Cache Configuration

The application uses a 2-tier caching strategy:

### L1: Memory Cache (LRU)

All server instances maintain a local LRU cache for high-frequency objects.

### L2: Upstash Redis (Optional but Recommended)

Global cache layer for cross-instance data consistency and shared state.

**Required Environment Variables:**

- `UPSTASH_REDIS_REST_URL`: The REST URL of your Upstash Redis database.
- `UPSTASH_REDIS_REST_TOKEN`: The REST Token of your Upstash Redis database.

---

## Auth Configuration

The application uses Google OAuth 2.0 with a centralized `AuthService`.

**Required Environment Variables:**

- `GOOGLE_CLIENT_ID`: Google Cloud Console OAuth Client ID
- `GOOGLE_CLIENT_SECRET`: Google Cloud Console OAuth Client Secret
- `SESSION_SECRET`: Random string for signing sessions
- `INITIAL_ADMIN_EMAIL`: The email that will be automatically granted admin privileges on first login.

**Session Management**:
Sessions are stored in PostgreSQL using `connect-pg-simple`.

---

## Rate Limiting

Rate limits are configured in `server/middleware/rateLimiter.ts` with the following defaults:

- **API**: 1000 requests per 15 minutes
- **Auth**: 5 attempts per 15 minutes
- **Uploads**: 10 uploads per hour

These limits are enforced per-IP using memory storage (dev) or Redis (prod) if configured.

---

## Environment Variables Reference

See `.env.example` in the project root for a complete list of supported variables.

```bash
# Core
PORT=5001
NODE_ENV=development
DATABASE_URL=postgresql://...

# Security
STRICT_ALLOWED_ORIGINS=https://app.run-apparel.com,https://staging.run-apparel.com
SESSION_SECRET=...
INITIAL_ADMIN_EMAIL=...

# Cache (Optional)
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```
