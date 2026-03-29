# Troubleshooting Guide

**Version:** 2.0  
**System:** RUN APPAREL CMS (Port 5002)  
**Last Updated:** February 2026

---

## 🔍 Quick Diagnostics

**Run these commands first for any issue:**

```bash
# Verify port configuration
npm run verify-port

# Check what's on port 5002
lsof -i :5002

# View server logs
npm run dev 2>&1 | tee debug.log

# Check Node version
node --version  # Should be ≥24
```

---

## 🚨 Port 5002 Issues

### Issue 1: Port 5002 Already in Use

**Symptoms:**
```
Error: listen EADDRINUSE: address already in use :::5002
```

**Diagnosis:**
```bash
# Find what's using port 5002
lsof -i :5002

# Example output:
# COMMAND   PID  USER
# node     1234 user
```

**Solutions:**

**Option A: Kill the process**
```bash
# Kill specific process
kill -9 1234

# Or kill all node processes
killall node
```

**Option B: Use different terminal**
```bash
# Check if you have multiple terminals running dev server
ps aux | grep "npm run dev"
```

**Prevention:**
```bash
# Add to package.json scripts
"predev": "lsof -ti:5002 | xargs kill -9 || true",
"dev": "concurrently \"npm run dev:server\" \"npm run dev:client\""
```

---

### Issue 2: Server Starts on Wrong Port

**Symptoms:**
- Server logs show: `Server running on http://localhost:3000`
- Browser URL: `http://localhost:3000` instead of `5002`

**Diagnosis:**
```bash
# Check server configuration
cat server/index.ts | grep PORT

# Check Vite configuration
cat vite.config.ts | grep port

# Run verification
npm run verify-port
```

**Common Causes:**

**Cause 1: Environment variable override**
```typescript
// ❌ WRONG - server/index.ts
const PORT = process.env.PORT || 3000;
```

**Solution:**
```typescript
// ✅ CORRECT
const PORT = 5002; // Hardcoded, no env variable
```

**Cause 2: Vite config wrong**
```typescript
// ❌ WRONG - vite.config.ts
server: {
  port: 3000,
}
```

**Solution:**
```typescript
// ✅ CORRECT
server: {
  port: 5002,
  strictPort: true,
}
```

**Cause 3: Environment file**
```bash
# ❌ WRONG - .env
PORT=3000
```

**Solution:**
```bash
# ✅ CORRECT
PORT=5002
```

---

### Issue 3: Port Verification Script Fails

**Symptoms:**
```
npm run verify-port
❌ vite.config.ts contains forbidden port (not 5002)
❌ server/index.ts contains forbidden port (not 5002)
```

**Diagnosis:**
```bash
# Find all port references
grep -rn "port.*:" --include="*.ts" --include="*.js" . | grep -v node_modules | grep -v "5002"
```

**Solutions:**

**For each file flagged:**

1. **Open the file**
2. **Search for port references**
3. **Replace with 5002**
4. **Re-run verification**

**Example:**
```bash
# File: vite.config.ts
# Line 15: port: 3000

# Fix:
# Line 15: port: 5002
```

**Bulk fix (use with caution):**
```bash
# Find and replace in specific files
sed -i 's/port: 3000/port: 5002/g' vite.config.ts
sed -i 's/PORT = 3000/PORT = 5002/g' server/index.ts
```

---

### Issue 4: API Calls Go to Wrong Port

**Symptoms:**
- Network tab shows: `http://localhost:3000/api/...`
- API calls fail with 404 or connection refused

**Diagnosis:**
```bash
# Check API base URL in code
grep -r "localhost:" client/ | grep -v "5002"

# Check environment variables
cat .env | grep API_BASE_URL
```

**Common Causes:**

**Cause 1: Hardcoded wrong URL**
```typescript
// ❌ WRONG
const API_URL = 'http://localhost:3000/api';
```

**Solution:**
```typescript
// ✅ CORRECT
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002/api';
```

**Cause 2: Missing environment variable**
```bash
# .env missing or incorrect
VITE_API_BASE_URL=http://localhost:3000/api
```

**Solution:**
```bash
# .env
VITE_API_BASE_URL=http://localhost:5002/api/v1
VITE_ADMIN_BASE_URL=http://localhost:5002/admin
```

**Cause 3: Vite proxy misconfigured**
```typescript
// ❌ WRONG
proxy: {
  '/api': {
    target: 'http://localhost:3000',
  },
}
```

