# RUN APPAREL CMS System

**Version:** 2.0  
**Port:** 5002 (Exclusively)  
**Last Updated:** February 2026

---

## 🚨 CRITICAL: This System Uses Port 5002 Exclusively

**ALL services, routes, and APIs run on port 5002.**

```
✓ Server:      http://localhost:5002
✓ Admin Panel: http://localhost:5002/admin
✓ Public Site: http://localhost:5002
- **API**:         http://localhost:5002/api/v1
```

**If you see any other port, that's a bug.**

---

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 24
- npm or pnpm
- PostgreSQL (or your configured database)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd cms-system

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# CRITICAL: Verify port 5002 is configured
npm run verify-port

# Start development server (port 5002)
npm run dev
```

### Verification

Open your browser to:

- **Public Site:** http://localhost:5002
- **Admin Panel:** http://localhost:5002/admin
- **API Health:** http://localhost:5002/api/v1/health

**If any URL fails, check port configuration.**

---

## 📁 Project Structure

```
cms-system/
├── client/                  # Frontend (React 19 + Vite)
│   ├── app/
│   │   ├── components/
│   │   │   ├── ui/         # Generic UI components
│   │   │   ├── admin/      # Admin-specific components
│   │   │   └── [domain]/   # Domain components
│   │   ├── pages/
│   │   │   ├── admin/      # Admin pages
│   │   │   └── *.tsx       # Public pages
│   │   ├── routes/
│   │   │   ├── index.tsx   # Public routes
│   │   │   └── admin.tsx   # Admin routes
│   │   └── styles/
│   └── index.html
│
├── server/                  # Backend (Express 5 + Node.js)
│   ├── routes/
│   │   ├── api/
│   │   │   ├── public.ts   # Public API endpoints
│   │   │   └── admin.ts    # Admin API endpoints
│   │   └── index.ts
│   ├── services/           # Business logic
│   ├── middleware/
│   ├── models/
│   └── index.ts            # Server entry (PORT 5002)
│
├── shared/                  # Shared code
│   └── constants/
│       └── routeMapping.ts  # Route mapping table
│
├── docs/                    # Documentation
│   ├── PORT_5002_ARCHITECTURE.md
│   ├── ROUTE_MAPPING.md
│   └── TROUBLESHOOTING.md
│
├── scripts/
│   └── verify-port-5002.js  # Port verification script
│
├── .env                     # Environment (PORT=5002)
├── .env.example            # Template (PORT=5002)
├── vite.config.ts          # Vite config (port: 5002)
├── package.json            # Scripts for port 5002
├── RULES.md                # Coding rules (Rule #0: Port 5002)
├── WORKFLOW.md             # Development workflow
├── AGENT.md                # AI agent instructions
└── README.md               # This file
```

---

## 🎯 Tech Stack

### Frontend
- **React 19** - No forwardRef (uses raw ref prop)
- **Vite 7** - Dev server on port 5002
- **TypeScript** - Strict mode, no `any`
- **Tailwind V4** - @utility syntax for custom CSS
- **React Router** - Client-side routing

### Backend
- **Express 5** - Async handlers (no try-catch needed)
- **Node.js ≥24**
- **PostgreSQL** - Primary database
- **Service Architecture** - Business logic in services/

### 3D Content
- **@google/model-viewer** - ONLY 3D solution
- **UnifiedModelViewer** - Wrapper component
- ❌ **NEVER** use React Three Fiber or drei

### Development Tools
- **Vitest** - Testing framework
- **Biome** - Linting and formatting
- **Lucide React** - Icons
- **React Hook Form** - Form handling
- **Zod** - Validation
- **CVA** - Component variants

---

## 🔧 Configuration Files

### Critical Port 5002 Files

**These files MUST reference port 5002:**

#### vite.config.ts
```typescript
export default defineConfig({
  server: {
    port: 5002,           // Line 7
    strictPort: true,     // Fail if unavailable
  },
});
```

#### server/index.ts
```typescript
const PORT = 5002;        // Line 5 - Hardcoded
app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
});
```

#### .env
```bash
PORT=5002
VITE_API_BASE_URL=http://localhost:5002/api/v1
VITE_ADMIN_BASE_URL=http://localhost:5002/admin
```

#### package.json
```json
{
  "scripts": {
    "dev:client": "vite --port 5002",
    "verify-port": "node scripts/verify-port-5002.js"
  }
}
```

---

## 📋 Available Scripts

### Development

```bash
# Start development server (port 5002)
npm run dev

