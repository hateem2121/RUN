---
name: port-5002-compliance
description: Ensures absolute compliance with port 5002 across the entire RUN APPAREL CMS system.
triggers:
  - "port configuration"
  - "server setup"
  - "vite config"
  - "environment variables"
  - "docker deployment"
  - "deployment"
  - "port 5002"
---

# Port 5002 Compliance Skill

**Skill Name:** port-5002-compliance  
**Version:** 1.0  
**Category:** Configuration & Architecture  
**Complexity:** Low  
**Impact:** Critical

---

## Overview

This skill ensures absolute compliance with port 5002 across the entire RUN APPAREL CMS system. Port consistency is critical for development, testing, and deployment workflows.

**Why This Matters:**
- Prevents port conflicts and confusion
- Ensures frontend-backend connectivity
- Simplifies documentation and onboarding
- Reduces configuration-related bugs
- Maintains system consistency

---

## Trigger Conditions

Use this skill when:
- Creating or modifying server configuration
- Setting up Vite/dev server
- Writing environment variables
- Configuring Docker/deployment
- Creating API client utilities
- Modifying any file that references ports
- Troubleshooting connection issues
- Onboarding new developers
- Setting up CI/CD pipelines

---

## Core Concepts

### The Port 5002 Law

**Every service, route, API endpoint, and URL in this system MUST use port 5002.**

This is non-negotiable and applies to:
- Express server startup
- Vite dev server
- Environment variables
- API base URLs
- Docker configurations
- Nginx reverse proxy (internally)
- Test environments
- Documentation examples

### Architecture

```
┌─────────────────────────────────────┐
│     Port 5002 (Single Entry)        │
│                                     │
│  ┌───────────┐  ┌──────────────┐  │
│  │  Public   │  │    Admin     │  │
│  │  Routes   │  │    Routes    │  │
│  │    /      │  │   /admin     │  │
│  └───────────┘  └──────────────┘  │
│                                     │
│  ┌───────────────────────────────┐ │
│  │       API Endpoints           │ │
│  │  /api/* and /admin/api/*      │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## Implementation Patterns

### Pattern 1: Server Configuration

**File:** `server/index.ts` or `server/app.ts`

```typescript
// ✅ CORRECT - Hardcoded port 5002
const PORT = 5002;

app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Admin panel: http://localhost:${PORT}/admin`);
  console.log(`✓ API base: http://localhost:${PORT}/api`);
});

export default app;
```

**❌ ANTI-PATTERNS:**
```typescript
// Never use environment variables without default
const PORT = process.env.PORT;  // WRONG

// Never use other ports
const PORT = 3000;  // WRONG
const PORT = process.env.PORT || 3000;  // WRONG

// Never make it dynamic without 5002 default
const PORT = parseInt(process.env.PORT || '3000');  // WRONG
```

**Verification:**
```bash
grep -n "const PORT" server/index.ts
# Should show: const PORT = 5002;
```

---

### Pattern 2: Vite Configuration

**File:** `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5002,              // ✅ Hardcoded
    strictPort: true,        // ✅ Fail if unavailable
    proxy: {
      '/api': {
        target: 'http://localhost:5002',  // ✅ Port 5002
        changeOrigin: true,
      },
      '/admin/api': {
        target: 'http://localhost:5002',  // ✅ Port 5002
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/app'),
    },
  },
});
```

**Verification:**
```bash
grep -n "port:" vite.config.ts
# Should show: port: 5002
```

---

### Pattern 3: Environment Variables

**File:** `.env`

```bash
# Port Configuration (MANDATORY)
PORT=5002
VITE_API_BASE_URL=http://localhost:5002/api
VITE_ADMIN_BASE_URL=http://localhost:5002/admin

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/cms_db

# Session
SESSION_SECRET=your-secret-key
```

**File:** `.env.example`

```bash
PORT=5002
VITE_API_BASE_URL=http://localhost:5002/api
VITE_ADMIN_BASE_URL=http://localhost:5002/admin
DATABASE_URL=
SESSION_SECRET=
```

**File:** `.env.production`

```bash
PORT=5002
NODE_ENV=production
DATABASE_URL=postgresql://...
SESSION_SECRET=...
```

**Verification:**
```bash
grep "PORT=" .env
# Should show: PORT=5002
```

---

### Pattern 4: API Client Configuration

**File:** `client/app/lib/api.ts`

```typescript
// ✅ CORRECT - Uses environment variable with 5002 fallback
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL 
  || 'http://localhost:5002/api';

const ADMIN_API_BASE_URL = import.meta.env.VITE_ADMIN_BASE_URL 
  || 'http://localhost:5002/admin/api';

