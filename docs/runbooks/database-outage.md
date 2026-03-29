# Database Outage Runbook

## Symptoms
- 503 errors from API endpoints
- Health check shows `database: unhealthy`
- Logs show `DB_CONNECTION_ERROR` or `ECONNREFUSED`
- Circuit breaker status: `OPEN` for database

## Impact
- **Critical**: All database-dependent features unavailable
- Affected: Product catalog, user auth, admin operations, orders

## Diagnosis

### 1. Check Health Endpoint
```bash
curl -H "X-Health-Check-Key: $SECRET" https://your-domain.com/health/detailed | jq '.checks[] | select(.service == "database")'
```

### 2. Check Neon Dashboard
- Visit [Neon Console](https://console.neon.tech)
- Check project status and recent incidents
- Review connection limits and cold start metrics

### 3. Check Application Logs
```bash
# Filter for database errors
grep -E "DB_CONNECTION_ERROR|database|ECONNREFUSED" /var/log/app/*.log | tail -50
```

### 4. Check Circuit Breaker State
```bash
curl -H "X-Health-Check-Key: $SECRET" https://your-domain.com/health/detailed | jq '.circuitBreaker'
```

## Resolution

### Step 1: Verify Neon Status
Check https://status.neon.tech for platform-wide issues.

### Step 2: Test Direct Connection
```bash
# From a secure environment
psql $DATABASE_URL -c "SELECT 1"
```

### Step 3: Cold Start Recovery
If Neon serverless is cold-starting:
```bash
# Trigger wakeup (if implemented)
curl https://your-domain.com/api/wakeup
```

### Step 4: Connection Pool Reset
If connections are exhausted, restart the application:
```bash
# Cloud Run
gcloud run services update run-remix --region=us-central1

# Or trigger a new deployment
```

### Step 5: Verify Recovery
```bash
curl -H "X-Health-Check-Key: $SECRET" https://your-domain.com/health/detailed
```

## Prevention
- Monitor connection pool metrics
- Set up alerts for DB latency > 1s
- Consider connection pooling via PgBouncer for high traffic
- Review query performance for slow queries
