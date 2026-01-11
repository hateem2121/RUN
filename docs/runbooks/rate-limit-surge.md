# Rate Limit Surge Runbook

## Symptoms
- Spike in 429 Too Many Requests responses
- Redis/memory rate limiter showing high usage
- Legitimate users reporting "Too many requests" errors
- Potential DDoS or scraping attack

## Impact
- **Medium-High**: Legitimate users blocked alongside abusers
- Affected: All API endpoints behind rate limiters

## Diagnosis

### 1. Check Rate Limit Metrics
```bash
# Check Prometheus metrics (if enabled)
curl -H "X-Metrics-Key: $SECRET" https://your-domain.com/metrics | grep rate_limit
```

### 2. Identify Top Offenders
Check logs for IPs with most 429s:
```bash
grep "RATE_LIMIT_EXCEEDED" /var/log/app/*.log | awk '{print $NF}' | sort | uniq -c | sort -rn | head -20
```

### 3. Check Upstash Redis (if using)
- Visit Upstash Console
- Check key count and memory usage
- Look for patterns in rate limit keys

## Resolution

### Step 1: Identify Attack Pattern
Determine if it's:
- Single IP abuse → Block at WAF/CDN level
- Distributed attack → Increase limits temporarily or add CAPTCHA
- Legitimate traffic spike → Scale limits

### Step 2: Block Abusive IPs (Cloud WAF)
```bash
# Google Cloud Armor example
gcloud compute security-policies rules create 1000 \
  --security-policy=my-policy \
  --src-ip-ranges=1.2.3.4/32 \
  --action=deny-403
```

### Step 3: Adjust Rate Limits (Temporary)
Update in `server/middleware/rateLimiter.ts`:
```typescript
// Temporarily increase limits
export const apiRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 2000,  // Doubled from 1000
  ...
});
```

### Step 4: Clear Rate Limit State (if needed)
```bash
# If using Redis, clear rate limit keys
redis-cli KEYS "ratelimit:*" | xargs redis-cli DEL
```

## Prevention
- Implement IP reputation scoring
- Add CAPTCHA for auth endpoints after N failures
- Set up alerts for 429 rate > 5% of traffic
- Consider per-user rate limits vs per-IP
