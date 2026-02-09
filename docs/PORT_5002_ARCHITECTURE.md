# Port 5002 System Architecture

**Version:** 2.0  
**System:** RUN APPAREL CMS  
**Last Updated:** February 2026

---

## Executive Summary

The RUN APPAREL CMS system operates exclusively on **port 5002** for all services, routes, and API endpoints. This document details the architectural decisions, implementation patterns, and maintenance procedures for port 5002 compliance.

**Key Points:**
- **Single Port Strategy:** All services run on port 5002
- **Consistency:** Simplifies development, testing, and deployment
- **Security:** Clear separation of public/admin via routes, not ports
- **Scalability:** Ready for reverse proxy in production

---

## System Overview

```
┌───────────────────────────────────────────────────────────┐
│                                                           │
│                    PORT 5002 SERVER                       │
│              (Express 5 + Vite Dev Server)                │
│                                                           │
└───────────────────┬───────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
   ┌────────┐  ┌────────┐  ┌────────┐
   │ Public │  │ Admin  │  │  API   │
   │ Routes │  │ Routes │  │ Routes │
   │   /    │  │ /admin │  │ /api   │
   └────────┘  └────────┘  └────────┘
```

---

## Architectural Principles

### 1. Single Port Philosophy

**Rationale:**
- Reduces configuration complexity
- Eliminates port conflict issues
- Simplifies documentation
- Easier local development
- Consistent across environments

**Benefits:**
- ✅ One port to remember: 5002
- ✅ No CORS issues between services
- ✅ Simplified environment setup
- ✅ Clear separation via routes (not ports)
- ✅ Easy to proxy in production

### 2. Route-Based Separation

Instead of separating services by port, we use route prefixes:

```
http://localhost:5002/          → Public frontend
http://localhost:5002/api/v1/v1/      → Public API
http://localhost:5002/admin/    → Admin panel
http://localhost:5002/admin/api/→ Admin API
```

**Security maintained through:**
- Authentication middleware (`isAuthenticated`)
- Route-level guards
- JWT token validation
- CORS configuration

### 3. Development-Production Parity

**Development:**
```
Developer → localhost:5002 → Express + Vite
```

**Production:**
```
User → port 80/443 → Nginx → localhost:5002 → Express
```

Same port internally ensures consistency.

---

## Detailed Architecture

### Layer 1: Network Entry Point (Port 5002)

**Development Mode:**
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    port: 5002,           // Vite dev server
    strictPort: true,     // Fail if unavailable
    proxy: {
      '/api': 'http://localhost:5002',
      '/admin': 'http://localhost:5002',
    },
  },
});

// server/index.ts
const PORT = 5002;        // Express server
app.listen(PORT);
```

Both Vite (frontend) and Express (backend) run on 5002:
- **Vite:** Serves React app and proxies API calls
- **Express:** Handles API and admin routes

**Production Mode:**
```typescript
// server/index.ts
const PORT = 5002;
app.listen(PORT);

// Serves:
// - Static files from dist/
// - API endpoints
// - Admin panel
```

### Layer 2: Routing Layer

**Express Route Structure:**

```typescript
// server/index.ts
import express from 'express';
import { publicRoutes } from './routes/public';
import { adminRoutes } from './routes/admin';
import { apiRoutes } from './routes/api';

const app = express();

// API routes (public and admin)
app.use('/api', apiRoutes);
app.use('/admin/api', authMiddleware, adminApiRoutes);

// Admin panel
app.use('/admin', authMiddleware, adminRoutes);

// Public frontend (catch-all, must be last)
app.use('/', publicRoutes);

const PORT = 5002;
app.listen(PORT);
```

**Route Priority:**
1. `/api/*` - Public API endpoints
2. `/admin/api/*` - Admin API endpoints (authenticated)
3. `/admin/*` - Admin panel routes (authenticated)
4. `/*` - Public frontend routes (catch-all)

### Layer 3: Frontend Routing

**Public Routes:**
```typescript
// client/app/routes/index.tsx
export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        {/* ... */}
      </Routes>
    </BrowserRouter>
  );
}
```

**Admin Routes:**
```typescript
// client/app/routes/admin.tsx
export function AdminRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/login" element={<LoginPage />} />
        <Route 
          path="/admin/*" 
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Routes>
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route path="products" element={<ProductsManagementPage />} />
                  <Route path="products/:id/edit" element={<ProductEditorPage />} />
                  {/* ... */}
                </Routes>
              </AdminLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