# Start client only (port 5002)
npm run dev:client

# Start server only (port 5002)
npm run dev:server
```

### Port Management

```bash
# Verify port 5002 compliance (RUN BEFORE EVERY COMMIT)
npm run verify-port

# Check what's on port 5002
lsof -i :5002

# Kill process on port 5002
kill -9 $(lsof -t -i:5002)
```

### Code Quality

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Format code
npm run format
```

### Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Integration tests
npm run test:integration
```

### Build & Deploy

```bash
# Build for production
npm run build

# Start production server (port 5002)
npm run start

# Preview production build
npm run preview
```

---

## 🗺️ Route Structure

### Public Routes (http://localhost:5002)

| Route | Component | Admin Equivalent |
|-------|-----------|------------------|
| `/` | HomePage | `/admin/dashboard` |
| `/products` | ProductsPage | `/admin/products` |
| `/products/:id` | ProductDetailPage | `/admin/products/:id/edit` |
| `/blog` | BlogPage | `/admin/blog/posts` |
| `/blog/:slug` | BlogPostPage | `/admin/blog/posts/:id/edit` |
| `/about` | AboutPage | `/admin/pages/about` |
| `/contact` | ContactPage | `/admin/settings/contact` |
| `/gallery` | GalleryPage | `/admin/media/gallery` |

### Admin Routes (http://localhost:5002/admin)

**All admin routes require authentication.**

| Route | Component | Public Equivalent |
|-------|-----------|-------------------|
| `/admin/dashboard` | DashboardPage | `/` |
| `/admin/products` | ProductsManagementPage | `/products` |
| `/admin/products/:id/edit` | ProductEditorPage | `/products/:id` |
| `/admin/blog/posts` | BlogPostsPage | `/blog` |
| `/admin/blog/posts/:id/edit` | PostEditorPage | `/blog/:slug` |
| `/admin/pages/about` | PageEditorPage | `/about` |
| `/admin/settings/contact` | ContactSettingsPage | `/contact` |
| `/admin/media/gallery` | MediaGalleryPage | `/gallery` |

**See `docs/ROUTE_MAPPING.md` for complete mapping.**

---

## 🔌 API Endpoints

### Public API (http://localhost:5002/api/v1)

Returns only published content.

```bash
GET  /api/products              # List published products
GET  /api/products/:id          # Get product details
GET  /api/blog/posts            # List published blog posts
GET  /api/blog/posts/:slug      # Get post by slug
GET  /api/pages/:id             # Get page content
```

### Admin API (http://localhost:5002/admin/api)

**Requires authentication.** Returns all content (published + drafts).

```bash
# Dashboard
GET  /admin/api/dashboard/stats

# Products
GET  /admin/api/products        # List all products
POST /admin/api/products        # Create product
PUT  /admin/api/products/:id    # Update product
DEL  /admin/api/products/:id    # Delete product

# Blog
GET  /admin/api/blog/posts      # List all posts
POST /admin/api/blog/posts      # Create post
PUT  /admin/api/blog/posts/:id  # Update post
DEL  /admin/api/blog/posts/:id  # Delete post

# Media
GET  /admin/api/media           # List media files
POST /admin/api/media/upload    # Upload file
DEL  /admin/api/media/:id       # Delete file
```

---

## 🔐 Authentication

### Admin Access

Admin panel requires authentication via JWT tokens.

```bash
# Login
POST http://localhost:5002/admin/api/auth/login
{
  "email": "admin@example.com",
  "password": "password"
}

