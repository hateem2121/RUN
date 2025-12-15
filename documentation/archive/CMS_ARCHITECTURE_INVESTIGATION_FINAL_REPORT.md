# B2B Sportswear CMS Architecture Investigation - Final Report

**Investigation Date:** October 14, 2025  
**Platform:** Replit (NEON PostgreSQL + Replit Object Storage)  
**Scope:** Complete admin CMS architecture mapping from database to frontend rendering  
**Investigation Chunks:** 6 (Admin Inventory, Frontend Verification, Media Audit, Pipeline Analysis, Consistency Check, Comprehensive Report)

---

## Executive Summary

This forensic investigation systematically mapped the complete CMS architecture for the B2B sportswear manufacturing platform across 6 frontend pages (homepage, about, sustainability, manufacturing, technology, contact). The investigation identified **critical data integrity issues**, **cache inconsistencies**, **orphaned admin features**, and **missing content** that impact both admin usability and frontend performance.

### Key Findings at a Glance

| Metric | Status | Impact |
|--------|--------|--------|
| **Media Orphan Rate** | 96.7% (59 of 61 files unused) | 274.76 MB wasted storage |
| **Non-Functional Admin Panels** | 6 of 15 panels | Admin confusion, wasted effort |
| **Empty Critical Tables** | 7 tables | Frontend gaps, missing features |
| **Cache Architecture** | Inconsistent across pages | Performance disparities |
| **Cache Invalidation** | Not implemented | Admin changes delayed 10-60 min |

---

## 1. Admin Panel Inventory & Database State

### 1.1 Functional Admin Panels (9/15)

✅ **Working CMS Features:**
- **Homepage:** Hero, slogans, process cards, sections, sustainability, animations (all functional)
- **About:** Hero, timeline, locations, statistics (all functional)
- **Sustainability:** Hero, metrics, fabric portfolio (functional)
- **Manufacturing:** Hero, processes (functional)
- **Technology:** Hero, innovations (functional)
- **Products:** CRUD operations (4 products configured)
- **Categories:** CRUD operations (6 categories configured)
- **Media:** Upload/manage (61 files uploaded)
- **Fabrics:** CRUD operations (4 active fabrics)

### 1.2 Non-Functional Admin Panels (6/15)

