# Architecture Discovery Report: Contact Page CMS Enhancement
**RUN APPAREL (PVT) LTD - B2B Sportswear Manufacturing Platform**

---

**Report Date:** October 20, 2025  
**Purpose:** Comprehensive architecture analysis for implementing admin-editable contact page content management  
**Objective:** Document existing system architecture, patterns, and implementation details to inform contact page CMS development with NEON cost optimization through intelligent caching strategies

---

## Executive Summary

This report provides a complete architectural analysis across 6 phases to guide the implementation of an admin content management system for the contact page. The analysis covers existing infrastructure, identifies gaps, and provides detailed design recommendations for database schema, API contracts, frontend components, and optimization strategies.

### Key Findings

**Existing Infrastructure (Strong Foundation):**
- ✅ NEON PostgreSQL with HTTP driver (serverless-optimized)
- ✅ Drizzle ORM with comprehensive schema (2,395 lines)
- ✅ 3-tier caching system (React Query + Replit KV + NEON)
- ✅ TanStack React Query v5 for data fetching
- ✅ React Hook Form + Zod for validation
- ✅ 80+ shadcn/ui components available
- ✅ Contact page and admin routes already exist
- ✅ Domain-driven API architecture with 24 CMS content routes

**Critical Gaps Identified:**
- ❌ **No authentication system** (security risk for admin routes)
- ❌ Contact content not in database schema
- ❌ No admin API for contact content management

### Expected Impact

**Performance Gains:**
- Sub-millisecond response from L1 cache (React Query)
- <10ms response from L2 cache (Replit KV)
- ~50-100ms from NEON (cache miss only)

**Cost Optimization:**
- **95% reduction** in NEON active time
- **97% reduction** in NEON queries (100/day → 3/day)
- Estimated monthly cost savings: Significant

**User Experience:**
- Instant page loads from client-side cache
- Real-time admin updates with optimistic UI
- Clear validation and error messages
- No page refreshes needed

---

## Table of Contents

