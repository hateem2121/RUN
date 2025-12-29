# Environment Setup Guide

## Database Configuration

### NEON PostgreSQL Connection Pooling

The application uses NEON PostgreSQL with HTTP-based serverless connections for optimal performance and reliability. Proper configuration is **critical** for production deployments.

#### Required DATABASE_URL Format

**✅ Correct (with pooler):**

```
postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech:5432/dbname
```

**❌ Incorrect (without pooler):**

```
postgresql://user:password@ep-xxx.region.aws.neon.tech:5432/dbname
```

#### Why the `-pooler` Suffix is Required

1. **Connection Pooling**: NEON uses PgBouncer for connection pooling. The `-pooler` suffix routes connections through the pooler instead of directly to the database.

2. **Serverless Compatibility**: Without pooling, serverless environments can quickly exhaust connection limits, causing:
   - Connection timeout errors
   - Database unavailability
   - Poor performance under load
   - Connection leaks

3. **Auto-Scaling**: The pooler manages connections efficiently across multiple serverless instances.

4. **Performance**: Pooled connections have lower latency and better resource utilization.

#### How to Obtain the Pooled Connection String

1. Log into your NEON dashboard
2. Navigate to your project
3. Go to the "Connection Details" section
4. **Select "Pooled connection"** (not "Direct connection")
5. Copy the connection string - it will include `-pooler` in the hostname
6. Set this as your `DATABASE_URL` environment variable

#### Validation

The application automatically validates your DATABASE_URL on startup. You'll see one of these messages:

**✅ Success:**

```
[Database] ✅ DATABASE_URL validation passed
```

**⚠️ Warning (missing pooler):**

```
[Database] ⚠️ NEON pooling not detected - DATABASE_URL should include "-pooler" suffix
for optimal serverless performance. Without pooling, the database may experience
connection exhaustion in high-traffic scenarios.
Example: postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/dbname
```

**❌ Error (invalid URL):**

```
❌ Invalid DATABASE_URL protocol: "mysql"
DATABASE_URL must start with "postgresql://" or "postgres://"
```

#### Migration from Direct Connection

If you're currently using a direct connection:

1. **No data migration needed** - same database, different connection method
2. Update `DATABASE_URL` with the pooled connection string
3. Restart your application
4. Verify in logs that the pooler warning is gone

#### Technical Details

- **Driver**: `@neondatabase/serverless` with HTTP protocol
- **ORM**: Drizzle ORM with `drizzle-orm/neon-http`
- **Pooling**: NEON-managed PgBouncer (transparent to application)
- **Connection Type**: Stateless HTTP (no TCP pooling needed in application)

#### References