# Response
{
  "token": "eyJhbGc...",
  "user": { ... }
}
```

**Token stored in httpOnly cookie.**

### Protected Routes

All `/admin/*` routes check authentication via middleware:

```typescript
router.use('/admin/api', isAuthenticated);
```

---

## 🛠️ Development Workflow

### Adding a New Page

**CRITICAL:** Every public page MUST have an admin counterpart.

**Example: Adding a "Team" page**

#### 1. Create Public Route

```typescript
// client/app/routes/index.tsx
<Route path="/team" element={<TeamPage />} />
```

#### 2. Create Admin Route (REQUIRED)

```typescript
// client/app/routes/admin.tsx
<Route path="/admin/team" element={<TeamManagementPage />} />
```

#### 3. Create API Endpoints

```typescript
// Public API
router.get('/api/team', async (req, res) => {
  const members = await teamService.getAllPublished();
  res.json(members);
});

// Admin API (REQUIRED)
router.get('/admin/api/team', isAuthenticated, async (req, res) => {
  const members = await teamService.getAll();
  res.json(members);
});
```

#### 4. Update Route Mapping

```typescript
// shared/constants/routeMapping.ts
{
  public: '/team',
  admin: '/admin/team',
  description: 'Team Page / Team Management',
  apiEndpoint: '/api/team',
}
```

#### 5. Verify

```bash
npm run verify-port     # Port compliance
npm run build           # Build verification
npm run test            # Run tests
```

#### 6. Test Manually

```bash
# Test public page
curl http://localhost:5002/team

# Test admin page (requires auth)
curl http://localhost:5002/admin/team
```

**See `WORKFLOW.md` for detailed processes.**

---

## 📚 Documentation

### Core Documentation

- **RULES.md** - Coding standards (Rule #0: Port 5002)
- **WORKFLOW.md** - Development processes
- **AGENT.md** - AI agent instructions

### Architecture Documentation

- **docs/PORT_5002_ARCHITECTURE.md** - Port 5002 system design
- **docs/ROUTE_MAPPING.md** - Frontend-admin route mapping
- **docs/TROUBLESHOOTING.md** - Common issues and fixes

### API Documentation

- **docs/API.md** - Complete API reference
- **Swagger/OpenAPI** - Interactive API docs at `/api/docs`

---

## 🚨 Troubleshooting

### Port 5002 Already in Use

```bash
# Find process on port 5002
lsof -i :5002

# Kill the process
kill -9 <PID>

# Or kill all node processes
killall node

# Restart dev server
npm run dev
```

### Admin Panel Not Loading

1. **Check authentication:**
   ```bash
   # Verify token in browser localStorage or cookies
   ```

2. **Verify port:**
   ```bash
   npm run verify-port
   ```

3. **Check server logs:**
   ```bash
   # Look for "Server running on http://localhost:5002"
   ```

### API Calls Failing

1. **Verify base URL:**
   ```bash
   echo $VITE_API_BASE_URL
   # Should be: http://localhost:5002/api/v1
   ```

2. **Check CORS configuration:**
   ```typescript
   // server/middleware/cors.ts should allow localhost:5002
   ```

3. **Test endpoint directly:**
   ```bash
   curl http://localhost:5002/api/v1/health
   ```

### Port Verification Fails

```bash
# Run verification with verbose output
npm run verify-port

# Example error:
❌ vite.config.ts contains forbidden port (not 5002)

# Fix the issue in the mentioned file
# Change port to 5002

# Re-run verification
npm run verify-port
```

**See `docs/TROUBLESHOOTING.md` for more issues.**

---

## ✅ Pre-Commit Checklist

**Before EVERY commit, verify:**

```bash
# Port compliance (MANDATORY)
npm run verify-port

# Code quality
npm run lint
npm run typecheck

# Tests
npm run test

# Build
npm run build
```

**All must pass before committing.**

### Pre-Commit Hook

This project uses Husky to automatically run checks:

```bash
# .husky/pre-commit
npm run verify-port && lint-staged
```

If pre-commit hook fails, fix issues before committing.

---

## 🎯 Coding Standards

### Rule #0: Port 5002 Compliance

**ALWAYS use port 5002. NO exceptions.**

```typescript
// ✅ CORRECT
const PORT = 5002;

// ❌ WRONG
const PORT = 3000;
const PORT = process.env.PORT || 3000;
```

### Rule #1: TypeScript Strict Mode

**No `any` types allowed.**

```typescript
// ✅ CORRECT
function getUser(id: string): Promise<User> {
  return userService.findById(id);
}

// ❌ WRONG
function getUser(id: any): Promise<any> {
  return userService.findById(id);
}
```

### Rule #2: React 19 Standards

**No forwardRef. Use raw ref prop.**

```typescript
// ✅ CORRECT
export function Input({ ref, ...props }: { ref?: Ref<HTMLInputElement> }) {
  return <input ref={ref} {...props} />;
}

// ❌ WRONG
const Input = forwardRef((props, ref) => {
  return <input ref={ref} {...props} />;
});
```

### Rule #3: Frontend-Admin Mapping

**Every public page MUST have an admin counterpart.**

```typescript
// ✅ CORRECT - Both routes exist
<Route path="/products" element={<ProductsPage />} />
<Route path="/admin/products" element={<ProductsManagementPage />} />

// ❌ WRONG - Missing admin route
<Route path="/products" element={<ProductsPage />} />
// Missing admin counterpart!
```

**See `RULES.md` for complete coding standards.**

---

## 🧪 Testing

### Unit Tests

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Integration Tests

```bash
# API integration tests
npm run test:integration

# Test specific endpoint
npm run test:integration -- products
```

### E2E Tests

```bash
# Run E2E tests
npm run test:e2e

# Run specific test
npm run test:e2e -- login
```

### Testing Standards

- Service layer: **80%+ coverage required**
- API endpoints: **Integration tests required**
- Critical flows: **E2E tests recommended**

---

## 🚀 Deployment

### Production Build

```bash
# Build project
npm run build

# Output:
# - client/dist/       # Frontend build
# - server/dist/       # Backend build
```

### Production Environment

**Environment Variables (.env.production):**

```bash
PORT=5002
NODE_ENV=production
DATABASE_URL=postgresql://...
SESSION_SECRET=...
```

### Starting Production Server

```bash
# Start server (port 5002)
npm run start

# Or with PM2
pm2 start dist/server/index.js --name cms-app

# Verify
curl http://localhost:5002/api/v1/health
```

### Docker Deployment

```yaml
# docker-compose.yml
services:
  app:
    build: .
    ports:
      - "5002:5002"  # Port 5002 mapping
    environment:
      - PORT=5002
      - NODE_ENV=production
```

**Deploy:**

```bash
docker-compose up -d
```

---

## 🔒 Security Considerations

### Authentication

- JWT tokens in httpOnly cookies
- Token expiration: 24 hours
- Refresh token mechanism implemented

### API Security

- Rate limiting on public endpoints
- Authentication middleware on admin routes
- Input validation with Zod
- SQL injection prevention (parameterized queries)
- XSS protection (sanitize user input)

### CORS Configuration

```typescript
// Only allow localhost:5002 in development
const allowedOrigins = ['http://localhost:5002'];
```

---

## 📊 Performance Guidelines

### Bundle Size Targets

- Main bundle: < 200KB (gzipped)
- Route chunks: < 50KB each
- Total initial load: < 300KB

### API Response Times

- Public API: < 200ms (p95)
- Admin API: < 500ms (p95)
- Database queries: Use indexes

### Optimization Techniques

- Lazy loading for admin pages
- Dynamic imports for heavy components
- Image optimization (WebP format)
- CDN for static assets

---

## 🤝 Contributing

### Getting Started

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/name`
3. Read `RULES.md` and `WORKFLOW.md`
4. Implement your feature
5. Run pre-commit checks
6. Submit a pull request

### Pull Request Guidelines

**PR must include:**
- [ ] `npm run verify-port` passes
- [ ] `npm run build` passes
- [ ] `npm run test` passes
- [ ] Tests for new features
- [ ] Updated documentation
- [ ] Route mapping updated (if new pages)

**PR template available in:** `.github/PULL_REQUEST_TEMPLATE.md`

---

## 📞 Support

### Documentation

- **README.md** - This file
- **RULES.md** - Coding standards
- **WORKFLOW.md** - Development processes
- **AGENT.md** - AI agent instructions
- **docs/** - Architecture and guides

### Common Issues

See `docs/TROUBLESHOOTING.md` for solutions to common problems.

### Questions?

- Check existing documentation
- Search closed issues on GitHub
- Ask in #development Slack channel
- Tag @team-lead for urgent issues

---

## 📜 License

[Your License Here]

---

## 🎉 Project Status

**Current Version:** 2.0  
**Port:** 5002 (Mandatory)  
**Status:** Active Development  
**Last Updated:** February 2026

---

## 📝 Changelog

### Version 2.0 (February 2026)
- ✅ Standardized port 5002 across all services
- ✅ Implemented frontend-admin route mapping
- ✅ Added comprehensive documentation
- ✅ Created port verification script
- ✅ Added pre-commit hooks
- ✅ Updated all configuration files

### Version 1.0 (Initial Release)
- Initial CMS implementation
- Basic public and admin interfaces
- API endpoints

---

**Remember:** This system uses **port 5002 exclusively**. Any deviation is a bug.

**For questions about port configuration:** See `docs/PORT_5002_ARCHITECTURE.md`  
**For development workflow:** See `WORKFLOW.md`  
**For coding standards:** See `RULES.md`  
**For AI agents:** See `AGENT.md`