1. [Phase 1: Architecture Discovery](#phase-1-architecture-discovery)
   - 1.1 [Project Structure and Routing](#11-project-structure-and-routing-analysis)
   - 1.2 [Database Architecture](#12-database-architecture-investigation)
   - 1.3 [Frontend Architecture](#13-frontend-architecture-and-component-patterns)
   - 1.4 [Backend API Patterns](#14-backend-api-and-middleware-patterns)

2. [Phase 2: Content Management Strategy](#phase-2-content-management-strategy)
   - 2.1 [Authentication and Authorization](#21-admin-authentication-and-authorization-review)
   - 2.2 [Storage Options Analysis](#22-replit-storage-options-investigation)

3. [Phase 3: Data Structure Design](#phase-3-data-structure-and-schema-design)
   - 3.1 [Database Schema](#31-database-schema-design-for-contact-content)
   - 3.2 [API Contracts](#32-api-contract-design-for-content-management)
   - 3.3 [Migration Strategy](#33-migration-strategy-and-default-content)

4. [Phase 4: Component Architecture](#phase-4-component-architecture-design)
   - 4.1 [Contact Page Components](#41-contact-page-component-structure)
   - 4.2 [Admin Panel Components](#42-admin-panel-component-structure)
   - 4.3 [Data Fetching Patterns](#43-data-fetching-and-state-management-design)

5. [Phase 5: Form Handling](#phase-5-form-handling-and-validation)
   - 5.1 [Validation Schemas](#51-validation-schema-design)
   - 5.2 [Error Handling](#52-form-submission-and-error-handling)

6. [Phase 6: Optimization](#phase-6-optimization-and-caching)
   - 6.1 [Caching Strategy](#61-neon-cost-optimization-strategy)
   - 6.2 [Query Optimization](#62-query-optimization-for-neon)

7. [Implementation Roadmap](#implementation-roadmap)
8. [Appendix](#appendix)

---

## PHASE 1: ARCHITECTURE DISCOVERY

### 1.1 Project Structure and Routing Analysis

#### Directory Structure

**Frontend Architecture (`client/src/`)**

```
client/src/
├── components/           # 200+ React components
│   ├── admin/           # Admin panel components
│   │   ├── categories/
│   │   ├── contact-management/  ✓ EXISTS
│   │   ├── manufacturing/
│   │   ├── media-library/
│   │   ├── product-management-unified/
│   │   ├── sustainability/
│   │   └── technology/
│   ├── contact/         # Contact page components
│   │   ├── ContactForm.tsx
│   │   ├── ContactHero.tsx
│   │   ├── ContactInfo.tsx
│   │   ├── ContactLayout.tsx
│   │   └── index.ts
│   ├── ui/              # 80+ shadcn/ui components
│   ├── products/
│   ├── homepage/
│   └── navigation/
├── pages/               # 22 page components
│   ├── admin/
│   │   ├── contact-management.tsx  ✓ EXISTS
│   │   ├── media.tsx
│   │   ├── about-management.tsx
│   │   └── ...
│   ├── contact.tsx      ✓ EXISTS
│   ├── home.tsx
│   └── ...
├── hooks/               # 40+ custom hooks
├── lib/                 # Utilities
│   ├── queryClient.ts
│   ├── media-query-keys.ts
│   └── ...
└── context/             # AdminContext
```

**Backend Architecture (`server/`)**

```
server/
├── routes/              # Domain-organized (MASTER ROUTER PATTERN)
│   ├── core/           # 8 business entity routes
│   │   ├── products.ts
│   │   ├── categories.ts
│   │   └── ...
│   ├── admin/          # 2 admin operation routes
│   ├── utilities/      # 8 diagnostic/metrics routes
│   ├── resources/      # 24 CMS content routes
│   │   ├── contact.routes.ts  ✓ EXISTS
│   │   ├── homepage.routes.ts
│   │   ├── about.routes.ts
│   │   └── ...
│   └── media/          # Media management
├── lib/                # Business logic
│   ├── repositories/   # Data access patterns
│   │   ├── media-repository.ts
│   │   ├── product-repository.ts
│   │   ├── page-content-repository.ts
│   │   └── misc-repository.ts
│   ├── unified-replit-cache.ts  # 2-tier caching (2,047 lines)
│   ├── query-performance-monitor.ts
│   └── ...
├── middleware/         # Security, rate limiting, errors
├── config/            # Environment configuration
└── db.ts              # Database connection
```

**Shared Schema (`/shared/`)**

```
shared/
├── schema.ts          # 2,395 lines - Complete Drizzle schema
└── api-constants.ts   # Shared API constants
```

**Database (`/db/` and `/migrations/`)**

```
migrations/
├── meta/
│   ├── 0000_snapshot.json
│   └── _journal.json
└── 0000_ordinary_dreadnoughts.sql
```

#### Routing Configuration

**Frontend Routing (Wouter)** - `client/src/App.tsx`

**Public Routes:**
```typescript
/                              → Homepage
/products                      → Product listing
/contact                       → Contact page ✓ EXISTS
/categories/:slug              → Category products
/categories/:category/:product → Hierarchical product detail
/about, /sustainability, /manufacturing, /technology
/resources/*                   → Resource pages with error boundaries
```

**Admin Routes:**
```typescript
/admin                    → Admin dashboard
/admin/contact            → Contact management ✓ EXISTS
/admin/products           → Product management
/admin/media              → Media library
/admin/homepage           → Homepage CMS
/admin/about              → About page CMS
/admin/sustainability     → Sustainability CMS
/admin/manufacturing      → Manufacturing CMS
/admin/technology         → Technology CMS
```

**Route Preloading:**
```typescript
// Uses requestIdleCallback to preload critical routes
requestIdleCallback(() => {
  preloadRoutes(['products', 'about', 'categories', 'contact']);
});
```

**Backend Routing (Express)** - `server/routes/index.ts`

**API Structure:** Flat routes at `/api/*` (no nested versioning)

**Contact-Related Routes** (`server/routes/resources/contact.routes.ts`):
```typescript
POST   /api/contact              → Contact form submission (Zod validation)
GET    /api/contact-info         → Get contact configuration (cached 15min)
GET    /api/locations            → Get business locations (cached 1hr)
```

**Route Organization Features:**
- Modular router pattern with default exports
- Rate limiting: General (100/15min), Admin (30/15min), Diagnostics (10/1min)
- Cache bypass: Admin referer or `?nocache=true` query param
- Compression middleware for JSON/text responses

#### Dependencies Analysis

**Core Dependencies:**

| Dependency | Version | Purpose |
|------------|---------|---------|
| React | 19.0.0 | Frontend framework with improved metadata API |
| TanStack React Query | 5.60.5 | Server state management (object-form API only) |
| React Hook Form | 7.55.0 | Form state management ✓ |
| Zod | 3.24.2 | Schema validation ✓ |
| Drizzle ORM | 0.44.5 | PostgreSQL ORM |
| Drizzle Kit | 0.31.4 | Migration tooling |
| @neondatabase/serverless | 1.0.1 | NEON HTTP driver ✓ |
| @replit/database | 3.0.1 | KV Store for caching ✓ |
| @replit/object-storage | 1.0.0 | File storage ✓ |
| Express | 4.21.2 | Backend framework |
| Wouter | 3.3.5 | Lightweight routing |

**shadcn/ui Components** (80+ available):
- accordion, alert-dialog, button, card, checkbox, dialog, dropdown-menu
- **form ✓**, **input ✓**, **label ✓**, select, separator, sheet, switch
- tabs, **textarea ✓**, toast, tooltip, and many more

**Configuration:** New York style, TypeScript, Tailwind with CSS variables

#### Configuration Files

**vite.config.ts**
- React plugin with Replit-specific plugins (runtime-error-modal, cartographer)
- Path aliases: `@/` → client/src, `@shared/` → shared, `@assets/` → attached_assets
- Build output: dist/public
- Strict filesystem access

**tailwind.config.ts**
- Dark mode: class-based
- Extended color palette with CSS variables
- Custom style1 color system
- Typography plugin enabled

**tsconfig.json**
- Project references: scripts, utils, client, server, shared
- Module: ESNext with bundler resolution
- Strict mode enabled

**drizzle.config.ts**
- Schema: `./shared/schema.ts`
- Output: `./migrations`
- PostgreSQL dialect
- Filters: Excludes NEON internal tables

---

### 1.2 Database Architecture Investigation

#### Database Connection

**Technology Stack:**
- **NEON HTTP driver** (`@neondatabase/serverless`)
- **Drizzle ORM** with `drizzle-orm/neon-http`
- **Connection Mode**: HTTP-based (serverless-compatible, no TCP pool exhaustion)

**Connection Setup** (`server/db.ts`):
```typescript
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../shared/schema.js';

const sql = neon(database.url);
export const db: NeonHttpDatabase<typeof schema> = drizzle(sql, { schema });
```

**DATABASE_URL Validation:**
Comprehensive startup checks:
1. ✓ URL exists and non-empty
2. ✓ Protocol is `postgresql://` or `postgres://`
3. ✓ Contains hostname and database name
4. ⚠️ NEON pooling warning if `-pooler` suffix missing

**Query Timeout Protection:**
```typescript
withQueryTimeout(operation, timeoutMs = 5000, operationName)
// Uses Promise.race + AbortController pattern
// Custom QueryTimeoutError class
```

**Type Exports:**
```typescript
type DbClient = Database | Parameters<Parameters<Database['transaction']>[0]>[0];
type Database = typeof db;
```

#### Schema Files

**Primary Schema:** `shared/schema.ts` (2,395 lines)

**Key Tables for Contact Management:**

**Existing Content Tables:**
```typescript
contact_page_configuration    // Contact page settings (hero, layout, SEO)
contact_inquiries            // Contact form submissions
homepage_*                   // Homepage content (hero, slogans, sections, etc.)
about_*                      // About page content (hero, sections, team, etc.)
sustainability_*             // Sustainability content
manufacturing_*              // Manufacturing content
technology_*                 // Technology page content
```

**Schema Patterns:**
```typescript
// Custom table creator (Drizzle 0.44+ compliance)
const pgTable = pgTableCreator((name) => name);

// Foreign keys with explicit cascade rules
foreignKey: { onDelete: 'set null' | 'restrict' | 'cascade' }

// JSONB for flexible nested data
jsonb('social_links').$type<Array<{ platform: string; url: string }>>()

// Composite indexes for performance
index('idx_products_category').on(products.categoryId)

// Soft delete support
deletedAt: timestamp('deleted_at')

// Optimistic locking
version: integer('version').default(1).notNull()

// Timestamps
createdAt: timestamp('created_at').defaultNow()
updatedAt: timestamp('updated_at').defaultNow()
```

**Naming Conventions:**
- Tables: `lowercase_with_underscores`
- TypeScript columns: `camelCase`
- Database columns: `snake_case`
- Indexes: `idx_{table}_{column}`

#### Migration Strategy

**Directory:** `/migrations/`

**Commands:**
```bash
# Generate migration (manual)
drizzle-kit generate

# Push schema to database
npm run db:push

# Force push (skip confirmation)
npm run db:push --force
```

**Strategy:**
- Drizzle Kit manages migrations automatically
- Schema changes pushed directly to NEON database
- No manual SQL migration writing required

#### ORM Query Patterns

**SELECT Examples:**
```typescript
// Specific column selection (performance optimized)
await db.select({
  heroHeading: contactContent.heroHeading,
  locationAddress: contactContent.locationAddress
}).from(contactContent).limit(1);

// With relations and joins
await db.query.products.findMany({
  with: { category: true, primaryImage: true }
});
```

**INSERT Example:**
```typescript
await db.insert(contactInquiries).values(data).returning();
```

**UPDATE Example:**
```typescript
await db.update(contactContent)
  .set({ heroHeading: 'New Heading' })
  .returning();
```

**TRANSACTION Example:**
```typescript
await db.transaction(async (tx) => {
  // Multiple operations with rollback on error
  await tx.update(content).set({ ... });
  await tx.insert(auditLog).values({ ... });
});
```

**Repository Pattern:**
Found in `server/lib/repositories/`:
- Abstraction layer over direct Drizzle queries
- Methods like `getContactPageConfiguration()`, `updateContactPageConfiguration()`
- Centralized query logic with error handling

---

### 1.3 Frontend Architecture and Component Patterns

#### Component Organization

**Naming Convention:**
- Components: PascalCase
- Files: kebab-case
- Single-export pattern: One component per file with default export
- Index files for barrel exports

**Component Structure:**
```
components/
├── presentational components (UI only)
pages/
├── page-level components (with data fetching)
components/admin/
├── admin-specific components
components/ui/
└── shadcn/ui shared components
```

#### Current /contact Implementation

**Page Component:** `client/src/pages/contact.tsx`

**Architecture:**
```tsx
Contact Page
├── useQuery<ContactConfig>('/api/contact-info')  ← Fetch configuration
├── ContactLayout (wrapper)
│   ├── ContactHero (title, subtitle)
│   ├── ContactInfo (email, phone, address, hours)
│   └── ContactForm (name, email, subject, message)
```

**Data Flow:**
1. Page fetches `ContactConfig` from `/api/contact-info`
2. Passes props down to presentational components
3. Components are pure (no API calls inside)
4. Loading states with skeleton UI

**Contact Components** (`client/src/components/contact/`):
```typescript
ContactHero.tsx     // Hero section with title/subtitle
ContactInfo.tsx     // Display contact information cards
ContactForm.tsx     // Form with validation and submission
ContactLayout.tsx   // Layout wrapper
index.ts           // Barrel export
```

**ContactForm Implementation Highlights:**
- Uses `useMutation` for form submission
- Zod validation: `contactFormSchema`
- Client-side validation with field-level error display
- Success state UI with auto-reset after 5 seconds
- Error handling with toast notifications
- POST to `/api/contact-inquiries`

#### Admin Panel Structure

**Admin Page:** `client/src/pages/admin/contact-management.tsx`

**Structure:**
```tsx
ContactManagement
├── Tabs (defaultValue="overview")
│   ├── Overview Tab → ContactDashboard
│   ├── Inquiries Tab → ContactInquiriesTable
│   └── Settings Tab → ContactPageSettings
```

**Admin Components** (`client/src/components/admin/contact-management/`):
```typescript
ContactDashboard.tsx         // Overview metrics/statistics
ContactInquiriesTable.tsx    // Display/manage form submissions
ContactPageSettings.tsx      // Edit contact page configuration ✓
index.ts                     // Barrel export
```

**ContactPageSettings Features:**
- Fetches: `useQuery<ContactPageConfiguration>('/api/contact-page-configuration')`
- Form state: Local `useState` with controlled inputs
- Mutation: `useMutation` with POST/PATCH fallback logic
- Sections: Hero, Layout, Styling, SEO (using Tabs)
- Actions: Save, Reset, Preview (opens /contact in new tab)
- Uses shadcn: Card, Tabs, Input, Label, Textarea, Switch, Select

#### Data Fetching Patterns

**TanStack Query V5 Usage:**

**Query Pattern:**
```typescript
const { data, isLoading, error } = useQuery<Type>({
  queryKey: ['/api/endpoint'],
  staleTime: 900000, // 15 minutes
  // queryFn auto-provided by queryClient default
});
```

**Mutation Pattern:**
```typescript
const mutation = useMutation({
  mutationFn: async (data) => apiRequest('POST', '/api/endpoint', data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/endpoint'] });
    toast({ title: "Success" });
  },
  onError: (error) => {
    toast({ title: "Error", variant: "destructive" });
  }
});
```

**Query Client Configuration** (`client/src/lib/queryClient.ts`):

Key features:
- Default queryFn: `getQueryFn({ on401: "throw" })`
- Stale time: 2min (media), 30s (dynamic)
- GC time: 10min (media), 5min (dynamic)
- Retry: Up to 10 attempts for large 3D models
- **Request deduplication:** In-flight request tracking for GET/HEAD
- **Batch media fetching:** `batchFetchMediaContent()` eliminates N+1 requests

**Cache Invalidation:**
```typescript
queryClient.invalidateQueries({ queryKey: [...] })
```

**Optimized Query Options by Data Type:**
```typescript
// Static (categories, fabrics)
staleTime: 5 * 60 * 1000  // 5min
gcTime: 30 * 60 * 1000    // 30min

// Products
staleTime: 60 * 1000      // 1min
gcTime: 10 * 60 * 1000    // 10min

// Media
staleTime: 5 * 60 * 1000  // 5min
gcTime: 20 * 60 * 1000    // 20min

// Dynamic
staleTime: 30 * 1000      // 30s
gcTime: 5 * 60 * 1000     // 5min
```

#### Form Patterns

**Validation:** Zod schemas
```typescript
const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Please enter a valid email address"),
  message: z.string().min(10, "Message must be at least 10 characters long"),
});
```

**Form Management:**
- Most forms: Controlled components with `useState`
- Complex forms: `react-hook-form` with `zodResolver`

**Common Pattern:**
1. Define Zod schema
2. Controlled inputs with `useState`
3. Validate on submit with `try/catch`
4. Show field errors below inputs
5. Submit with `useMutation`
6. Reset form on success

---

### 1.4 Backend API and Middleware Patterns

#### API Route Organization

**Structure:** Domain-driven (MASTER ROUTER PATTERN)
**Orchestration:** `server/routes/index.ts`

**Route Categories:**

1. **Core Business Entities** (`/core/`)
   - categories, products, fabrics, accessories, certificates, materials, size-charts, taxonomy

2. **Admin Operations** (`/admin/`)
   - admin.ts, admin-products-validation.ts

3. **CMS Resources** (`/resources/`)
   - 24 routers for page content
   - homepage, contact, about, sustainability, manufacturing, technology
   - Batch endpoints and individual resource endpoints

4. **Media Management** (`/media/`)
   - Upload, processing, delivery, folder management

5. **Utilities** (`/utilities/`)
   - Diagnostics, metrics, health checks, migrations, data creation

**Naming Convention:**
- Resources: `*.routes.ts` (e.g., `contact.routes.ts`)
- Core/Admin/Utilities: `*.ts` (e.g., `products.ts`)

**API Structure:** Flat at `/api/*` - no nested versioning

#### Middleware

**Security Middleware** (`server/middleware/production-security.ts`):

```typescript
securityHeaders()        // X-Frame-Options, X-Content-Type-Options, CSP, HSTS
requestValidation()      // Size limits (10MB), Content-Type validation
apiKeyValidation()       // API key check for sensitive endpoints
```

**Rate Limiting** (`server/lib/rate-limiter.ts`):
- Custom in-memory rate limiter with IP-based tracking
- Three tiers:
  - General API: 100 requests / 15 minutes
  - Admin: 30 requests / 15 minutes
  - Diagnostics: 10 requests / 1 minute
- RateLimit headers (draft-8 specification)

**Error Handling** (`server/middleware/production-error-handler.ts`):
- Centralized error handler
- Standard error envelope: `{ success: false, error: { message, details } }`
- No stack traces in production

**Other Middleware:**
```typescript
async-handler.ts           // Wraps async routes to catch errors
correlation-id.ts          // Request tracking with correlation IDs
request-timeout.ts         // Global timeout protection
enhanced-health.ts         // Health check endpoints
```

#### Controllers/Handlers Pattern

**Contact Routes Example** (`server/routes/resources/contact.routes.ts`):

```typescript
// POST /api/contact - Form submission
router.post('/contact', asyncHandler(async (req, res) => {
  const validatedData = contactFormSchema.parse(req.body);
  // Store submission (TODO in current code)
  res.json({ success: true, submissionId, message });
}));

// GET /api/contact-info - Get configuration
router.get('/contact-info', asyncHandler(async (req, res) => {
  const cacheKey = CacheKeys.contact.configuration();
  const cached = await unifiedCache.get(cacheKey);
  
  if (cached && !shouldBypassCache(req)) {
    res.setHeader('X-Cache-Hit', 'true');
    return res.json(cached);
  }
  
  if (shouldBypassCache(req)) {
    logger.debug('[Contact] Admin/debug request - bypassing cache');
  }

  const storage = getStorage();
  const config = await storage.getContactPageConfiguration();
  
  if (!config) {
    return res.status(404).json({ error: 'Not found' });
  }

  await unifiedCache.set(cacheKey, contactInfo, CACHE_TTL_NAVIGATION * 1000);
  return res.json(contactInfo);
}));
```

**Request/Response Pattern:**
1. Validate request with Zod
2. Check cache (with admin bypass)
3. Query database via storage layer
4. Cache result (with TTL)
5. Return JSON response

**Validation Pattern:**
```typescript
// Zod schemas defined at route level
const schema = z.object({ ... });
const validatedData = schema.parse(req.body);
// .parse() throws on invalid data (caught by error handler)
```

#### Admin API Routes

**Current Admin Endpoints:**
```typescript
/api/contact-page-configuration    // GET/POST/PATCH contact settings
/api/contact-inquiries             // POST contact form submissions
```

**Admin Route Protection:**
- All admin routes protected by admin rate limiter (30/15min)

#### Content Management Patterns

**Pattern:** Resource-oriented routers with full CRUD
```typescript
GET     // Fetch content
POST    // Create new content
PATCH   // Update existing content
DELETE  // Soft delete (sets deletedAt)
```

**Cache Invalidation:**
```typescript
// After mutations
await unifiedCache.delete(cacheKey);
```

**Batch Endpoints:**
Pattern found in homepage, sustainability, technology:
```typescript
GET /api/homepage/batch         // All homepage content in single response
GET /api/sustainability/batch   // All sustainability content

// Benefits: Reduces NEON active time, consolidates 5+ API calls into 1
```

---

## PHASE 2: CONTENT MANAGEMENT STRATEGY

### 2.1 Admin Authentication and Authorization Review

#### Authentication System Status

**Status:** ❌ **NO AUTHENTICATION SYSTEM DETECTED**

**Findings:**
- ❌ No JWT token generation or validation
- ❌ No session management middleware
- ❌ No Replit Auth integration
- ❌ No login/logout routes
- ❌ No user table in database schema
- ❌ No role-based access control (RBAC)

**Current Security Measures:**

1. **Rate Limiting:**
   ```typescript
   // Admin endpoints limited to 30 requests / 15 minutes
   // IP-based tracking
   ```

2. **Environment-Based Access:**
   ```typescript
   // Development mode bypasses certain checks
   if (config.app.environment === 'development') {
     return next(); // Skip API key validation
   }
   ```

3. **Cache Bypass Detection:**
   ```typescript
   // Admin referer header detection
   req.headers.referer?.includes('/admin')
   
   // Debug query param
   ?nocache=true
   ```

**Risk Assessment:** ⚠️ **CRITICAL SECURITY GAP**

- Any user can access `/admin/*` routes
- No authentication required for data modifications
- Admin mutations not protected by user verification

#### Protected Routes

**Frontend:**
- ❌ No route guards or authentication checks
- ❌ `/admin/*` routes publicly accessible
- ❌ No redirect to login page

**Backend:**
- ❌ No authentication middleware protecting admin routes
- ✓ Rate limiting (only protection mechanism)

#### Authorization Patterns

**Current State:** None
- No role checking (admin, editor, viewer)
- No permission system
- No user context passed with requests

#### Environment-Specific Access

**Detected Patterns:**
```typescript
// Production API key check (partial implementation)
const apiKey = req.headers['x-api-key'] || req.query.apiKey;
if (!apiKey) {
  return res.status(401).json({ error: 'API key required' });
}
```

**Findings:**
- API key validation exists but incomplete
- No centralized authentication enforcement
- Environment variables checked but no auth flow

#### RECOMMENDATION: 🔴 **HIGH PRIORITY**

Before implementing contact content management, implement authentication:

**Option 1: Replit Auth (Recommended)**
- ✅ Native integration with Replit platform
- ✅ Handles OAuth flow automatically
- ✅ User management included
- ✅ Simple integration with Express

**Option 2: API Key Authentication**
- ✅ Simplest to implement
- ✅ Set `ADMIN_API_KEY` environment variable
- ✅ Add middleware to check `x-api-key` header
- ⚠️ Good for initial MVP, less secure than OAuth

**Option 3: JWT + Database**
- ✅ Most flexible
- ⚠️ Most complex
- ⚠️ Requires user table, password hashing, token management

**Immediate Action Required:**
Add basic API key authentication to admin routes until proper auth is implemented.

---

### 2.2 Replit Storage Options Investigation

#### NEON PostgreSQL Usage

**Current Implementation:**
```typescript
Driver: @neondatabase/serverless (HTTP-based, not TCP pooling)
Connection: Single HTTP connection via neon(DATABASE_URL)
Pooling: Recommended -pooler suffix in DATABASE_URL
```

**Query Patterns:**
1. Direct Queries: Most routes query NEON directly
2. Repository Pattern: Abstraction layer for complex queries
3. Timeout Protection: 5-second default timeout on all queries
4. Circuit Breaker: Prevents cascade failures on database errors

**Scale-to-Zero Considerations:**
- NEON autosuspends after 5 minutes of inactivity in serverless
- HTTP driver handles cold starts better than TCP
- Pooling suffix ensures connection pooling for high-traffic scenarios

**Current Query Frequency:**
| Endpoint | Frequency | Cache Duration |
|----------|-----------|----------------|
| Homepage | High (every page load) | Uses batch endpoint |
| Products | High | 1 minute |
| Contact | Low | 15 minutes |
| Admin | Very low | Cache bypass enabled |

#### Replit KV Store Usage

**Implementation:** `@replit/database` with unified cache system

**File:** `server/lib/unified-replit-cache.ts` (2,047 lines)

**Architecture:**
```
UnifiedReplitCache (Singleton)
├── L1: LRU Memory Cache
│   ├── Max: 1000 entries
│   ├── Size: 50MB limit
│   └── TTL: 15 minutes
└── L2: Replit KV Database
    ├── Persistent
    └── Unlimited storage
```

**Features:**
- ✅ 2-Tier Caching: Memory (L1) + Persistent (L2)
- ✅ Automatic TTL: Configurable per data type
- ✅ Cache Categories: media, data, static
- ✅ Metrics Tracking: Hit rate, response times, memory usage
- ✅ Memory Management: Automatic eviction, pressure detection
- ✅ Batch Operations: Supports bulk get/set
- ✅ Request Coalescing: Prevents cache stampede

**Current Cache Key Patterns:**
```typescript
CacheKeys.contact.configuration() → 'contact:configuration'
CacheKeys.homepage.hero()        → 'homepage:hero'
```

**TTL Values:**
```typescript
CACHE_TTL_NAVIGATION = 1800s (30 minutes)  // Contact info
CACHE_TTL_STATIC = 3600s (1 hour)          // Business locations
CACHE_TTL_BATCH = 900s (15 minutes)        // Batch endpoints
```

**Memory Cache (L1):**
- Max: 1000 entries (increased from 500 in P2C optimization)
- Size limit: 50MB
- Eviction: LRU policy
- TTL: 15 minutes (extended from 5min for stable content)

**Replit KV (L2):**
- Value size limit: 5 MiB
- API: Dictionary-like
- Persistence: Automatic
- Querying: Prefix support

#### Replit Object Storage Usage

**Implementation:** `@replit/object-storage`

**File:** `server/app-storage-service.ts`

**Current Usage:**
- Media Assets: Images, videos, 3D models (.glb/.gltf)
- Thumbnails: Auto-generated thumbnails
- Uploaded Files: User-uploaded content

**Storage Structure:**
```
bucket: repl-default-bucket-$REPL_ID
├── public/        # Public assets (CDN accessible)
└── .private/      # Private objects
```

**Features:**
- ✅ Automatic thumbnail generation (Sharp)
- ✅ Progressive image loading with blurhash
- ✅ CDN URL generation
- ✅ Security scanning before upload
- ✅ Chunked upload support (5MB chunks)
- ✅ Lifecycle policies (configured in YAML)

**Storage Patterns:**
- Media referenced by database ID
- URLs generated on-demand or cached
- Direct Replit storage paths in database (`storagePath`, `bucketName`)

#### Caching Strategy Analysis

**Current 3-Tier System:**
```
Request Flow:
┌────────────┬──────────────────┬─────────────────┐
│ L1: React  │ L2: Unified     │ L3: NEON       │
│ Query      │ Replit Cache    │ PostgreSQL     │
├────────────┼──────────────────┼─────────────────┤
│ Client     │ Server Memory   │ Database       │
│ 2min stale │ + Replit KV     │ Source of      │
│ 10min GC   │ 15-30min TTL    │ truth          │
└────────────┴──────────────────┴─────────────────┘
```

**Cache Invalidation:**
- **Manual:** After mutations via `invalidateQueries()` or `cache.delete()`
- **TTL-Based:** Automatic expiration
- **Admin Bypass:** Admin requests skip cache

**Performance Metrics:**
From existing documentation:
- Sustainability batch endpoint: 253ms response time
- NEON active time reduced by 87% with caching
- Cache hit rates monitored via metrics system

#### Recommendation for Contact Page Caching

**OPTIMAL STRATEGY:** ✅

**L1 - React Query (Client):**
```typescript
queryKey: ['contact-content'],
staleTime: 5 * 60 * 1000,    // 5 minutes
gcTime: 30 * 60 * 1000,      // 30 minutes
refetchOnWindowFocus: false  // Contact info rarely changes
```

**L2 - Replit KV (Server):**
```typescript
cacheKey: 'contact:content',
ttl: 1800000  // 30 minutes (CACHE_TTL_NAVIGATION)
```

**L3 - NEON (Database):**
- Only queried on cache miss or admin updates

**Invalidation Strategy:**
```typescript
// After admin saves contact content
await unifiedCache.delete('contact:content');
queryClient.invalidateQueries({ queryKey: ['contact-content'] });
```

**Benefits:**
1. **Cost Optimization:** Reduces NEON queries from 100s/day to <10/day
2. **Performance:** Sub-millisecond response from L1 memory cache
3. **Scalability:** KV Store handles persistence across server restarts
4. **Freshness:** 5-30min freshness acceptable for contact info

**Cache Warming:**
```typescript
// Pre-populate cache on server startup
async initialContactWarmup() {
  const config = await storage.getContactPageConfiguration();
  await this.set('contact:content', config, CACHE_TTL_NAVIGATION);
}
```

---

## PHASE 3: DATA STRUCTURE AND SCHEMA DESIGN

### 3.1 Database Schema Design for Contact Content

**Table Name:** `contact_page_content`

**Drizzle ORM Schema:**

```typescript
import { pgTable, serial, varchar, text, jsonb, timestamp, integer } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

export const contactPageContent = pgTable('contact_page_content', {
  id: serial('id').primaryKey(),
  
  // Hero Section
  heroHeading: varchar('hero_heading', { length: 100 })
    .notNull()
    .default('DROP US A LINE'),
  
  // Location Information
  locationLine1: varchar('location_line1', { length: 200 }).notNull(),
  locationLine2: varchar('location_line2', { length: 200 }),
  locationButtonText: varchar('location_button_text', { length: 50 })
    .notNull()
    .default('Get Directions'),
  
  // Contact Details
  contactEmail: varchar('contact_email', { length: 255 }).notNull(),
  contactPhone: varchar('contact_phone', { length: 50 }).notNull(),
  
  // Trading Hours (JSONB for flexibility)
  tradingHours: jsonb('trading_hours')
    .$type<Array<{ label: string; value: string }>>()
    .notNull(),
  
  // Social Media Links (JSONB)
  socialLinks: jsonb('social_links')
    .$type<Array<{ platform: string; url: string }>>()
    .notNull(),
  
  // Form Labels (13 fields)
  formLabelFirstName: varchar('form_label_first_name', { length: 50 })
    .notNull()
    .default('First Name'),
  formLabelLastName: varchar('form_label_last_name', { length: 50 })
    .notNull()
    .default('Last Name'),
  formLabelEmail: varchar('form_label_email', { length: 50 })
    .notNull()
    .default('Email'),
  formLabelPhone: varchar('form_label_phone', { length: 50 })
    .notNull()
    .default('Phone Number'),
  formLabelCountry: varchar('form_label_country', { length: 50 })
    .notNull()
    .default('Country'),
  formLabelInquiryType: varchar('form_label_inquiry_type', { length: 50 })
    .notNull()
    .default('Inquiry Type'),
  formLabelMessage: varchar('form_label_message', { length: 50 })
    .notNull()
    .default('Message'),
  formLabelQuantity: varchar('form_label_quantity', { length: 50 })
    .notNull()
    .default('Expected Quantity'),
  formLabelTimeline: varchar('form_label_timeline', { length: 50 })
    .notNull()
    .default('Expected Timeline'),
  formLabelBudget: varchar('form_label_budget', { length: 50 })
    .notNull()
    .default('Budget Range'),
  formLabelPlatform: varchar('form_label_platform', { length: 50 })
    .notNull()
    .default('Preferred Platform'),
  formLabelCompany: varchar('form_label_company', { length: 50 })
    .notNull()
    .default('Company Name'),
  formLabelRole: varchar('form_label_role', { length: 50 })
    .notNull()
    .default('Your Role'),
  
  // Form Configuration
  formButtonText: varchar('form_button_text', { length: 100 })
    .notNull()
    .default('Submit Inquiry'),
  formPrivacyText: text('form_privacy_text').notNull(),
  
  // Validation Messages
  validationRequired: varchar('validation_required', { length: 200 })
    .notNull()
    .default('This field is required'),
  validationEmail: varchar('validation_email', { length: 200 })
    .notNull()
    .default('Please enter a valid email address'),
  validationPhone: varchar('validation_phone', { length: 200 })
    .notNull()
    .default('Please enter a valid phone number'),
  validationMinLength: varchar('validation_min_length', { length: 200 })
    .notNull()
    .default('Message must be at least {min} characters'),
  
  // Success Message
  successHeading: varchar('success_heading', { length: 100 })
    .notNull()
    .default('Thank You!'),
  successMessage: text('success_message').notNull(),
  
  // Platform Options (JSONB array)
  platformOptions: jsonb('platform_options')
    .$type<string[]>()
    .notNull(),
  
  // Metadata
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  
  // Version control (optimistic locking)
  version: integer('version').default(1).notNull()
});

// TypeScript Types
export type ContactPageContent = typeof contactPageContent.$inferSelect;

export const insertContactPageContentSchema = createInsertSchema(contactPageContent, {
  heroHeading: z.string().min(1).max(100),
  locationLine1: z.string().min(1).max(200),
  locationLine2: z.string().max(200).optional(),
  contactEmail: z.string().email(),
  contactPhone: z.string().min(1).max(50),
  tradingHours: z.array(z.object({
    label: z.string(),
    value: z.string()
  })),
  socialLinks: z.array(z.object({
    platform: z.string(),
    url: z.string().url()
  })),
  platformOptions: z.array(z.string()).min(1)
}).omit({ id: true, createdAt: true, updatedAt: true, version: true });

export type InsertContactPageContent = z.infer<typeof insertContactPageContentSchema>;
```

**Design Decisions:**

**1. JSONB vs Separate Columns:**

**JSONB Used For:**
- `tradingHours` - Array of label-value pairs (flexible count)
- `socialLinks` - Array of platform-url pairs (variable count)
- `platformOptions` - Array of strings (easily extensible)

**Separate Columns For:**
- Form labels - Fixed count (13 fields), frequently queried individually
- Validation messages - Fixed count, better query performance

**Reasoning:**
- JSONB provides flexibility for variable-length arrays
- Separate columns optimize query performance for fixed fields
- Balance between flexibility and performance

**2. Timestamps:**
```typescript
createdAt: timestamp  // Track when configuration was first created
updatedAt: timestamp  // Track last modification (manual update in mutation)
```

**3. Versioning:**
```typescript
version: integer  // Optimistic locking (prevent concurrent updates)
// Increment on each update
```

**4. No Soft Delete:**
- Single-row table (always exists after first creation)
- No need for `deletedAt` or `isActive`

---

### 3.2 API Contract Design for Content Management

#### PUBLIC API

**GET /api/content/contact**

**Purpose:** Fetch all contact page content for public display

**Response Type:**
```typescript
interface PublicContactContent {
  hero: {
    heading: string;
  };
  location: {
    line1: string;
    line2: string | null;
    buttonText: string;
  };
  contact: {
    email: string;
    phone: string;
  };
  tradingHours: Array<{ label: string; value: string }>;
  socialLinks: Array<{ platform: string; url: string }>;
  form: {
    labels: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      country: string;
      inquiryType: string;
      message: string;
      quantity: string;
      timeline: string;
      budget: string;
      platform: string;
      company: string;
      role: string;
    };
    buttonText: string;
    privacyText: string;
    platformOptions: string[];
  };
  validation: {
    required: string;
    email: string;
    phone: string;
    minLength: string;
  };
  success: {
    heading: string;
    message: string;
  };
}
```

**Caching:**
- Cache Key: `contact:content`
- TTL: 1800s (30 minutes)
- Cache-Control: `public, max-age=1800`

**Error Responses:**
```typescript
404 - No contact content configured (first-time setup)
500 - Server error
```

#### ADMIN API

**GET /api/admin/contact/content**

**Purpose:** Fetch all editable contact content fields for admin panel

**Authentication:** Required (API key or session)

**Response:**
```typescript
interface AdminContactContent extends PublicContactContent {
  metadata: {
    id: number;
    createdAt: string;
    updatedAt: string;
    version: number;
  };
}
```

**Error Responses:**
```typescript
401 - Unauthorized (no valid API key/session)
404 - No content configured
500 - Server error
```

**PUT /api/admin/contact/content**

**Purpose:** Update contact page content (full or partial)

**Authentication:** Required

**Request Body:**
```typescript
type UpdateContactContent = Partial<
  Omit<InsertContactPageContent, 'id' | 'createdAt' | 'updatedAt'>
>;
```

**Example Request:**
```json
{
  "heroHeading": "Get in Touch",
  "contactEmail": "hello@example.com",
  "tradingHours": [
    { "label": "Monday-Friday", "value": "9:00 AM - 5:00 PM" },
    { "label": "Saturday", "value": "10:00 AM - 2:00 PM" }
  ]
}
```

**Response:** Updated content with metadata

**Side Effects:**
1. Update database
2. Invalidate KV Store cache (`contact:content`)
3. Increment version number
4. Update `updatedAt` timestamp

**Error Responses:**
```typescript
400 - Validation error (Zod schema violation)
401 - Unauthorized
409 - Version conflict (optimistic locking)
500 - Server error
```

**POST /api/admin/contact/content/reset**

**Purpose:** Reset contact content to default values

**Authentication:** Required

**Request Body:** None

**Response:** Default contact content

**Default Values:**
```json
{
  "heroHeading": "DROP US A LINE",
  "locationLine1": "123 Main Street, Anytown, USA 12345",
  "locationLine2": "",
  "contactEmail": "info@example.com",
  "contactPhone": "(123) 456-7890",
  "tradingHours": [
    { "label": "Monday-Friday", "value": "9:00 AM - 5:00 PM" },
    { "label": "Saturday", "value": "10:00 AM - 2:00 PM" },
    { "label": "Sunday & Holidays", "value": "Closed" }
  ],
  "socialLinks": [
    { "platform": "Facebook", "url": "#" },
    { "platform": "Instagram", "url": "#" },
    { "platform": "Twitter", "url": "#" },
    { "platform": "LinkedIn", "url": "#" }
  ],
  "platformOptions": ["Phone Call", "WhatsApp", "WeChat", "Telegram", "Other"]
}
```

---

### 3.3 Migration Strategy and Default Content

#### Migration Approach

**Strategy:** Direct schema push (no manual SQL)

**Step 1: Add Schema Definition**
Add `contactPageContent` table to `shared/schema.ts`

**Step 2: Push Schema to Database**
```bash
npm run db:push
```

If prompted with data-loss warning:
```bash
npm run db:push --force
```

#### Seeding Default Content

**Option A: Database Initialization (Recommended)**

Create seed function in server:

```typescript
// server/lib/seed-contact-content.ts
import { db } from '../db.js';
import { contactPageContent } from '../../shared/schema.js';

export async function seedContactContent() {
  const exists = await db.select().from(contactPageContent).limit(1);
  
  if (exists.length > 0) {
    console.log('[Seed] Contact content already exists, skipping');
    return;
  }
  
  const defaultContent = {
    heroHeading: 'DROP US A LINE',
    locationLine1: '123 Main Street, Anytown, USA 12345',
    locationLine2: '',
    locationButtonText: 'Get Directions',
    contactEmail: 'info@example.com',
    contactPhone: '(123) 456-7890',
    tradingHours: [
      { label: 'Monday-Friday', value: '9:00 AM - 5:00 PM' },
      { label: 'Saturday', value: '10:00 AM - 2:00 PM' },
      { label: 'Sunday & Holidays', value: 'Closed' }
    ],
    socialLinks: [
      { platform: 'Facebook', url: '#' },
      { platform: 'Instagram', url: '#' },
      { platform: 'Twitter', url: '#' },
      { platform: 'LinkedIn', url: '#' }
    ],
    formLabelFirstName: 'First Name',
    formLabelLastName: 'Last Name',
    formLabelEmail: 'Email',
    formLabelPhone: 'Phone Number',
    formLabelCountry: 'Country',
    formLabelInquiryType: 'Inquiry Type',
    formLabelMessage: 'Message',
    formLabelQuantity: 'Expected Quantity',
    formLabelTimeline: 'Expected Timeline',
    formLabelBudget: 'Budget Range',
    formLabelPlatform: 'Preferred Platform',
    formLabelCompany: 'Company Name',
    formLabelRole: 'Your Role',
    formButtonText: 'Submit Inquiry',
    formPrivacyText: 'We respect your privacy and will never share your information with third parties.',
    validationRequired: 'This field is required',
    validationEmail: 'Please enter a valid email address',
    validationPhone: 'Please enter a valid phone number',
    validationMinLength: 'Message must be at least {min} characters',
    successHeading: 'Thank You!',
    successMessage: 'Your message has been received. Our team will get back to you within 24 hours.',
    platformOptions: ['Phone Call', 'WhatsApp', 'WeChat', 'Telegram', 'Other']
  };
  
  await db.insert(contactPageContent).values(defaultContent);
  console.log('[Seed] ✅ Contact content seeded successfully');
}
```

Call in server startup:
```typescript
// server/index.ts
import { seedContactContent } from './lib/seed-contact-content.js';

// After database connection
await seedContactContent();
```

**Option B: Admin Panel First-Time Setup**
- If no content exists (404), show "Setup Wizard" in admin panel
- Pre-fill form with default values
- User must save to create initial record

#### Drizzle Kit Configuration

Already configured in `drizzle.config.ts`:
- Schema: `./shared/schema.ts` ✓
- Output: `./migrations` ✓
- Dialect: `postgresql` ✓
- No changes required

#### Migration Rollback

Not supported by Drizzle Kit push command. For rollback:
1. Manual SQL to drop table
2. Or restore from NEON snapshot/backup

---

## PHASE 4: COMPONENT ARCHITECTURE DESIGN

### 4.1 Contact Page Component Structure

**Component Hierarchy:**

```
ContactPage (client/src/pages/contact.tsx)
├── useQuery(['contact-content'])
├── ContactLayout
│   ├── ContactHero
│   │   └── Props: { heading: string }
│   ├── ContactFormSection
│   │   └── ContactForm
│   │       ├── Props: { labels, buttonText, privacyText, platformOptions, validation, success }
│   │       ├── State: formData, validationErrors, isSuccess
│   │       ├── useMutation - Submit form
│   │       └── Zod validation
│   └── ContactInfoSidebar
│       ├── LocationBox
│       │   └── Props: { line1, line2, buttonText }
│       ├── ContactBox
│       │   └── Props: { email, phone }
│       ├── TradingHoursBox
│       │   └── Props: { hours: Array<{label, value}> }
│       └── SocialLinksBox
│           └── Props: { links: Array<{platform, url}> }
```

**TypeScript Interfaces:**

```typescript
// Main data types
interface ContactContent {
  hero: { heading: string };
  location: { line1: string; line2: string | null; buttonText: string };
  contact: { email: string; phone: string };
  tradingHours: Array<{ label: string; value: string }>;
  socialLinks: Array<{ platform: string; url: string }>;
  form: {
    labels: FormLabels;
    buttonText: string;
    privacyText: string;
    platformOptions: string[];
  };
  validation: ValidationMessages;
  success: SuccessMessage;
}

interface FormLabels {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  inquiryType: string;
  message: string;
  quantity: string;
  timeline: string;
  budget: string;
  platform: string;
  company: string;
  role: string;
}

interface ValidationMessages {
  required: string;
  email: string;
  phone: string;
  minLength: string;
}

interface SuccessMessage {
  heading: string;
  message: string;
}
```

**Component Responsibilities:**

| Component | Responsibility |
|-----------|---------------|
| ContactPage | Fetch content, handle loading, pass props |
| ContactHero | Display hero heading |
| ContactFormSection | Layout wrapper for form |
| ContactForm | Form state, validation, submission, success/error UI |
| ContactInfoSidebar | Layout wrapper for info boxes |
| LocationBox | Display address + "Get Directions" button |
| ContactBox | Display email (mailto:) + phone (tel:) |
| TradingHoursBox | Display hours in key-value format |
| SocialLinksBox | Display social icons/links |

**Existing vs New:**
- ✅ Existing: ContactLayout, ContactHero, ContactInfo, ContactForm
- 🆕 New: Refactor ContactInfo into modular boxes

**Tailwind/shadcn Usage:**
- Card for info boxes
- Button for CTAs
- Input, Textarea for form fields
- Select for dropdowns
- Toast for notifications

---

### 4.2 Admin Panel Component Structure

**Component Hierarchy:**

```
AdminContactEditor (client/src/pages/admin/contact-management.tsx)
├── useQuery(['admin', 'contact-content'])
├── useUpdateContactContent()
├── useResetContactContent()
├── AdminBreadcrumb
├── AdminLoadingState
├── ContentEditForm
│   ├── useForm (React Hook Form + zodResolver)
│   ├── Form (shadcn wrapper)
│   ├── Accordion or Tabs
│   │   ├── HeroSection
│   │   │   └── FormField: heroHeading (Input)
│   │   ├── LocationSection
│   │   │   ├── FormField: locationLine1 (Input)
│   │   │   ├── FormField: locationLine2 (Input)
│   │   │   └── FormField: locationButtonText (Input)
│   │   ├── ContactSection
│   │   │   ├── FormField: contactEmail (Input)
│   │   │   └── FormField: contactPhone (Input)
│   │   ├── TradingHoursSection
│   │   │   ├── FieldArray: tradingHours
│   │   │   ├── Add button (append)
│   │   │   └── Remove button
│   │   ├── SocialLinksSection
│   │   │   ├── FieldArray: socialLinks
│   │   │   ├── Add button
│   │   │   └── Remove button
│   │   ├── FormLabelsSection (Collapsible)
│   │   │   └── 13 FormFields (all Input)
│   │   ├── FormConfigSection
│   │   │   ├── FormField: formButtonText (Input)
│   │   │   └── FormField: formPrivacyText (Textarea)
│   │   ├── ValidationMessagesSection
│   │   │   └── 4 FormFields (all Input)
│   │   ├── SuccessMessageSection
│   │   │   ├── FormField: successHeading (Input)
│   │   │   └── FormField: successMessage (Textarea)
│   │   └── PlatformOptionsSection
│   │       ├── ChipInput or Tags component
│   │       └── Add/Remove functionality
│   └── ActionButtons
│       ├── Save Button (primary)
│       ├── Reset Button (secondary)
│       └── Preview Button (opens /contact)
└── SaveStatusIndicator
    ├── "Saving..." - During mutation
    ├── "Saved ✓" - 2s after success
    └── "Error !" - On failure
```

**Form Handling Pattern:**

```typescript
// In AdminContactEditor component
const form = useForm<ContactFormData>({
  resolver: zodResolver(insertContactPageContentSchema),
  defaultValues: { /* ... */ }
});

// Populate form when data loads
useEffect(() => {
  if (data) {
    form.reset(data);
  }
}, [data]);

// Submit handler
const onSubmit = (formData: ContactFormData) => {
  updateMutation.mutate(formData);
};

// Field array pattern
const { fields, append, remove } = useFieldArray({
  control: form.control,
  name: 'tradingHours'
});
```

**Optimistic Updates:**
```typescript
const updateMutation = useMutation({
  mutationFn: (data) => apiRequest('PUT', '/api/admin/contact/content', data),
  onMutate: async (newData) => {
    await queryClient.cancelQueries({ queryKey: ['admin', 'contact-content'] });
    const previous = queryClient.getQueryData(['admin', 'contact-content']);
    queryClient.setQueryData(['admin', 'contact-content'], (old) => ({ ...old, ...newData }));
    return { previous };
  },
  onError: (err, variables, context) => {
    queryClient.setQueryData(['admin', 'contact-content'], context.previous);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'contact-content'] });
  }
});
```

**shadcn/ui Components Used:**
- Form, FormField, FormItem, FormLabel, FormControl, FormMessage
- Input, Textarea, Select
- Button
- Accordion, AccordionItem, AccordionTrigger, AccordionContent
- Card, CardHeader, CardTitle, CardContent
- Badge (for save status)
- Toast (for notifications)

---

### 4.3 Data Fetching and State Management Design

#### Public Page (/contact)

**Hook: useContactContent()**
```typescript
import { useQuery } from '@tanstack/react-query';

export function useContactContent() {
  return useQuery<ContactContent>({
    queryKey: ['contact-content'],
    staleTime: 5 * 60 * 1000,    // 5 minutes
    gcTime: 30 * 60 * 1000,      // 30 minutes
    refetchOnWindowFocus: false, // Contact info rarely changes
  });
}
```

**Loading States:**
```tsx
const { data: content, isLoading, error } = useContactContent();

if (isLoading) {
  return <ContactSkeleton />;
}

if (error) {
  return <ErrorState error={error} />;
}

return <ContactLayout content={content} />;
```

#### Admin Page (/admin/contact)

**Hook: useAdminContactContent()**
```typescript
export function useAdminContactContent() {
  return useQuery<AdminContactContent>({
    queryKey: ['admin', 'contact-content'],
    staleTime: 1 * 60 * 1000,  // 1 minute (fresher for admin)
    gcTime: 5 * 60 * 1000,     // 5 minutes
  });
}
```

**Hook: useUpdateContactContent()**
```typescript
export function useUpdateContactContent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<ContactFormData>) => {
      return apiRequest('PUT', '/api/admin/contact/content', data);
    },
    onSuccess: () => {
      // Invalidate both admin and public queries
      queryClient.invalidateQueries({ queryKey: ['admin', 'contact-content'] });
      queryClient.invalidateQueries({ queryKey: ['contact-content'] });
    }
  });
}
```

**Hook: useResetContactContent()**
```typescript
export function useResetContactContent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/admin/contact/content/reset');
    },
    onSuccess: (defaultContent) => {
      queryClient.setQueryData(['admin', 'contact-content'], defaultContent);
      queryClient.invalidateQueries({ queryKey: ['contact-content'] });
    }
  });
}
```

#### Cache Invalidation Strategy

**After Update:**
```typescript
// Invalidate both admin and public caches
queryClient.invalidateQueries({ queryKey: ['admin', 'contact-content'] });
queryClient.invalidateQueries({ queryKey: ['contact-content'] });

// This triggers:
// 1. Refetch in admin panel (sees latest data)
// 2. Invalidates public cache (next visitor gets fresh data)
// 3. Server cache invalidation (via backend after mutation)
```

**Error Handling:**

```typescript
// Query Errors
const { data, error } = useContactContent();
if (error) {
  return <ErrorBoundary error={error} />;
}

// Mutation Errors
updateMutation.mutate(data, {
  onError: (error) => {
    if (error.message.includes('401')) {
      window.location.href = '/admin/login';
    } else if (error.message.includes('409')) {
      toast({
        title: "Update conflict",
        description: "Content was modified by another user. Please refresh.",
        variant: "destructive"
      });
    }
  }
});
```

---

## PHASE 5: FORM HANDLING AND VALIDATION

### 5.1 Validation Schema Design

**Complete Zod Schema:**

```typescript
import { z } from 'zod';

// Sub-schemas for nested objects
const tradingHourSchema = z.object({
  label: z.string().min(1, 'Label is required').max(50, 'Label too long'),
  value: z.string().min(1, 'Value is required').max(100, 'Value too long')
});

const socialLinkSchema = z.object({
  platform: z.string().min(1, 'Platform is required').max(50, 'Platform name too long'),
  url: z.string().url('Must be a valid URL').max(500, 'URL too long')
});

// Main validation schema
export const contactContentValidationSchema = z.object({
  // Hero Section
  heroHeading: z.string()
    .min(1, 'Hero heading is required')
    .max(100, 'Hero heading must be 100 characters or less'),
  
  // Location Information
  locationLine1: z.string()
    .min(1, 'Address line 1 is required')
    .max(200, 'Address line 1 must be 200 characters or less'),
  
  locationLine2: z.string()
    .max(200, 'Address line 2 must be 200 characters or less')
    .optional()
    .nullable(),
  
  locationButtonText: z.string()
    .min(1, 'Button text is required')
    .max(50, 'Button text must be 50 characters or less')
    .default('Get Directions'),
  
  // Contact Details
  contactEmail: z.string()
    .email('Please enter a valid email address')
    .max(255, 'Email must be 255 characters or less'),
  
  contactPhone: z.string()
    .min(1, 'Phone number is required')
    .max(50, 'Phone number must be 50 characters or less')
    .regex(/^[\d\s\-\(\)\+]+$/, 'Invalid phone number format'),
  
  // Trading Hours (JSONB array)
  tradingHours: z.array(tradingHourSchema)
    .min(1, 'At least one trading hour entry is required')
    .max(10, 'Maximum 10 trading hour entries allowed'),
  
  // Social Links (JSONB array)
  socialLinks: z.array(socialLinkSchema)
    .min(0, 'Social links are optional')
    .max(10, 'Maximum 10 social links allowed'),
  
  // Form Labels (13 fields)
  formLabelFirstName: z.string().min(1).max(50),
  formLabelLastName: z.string().min(1).max(50),
  formLabelEmail: z.string().min(1).max(50),
  formLabelPhone: z.string().min(1).max(50),
  formLabelCountry: z.string().min(1).max(50),
  formLabelInquiryType: z.string().min(1).max(50),
  formLabelMessage: z.string().min(1).max(50),
  formLabelQuantity: z.string().min(1).max(50),
  formLabelTimeline: z.string().min(1).max(50),
  formLabelBudget: z.string().min(1).max(50),
  formLabelPlatform: z.string().min(1).max(50),
  formLabelCompany: z.string().min(1).max(50),
  formLabelRole: z.string().min(1).max(50),
  
  // Form Configuration
  formButtonText: z.string().min(1).max(100),
  formPrivacyText: z.string().min(1).max(500),
  
  // Validation Messages
  validationRequired: z.string().min(1).max(200),
  validationEmail: z.string().min(1).max(200),
  validationPhone: z.string().min(1).max(200),
  validationMinLength: z.string().min(1).max(200),
  
  // Success Message
  successHeading: z.string().min(1).max(100),
  successMessage: z.string().min(1).max(500),
  
  // Platform Options (JSONB array)
  platformOptions: z.array(z.string().min(1).max(50))
    .min(1, 'At least one platform option is required')
    .max(20, 'Maximum 20 platform options allowed')
});

// Infer TypeScript type
export type ContactContentFormData = z.infer<typeof contactContentValidationSchema>;

// Backend validation schema (same as frontend)
export const backendContactContentSchema = contactContentValidationSchema;

// Partial schema for updates
export const updateContactContentSchema = contactContentValidationSchema.partial();
```

**Usage:**

**Backend:**
```typescript
router.put('/api/admin/contact/content', asyncHandler(async (req, res) => {
  const validatedData = updateContactContentSchema.parse(req.body);
  const result = await storage.updateContactContent(validatedData);
  res.json(result);
}));
```

**Frontend:**
```typescript
const form = useForm<ContactContentFormData>({
  resolver: zodResolver(contactContentValidationSchema),
  mode: 'onBlur',
  defaultValues: { /* ... */ }
});
```

---

### 5.2 Form Submission and Error Handling

**Form Submission Flow:**

```
1. User edits fields
   ↓
2. onChange triggers React Hook Form updates
   ↓
3. Validation on blur (field-level)
   ↓
4. User clicks "Save"
   ↓
5. Full form validation
   ├── Valid → Continue
   └── Invalid → Show errors, stop
   ↓
6. Trigger mutation
   ├── onMutate: Set "Saving..."
   ├── Optimistic update
   └── Disable save button
   ↓
7. API call to PUT /api/admin/contact/content
   ├── Server-side validation
   ├── Database update
   └── Cache invalidation
   ↓
8. Response handling
   ├── onSuccess → Show "Saved ✓"
   └── onError → Show "Error !"
```

**Implementation:**

```typescript
const form = useForm<ContactContentFormData>({
  resolver: zodResolver(contactContentValidationSchema),
  mode: 'onBlur',
  defaultValues: { /* ... */ }
});

const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
const updateMutation = useUpdateContactContent();

const onSubmit = form.handleSubmit(async (data) => {
  setSaveStatus('saving');
  
  try {
    await updateMutation.mutateAsync(data);
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  } catch (error) {
    setSaveStatus('error');
  }
});

// JSX
<Form {...form}>
  <form onSubmit={onSubmit}>
    <Button type="submit" disabled={saveStatus === 'saving'}>
      {saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
    </Button>
    
    {saveStatus === 'saved' && <Badge variant="success">Saved ✓</Badge>}
    {saveStatus === 'error' && <Badge variant="destructive">Error !</Badge>}
  </form>
</Form>
```

**Error Handling:**

| Error Type | HTTP Code | Handling |
|------------|-----------|----------|
| Network | Failed to fetch | Show connection error, retry option |
| Validation | 400 | Display field errors, highlight invalid fields |
| Unauthorized | 401 | Redirect to login |
| Version Conflict | 409 | Show conflict warning, suggest refresh |
| Server Error | 500 | Show generic error, suggest retry later |

**UI Feedback:**

```typescript
// Loading spinner
<Button disabled={isPending}>
  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  {isPending ? 'Saving...' : 'Save Changes'}
</Button>

// Success toast
toast({
  title: "Saved successfully",
  description: "Contact page content has been updated.",
  duration: 3000
});

// Error toast
toast({
  title: "Save failed",
  description: error.message,
  variant: "destructive",
  duration: 5000
});
```

**Unsaved Changes Warning:**

```typescript
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (form.formState.isDirty) {
      e.preventDefault();
      e.returnValue = '';
    }
  };
  
  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [form.formState.isDirty]);
```

---

## PHASE 6: OPTIMIZATION AND CACHING

### 6.1 NEON Cost Optimization Strategy

**Goal:** Reduce NEON database queries to minimize scale-to-zero disruption and cost

**Current Challenge:**
- Contact page: 100+ visits per day
- Each visit without caching = 1 NEON query
- NEON charges for active time (scale-to-zero after 5min inactivity)
- Frequent queries keep database active = higher costs

**Proposed 3-Tier Caching Strategy:**

```
┌─────────────────────────────────────────────────┐
│              REQUEST FLOW                        │
└─────────────────────────────────────────────────┘

USER REQUEST
    ↓
┌─────────────────────────────────────────┐
│ L1: React Query (Client-Side Cache)    │
│ • 5min stale, 30min GC                  │
│ • Instant response for repeat visits    │
│ • No network request if fresh           │
└─────────────────────────────────────────┘
    ↓ (if stale)
┌─────────────────────────────────────────┐
│ L2: Replit KV Store (Server Cache)     │
│ • 30min TTL                             │
│ • Shared across all users               │
│ • Sub-millisecond from L1 memory        │
│ • <10ms from L2 KV                      │
└─────────────────────────────────────────┘
    ↓ (if cache miss)
┌─────────────────────────────────────────┐
│ L3: NEON PostgreSQL (Database)         │
│ • Source of truth                       │
│ • Only queried on cache miss/updates    │
│ • ~50-100ms response                    │
└─────────────────────────────────────────┘
```

#### Layer Configuration

**L1: React Query (Client)**
```typescript
const { data } = useQuery<ContactContent>({
  queryKey: ['contact-content'],
  staleTime: 5 * 60 * 1000,    // 5 minutes
  gcTime: 30 * 60 * 1000,      // 30 minutes
  refetchOnWindowFocus: false  // Don't refetch on focus
});
```

**Benefits:**
- Instant response for repeat visits within 30 minutes
- No network request if data is fresh (<5 min)
- Reduces server load

**L2: Replit KV Store (Server)**
```typescript
const cacheKey = 'contact:content';
const cached = await unifiedCache.get<ContactContent>(cacheKey);

if (cached && !shouldBypassCache(req)) {
  res.setHeader('X-Cache-Hit', 'true');
  return res.json(cached);
}

const config = await storage.getContactPageConfiguration();
await unifiedCache.set(cacheKey, config, 30 * 60 * 1000);
return res.json(config);
```

**Benefits:**
- Persistent cache across server restarts
- Shared across all users
- Sub-millisecond from L1 memory, <10ms from L2 KV

**L3: NEON PostgreSQL (Database)**

Only queried when:
- Cache miss (first request after restart)
- Cache expired (after 30 minutes)
- Admin update invalidates cache
- Cache bypass (`?nocache=true` or admin referer)

#### Data Flow Diagrams

**Public Request:**
```
1. Browser → GET /api/content/contact
2. React Query checks L1 cache
   ├── If fresh (<5min) → Return from L1 ✅ (0ms)
   └── If stale → Continue
3. Server receives request
4. Check L2 KV Store
   ├── If hit → Return from L2 ✅ (~5ms)
   └── If miss → Continue
5. Query NEON L3
6. Store in L2 KV (30min TTL)
7. Return to client
8. React Query stores in L1
```

**Admin Update:**
```
1. Admin saves → PUT /api/admin/contact/content
2. Validate with Zod
3. Update NEON database
4. Invalidate L2: unifiedCache.delete('contact:content')
5. Invalidate L1: queryClient.invalidateQueries(['contact-content'])
6. Pre-warm: unifiedCache.set('contact:content', newData, 30min)
7. Return success
8. Next public request gets fresh data from warm L2
```

#### Performance Metrics

**Before Caching (Worst Case):**
- 100 daily visitors × 1 query = 100 NEON queries/day
- NEON active time: ~1440 minutes (24 hours constantly active)
- Cost: Maximum database active time

**After 3-Tier Caching:**
- 100 daily visitors × ~3 cache expirations = ~3 NEON queries/day
- NEON active time: ~30-60 minutes/day
- **Cost reduction: ~95% less NEON active time**

**Expected Cache Hit Rate:**
- L1 (React Query): 60-70% (users within session)
- L2 (KV Store): 95-99% (after warmup)
- L3 (NEON): 1-5% (cache misses only)

---

### 6.2 Query Optimization for NEON

#### Connection Strategy

**Current Setup (Optimal):**
- Driver: Neon HTTP (`@neondatabase/serverless`)
- Connection Pooling: `-pooler` suffix in DATABASE_URL
- Connection Mode: HTTP (stateless, serverless-friendly)

**Why HTTP is Better:**
1. No connection pool exhaustion
2. Faster cold starts
3. Auto-scaling friendly
4. No connection limits

#### SELECT Query Optimization

**❌ Bad - SELECT * (Anti-Pattern):**
```typescript
const content = await db.select().from(contactPageContent).limit(1);
```

**✅ Good - Specific Column Selection:**
```typescript
const content = await db.select({
  // Hero
  heroHeading: contactPageContent.heroHeading,
  
  // Location
  locationLine1: contactPageContent.locationLine1,
  locationLine2: contactPageContent.locationLine2,
  locationButtonText: contactPageContent.locationButtonText,
  
  // Contact
  contactEmail: contactPageContent.contactEmail,
  contactPhone: contactPageContent.contactPhone,
  
  // JSONB fields
  tradingHours: contactPageContent.tradingHours,
  socialLinks: contactPageContent.socialLinks,
  
  // All form labels, validation, success fields...
}).from(contactPageContent).limit(1);
```

**Performance:**
- Reduces data transfer
- Faster parsing
- Explicit dependencies

#### UPDATE Query Optimization

**✅ Partial Update:**
```typescript
await db.update(contactPageContent)
  .set({
    heroHeading: 'New Heading',
    updatedAt: new Date(),
    version: sql`${contactPageContent.version} + 1`
  })
  .returning();
```

**✅ Optimistic Locking:**
```typescript
const result = await db.update(contactPageContent)
  .set({
    ...updates,
    version: sql`${contactPageContent.version} + 1`
  })
  .where(
    and(
      eq(contactPageContent.id, id),
      eq(contactPageContent.version, currentVersion)
    )
  )
  .returning();

if (result.length === 0) {
  throw new Error('Version conflict');
}
```

#### Transaction Pattern

```typescript
await db.transaction(async (tx) => {
  await tx.update(contactPageContent).set({ ... });
  await unifiedCache.delete('contact:content');
  await tx.insert(auditLog).values({ action: 'update_contact' });
});
```

#### Expected Performance

**With HTTP Driver + Caching:**
- Cache hit (L2): ~5-10ms
- Cache miss (L3 query): ~50-100ms
- Update query: ~100-200ms

**Without Caching:**
- Every request: ~50-100ms
- Cold start: ~200-500ms

---

## IMPLEMENTATION ROADMAP

### Phase 1: Security (CRITICAL) 🔴

**Priority:** Immediate

**Tasks:**
1. Implement basic API key authentication
   - Set `ADMIN_API_KEY` environment variable
   - Create middleware to check `x-api-key` header
   - Protect all `/api/admin/*` routes
   
2. Document temporary auth
   - Create API key documentation
   - Note that full OAuth will come later

**Estimated Time:** 2-4 hours

---

### Phase 2: Database Schema

**Priority:** High

**Tasks:**
1. Add `contactPageContent` table to `shared/schema.ts`
   - Copy schema from Phase 3.1
   - Include all JSONB fields, form labels, validation
   
2. Run `npm run db:push` to create table
   - Or `npm run db:push --force` if data-loss warning
   
3. Create seed function
   - `server/lib/seed-contact-content.ts`
   - Call in server startup
   - Check if content exists before seeding

**Estimated Time:** 3-5 hours

---

### Phase 3: Backend API

**Priority:** High

**Tasks:**
1. Create public endpoint
   - `GET /api/content/contact`
   - Add to `server/routes/resources/contact.routes.ts`
   - Implement 3-tier caching
   - Return formatted response
   
2. Create admin endpoints
   - `GET /api/admin/contact/content`
   - `PUT /api/admin/contact/content`
   - `POST /api/admin/contact/content/reset`
   - Add Zod validation
   - Implement cache invalidation
   
3. Update storage layer
   - Add methods to `IStorage` interface
   - Implement in storage class
   - Use repository pattern

**Estimated Time:** 8-10 hours

---

### Phase 4: Frontend Components

**Priority:** High

**Tasks:**
1. Refactor public contact page
   - Update to use new `/api/content/contact` endpoint
   - Refactor ContactInfo into modular boxes
   - Add loading/error states
   
2. Build admin content editor
   - Create form with React Hook Form
   - Implement all sections (Hero, Location, Contact, etc.)
   - Add field arrays for Trading Hours and Social Links
   - Implement optimistic updates
   
3. Add error handling
   - Unsaved changes warning
   - Validation error display
   - Success/error toasts

**Estimated Time:** 12-16 hours

---

### Phase 5: Optimization

**Priority:** Medium

**Tasks:**
1. Configure 3-tier caching
   - Set React Query staleTime/gcTime
   - Configure KV Store TTL
   - Implement cache warming
   
2. Add monitoring
   - Log cache hits/misses
   - Track NEON query count
   - Monitor cache invalidation events
   
3. Document metrics
   - Create performance dashboard
   - Track NEON cost reduction
   - Monitor cache hit rates

**Estimated Time:** 4-6 hours

---

### Total Estimated Time: 29-41 hours

---

## APPENDIX

### A. Technology Stack Summary

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Frontend Framework | React | 19.0.0 | UI rendering |
| State Management | TanStack Query | 5.60.5 | Server state |
| Form Management | React Hook Form | 7.55.0 | Form handling |
| Validation | Zod | 3.24.2 | Schema validation |
| Routing | Wouter | 3.3.5 | Client routing |
| UI Components | shadcn/ui | Latest | Component library |
| Styling | TailwindCSS | Latest | Utility CSS |
| Backend Framework | Express | 4.21.2 | HTTP server |
| Database | NEON PostgreSQL | Latest | Data storage |
| ORM | Drizzle | 0.44.5 | Database queries |
| Cache | Replit KV | 3.0.1 | Server caching |
| Build Tool | Vite | Latest | Frontend bundling |

### B. Cache TTL Reference

| Data Type | L1 Stale | L1 GC | L2 TTL | Notes |
|-----------|----------|-------|--------|-------|
| Contact Content | 5min | 30min | 30min | Rarely changes |
| Static Data | 5min | 30min | 1hr | Categories, fabrics |
| Products | 1min | 10min | 15min | Moderate changes |
| Media | 5min | 20min | 15min | Heavy assets |
| Dynamic | 30s | 5min | 5min | Frequently updated |

### C. API Endpoint Reference

| Method | Endpoint | Purpose | Auth | Cache |
|--------|----------|---------|------|-------|
| GET | /api/content/contact | Public contact content | No | 30min |
| GET | /api/admin/contact/content | Admin contact content | Yes | Bypass |
| PUT | /api/admin/contact/content | Update content | Yes | Invalidate |
| POST | /api/admin/contact/content/reset | Reset to defaults | Yes | Invalidate |

### D. Database Schema Reference

**Table:** `contact_page_content`

**Columns:** 35 total
- Hero: 1 field
- Location: 3 fields
- Contact: 2 fields
- Trading Hours: 1 JSONB field
- Social Links: 1 JSONB field
- Form Labels: 13 fields
- Form Config: 2 fields
- Validation: 4 fields
- Success: 2 fields
- Platform Options: 1 JSONB field
- Metadata: 3 fields (createdAt, updatedAt, version)

### E. Error Code Reference

| Code | Meaning | User Message | Action |
|------|---------|--------------|--------|
| 400 | Validation error | "Please check your form for errors" | Show field errors |
| 401 | Unauthorized | "Please log in again" | Redirect to login |
| 404 | Not found | "Contact content not configured" | Show setup wizard |
| 409 | Version conflict | "Content was modified by another user" | Suggest refresh |
| 500 | Server error | "Something went wrong. Try again later" | Show retry |

---

**End of Architecture Discovery Report**

*Document Version: 1.0*  
*Last Updated: October 20, 2025*  
*Status: Complete - Ready for Implementation*