**Solution:**
```typescript
// ✅ CORRECT
proxy: {
  '/api': {
    target: 'http://localhost:5002',
    changeOrigin: true,
  },
}
```

---

### Issue 5: Multiple Ports in Docker

**Symptoms:**
- Docker container exposes multiple ports
- Application accessible on different ports

**Diagnosis:**
```bash
# Check docker-compose.yml
cat docker-compose.yml | grep ports

# Check Dockerfile
cat Dockerfile | grep EXPOSE
```

**Solution:**

**docker-compose.yml:**
```yaml
# ❌ WRONG
services:
  app:
    ports:
      - "3000:3000"
      - "5002:5002"

# ✅ CORRECT
services:
  app:
    ports:
      - "5002:5002"  # Only port 5002
    environment:
      - PORT=5002
```

**Dockerfile:**
```dockerfile
# ❌ WRONG
EXPOSE 3000

# ✅ CORRECT
EXPOSE 5002
```

---

## 🔐 Authentication Issues

### Issue 6: Can't Access Admin Panel

**Symptoms:**
- Redirected to login page
- Admin routes return 401 Unauthorized

**Diagnosis:**
```bash
# Check if server is running
curl http://localhost:5002/api/v1/health

# Check admin API
curl http://localhost:5002/admin/api/auth/me
```

**Common Causes:**

**Cause 1: Not logged in**

**Solution:**
```bash
# Login via API
curl -X POST http://localhost:5002/admin/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'
```

**Cause 2: Token expired**

**Solution:**
```typescript
// Check token expiration
// Clear localStorage/cookies
localStorage.clear();
// Re-login
```

**Cause 3: Middleware not applied**

**Solution:**
```typescript
// server/routes/admin.ts
// ❌ WRONG - Missing middleware
router.get('/admin/api/products', async (req, res) => {
  // ...
});

// ✅ CORRECT - Middleware applied
router.use('/admin/api', isAuthenticated);
router.get('/admin/api/products', async (req, res) => {
  // ...
});
```

---

### Issue 7: CORS Errors on Admin API

**Symptoms:**
```
Access to fetch at 'http://localhost:5002/admin/api/...' 
has been blocked by CORS policy
```

**Diagnosis:**
```bash
# Check CORS middleware
cat server/middleware/cors.ts
```

**Solution:**

**server/middleware/cors.ts:**
```typescript
import cors from 'cors';

export const corsMiddleware = cors({
  origin: 'http://localhost:5002',  // Must be port 5002
  credentials: true,
});

// Apply to app
app.use(corsMiddleware);
```

---

## 🗺️ Route Issues

### Issue 8: Public Page Missing Admin Counterpart

**Symptoms:**
- Public page works: `http://localhost:5002/team`
- Admin page 404: `http://localhost:5002/admin/team`

**Diagnosis:**
```bash
# Check route mapping
cat shared/constants/routeMapping.ts | grep team
```

**Solution:**

**1. Create admin route:**
```typescript
// client/app/routes/admin.tsx
<Route path="/admin/team" element={<TeamManagementPage />} />
```

**2. Create admin page component:**
```typescript
// client/app/pages/admin/TeamManagementPage.tsx
export function TeamManagementPage() {
  // Admin interface for team management
}
```

**3. Create admin API endpoint:**
```typescript
// server/routes/api/admin.ts
router.get('/admin/api/team', isAuthenticated, async (req, res) => {
  const members = await teamService.getAll();
  res.json(members);
});
```

**4. Update route mapping:**
```typescript
// shared/constants/routeMapping.ts
{
  public: '/team',
  admin: '/admin/team',
  description: 'Team Page / Team Management',
  apiEndpoint: '/api/team',
}
```

---

### Issue 9: Admin Route Returns Public Data

**Symptoms:**
- Admin page shows only published items
- Can't see drafts or unpublished content

**Diagnosis:**
```bash
# Check admin API endpoint
curl -H "Authorization: Bearer <token>" \
  http://localhost:5002/admin/api/products
```

**Solution:**