```

### Layer 4: API Layer

**Public API:**
```typescript
// server/routes/api/public.ts
router.get('/products', async (req, res) => {
  // Returns published products only
  const products = await productService.getAllPublished();
  res.json(products);
});

router.get('/products/:id', async (req, res) => {
  const product = await productService.getById(req.params.id);
  if (!product || !product.isPublished) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.json(product);
});
```

**Admin API:**
```typescript
// server/routes/api/admin.ts
// All routes protected by authentication middleware
router.use(isAuthenticated);

router.get('/products', async (req, res) => {
  // Returns all products (including drafts)
  const products = await productService.getAll();
  res.json(products);
});

router.post('/products', async (req, res) => {
  const product = await productService.create(req.body);
  res.status(201).json(product);
});

router.put('/products/:id', async (req, res) => {
  const product = await productService.update(req.params.id, req.body);
  res.json(product);
});

router.delete('/products/:id', async (req, res) => {
  await productService.delete(req.params.id);
  res.status(204).send();
});
```

---

## Request Flow Diagrams

### Public Page Request Flow

```
┌─────────┐
│ Browser │
└────┬────┘
     │ GET http://localhost:5002/products
     ▼
┌─────────────────┐
│  Port 5002      │
│  (Vite Dev)     │
└────┬────────────┘
     │ Serve React App
     ▼
┌─────────────────┐
│ ProductsPage    │
│ Component       │
└────┬────────────┘
     │ useEffect(() => fetch('/api/products'))
     ▼