export async function fetchAPI<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`);
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchAdminAPI<T>(endpoint: string): Promise<T> {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`${ADMIN_API_BASE_URL}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error(`Admin API error: ${response.statusText}`);
  }
  return response.json();
}
```

**Verification:**
```bash
grep -n "localhost:" client/app/lib/api.ts
# Should only show port 5002
```

---

### Pattern 5: Package.json Scripts

**File:** `package.json`

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:server": "NODE_ENV=development tsx watch server/index.ts",
    "dev:client": "vite --port 5002",
    "build": "npm run build:client && npm run build:server",
    "build:client": "vite build",
    "build:server": "tsc --project tsconfig.server.json",
    "start": "NODE_ENV=production node dist/server/index.js",
    "test": "vitest",
    "verify-port": "node scripts/verify-port-5002.js"
  }
}
```

**Note:** The `--port 5002` flag in dev:client is redundant if vite.config.ts is correct, but serves as an extra safeguard.

---

### Pattern 6: Port Verification Script

**File:** `scripts/verify-port-5002.js`

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const criticalFiles = [
  'vite.config.ts',
  'server/index.ts',
  'server/app.ts',
  '.env',
  '.env.example',
  '.env.production',
  'package.json',
  'docker-compose.yml',
  'Dockerfile',
];

let errors = [];
let warnings = [];