**Separate service methods:**
```typescript
// ❌ WRONG - Both use same method
// Public API
router.get('/api/products', async (req, res) => {
  const products = await productService.getAll(); // Gets all
  res.json(products);
});

// Admin API
router.get('/admin/api/products', isAuthenticated, async (req, res) => {
  const products = await productService.getAll(); // Gets all
  res.json(products);
});

// ✅ CORRECT - Different methods
// Public API
router.get('/api/products', async (req, res) => {
  const products = await productService.getAllPublished(); // Published only
  res.json(products);
});

// Admin API
router.get('/admin/api/products', isAuthenticated, async (req, res) => {
  const products = await productService.getAll(); // All products
  res.json(products);
});
```

---

## 🏗️ Build Issues

### Issue 10: Build Fails Due to Port Configuration

**Symptoms:**
```
npm run build
[vite]: Build failed with errors
```

**Diagnosis:**
```bash
# Run build with verbose output
npm run build -- --debug

# Check TypeScript errors
npm run typecheck
```

**Common Causes:**

**Cause 1: Type errors in config files**

**Solution:**
```bash
# Check vite.config.ts
npm run typecheck

# Fix type errors
```

**Cause 2: Environment variables missing**

**Solution:**
```bash
# Create .env.production
cat > .env.production << 'EOF'
PORT=5002
NODE_ENV=production
DATABASE_URL=...
EOF
```

---

### Issue 11: Production Server Won't Start

**Symptoms:**
```
npm run start
Error: Cannot find module './dist/server/index.js'
```

**Diagnosis:**
```bash
# Check if build was successful
ls -la dist/

# Check if server built
ls -la dist/server/
```

**Solutions:**

**Solution 1: Build project**
```bash
npm run build
npm run start
```

**Solution 2: Check build script**
```json
// package.json
{
  "scripts": {
    "build": "npm run build:client && npm run build:server",
    "build:client": "vite build",
    "build:server": "tsc --project tsconfig.server.json"
  }
}
```

**Solution 3: Check output path**
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    outDir: 'dist',  // Correct output directory
  },
});
```

---

## 🧪 Test Issues

### Issue 12: Tests Fail Due to Port Mismatch

**Symptoms:**
```
npm run test
Tests failed: Expected port 5002, got 3000
```

**Diagnosis:**
```bash
# Check test configuration
cat vitest.config.ts
```

**Solution:**

**vitest.config.ts:**
```typescript
export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    env: {
      PORT: '5002',  // Set port for tests
      VITE_API_BASE_URL: 'http://localhost:5002/api',
    },
  },
});
```

**Test setup file:**
```typescript
// tests/setup.ts
process.env.PORT = '5002';
process.env.VITE_API_BASE_URL = 'http://localhost:5002/api';
```

---

### Issue 13: Integration Tests Can't Connect

**Symptoms:**
```
Integration test failed: ECONNREFUSED localhost:3000
```

**Diagnosis:**
```bash
# Check if test server is running
ps aux | grep "test server"
```

**Solution:**

**Test server setup:**
```typescript
// tests/integration/setup.ts
import { createServer } from '../../server';

const PORT = 5002;  // Must be 5002
const app = createServer();

export const server = app.listen(PORT, () => {
  console.log(`Test server on port ${PORT}`);
});

export const API_BASE = `http://localhost:${PORT}`;
```

---

## 💾 Database Issues

### Issue 14: Database Connection Fails

**Symptoms:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Diagnosis:**
```bash
# Check database is running
pg_isready

# Check connection string
cat .env | grep DATABASE_URL
```

**Solution:**

**1. Start database:**
```bash
# PostgreSQL
pg_ctl start

# Or with Docker
docker-compose up -d postgres
```

**2. Verify connection:**
```bash
psql $DATABASE_URL -c "SELECT 1"
```

**3. Check .env:**
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/cms_db
```

---

## 🎨 Frontend Issues

### Issue 15: Admin Panel UI Not Loading

**Symptoms:**
- Blank page at `http://localhost:5002/admin`
- Console errors about missing chunks

**Diagnosis:**
```bash
# Check browser console
# Look for: Failed to load module

# Check network tab
# Look for: 404 errors
```

**Common Causes:**

**Cause 1: Build not included admin files**

**Solution:**
```bash
# Rebuild
npm run build

# Check dist folder
ls -la dist/admin/
```

**Cause 2: Wrong base path**

**Solution:**
```typescript
// vite.config.ts
export default defineConfig({
  base: '/admin/',  // For admin build
  build: {
    outDir: 'dist/admin',
  },
});
```

---

### Issue 16: Styles Not Loading

**Symptoms:**
- Unstyled content
- Missing Tailwind classes