- [NEON Connection Pooling Documentation](https://neon.tech/docs/connect/connection-pooling)
- Database configuration: `server/db.ts` (lines 20-81)
- Validation logic: `server/db.ts` `validateDatabaseUrl()` function

---

## Cache Configuration

The application uses a 2-tier caching strategy:

### L1: Memory Cache (LRU)

All server instances maintain a local LRU cache for high-frequency objects.

### L2: Upstash Redis

Global cache layer for cross-instance data consistency and shared state.

**Required Environment Variables:**

- `UPSTASH_REDIS_REST_URL`: The REST URL of your Upstash Redis database.
- `UPSTASH_REDIS_REST_TOKEN`: The REST Token of your Upstash Redis database.

**Cross-Instance Sync**:
When `UnifiedCache` performs a write or delete, it notifies other instances via a simplified Redis pub/sub mechanism (using hash timestamps) to ensure L1 consistency.

---

## Auth Configuration

The application uses Google OAuth 2.0 with a centralized `AuthService`.

**Required Environment Variables:**

- `GOOGLE_CLIENT_ID`: Google Cloud Console OAuth Client ID
- `GOOGLE_CLIENT_SECRET`: Google Cloud Console OAuth Client Secret
- `SESSION_SECRET`: Random string for signing sessions
- `INITIAL_ADMIN_EMAIL`: The email that will be automatically granted admin privileges on first login.

**Session Management**:
Sessions are stored in PostgreSQL using `connect-pg-simple`. Ensure the `sessions` table exists or the application will attempt to create it on startup.

### L2: Persistent Cache (Replit KV)

- **Provider**: `@replit/database`
- **TTL**: Configurable per resource type
  - Batch/Navigation data: 15 minutes (900s)
  - Individual gradient settings: 15 minutes (900s)
  - Homepage data: 10 minutes (600s)
- **Purpose**: Reduce NEON database queries

### Stale-While-Revalidate

Technology and homepage batch endpoints use stale-while-revalidate:

- **Stale Threshold**: 80% of TTL (e.g., 12 minutes for 15-minute cache)
- **Behavior**: Serve stale data immediately + refresh in background
- **Benefit**: Zero loading states for users, always instant responses

### Cache Invalidation

Cache is automatically invalidated on data updates:

```typescript
// Invalidates all technology:* cache keys
await CacheOperations.invalidateTechnology();

// Invalidates specific item
await CacheOperations.invalidateMedia(mediaId);
```

---

## Environment Variables

### Required Variables

```bash
# Database (REQUIRED)
DATABASE_URL=postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech:5432/dbname

# Server (auto-configured by Replit)
PORT=5001
NODE_ENV=production
```

### Optional Variables

```bash
# Logging
LOG_LEVEL=info  # Options: debug, info, warn, error

# Rate Limiting
RATE_LIMIT_GENERAL=100     # Requests per 15 minutes
RATE_LIMIT_ADMIN=30        # Admin requests per 15 minutes
RATE_LIMIT_DIAGNOSTIC=10   # Diagnostic requests per minute
```

### Verification

Check environment configuration on startup:

```bash
npm run dev
```

Look for validation messages in logs:

- ✅ Database URL validation
- ✅ Cache initialization
- ✅ Server startup on port 5001

---

## Troubleshooting

### "Connection exhausted" Errors

**Symptom**: Database queries fail with connection timeout or pool exhaustion

**Solution**: Verify DATABASE_URL includes `-pooler` suffix

**Diagnosis**:

```bash
# Check your DATABASE_URL
echo $DATABASE_URL | grep -o "pooler"
```

If no output, you're missing the pooler suffix.

### "Cache failed to initialize" Warnings

**Symptom**: Logs show cache initialization failures

**Solution**: Ensure Replit Database is enabled for your project

**Diagnosis**: Check Replit sidebar → Database tab is present

### Slow Initial Page Load

**Symptom**: First page load takes >2 seconds

**Solution**: Expected behavior - cache warmup happening

**After warmup**:

- Fresh cache: <50ms
- Stale cache (with revalidate): <10ms
- Cache miss: 200-2000ms (NEON query time)

---

## Performance Monitoring

### Cache Hit Rates

Monitor HTTP response headers:

```
X-Cache-Hit: true       # Fresh cache hit
X-Cache-Hit: stale      # Stale-while-revalidate hit
X-Cache-Hit: false      # Cache miss (database query)
X-Response-Time: 5.2    # Response time in milliseconds
```

### Expected Performance

| Scenario                   | Response Time | X-Cache-Hit |
| -------------------------- | ------------- | ----------- |
| Hot data (L1 cache)        | <1ms          | true        |
| Warm data (L2 cache)       | 5-20ms        | true        |
| Stale data (revalidating)  | <10ms         | stale       |
| Cold data (database query) | 200-2000ms    | false       |

### Health Checks

```bash
# Check server health
curl http://localhost:5000/api/health

# Check database connectivity
curl http://localhost:5000/api/diagnostics/database

# Force cache refresh
curl -H "Cache-Control: no-cache" http://localhost:5000/api/technology-batch
```

---

## Production Deployment Checklist

- [ ] DATABASE_URL uses `-pooler` suffix
- [ ] No database validation warnings in logs
- [ ] Cache hit rate >80% after warmup
- [ ] Response times <50ms for cached endpoints
- [ ] Stale-while-revalidate working (check X-Cache-Hit: stale headers)
- [ ] Background refresh completing successfully (check logs)
- [ ] No connection timeout errors under load

---

_Last updated: October 19, 2025_
_Related files: `server/db.ts`, `server/lib/unified-replit-cache.ts`, `server/routes/resources/page-content-routes.ts`_