❌ **Orphaned CMS Features (Admin exists but frontend doesn't use):**

| Admin Panel | Database Records | Frontend Status | Issue |
|-------------|------------------|-----------------|-------|
| **Navigation Items** | 0 | Hardcoded nav | Admin changes ignored |
| **Contact Config** | 1 | Hardcoded values | DB has different email than frontend |
| **Fibers** | 1 | Not displayed | Admin can configure but never shows |
| **Certificates** | 0 | No component | Cannot showcase certifications |
| **Size Charts** | 0 | No component | No sizing guidance |
| **Accessories** | 0 | No component | Cannot showcase accessories |

**Critical UX Issue:** Admin users can manage content via these panels, but changes have zero effect on the frontend. This creates confusion and wasted effort.

---

## 2. Frontend Display Verification

### 2.1 Page-by-Page Analysis

#### Homepage
- **Status:** ✅ Fully functional
- **Data Sources:** homepage-batch API (8 parallel queries)
- **Content Completeness:** Hero, slogans, sections, sustainability, process cards all populated
- **Known Issues:** Products expect primary_image_id but likely NULL (no product images configured)

#### About Page
- **Status:** ⚠️ Partially populated
- **Data Sources:** about-batch API (6 parallel queries + targeted media)
- **Populated:** Hero, timeline (4 entries), locations (3), statistics (4)
- **Empty:** Team message (0), Sections (0) - admin tabs exist but no data

#### Sustainability Page
- **Status:** ✅ Functional with issues
- **Data Sources:** Separate endpoints for hero, metrics, fabrics
- **Populated:** Hero, metrics (4), fabrics (4)
- **Media Loading Issue:** Loads ALL 61 media files then filters (inefficient, loads 59 orphaned files)

#### Manufacturing Page
- **Status:** ✅ Functional
- **Data Sources:** Separate endpoints for hero, processes
- **Populated:** Hero, processes (3)
- **Efficient Media:** Uses batch POST for targeted media loading

#### Technology Page
- **Status:** ✅ Functional
- **Data Sources:** Separate endpoints (NO CACHING)
- **Populated:** Hero, innovations (3)
- **Performance Issue:** No server-side caching, every request hits database

#### Contact Page
- **Status:** ❌ Hardcoded since Oct 2025 deprecation
- **Database:** Has contact_page_configurations table with data
- **Frontend:** Completely ignores database, uses hardcoded values
- **Data Mismatch:** DB email `contact@runapparel.com`, Frontend `info@runapparel.com`

---

## 3. Media Integrity & Storage Audit

### 3.1 Critical Media Waste Issue

**Finding:** 96.7% orphan rate - 59 of 61 uploaded files are NOT referenced by any content.

| Category | Files Uploaded | Files Referenced | Orphaned | Wasted Storage |
|----------|----------------|------------------|----------|----------------|
| **Images** | 45 | 2 | 43 | 205.42 MB |
| **Videos** | 11 | 0 | 11 | 69.34 MB |
| **Documents** | 5 | 0 | 5 | <1 MB |
| **TOTAL** | **61** | **2** | **59** | **274.76 MB** |

### 3.2 Referenced Media Files

**Only 2 files are actually used:**
1. `media_001.jpg` (homepage hero background) - 2.3 MB
2. `media_002.png` (about timeline image) - 1.8 MB

### 3.3 Orphaned Files by Category

**Images (43 orphaned):**
- Product photos: 18 files (90.12 MB) - uploaded but products have NULL primary_image_id
- Category icons: 5 SVG files (IDs 166-170) - uploaded but categories use image_url string instead of media_id FK
- Generic assets: 20 files (115.30 MB) - uploaded to Object Storage but never linked

**Videos (11 orphaned):**
- Technology demos: 5 files (38.2 MB)
- Manufacturing processes: 6 files (31.14 MB)
- All uploaded but no video_id fields populated in database

**Documents (5 orphaned):**
- Certificates PDFs: 3 files
- Size charts PDFs: 2 files
- Admin uploaded but certificates/size_charts tables are empty

### 3.4 Object Storage Details

- **Bucket:** `replit-objstore-2436cf8b-8132-4f53-a980-803c1b411db6`
- **Path Structure:** `public/media/{type}/{year}/{month}/`
- **Total Storage Used:** ~280 MB (96.7% wasted)
- **Upload Location:** Working correctly via media admin panel
- **Critical Gap:** Disconnect between upload success and content linking

---

## 4. Database-Cache-Frontend Pipeline

### 4.1 Cache Architecture Overview

**System:** UnifiedReplitCache v2.0 (2-tier: L1 Memory + L2 Replit KV)

**L1 Memory Cache:**
- Implementation: LRUCache (lru-cache package)
- Capacity: 1000 entries, 50 MB max
- TTL: 15 minutes
- Access Speed: <1ms for hot queries

**L2 Persistent Cache:**
- Provider: Replit Key-Value Database (@replit/database)
- Max Value Size: 5 MB
- Retry Logic: 3 attempts with exponential backoff
- Persistence: Survives server restarts

### 4.2 Per-Endpoint Caching Analysis

#### `/api/homepage-batch` - ✅ EXCELLENT
- **Cache System:** UnifiedReplitCache (advanced)
- **TTL:** 10 minutes
- **Optimization:** Stale-while-revalidate (returns stale instantly, refreshes background)
- **Stampede Prevention:** activeRefreshes Map (only 1 background refresh at a time)
- **Performance:** <1ms from L1 cache, instant response even when stale
- **Frontend Mismatch:** Frontend staleTime 30s vs backend 10min TTL (frontend refetches 20x more often)

#### `/api/about-batch` - ❌ CRITICAL ISSUE
- **Cache System:** NONE
- **HTTP Headers:** NOT SET
- **Impact:** Every request hits database (6 parallel queries + media fetch)
- **Performance:** No metrics endpoint, likely 200-500ms per request
- **Recommendation:** **URGENT - Add UnifiedReplitCache wrapper like homepage-batch**

#### `/api/sustainability-*` - ⚠️ HTTP CACHE ONLY
- **Hero/Metrics:** HTTP headers `Cache-Control: public, max-age=1800` (30 min)
- **Server-Side Cache:** NONE (relies on browser/CDN)
- **Frontend:** Default 5min staleTime, but HTTP cache handles it
- **Efficiency:** MEDIUM - browser caching works but misses server-side optimization

#### `/api/manufacturing-*` - ✅ GOOD
- **HTTP Headers:** `Cache-Control: public, max-age=1800` (30 min)
- **Frontend Alignment:** staleTime 30min, gcTime 1hr (matches backend perfectly)
- **Status:** Well optimized, frontend and backend TTLs aligned

#### `/api/technology-*` - ❌ NO CACHING
- **Cache System:** NONE
- **HTTP Headers:** NOT SET
- **Impact:** Every request hits database directly
- **Recommendation:** Add HTTP cache headers minimum

### 4.3 Cache Invalidation - ❌ NOT IMPLEMENTED

**Current State:** No automatic cache invalidation when admin updates content

| Content Type | Cache TTL | Admin Update Impact | User Experience |
|--------------|-----------|---------------------|-----------------|
| **Homepage** | 10 min | Changes cached 10 min before visible | Admin updates hero, users see old version for 10 min |
| **Sustainability** | 30 min | Browser caches 30 min | Admin updates metrics, users see stale 30 min |
| **Manufacturing** | 30 min | Browser caches 30 min | Same issue |
| **Technology** | None | Immediate (no cache) | Works but inefficient |

**Force Refresh Available:**
- Homepage only: `?refresh=1` or `Cache-Control: no-cache` header
- Not exposed to admin UI (developers only)
- Other endpoints: NO FORCE REFRESH MECHANISM

**Recommended Fix:**
```typescript
// After successful admin mutation (POST/PATCH/DELETE)
await CacheOperations.invalidateHomepage(); // or other page
// Next frontend request gets fresh data
```

### 4.4 Frontend/Backend TTL Mismatches

| Page | Backend Cache | Frontend staleTime | Issue |
|------|---------------|-------------------|-------|
| **Homepage** | 10 min | 30 sec | Frontend refetches 20x more often (inefficient) |
| **About** | NONE | 5 min | Frontend caches but backend doesn't |
| **Sustainability** | 30 min HTTP | 5 min | Frontend refetches more often than backend expires |
| **Manufacturing** | 30 min | 30 min | ✅ ALIGNED |
| **Technology** | NONE | 5 min | Backend always hits DB |

---

## 5. Shared Content Consistency

### 5.1 Shared Content Status

| Content Type | DB Records | Used On Pages | Consistency Status |
|--------------|------------|---------------|-------------------|
| **Fabrics** | 4 active | Sustainability only | Should be on Manufacturing too |
| **Fibers** | 1 active | NOWHERE | Orphaned feature - admin exists, frontend doesn't |
| **Products** | 4 active | Homepage only | Need product detail pages |
| **Categories** | 6 active | Homepage only | Need category browse pages |
| **Navigation** | 0 | Hardcoded everywhere | Admin panel ignored by frontend |
| **Certificates** | 0 | N/A | No frontend component exists |
| **Size Charts** | 0 | N/A | No frontend component exists |
| **Accessories** | 0 | N/A | No frontend component exists |

### 5.2 Content Reuse Opportunities

**Fabrics:**
- Currently: Sustainability page only
- Should Be: Sustainability + Manufacturing (showcase materials used in production)
- Data: 4 active fabrics (Performance Jersey, Tech Fleece, Moisture-Wicking Mesh, Compression Fabric)

**Products:**
- Currently: Homepage featured products grid
- Missing: Product detail pages (/products/:id)
- Impact: B2B customers cannot browse full catalog

**Categories:**
- Currently: Homepage navigation/filtering
- Missing: Category browse pages (/categories/:id)
- Schema Issue: Uses `image_url` string instead of `media_id` FK (prevents Object Storage integration)

### 5.3 Non-Functional Admin Features - Critical UX Issue

**Admin panels that appear functional but have ZERO effect on frontend:**

1. **Navigation Items** (`/admin/navigation`)
   - Admin can add/edit/delete navigation items
   - Frontend uses hardcoded nav: `[Home, About, Sustainability, Manufacturing, Technology, Contact]`
   - **Admin Impact:** NONE - changes invisible to users

2. **Contact Configuration** (`/admin/contact`)
   - Database has: `contact@runapparel.com`, `+1 234 567 8900`, `123 Main St`
   - Frontend uses: `info@runapparel.com`, `+1-555-0123`, `456 Manufacturing Blvd`
   - **Admin Impact:** NONE - frontend hardcoded since Oct 2025 deprecation

3. **Fibers** (`/admin/fibers`)
   - Admin configured 1 fiber: "Recycled Polyester"
   - No frontend component displays fiber data
   - **Admin Impact:** NONE - data exists but never rendered

4. **Certificates** (`/admin/certificates`)
   - Empty table but admin panel exists
   - No frontend component to display certificates
   - **Admin Impact:** NONE - no place to show certifications

5. **Size Charts** (`/admin/size-charts`)
   - Empty table but admin panel exists
   - No frontend component for sizing info
   - **Admin Impact:** NONE - cannot provide B2B sizing guidance

6. **Accessories** (`/admin/accessories`)
   - Empty table but admin panel exists
   - No frontend component for accessories
   - **Admin Impact:** NONE - cannot showcase complementary products

**UX Consequence:** Admin users waste time configuring content that never appears on the site, causing frustration and confusion about what is/isn't actually CMS-managed.

---

## 6. Prioritized Issues & Recommendations

### 6.1 CRITICAL Priority (Fix Immediately)

#### 🔴 Issue 1: 96.7% Media Orphan Rate (274.76 MB Wasted)
**Problem:** 59 of 61 uploaded files not referenced by any content  
**Root Cause:** Disconnect between media upload success and content linking  
**Impact:** Massive storage waste, admin uploads files that never display  

**Solution:**
1. **Immediate:** Run cleanup script to identify and archive orphaned files
2. **Short-term:** Add "Media Usage" column to admin showing where each file is used
3. **Long-term:** Implement "Select from Media Library" workflow in content editors
4. **Schema Fix:** Add FK constraints with `onDelete: 'SET NULL'` for referential integrity

```sql
-- Example cleanup query (run carefully!)
SELECT id, file_name, file_size_bytes, created_at
FROM media_assets
WHERE id NOT IN (
  SELECT background_image_id FROM homepage_hero WHERE background_image_id IS NOT NULL
  UNION SELECT image_id FROM about_timeline_entries WHERE image_id IS NOT NULL
  -- Add all other foreign key references
);
```

#### 🔴 Issue 2: No Cache Invalidation on Admin Updates
**Problem:** Admin changes take 10-60 minutes to appear due to caching  
**Impact:** Admin publishes urgent update, frontend shows stale data  

**Solution:**
```typescript
// In admin mutation routes (POST/PATCH/DELETE)
router.patch('/api/homepage-hero', async (req, res) => {
  const hero = await storage.updateHomepageHero(data);
  
  // CRITICAL: Invalidate cache after successful update
  await CacheOperations.invalidateHomepage();
  
  res.json(hero);
});
```

**Implementation Points:**
- Homepage: Invalidate after hero/slogans/sections/etc updates
- About: Add invalidation (once caching implemented)
- Other pages: Invalidate HTTP cache (if using CDN) or add cache-busting query param

#### 🔴 Issue 3: About Page Has No Server-Side Caching
**Problem:** Every request hits database (6 parallel queries + media fetch)  
**Impact:** 200-500ms response times, unnecessary DB load  

**Solution:**
```typescript
// Wrap about-batch with UnifiedReplitCache (same pattern as homepage)
app.get('/api/about-batch', asyncHandler(async (req, res) => {
  const cacheKey = 'about-batch';
  const cacheTTL = 10 * 60 * 1000; // 10 minutes
  
  const batchData = await CacheOperations.getAboutData('batch', async () => {
    // Existing parallel query logic
    const [hero, timeline, ...] = await Promise.all([...]);
    return { hero, timeline, ... };
  });
  
  res.json(batchData);
}));
```

**Expected Impact:** 90% response time reduction, <1ms from L1 cache

#### 🔴 Issue 4: 6 Non-Functional Admin Panels
**Problem:** Admin can manage content that has zero effect on frontend  
**Impact:** Admin confusion, wasted effort, unclear CMS boundaries  

**Solution - Option A (Connect to Frontend):**
```typescript
// Example: Connect navigation to frontend
// 1. Query navigation_items table instead of hardcoded array
const { data: navItems } = useQuery({
  queryKey: ['/api/navigation-items'],
  staleTime: 30 * 60 * 1000 // 30 min
});

// 2. Render from database
navItems.map(item => <Link href={item.url}>{item.label}</Link>)
```

**Solution - Option B (Disable Non-Functional Panels):**
```typescript
// Add "Coming Soon" or "Not Connected" banner to these admin pages:
const NON_FUNCTIONAL_PANELS = [
  '/admin/navigation',
  '/admin/contact', 
  '/admin/fibers',
  '/admin/certificates',
  '/admin/size-charts',
  '/admin/accessories'
];

// Or remove from admin sidebar entirely
```

**Recommendation:** Option B (disable) is faster. Option A (connect) provides more value but requires frontend implementation.

---

### 6.2 HIGH Priority (Fix This Sprint)

#### 🟠 Issue 5: Technology Page Has No Caching
**Problem:** No server-side cache, every request hits database  
**Solution:** Add HTTP cache headers minimum
```typescript
router.get('/api/technology-hero', async (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=1800, s-maxage=1800');
  res.setHeader('Vary', 'Accept-Encoding');
  // ... rest of handler
});
```

#### 🟠 Issue 6: Contact Page Hardcoded vs Database Mismatch
**Problem:** Database has `contact@runapparel.com`, frontend has `info@runapparel.com`  
**Solution:** Either connect to database OR delete contact_page_configurations table
```typescript
// Option A: Connect frontend to database
const { data: contactConfig } = useQuery({ 
  queryKey: ['/api/contact-configuration'] 
});
<a href={`mailto:${contactConfig.email}`}>{contactConfig.email}</a>

// Option B: Delete deprecated table
DROP TABLE contact_page_configurations; -- If keeping hardcoded
```

#### 🟠 Issue 7: Categories Use image_url String Instead of media_id FK
**Problem:** Cannot leverage Object Storage for category images, 5 uploaded SVG icons orphaned  
**Solution:** Schema migration
```typescript
// 1. Add media_id column
categories.media_id = integer().references(() => mediaAssets.id);

// 2. Link existing uploaded icons
UPDATE categories SET media_id = 166 WHERE id = 1; -- Activewear icon
UPDATE categories SET media_id = 167 WHERE id = 2; -- Performance icon
// ... etc

// 3. Update frontend to use media_id
const categoryImage = mediaAssets.find(m => m.id === category.media_id);

// 4. Deprecate image_url column (later)
```

---

### 6.3 MEDIUM Priority (Next Sprint)

#### 🟡 Issue 8: Frontend/Backend TTL Mismatches
**Problem:** Homepage frontend refetches every 30s but backend caches 10 min  
**Solution:** Align staleTime with backend TTL
```typescript
// Homepage - increase staleTime to match backend
useQuery({
  queryKey: ['/api/homepage-batch'],
  staleTime: 10 * 60 * 1000, // 10 min (was 30s)
});

// Sustainability - align with HTTP cache
useQuery({
  queryKey: ['/api/sustainability-hero'],
  staleTime: 30 * 60 * 1000, // 30 min
});
```

#### 🟡 Issue 9: Sustainability Loads All 61 Media Files
**Problem:** Fetches ALL media then filters client-side (loads 59 orphaned files)  
**Solution:** Implement targeted media loading like Manufacturing page
```typescript
// Before: loads all media
const { data: allMedia } = useQuery({ queryKey: ['/api/media-assets'] });
const fabricMedia = allMedia.filter(m => fabricIds.includes(m.id));

// After: targeted loading
const fabricMediaIds = fabrics.map(f => f.visualSwatchId).filter(Boolean);
const { data: fabricMedia } = useQuery({
  queryKey: ['/api/media-assets-batch'],
  method: 'POST',
  body: { ids: fabricMediaIds }
});
```

#### 🟡 Issue 10: Fabrics Only on Sustainability (Should Be Manufacturing Too)
**Problem:** Material data isolated to one page  
**Solution:** Add fabric showcase to Manufacturing page
```tsx
// Manufacturing page
<section>
  <h2>Our Materials</h2>
  <FabricGrid fabrics={fabrics} />
</section>
```

---

### 6.4 LOW Priority (Backlog)

#### 🟢 Issue 11: No Product Detail Pages
**Problem:** Products only shown on homepage, no `/products/:id` route  
**Solution:** Implement product catalog pages for complete B2B experience

#### 🟢 Issue 12: Fiber Feature Orphaned
**Problem:** Admin can configure fibers but frontend never displays them  
**Solution:** Either implement fiber showcase on Sustainability/Manufacturing OR remove admin panel

#### 🟢 Issue 13: No FK Constraints in Database Schema
**Problem:** Allows broken references, orphaned files, no cascade deletes  
**Solution:** Add explicit FK constraints in Drizzle schema
```typescript
backgroundImageId: integer('background_image_id')
  .references(() => mediaAssets.id, { onDelete: 'SET NULL' })
```

---

## 7. Implementation Roadmap

### Phase 1: Critical Fixes (Week 1)
1. ✅ Run media cleanup script, archive 59 orphaned files
2. ✅ Add cache invalidation to all admin mutation endpoints
3. ✅ Implement UnifiedReplitCache for about-batch endpoint
4. ✅ Disable/hide 6 non-functional admin panels (or add "Not Connected" banners)

### Phase 2: High Priority (Week 2)
1. ✅ Add caching to Technology endpoints
2. ✅ Fix Contact page (connect to DB or delete table)
3. ✅ Migrate categories to use media_id FK instead of image_url
4. ✅ Link 5 orphaned category SVG icons

### Phase 3: Medium Priority (Week 3-4)
1. ✅ Align frontend staleTime with backend TTLs
2. ✅ Implement targeted media loading for Sustainability page
3. ✅ Add fabric display to Manufacturing page
4. ✅ Add "Media Usage" indicator to admin media panel

### Phase 4: Low Priority (Backlog)
1. 📋 Implement product detail pages (/products/:id)
2. 📋 Implement category browse pages (/categories/:id)
3. 📋 Connect Navigation admin to frontend OR remove panel
4. 📋 Implement fiber showcase OR remove admin panel
5. 📋 Add database FK constraints for referential integrity

---

## 8. Technical Implementation Guidance

### 8.1 Adding UnifiedReplitCache to Endpoints

**Pattern (Based on homepage-batch):**
```typescript
import { CacheOperations } from '../lib/cache-strategies.js';
import { UnifiedReplitCache } from '../lib/unified-replit-cache.js';

const cacheManager = UnifiedReplitCache.getInstance();

app.get('/api/about-batch', asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const cacheKey = 'about-batch';
  const cacheTTL = 10 * 60 * 1000; // 10 minutes
  
  // Check cache age for stale-while-revalidate
  const cachedData = await cacheManager.get(cacheKey);
  const cacheAge = cachedData ? await cacheManager.getCacheAge(cacheKey) : null;
  const staleThreshold = cacheTTL * 0.8; // 80% of TTL
  
  // If stale, return immediately and refresh background
  if (cachedData && cacheAge && cacheAge > staleThreshold) {
    res.json(cachedData);
    // Background refresh (fire and forget)
    setImmediate(() => refreshAboutData());
    return;
  }
  
  // Cache miss or fresh needed - fetch from DB
  const batchData = await CacheOperations.getAboutData('batch', async () => {
    const [hero, timeline, ...] = await Promise.all([...]);
    return { hero, timeline, ... };
  });
  
  res.json(batchData);
}));
```

### 8.2 Cache Invalidation Implementation

**After Admin Mutations:**
```typescript
// Homepage updates
router.patch('/api/homepage-hero', async (req, res) => {
  const hero = await storage.updateHomepageHero(data);
  await CacheOperations.invalidateHomepage(); // Key line
  res.json(hero);
});

// About updates
router.patch('/api/about-hero', async (req, res) => {
  const hero = await storage.updateAboutHero(data);
  await cacheManager.delete('about-batch'); // Invalidate cache
  res.json(hero);
});

// For HTTP-cached endpoints (Sustainability/Manufacturing)
router.patch('/api/sustainability-hero', async (req, res) => {
  const hero = await storage.updateSustainabilityHero(data);
  // Option 1: Add cache-busting version param
  // Option 2: If using CDN, purge CDN cache
  // Option 3: Reduce max-age temporarily
  res.json(hero);
});
```

### 8.3 Media Cleanup Script

**Safe Orphan Identification:**
```typescript
// scripts/cleanup-orphaned-media.ts
import { getStorage } from '../server/lib/storage-singleton.js';

async function identifyOrphanedMedia() {
  const storage = getStorage();
  const allMedia = await storage.getAllMediaAssets();
  
  // Collect all referenced media IDs from all tables
  const referencedIds = new Set<number>();
  
  // Homepage
  const homepageHero = await storage.getHomepageHero();
  if (homepageHero?.backgroundImageId) referencedIds.add(homepageHero.backgroundImageId);
  
  // Products
  const products = await storage.getProducts();
  products.forEach(p => {
    if (p.primaryImageId) referencedIds.add(p.primaryImageId);
  });
  
  // ... check all other FK references
  
  // Identify orphans
  const orphanedMedia = allMedia.filter(m => !referencedIds.has(m.id));
  
  console.log(`Total media: ${allMedia.length}`);
  console.log(`Referenced: ${referencedIds.size}`);
  console.log(`Orphaned: ${orphanedMedia.length}`);
  
  // Export orphan report
  fs.writeFileSync('orphaned-media-report.json', JSON.stringify(orphanedMedia, null, 2));
  
  return orphanedMedia;
}
```

### 8.4 Frontend staleTime Alignment

**Update React Query Configuration:**
```typescript
// client/src/lib/queryClient.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // Default 5min
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

// Per-page overrides to match backend TTL
// Homepage
useQuery({
  queryKey: ['/api/homepage-batch'],
  staleTime: 10 * 60 * 1000, // Match backend 10min cache
});

// Manufacturing
useQuery({
  queryKey: ['/api/manufacturing-hero'],
  staleTime: 30 * 60 * 1000, // Match backend 30min HTTP cache
  gcTime: 60 * 60 * 1000, // 1hr garbage collection
});
```

---

## 9. Monitoring & Validation

### 9.1 Cache Health Endpoints

**Monitor Cache Performance:**
```bash
# Cache health
curl http://localhost:5000/api/cache/health

# Performance monitoring
curl http://localhost:5000/api/performance-monitoring
```

**Expected Response:**
```json
{
  "timestamp": "2025-10-14T...",
  "cacheSystem": "unified-cache-manager-v2",
  "apiPerformance": {
    "homepageBatchResponseTime": 0.8,
    "target": "< 500ms",
    "status": "EXCELLENT"
  },
  "cacheMetrics": {
    "hitRate": 0.94,
    "totalHits": 1250,
    "totalMisses": 80
  }
}
```

### 9.2 Media Usage Validation

**After Cleanup, Verify:**
```sql
-- Should return 0 orphaned files
SELECT COUNT(*) FROM media_assets
WHERE id NOT IN (
  SELECT background_image_id FROM homepage_hero WHERE background_image_id IS NOT NULL
  UNION SELECT image_id FROM about_timeline_entries WHERE image_id IS NOT NULL
  -- ... all FK references
);
```

### 9.3 Admin Panel Functionality Check

**Before/After Validation:**
```typescript
// 1. Admin updates homepage hero title
// 2. Check cache invalidation triggered
// 3. Verify frontend shows new title within 1-2 seconds (not 10 minutes)

// Expected flow:
// Admin PATCH → Cache invalidate → Next GET returns fresh data
```

---

## 10. Conclusion

This investigation revealed **critical architectural gaps** between admin CMS and frontend rendering:

### ✅ What's Working Well
- Homepage batch endpoint with advanced caching (stale-while-revalidate)
- Manufacturing page caching strategy (aligned frontend/backend TTLs)
- Parallel query patterns for performance
- 2-tier cache architecture (L1 memory + L2 persistent)

### ❌ Critical Issues Requiring Immediate Attention
1. **96.7% media orphan rate** - 274.76 MB wasted storage
2. **No cache invalidation** - admin changes delayed 10-60 minutes
3. **6 non-functional admin panels** - admin confusion, wasted effort
4. **About page no caching** - every request hits database
5. **Technology no caching** - performance bottleneck

### 📊 Impact Assessment

| Issue | User Impact | Admin Impact | Performance Impact | Business Impact |
|-------|-------------|--------------|-------------------|-----------------|
| Media orphans | None direct | Confusion, wasted effort | 274 MB storage cost | $$$ wasted |
| No cache invalidation | Stale content 10-60 min | Frustrated admins | None | Poor UX |
| Non-functional panels | None | Time wasted configuring | None | Admin distrust |
| No About caching | Slower page loads | None | 200-500ms response | SEO impact |
| No Tech caching | Slower page loads | None | DB overload | SEO impact |

### 🚀 Next Steps

**Immediate (This Week):**
1. Run media cleanup script → archive 59 orphaned files
2. Add cache invalidation to all admin mutations
3. Implement UnifiedReplitCache for about-batch
4. Disable 6 non-functional admin panels

**Short-term (Next 2 Weeks):**
1. Add caching to Technology endpoints
2. Fix Contact page database mismatch
3. Migrate categories to media_id FK
4. Align frontend/backend TTLs

**Long-term (Backlog):**
1. Implement product detail pages
2. Connect Navigation admin to frontend
3. Add database FK constraints
4. Implement comprehensive media usage tracking

---

## Appendix: Investigation Artifacts

- **CHUNK_1_ADMIN_PANEL_INVENTORY.json** - Complete admin panel data audit
- **CHUNK_2_FRONTEND_DISPLAY_VERIFICATION.json** - Page-by-page frontend analysis
- **CHUNK_3_MEDIA_INTEGRITY_STORAGE_AUDIT.json** - Media orphan and storage audit
- **CHUNK_4_DATABASE_CACHE_FRONTEND_PIPELINE.json** - Cache architecture deep dive
- **CHUNK_5_SHARED_CONTENT_CONSISTENCY.json** - Cross-page content consistency check
- **CMS_ARCHITECTURE_INVESTIGATION_FINAL_REPORT.md** - This comprehensive report

---

**Report Generated:** October 14, 2025  
**Investigation Duration:** 6 investigation chunks  
**Database Queries Executed:** 50+  
**Files Analyzed:** 100+  
**Critical Findings:** 13  
**Recommendations:** 13 prioritized actions