**Diagnosis:**
```bash
# Check if Tailwind is compiled
cat dist/assets/*.css | grep "utility"

# Check console for CSS errors
```

**Solution:**

**1. Verify Tailwind config:**
```typescript
// tailwind.config.ts
export default {
  content: [
    './client/**/*.{ts,tsx}',
  ],
};
```

**2. Rebuild:**
```bash
npm run build
```

---

## 🔧 Configuration Issues

### Issue 17: TypeScript Errors in Config Files

**Symptoms:**
```
vite.config.ts:7:5 - error TS2322: Type 'number' is not assignable
```

**Diagnosis:**
```bash
npm run typecheck
```

**Solution:**

**Check type definitions:**
```typescript
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5002,  // Must be number, not string
    strictPort: true,
  },
});
```

---

### Issue 18: Environment Variables Not Loading

**Symptoms:**
- `console.log(import.meta.env.VITE_API_BASE_URL)` shows `undefined`

**Diagnosis:**
```bash
# Check .env file exists
ls -la .env

# Check variable prefix
cat .env | grep VITE_
```

**Solution:**

**1. Variables must have VITE_ prefix:**
```bash
# ❌ WRONG
API_BASE_URL=http://localhost:5002/api/v1

# ✅ CORRECT
VITE_API_BASE_URL=http://localhost:5002/api/v1
```

**2. Restart dev server:**
```bash
# Environment variables loaded on startup
npm run dev
```

---

## 🚀 Deployment Issues

### Issue 19: Production Env Wrong Port

**Symptoms:**
- Production app runs on port 80 or 443 instead of 5002

**Diagnosis:**
```bash
# Check production server
ssh production-server
lsof -i :5002
```

**Solution:**

**This is EXPECTED in production.**

**Nginx reverse proxy:**
```nginx
# nginx.conf
server {
  listen 80;
  listen 443 ssl;
  
  location / {
    proxy_pass http://localhost:5002;  # Forward to port 5002
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
  }
}
```

**App still runs on 5002 internally:**
```bash
# Production .env
PORT=5002
```

---

### Issue 20: PM2 Starts Multiple Instances

**Symptoms:**
- Multiple processes on port 5002
- Port conflict errors

**Diagnosis:**
```bash
# Check PM2 processes
pm2 list
```

**Solution:**

**1. Stop all instances:**
```bash
pm2 delete all
```

**2. Start single instance:**
```bash
PORT=5002 pm2 start dist/server/index.js \
  --name cms-app \
  --instances 1
```

**3. Save configuration:**
```bash
pm2 save
```

---

## 📋 Quick Fix Checklist

**When nothing works:**

```bash
# 1. Kill all node processes
killall node

# 2. Clear all caches
rm -rf node_modules
rm -rf dist
rm -rf .vite
npm cache clean --force

# 3. Reinstall dependencies
npm install

# 4. Verify port configuration
npm run verify-port

# 5. Rebuild
npm run build

# 6. Start fresh
npm run dev
```

---

## 🆘 Getting Help

### Before Asking for Help

**Run these diagnostics:**

```bash
# System info
node --version
npm --version
lsof -i :5002

# Port verification
npm run verify-port

# Build verification
npm run build

# Test verification
npm run test

# Logs
npm run dev > debug.log 2>&1
```

**Include in your help request:**
1. Output of `npm run verify-port`
2. Relevant error messages
3. Steps to reproduce
4. What you've already tried

### Documentation Resources

- **README.md** - Project overview
- **RULES.md** - Coding standards
- **WORKFLOW.md** - Development processes
- **AGENT.md** - AI agent instructions
- **Detailed Architecture**: [`docs/core/tech-stack.md`](./core/tech-stack.md)

### Support Channels

- GitHub Issues: [Link to issues]
- Slack: #development channel
- Email: team@wear-run.com

---

## 📊 Common Error Codes

| Error Code | Meaning | Solution |
|------------|---------|----------|
| EADDRINUSE | Port already in use | Kill process on port 5002 |
| ECONNREFUSED | Can't connect to server | Start dev server |
| 404 | Route not found | Check route configuration |
| 401 | Unauthorized | Check authentication |
| 500 | Server error | Check server logs |
| CORS Error | CORS policy blocked | Check CORS middleware |

---

**Last Updated:** February 2026  
**Maintained by:** Development Team  
**Need more help?** See `README.md` or contact team@wear-run.com
