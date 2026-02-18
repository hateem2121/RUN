# Frontend-to-Admin Route Mapping

This document defines the 1:1 relationship between public frontend pages and admin console pages.

> [!IMPORTANT]
> **Source of Truth**: The actual route configuration is defined in `client/app/routes.ts` (React Router 7 Config).
> The files in `client/app/routes/` are the route *modules* referenced by that configuration.

## Mapping Table

| Public Route | Admin Route | Shared API Endpoint | Description |
|--------------|-------------|---------------------|-------------|
| `/` | `/admin/dashboard` | `/api/dashboard/stats` | Homepage / Dashboard |
| `/products` | `/admin/products` | `/api/products` | Product catalog / management |
| `/products/:id` | `/admin/products/:id/edit` | `/api/products/:id` | Product detail / editor |
| `/blog` | `/admin/blog/posts` | `/api/blog/posts` | Blog listing / post management |
| `/blog/:slug` | `/admin/blog/posts/:id/edit` | `/api/blog/posts/:id` | Blog post / editor |
| `/about` | `/admin/pages/about` | `/api/pages/about` | About page / editor |
| `/contact` | `/admin/settings/contact` | `/api/contact-info` | Contact page / settings |
| `/gallery` | `/admin/media/gallery` | `/api/media` | Image gallery / media manager |
| `/accessories` | `/admin/accessories` | `/api/accessories` | Accessories Catalog / Management |
| `/analytics` | `/admin/analytics` | `/api/analytics/summary` | System Analytics / Data Insights |
| `/certifications` | `/admin/certifications` | `/api/certifications` | Company Certifications / Credentials |
| `/fabrics` | `/admin/fabrics` | `/api/fabrics` | Fabric Material Catalog / Management |
| `/fibers` | `/admin/fibers` | `/api/fibers` | Fiber & Yarn Catalog / Management |
| `/manufacturing` | `/admin/manufacturing` | `/api/manufacturing/status` | Manufacturing Facilities / Capacity |
| `/resources` | `/admin/resources` | `/api/resources` | B2B Resources & Documents |
| `/services` | `/admin/services` | `/api/services` | Manufacturing Services & Solutions |
| `/size-charts` | `/admin/size-charts` | `/api/size-charts` | Global Size Charts / Grading |
| `/sustainability` | `/admin/sustainability` | `/api/sustainability` | Sustainability Reports |
| `/technology` | `/admin/technology` | `/api/technology` | Technology Stack / Innovation Lab |

## Implementation Notes

### URL Pattern Differences

- **Public routes** use human-readable slugs (e.g., `/blog/my-post-slug`)
- **Admin routes** use database IDs (e.g., `/admin/blog/posts/123/edit`)

### API Endpoint Strategy

- **Public API** (`/api/*`) returns only published content
- **Admin API** (`/admin/api/*`) returns all content (published + drafts)

### Example: Product Page Flow

**Public View:**

1. User visits: `http://localhost:5002/products/abc123`
2. Frontend calls: `GET /api/products/abc123`
3. API returns: Published product data
4. Component: `<ProductDetailPage />`

**Admin View:**

1. Admin visits: `http://localhost:5002/admin/products/abc123/edit`
2. Admin panel calls: `GET /admin/api/products/abc123` (authenticated)
3. API returns: Full product data (including unpublished fields)
4. Component: `<ProductEditorPage />`

## Adding New Pages

When creating a new public page, ALWAYS create its admin counterpart:

### Checklist

- [ ] Add public route to `client/app/routes/index.tsx`
- [ ] Create public page component in `client/app/pages/`
- [ ] Add admin route to `client/app/routes/admin.tsx`
- [ ] Create admin page component in `client/app/pages/admin/`
- [ ] Add API endpoint to `server/routes/api/public.ts`
- [ ] Add admin API endpoint to `server/routes/api/admin.ts`
- [ ] Update `shared/constants/routeMapping.ts`
- [ ] Update this documentation

### Template

\`\`\`typescript
// Public route
<Route path="/new-page" element={<NewPage />} />

// Admin route
<Route path="/admin/pages/new-page" element={<NewPageEditor />} />

// API endpoints
// Public
router.get('/api/pages/new-page', getNewPageContent);

// Admin
router.put('/admin/api/pages/new-page', updateNewPageContent);
\`\`\`