┌─────────────────┐
│ Vite Proxy      │
│ /api/* →        │
│ localhost:5002  │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ Express Server  │
│ Port 5002       │
└────┬────────────┘
     │ GET /api/products
     ▼
┌─────────────────┐
│ Public API      │
│ Route Handler   │
└────┬────────────┘
     │ await productService.getAllPublished()
     ▼
┌─────────────────┐
│ Product Service │
│ Business Logic  │
└────┬────────────┘
     │ SELECT * FROM products WHERE is_published = true
     ▼
┌─────────────────┐
│ Database        │
│ (PostgreSQL)    │
└────┬────────────┘
     │ Return published products
     ▼
┌─────────────────┐
│ JSON Response   │
│ → Browser       │
└─────────────────┘
```

### Admin Page Request Flow

```
┌─────────┐
│ Browser │
└────┬────┘
     │ GET http://localhost:5002/admin/products
     │ Header: Authorization: Bearer <token>
     ▼
┌─────────────────┐
│ Port 5002       │
│ (Vite Dev)      │
└────┬────────────┘
     │ Check auth token in localStorage
     │ Valid → Serve admin app
     ▼
┌─────────────────┐
│ Admin Layout    │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ Products        │
│ Management Page │
└────┬────────────┘
     │ fetch('/admin/api/products')
     │ with Authorization header
     ▼
┌─────────────────┐
│ Vite Proxy      │
│ /admin/api/* →  │
│ localhost:5002  │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ Express Server  │
│ Port 5002       │
└────┬────────────┘
     │ GET /admin/api/products
     ▼
┌─────────────────┐
│ Auth Middleware │
│ isAuthenticated │
└────┬────────────┘
     │ Verify JWT token
     │ Token valid →
     ▼
┌─────────────────┐
│ Admin API       │
│ Route Handler   │
└────┬────────────┘
     │ await productService.getAll()
     ▼
┌─────────────────┐
│ Product Service │
└────┬────────────┘
     │ SELECT * FROM products (all, including drafts)
     ▼
┌─────────────────┐
│ Database        │
└────┬────────────┘
     │ Return all products
     ▼
┌─────────────────┐
│ JSON Response   │
│ → Browser       │
└─────────────────┘
```

---

## Security Architecture

### Authentication Flow

```
┌─────────────────────────────────────────────┐
│           Port 5002 Security Model          │
└─────────────────────────────────────────────┘

PUBLIC ROUTES (No Auth Required)
┌─────────────────────────────────────┐
│ GET  /                              │
│ GET  /products                      │
│ GET  /products/:id                  │
│ GET  /blog                          │
│ GET  /blog/:slug                    │
│                                     │
│ GET  /api/products                  │
│ GET  /api/blog/posts                │
└─────────────────────────────────────┘

ADMIN ROUTES (Auth Required)
┌─────────────────────────────────────┐
│ POST /admin/api/auth/login          │ ← No auth (login endpoint)
│                                     │
│ Middleware: isAuthenticated()       │
│ ↓                                   │
│ GET  /admin/dashboard               │
│ GET  /admin/products                │
│ POST /admin/api/products            │
│ PUT  /admin/api/products/:id        │
│ DEL  /admin/api/products/:id        │
└─────────────────────────────────────┘
```

### JWT Token Flow

```
1. Login Request
   POST /admin/api/auth/login
   Body: { email, password }
   ↓
2. Validate Credentials
   Check database
   ↓
3. Generate JWT Token
   jwt.sign({ userId, email }, SECRET, { expiresIn: '24h' })
   ↓
4. Return Token
   Response: { token, user }
   ↓
5. Store Token
   localStorage.setItem('auth_token', token)
   ↓
6. Subsequent Requests
   fetch('/admin/api/...', {
     headers: {
       'Authorization': 'Bearer ' + token
     }
   })
   ↓
7. Verify Token (Middleware)
   isAuthenticated() → jwt.verify(token, SECRET)
   ↓
8. Grant Access or Reject (401)
```

### CORS Configuration

```typescript
// server/middleware/cors.ts
import cors from 'cors';

const allowedOrigins = [
  'http://localhost:5002',  // Development
  process.env.PRODUCTION_URL, // Production
];

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
});

// Apply to app
app.use(corsMiddleware);
```

---

## Production Architecture

### Deployment Topology

```
┌──────────────────────────────────────────────────────┐
│                    Internet                          │
└─────────────────────┬────────────────────────────────┘
                      │ HTTPS (443)
                      │ HTTP (80)
                      ▼
┌──────────────────────────────────────────────────────┐
│                Load Balancer                         │
│               (Optional - AWS ALB)                   │
└─────────────────────┬────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────┐
│                Nginx Reverse Proxy                   │
│                  (Port 80/443)                       │
│                                                      │
│  location / {                                        │
│    proxy_pass http://localhost:5002;                 │
│  }                                                   │
└─────────────────────┬────────────────────────────────┘
                      │ Internal: port 5002
                      ▼
┌──────────────────────────────────────────────────────┐
│              Node.js Application                     │
│              (Express Server)                        │
│                  Port 5002                           │
│                                                      │
│  ┌─────────┐  ┌─────────┐  ┌────────┐              │
│  │ Public  │  │  Admin  │  │  API   │              │
│  │ Routes  │  │ Routes  │  │ Routes │              │
│  └─────────┘  └─────────┘  └────────┘              │
└─────────────────────┬────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────┐
│              PostgreSQL Database                     │
│                  Port 5432                           │
└──────────────────────────────────────────────────────┘
```

### Nginx Configuration

```nginx
# /etc/nginx/sites-available/cms-app

upstream app_server {
  server localhost:5002;  # Internal port 5002
}

server {
  listen 80;
  listen 443 ssl http2;
  server_name example.com;

  # SSL Configuration
  ssl_certificate /etc/ssl/certs/example.com.crt;
  ssl_certificate_key /etc/ssl/private/example.com.key;

  # Proxy to port 5002
  location / {
    proxy_pass http://app_server;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
  }

  # Static assets caching
  location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    proxy_pass http://app_server;
    expires 1y;
    add_header Cache-Control "public, immutable";
  }
}
```

### PM2 Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'cms-app',
    script: './dist/server/index.js',
    instances: 'max',  // Use all CPU cores
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5002,  // Always port 5002
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5002,
    },
  }],
};
```

**Start:**
```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

---

## Monitoring & Observability

### Health Checks

**Endpoint:** `GET /api/health`

```typescript
// server/routes/api/health.ts
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    port: 5002,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});
```

**Usage:**
```bash
# Local health check
curl http://localhost:5002/api/v1/v1/health

# Production health check (via Nginx)
curl https://example.com/api/health
```

### Port Monitoring

```bash
# Check what's running on port 5002
lsof -i :5002

# Monitor port usage
watch -n 1 'lsof -i :5002'

# Check if port is listening
nc -zv localhost 5002
```

### Logging

```typescript
// server/middleware/logger.ts
import morgan from 'morgan';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'cms-app', port: 5002 },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

export const httpLogger = morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim()),
  },
});

export { logger };
```

---

## Performance Considerations

### Connection Limits

```typescript
// server/index.ts
const server = app.listen(5002, () => {
  console.log('Server running on port 5002');
});

// Set connection limits
server.maxConnections = 1000;
server.setTimeout(30000); // 30 seconds
```

### Keep-Alive Configuration

```typescript
// server/index.ts
import { createServer } from 'http';

const server = createServer(app);

server.keepAliveTimeout = 65000; // Longer than ALB timeout (60s)
server.headersTimeout = 66000;

server.listen(5002);
```

### Load Testing

```bash
# Install k6
brew install k6

# Test port 5002 capacity
k6 run --vus 100 --duration 30s - <<EOF
import http from 'k6/http';
import { check } from 'k6';

export default function () {
  const res = http.get('http://localhost:5002/api/v1/v1/products');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
EOF
```

---

## Disaster Recovery

### Port Conflict Resolution

```bash
#!/bin/bash
# scripts/fix-port-conflict.sh

echo "Checking port 5002..."

PID=$(lsof -ti:5002)

if [ -n "$PID" ]; then
  echo "Port 5002 is in use by process $PID"
  ps -p $PID
  
  read -p "Kill process? (y/n) " -n 1 -r
  echo
  
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    kill -9 $PID
    echo "Process killed"
  fi
else
  echo "Port 5002 is available"
fi

echo "Starting application..."
npm run dev
```

### Backup Configuration

```bash
# Backup critical config files
tar -czf port-5002-config-backup.tar.gz \
  vite.config.ts \
  server/index.ts \
  .env.example \
  package.json \
  scripts/verify-port-5002.js

# Restore from backup
tar -xzf port-5002-config-backup.tar.gz
```

---

## Future Considerations

### Microservices Migration

If the system grows and needs to split into microservices:

```
┌────────────────────────────────────────┐
│         API Gateway (Port 80/443)      │
└─────────────────┬──────────────────────┘
                  │
     ┌────────────┼────────────┐
     │            │            │
     ▼            ▼            ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│ Frontend │ │ Products │ │   Blog   │
│ Service  │ │ Service  │ │ Service  │
│ Port 5002│ │ Port 5003│ │ Port 5004│
└──────────┘ └──────────┘ └──────────┘
```

**Note:** Even in microservices, each service should have a single consistent port.

---

## Compliance Checklist

Before deploying to any environment:

- [ ] `npm run verify-port` passes
- [ ] All configuration files reference port 5002
- [ ] Health check endpoint works on port 5002
- [ ] Nginx/reverse proxy configured for port 5002
- [ ] Environment variables set to port 5002
- [ ] Docker containers expose port 5002
- [ ] PM2 ecosystem configured for port 5002
- [ ] Monitoring tools configured for port 5002
- [ ] Documentation updated with port 5002
- [ ] Team trained on port 5002 compliance

---

## Conclusion

Port 5002 is the foundation of this system's architecture. Maintaining strict compliance ensures:
- ✅ Consistent development experience
- ✅ Simplified configuration
- ✅ Reduced debugging time
- ✅ Clear documentation
- ✅ Easier onboarding

**Remember:** Any deviation from port 5002 is a bug, not a feature.

---

**Document Owner:** Development Team  
**Review Cycle:** Quarterly  
**Last Review:** February 2026  
**Next Review:** May 2026  
**Questions:** team@wear-run.com
