# Circuit Breaker Trip Runbook

## Symptoms

- 503 Service Unavailable for specific operations
- Health check shows circuit breaker state: `OPEN`
- Logs show `[CircuitBreaker] <service> OPENED - circuit tripped`
- Fallback behavior activated

## Impact

- **High**: Affected service completely unavailable
- Scope depends on which circuit tripped (database, Redis, external API)

## Diagnosis

### 1. Check Circuit Breaker Status

```bash
curl -H "X-Health-Check-Key: $SECRET" https://your-domain.com/health/detailed | jq '.circuitBreaker'
```

### 2. Identify Which Circuit

Check logs for circuit breaker events:

```bash
grep "CircuitBreaker" /var/log/app/*.log | tail -50
```

### 3. Check Underlying Service

For database circuit:

```bash
curl -H "X-Health-Check-Key: $SECRET" https://your-domain.com/health/detailed | jq '.checks[] | select(.service == "database")'
```

For external API:

- Check the external service's status page
- Test direct connectivity from your environment

## Resolution

### Step 1: Fix Underlying Issue

Address the root cause (see service-specific runbooks):

- Database: See [database-outage.md](./database-outage.md)
- External API: Check vendor status, update credentials if expired

### Step 2: Wait for Half-Open

Circuit breakers automatically transition to `HALF_OPEN` after the reset timeout (typically 30-60s). The next request will test the service.

### Step 3: Manual Reset (Emergency Only)

If the underlying issue is fixed but circuit hasn't recovered:

```typescript
// Via admin endpoint or direct code change
import { resetCircuit } from "./server/lib/resilience/circuit-breaker.js";
resetCircuit("database");
```

### Step 4: Verify Recovery

```bash
# Make a test request
curl https://your-domain.com/api/products

# Check circuit state
curl -H "X-Health-Check-Key: $SECRET" https://your-domain.com/health/detailed | jq '.circuitBreaker'
```

## Prevention

- Monitor circuit breaker state changes
- Set up alerts when circuit opens
- Review timeout and threshold settings
- Add fallback data for critical paths (cached responses)