function checkFileForPort(filePath) {
  if (!fs.existsSync(filePath)) {
    warnings.push(`⚠️  ${filePath} does not exist (may be optional)`);
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Check for forbidden ports
  const forbiddenPorts = [
    /port[:\s]*=?[:\s]*(3000|8080|4000|5000|5001|5003)/gi,
    /PORT[:\s]*=?[:\s]*(3000|8080|4000|5000|5001|5003)/gi,
    /localhost:(3000|8080|4000|5000|5001|5003)/gi,
  ];
  
  for (const pattern of forbiddenPorts) {
    if (pattern.test(content)) {
      errors.push(`❌ ${filePath} contains forbidden port (not 5002)`);
      break;
    }
  }
  
  // Verify port 5002 is present (except in package.json which may not have it)
  if (!content.includes('5002') && !filePath.includes('package.json')) {
    warnings.push(`⚠️  ${filePath} does not reference port 5002`);
  }
}

console.log('🔍 Verifying port 5002 compliance...\n');

criticalFiles.forEach(checkFileForPort);

// Print warnings
if (warnings.length > 0) {
  console.log('Warnings:\n');
  warnings.forEach(w => console.log(w));
  console.log('');
}

// Print errors
if (errors.length > 0) {
  console.error('Port Configuration Errors:\n');
  errors.forEach(err => console.error(err));
  console.error('\n❌ Port verification failed\n');
  console.error('Run these commands to diagnose:\n');
  console.error('  grep -r "3000" --exclude-dir=node_modules .');
  console.error('  grep -r "8080" --exclude-dir=node_modules .');
  console.error('\n');
  process.exit(1);
} else {
  console.log('✅ All files comply with port 5002 standard\n');
  process.exit(0);
}
```

**Make executable:**
```bash
chmod +x scripts/verify-port-5002.js
```

**Usage:**
```bash
npm run verify-port
```

---

## Docker Configuration

### Pattern 7: docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5002:5002"  # Port 5002 mapping
    environment:
      - PORT=5002
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      - postgres
  
  postgres:
    image: postgres:15
    ports:
      - "5432:5432"  # Database on different port
    environment:
      - POSTGRES_DB=cms_db
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
```

### Pattern 8: Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 5002

ENV PORT=5002

CMD ["node", "dist/server/index.js"]
```

---

## Testing Configuration

### Pattern 9: vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    env: {
      PORT: '5002',  // Set port for tests
      VITE_API_BASE_URL: 'http://localhost:5002/api',
      VITE_ADMIN_BASE_URL: 'http://localhost:5002/admin',
      NODE_ENV: 'test',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/app'),
    },
  },
});
```

### Pattern 10: Test Setup

**File:** `tests/setup.ts`

```typescript
import { beforeAll, afterAll } from 'vitest';
import { createServer } from '../server';
import type { Express } from 'express';
import type { Server } from 'http';

const PORT = 5002;
let app: Express;
let server: Server;

beforeAll(async () => {
  // Set environment variables
  process.env.PORT = '5002';
  process.env.NODE_ENV = 'test';
  
  // Start test server
  app = createServer();
  server = app.listen(PORT);
  
  console.log(`Test server running on port ${PORT}`);
});

afterAll(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

export { app, server };
export const API_BASE = `http://localhost:${PORT}`;
```

---

## CI/CD Configuration

### Pattern 11: GitHub Actions

**File:** `.github/workflows/ci.yml`

```yaml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  verify:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Verify Port 5002 Compliance
        run: npm run verify-port
      
      - name: Type Check
        run: npm run typecheck
      
      - name: Lint
        run: npm run lint
      
      - name: Build
        run: npm run build
      
      - name: Test
        run: npm run test
        env:
          PORT: 5002
```

---

## Verification Workflow

### Step-by-Step Verification

**1. Initial Check**
```bash
npm run verify-port
```

**2. Manual Port Audit**
```bash
# Search for non-5002 port references
grep -rn "port.*:" --include="*.ts" --include="*.js" . | \
  grep -v node_modules | \
  grep -v "5002" | \
  grep -v "5432"  # Exclude database port

# Check localhost references
grep -rn "localhost:" . | \
  grep -v node_modules | \
  grep -v "5002"

# Check environment variables
grep -n "PORT" .env .env.example .env.production
```

**3. Runtime Verification**
```bash
# Start dev server
npm run dev

# Check server logs
# Should see: "Server running on http://localhost:5002"

# Verify endpoints
curl http://localhost:5002/api/v1/health
curl http://localhost:5002/admin/api/health
```

**4. Build Verification**
```bash
npm run build
npm run start

# Check production server
curl http://localhost:5002/api/health
```

---

## Common Mistakes & Fixes

### Mistake 1: Using Environment Variables

❌ **Wrong:**
```typescript
const PORT = process.env.PORT || 3000;
```

✅ **Correct:**
```typescript
const PORT = 5002;  // Hardcoded
```

### Mistake 2: Inconsistent Ports

❌ **Wrong:**
```typescript
// Server on 5002
const PORT = 5002;

// But API calls go to 3000
const API_URL = 'http://localhost:3000/api';
```

✅ **Correct:**
```typescript
// Everything on 5002
const PORT = 5002;
const API_URL = 'http://localhost:5002/api';
```

### Mistake 3: Forgetting Proxy Config

❌ **Wrong:**
```typescript
// vite.config.ts - No proxy
server: {
  port: 5002,
}
```

✅ **Correct:**
```typescript
// vite.config.ts - With proxy
server: {
  port: 5002,
  proxy: {
    '/api': {
      target: 'http://localhost:5002',
      changeOrigin: true,
    },
  },
}
```

### Mistake 4: Missing Verification

❌ **Wrong:**
```bash
# Commit without verification
git add .
git commit -m "feat: add feature"
```

✅ **Correct:**
```bash
# Always verify first
npm run verify-port
npm run build
npm run test
git add .
git commit -m "feat: add feature"
```

---

## Integration with Other Skills

### Works Well With:
- **frontend-design** - Ensures UI connects to correct port
- **docx/pptx/xlsx** - Documentation reflects port 5002
- **web-artifacts-builder** - Artifacts use port 5002 for API calls

### Critical Dependencies:
- All frontend components must use correct API base URL
- All server routes must listen on port 5002
- All documentation must reference port 5002
- All tests must run against port 5002

---

## Success Criteria

**Port 5002 compliance is achieved when:**

- [ ] `npm run verify-port` passes
- [ ] Server starts on port 5002
- [ ] Vite dev server runs on port 5002
- [ ] All API calls target port 5002
- [ ] Environment files specify port 5002
- [ ] Docker configuration uses port 5002
- [ ] Tests run on port 5002
- [ ] CI/CD pipeline verifies port 5002
- [ ] Documentation references port 5002
- [ ] No forbidden port references exist

---

## Troubleshooting

### Issue: Port Already in Use

```bash
# Find process
lsof -i :5002

# Kill process
kill -9 <PID>

# Restart
npm run dev
```

### Issue: Verification Fails

```bash
# See what failed
npm run verify-port

# Fix each file mentioned
# Re-run verification
npm run verify-port
```

### Issue: API Calls Wrong Port

```bash
# Check environment variables
cat .env | grep VITE_API_BASE_URL

# Should be: http://localhost:5002/api/v1

# Restart dev server to load new env
npm run dev
```

---

## Documentation References

- **README.md** - Quick start with port 5002
- **RULES.md** - Rule #0: Port 5002 compliance
- **WORKFLOW.md** - Port verification in workflows
- **AGENT.md** - AI agent instructions
- **TROUBLESHOOTING.md** - Port-related issues
- **docs/PORT_5002_ARCHITECTURE.md** - System architecture

---

## Maintenance

### Monthly Port Audit

```bash
# Run full audit
npm run verify-port

# Check for new files
find . -name "*.ts" -o -name "*.js" | \
  xargs grep -l "port\|PORT" | \
  grep -v node_modules

# Review and update documentation
```

### When Onboarding

**New developers must:**
1. Read this skill documentation
2. Run `npm run verify-port`
3. Understand why port 5002 is mandatory
4. Add port verification to their workflow

---

## Version History

- **v1.0** (February 2026) - Initial release
  - Core port 5002 patterns established
  - Verification script created
  - Integration with CI/CD
  - Comprehensive documentation

---

**Skill Maintainer:** Development Team  
**Last Review:** February 2026  
**Next Review:** May 2026  
**Questions:** See TROUBLESHOOTING.md or contact team@wear-run.com
