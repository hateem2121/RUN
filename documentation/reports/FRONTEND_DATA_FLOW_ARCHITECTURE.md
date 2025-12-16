# Frontend Data Flow Architecture

## B2B Sportswear Manufacturing Platform CMS

**Last Updated:** October 14, 2025  
**Architecture Version:** 3.0 (Post-Batch Optimization)

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Data Loading Strategies](#data-loading-strategies)
3. [Page-by-Page Data Flow](#page-by-page-data-flow)
4. [Media Asset Loading Patterns](#media-asset-loading-patterns)
5. [Data Transformation Patterns](#data-transformation-patterns)
6. [Performance Optimizations](#performance-optimizations)

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Homepage │  │  About   │  │Manufact. │  │Technology│    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
│       │             │              │              │          │
│  ┌────▼─────────────▼──────────────▼──────────────▼─────┐   │
│  │         React Query Cache Layer (TanStack)          │   │
│  │         staleTime: 30s | gcTime: varies             │   │
│  └────┬─────────────┬──────────────┬──────────────┬─────┘   │
└───────┼─────────────┼──────────────┼──────────────┼─────────┘
        │             │              │              │
┌───────▼─────────────▼──────────────▼──────────────▼─────────┐
│                    API Endpoint Layer                        │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐    │
│  │   Batch     │  │  Separate   │  │  Media Batch     │    │
│  │  Endpoints  │  │  Endpoints  │  │    Endpoint      │    │
│  │ (Homepage,  │  │(Manufact.,  │  │  /api/media/     │    │
│  │   About)    │  │Technology)  │  │     batch        │    │
│  └──────┬──────┘  └──────┬──────┘  └────────┬─────────┘    │
└─────────┼─────────────────┼──────────────────┼──────────────┘
          │                 │                  │
┌─────────▼─────────────────▼──────────────────▼──────────────┐
│                  PostgreSQL Database                         │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │ 40+ CMS      │  │ Foreign Key  │  │ Media Assets    │   │
│  │ Tables       │  │ Relations    │  │ (mediaAssets)   │   │
│  └──────────────┘  └──────────────┘  └─────────────────┘   │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
                  ┌───────────────────────┐
                  │ Replit Object Storage │
                  │  (Actual Files)       │
                  └───────────────────────┘
```

---

## Data Loading Strategies

### Strategy 1: Batch Endpoints (Optimized)

**Used by:** Homepage, About  
**Pattern:** Single API call returns all page data  
**Performance:** 85.7% reduction in network requests (7→1)

```typescript
// Homepage Example
const { data: batchData } = useQuery<HomepageBatchData>({
  queryKey: ["/api/homepage-batch"],
  staleTime: 30 * 1000, // 30 seconds
});

// Response Structure
interface HomepageBatchData {
  hero: HomepageHero | null;
  slogans: HomepageSlogan[];
  processCards: HomepageProcessCard[];
  sections: HomepageSection[];
  sustainability: HomepageSustainability | null;
  featuredProductsSettings: HomepageFeaturedProductsSettings | null;
  products: Product[];
  categories: Category[];
  _meta: {
    fetchedAt: string;
    totalRequests: number;
    cacheEnabled: boolean;
    cacheTTL: number;
  };
}
```

### Strategy 2: Separate Endpoints

**Used by:** Manufacturing, Technology, Sustainability  
**Pattern:** Multiple parallel API calls per entity type  
**Performance:** Granular caching, longer staleTime (30min for Manufacturing)

```typescript
// Manufacturing Example
const { data: hero } = useQuery<ManufacturingHero>({
  queryKey: ["/api/manufacturing-hero"],
  staleTime: 30 * 60 * 1000, // 30 minutes
  gcTime: 60 * 60 * 1000, // 1 hour
});

const { data: processes = [] } = useQuery<ManufacturingProcess[]>({
  queryKey: ["/api/manufacturing-processes"],
  staleTime: 30 * 60 * 1000,
});
```

### Strategy 3: Hardcoded Data

**Used by:** Contact  
**Pattern:** No database queries  
**Reason:** Footer configuration system deprecated (October 2025)

```typescript
// Contact page - hardcoded
<ContactInfo
  email="info@runapparel.com"
  phone="+1 (555) 123-4567"
  address="123 Manufacturing Street"
/>
```

---

## Page-by-Page Data Flow

### 1. Homepage (`/`)

#### Data Fetching

```typescript
API Endpoint: /api/homepage-batch
Query Key: ["/api/homepage-batch"]
staleTime: 30 seconds
Cache Strategy: Batch with unwrapResult() helper
```

#### Database Tables Accessed

- `homepageHero` → hero data
- `homepageSlogans` → rotating slogans (sorted by position)
- `homepageProcessCards` → draggable cards (iconMediaId references)
- `homepageSections` → page sections configuration
- `homepageSustainability` → sustainability metrics
- `homepageFeaturedProductsSettings` → dot grid configuration
- `products` → featured products (first 3)
- `categories` → featured content with media

#### Media Loading Strategy

**Type:** Targeted Loading (Phase 1A+1B)

```typescript
// Extract all media IDs first
const extractedMediaIds = useMemo(() => {
  const ids = new Set<number>();

  // Hero background (CRITICAL)
  if (hero?.backgroundImageId) ids.add(hero.backgroundImageId);

  // Process cards
  processCards.forEach((card) => {
    if (card.iconMediaId) ids.add(card.iconMediaId);
  });

  // Sections
  sections.forEach((section) => {
    section.mediaIds?.forEach((id) => ids.add(id));
  });

  // Products
  products.forEach((product) => {
    if (product.primaryImageId) ids.add(product.primaryImageId);
    if (product.primaryVideoId) ids.add(product.primaryVideoId);
    product.imageIds?.forEach((id) => ids.add(id));
  });

  return Array.from(ids);
}, [hero, processCards, sections, products]);

// Load only those specific IDs
const { assets } = useHomepageMediaLoader(hero?.backgroundImageId, [], [], {
  targetedLoading: true,
  extractedMediaIds,
});
```

**API Call:** `/api/media/batch/content?ids=1,2,3,4,5`

**Response Format:**

- Small assets (<100KB): Inlined as Data URIs for instant rendering
- Large assets: URLs returned as `/api/media/{id}/content`

#### Data Transformation

```typescript
// Unwrap cached results
function unwrapResult<T>(x: MaybeCached<T>): T | undefined {
  if (!x) return undefined;
  if ("result" in x) return x.result;
  return x as T;
}

const hero = unwrapResult(batchData?.hero);
const slogans = unwrapResult(batchData?.slogans) || [];
```

#### Media URL Generation

```typescript
const getMediaUrl = (mediaId: number) => {
  const asset = getAssetById(mediaId);
  return asset ? `/api/media/${asset.id}/content` : null;
};
```

---

### 2. About Page (`/about`)

#### Data Fetching

```typescript
API Endpoint: /api/about-batch
Query Key: ['/api/about-batch']
staleTime: default (5 minutes)
Cache Strategy: Batch with media assets included
```

#### Database Tables Accessed

- `aboutHero` → hero section (backgroundMediaId)
- `aboutTimelineEntry` → timeline milestones (imageId references)
- `aboutMapLocation` → global presence map (latitude/longitude)
- `aboutSection` → capability sections (no media)
- `aboutStatistic` → key statistics (icon names, no media)
- `aboutTeamMessage` → executive message (imageId reference)
- `mediaAssets` → all referenced media loaded in batch

#### Media Loading Strategy

**Type:** Batch Inclusion

```typescript
const { data: batchData } = useQuery({
  queryKey: ["/api/about-batch"],
  queryFn: async () => {
    const response = await fetch("/api/about-batch");
    return response.json();
  },
});

// Media assets already included in response
const mediaAssets = batchData?.mediaAssets || [];

// Use MediaResolver for URL generation
const { getAsset, getAssetUrl } = useMediaResolver(mediaAssets);
```

#### Data Transformation

```typescript
// Timeline transformation
const timelineData = sortedTimeline.map((item) => ({
  title: item.year.toString(),
  content: (
    <div>
      {item.imageId && (
        <ReplitOptimizedImage mediaId={item.imageId} alt={item.title} quality={85} />
      )}
    </div>
  ),
}));

// Map location transformation
const mapLocations: MapLocation[] = locations.map((location) => ({
  id: location.id,
  type: location.type as "client" | "facility",
  latitude: parseFloat(location.latitude),
  longitude: parseFloat(location.longitude),
  city: location.city || "",
  country: location.country || "",
}));
```

#### Media URL Pattern

```typescript
// Via MediaResolver
const heroBackgroundImage = heroData?.backgroundMediaId
  ? getAssetUrl(heroData.backgroundMediaId)
  : "";

// Returns: /api/media/{id}/content
```

---

### 3. Sustainability Page (`/sustainability`)

#### Data Fetching

```typescript
// Separate endpoints strategy
const { data: hero } = useQuery<SustainabilityHero>({
  queryKey: ["/api/sustainability-hero"],
});

const { data: metrics = [] } = useQuery<SustainabilityMetric[]>({
  queryKey: ["/api/sustainability-metrics"],
});

const { data: initiatives = [] } = useQuery<SustainabilityInitiative[]>({
  queryKey: ["/api/sustainability-initiatives"],
});

const { data: goals = [] } = useQuery<SustainabilityGoal[]>({
  queryKey: ["/api/sustainability-goals"],
});

const { data: fabricsData = [] } = useQuery<Fabric[]>({
  queryKey: ["/api/fabrics"],
});

const { data: fabricPortfolio } = useQuery<SustainabilityFabricPortfolio>({
  queryKey: ["/api/sustainability-fabric-portfolio"],
});
```

#### Database Tables Accessed

- `sustainabilityHero` → hero section with media
- `sustainabilityMetric` → environmental metrics (icon names)
- `sustainabilityInitiative` → initiatives with imageId
- `sustainabilityGoal` → progress goals (calculations)
- `fabrics` → sustainable fabrics (visualSwatchId)
- `sustainabilityFabricPortfolio` → selected fabric IDs
- `certificates` → certifications display

#### Media Loading Strategy

**Type:** Load All + Filter

```typescript
// Load ALL media assets
const { data: mediaResponse } = useQuery({
  queryKey: MediaQueryKeys.list,
  queryFn: () => apiRequest("GET", "/api/media?all=true"),
});

const mediaAssets = mediaResponse?.data?.data || [];

// Client-side filtering
const initiativeImage = mediaAssets.find((asset) => asset.id === initiative.imageId);
```

**Note:** Less efficient than targeted loading, but simpler implementation

#### Data Transformation

```typescript
// Memoized fabric selection
const sustainableFabrics = useMemo(() => {
  const activeFabrics = fabricsData.filter((f) => f.isActive);
  const selectedIds = fabricPortfolioData?.selectedFabricIds;

  if (selectedIds?.length > 0) {
    return selectedIds
      .map((id) => activeFabrics.find((f) => f.id === id))
      .filter((f): f is Fabric => f !== undefined)
      .slice(0, 6);
  }

  return activeFabrics.slice(0, 6);
}, [fabricsData, fabricPortfolioData]);

// Progress calculation
const goalsWithProgress = useMemo(
  () =>
    goals.map((goal) => ({
      ...goal,
      progress: calculateProgress(goal.currentValue, goal.targetValue),
    })),
  [goals],
);
```

#### Media URL Pattern

```typescript
// Direct ID to URL
const imageUrl = media.url || `/api/media/${media.id}/content`;
```

---

### 4. Manufacturing Page (`/manufacturing`)

#### Data Fetching

```typescript
const { data: hero } = useQuery<ManufacturingHero>({
  queryKey: ["/api/manufacturing-hero"],
  staleTime: 30 * 60 * 1000, // 30 minutes
  gcTime: 60 * 60 * 1000, // 1 hour
  refetchOnWindowFocus: false,
});

const { data: processes = [] } = useQuery<ManufacturingProcess[]>({
  queryKey: ["/api/manufacturing-processes"],
  staleTime: 30 * 60 * 1000,
});

const { data: capabilities = [] } = useQuery<ManufacturingCapability[]>({
  queryKey: ["/api/manufacturing-capabilities"],
  staleTime: 30 * 60 * 1000,
});

const { data: qualityItems = [] } = useQuery<ManufacturingQuality[]>({
  queryKey: ["/api/manufacturing-quality"],
  staleTime: 30 * 60 * 1000,
});
```

#### Database Tables Accessed

- `manufacturingHero` → hero section (backgroundMediaId, videoId)
- `manufacturingProcess` → process steps (mediaIds array)
- `manufacturingCapability` → capabilities (imageId)
- `manufacturingQuality` → quality standards (imageId)

#### Media Loading Strategy

**Type:** Batch POST by Collected IDs

```typescript
// Step 1: Collect all required media IDs
const requiredMediaIds = useMemo(() => {
  const ids = new Set<number>();

  if (hero?.backgroundMediaId) ids.add(hero.backgroundMediaId);
  if (hero?.videoId) ids.add(hero.videoId);

  processes.forEach((p) => {
    p.mediaIds?.forEach((id) => ids.add(id));
  });

  capabilities.forEach((c) => {
    if (c.imageId) ids.add(c.imageId);
  });

  qualityItems.forEach((q) => {
    if (q.imageId) ids.add(q.imageId);
  });

  return Array.from(ids);
}, [hero, processes, capabilities, qualityItems]);

// Step 2: Batch load only those IDs
const { data: mediaResponse } = useQuery({
  queryKey: createMediaQueryKey.batch(requiredMediaIds),
  queryFn: async () => {
    if (requiredMediaIds.length === 0) return { data: [] };

    return apiRequest("POST", "/api/media/batch", {
      operation: "get",
      ids: requiredMediaIds,
    });
  },
  enabled: requiredMediaIds.length > 0,
  staleTime: 30 * 60 * 1000,
});

// Extract from batch response structure
const mediaAssets =
  mediaResponse?.data?.results?.filter((r) => r.success)?.map((r) => r.data) || [];
```

**Endpoint:** `POST /api/media/batch`  
**Body:** `{ operation: "get", ids: [1, 2, 3] }`

#### Media URL Pattern

```typescript
// Assets passed to child components
<PublicHeroSection mediaAssets={mediaAssets} />
<PublicProcessSection mediaAssets={mediaAssets} />
```

---

### 5. Technology Page (`/technology`)

#### Data Fetching

```typescript
// All with 30s staleTime
// Batch request via useOptimizedQuery
const { data: batchData } = useOptimizedQuery<TechnologyBatchResponse>({
  queryKey: ["/api/technology-batch"],
  staleTime: 15 * 60 * 1000, // 15 minutes default
});

// Single endpoint replaces 7 separate calls
const { hero, innovations, equipment, research, roadmap, cta, gradientSettings } = batchData || {};
```

#### Database Tables Accessed

- `technologyGradientSettings` → gradient animation config (JSONB)
- `technologyHero` → hero section (videoId OR imageId)
- `technologyInnovation` → innovations (imageId, videoId)
- `technologyEquipment` → equipment (imageId)
- `technologyResearch` → research projects (no media in schema)
- `technologyRoadmap` → roadmap items (no media in schema)
- `technologyCta` → call-to-action text

#### Data Transformation - View Model Pattern

```typescript
// Normalize schema mismatches
type HeroVM = {
  title: string;
  subtitle: string;
  primaryCtaText: string;
  secondaryCtaText: string;
  primaryCtaLink: string;
  secondaryCtaLink: string;
  backgroundImageId: number | null;
};

function normalizeHero(h: TechnologyHero): HeroVM | null {
  // Handle legacy JSON fields
  const heroData = h as Record<string, unknown>;

  return {
    title: (heroData.headline as string) || h.title || 'Technology',
    subtitle: (heroData.subheadline as string) || h.subtitle || '',
    primaryCtaText: (heroData.primaryCtaText as string) ||
                    (heroData.ctaText as string) || 'Learn more',
    // ... resolve all fields
    // STRICT: Only usage of schema defined backgroundMediaId
    backgroundImageId: resolveHeroBackgroundId(h)
  };
}

// Unified view model
const vm: TechnologyVM = useMemo(() =>
  normalizeTechnologyData(hero, innovations, equipment, ...),
  [hero, innovations, equipment, ...]
);
```

**Schema Discrepancy Noted:**  
Technology hero expects `primaryButtonText` and `primaryButtonLink` fields that don't exist in the database. View model normalizes these mismatches.

#### Media Loading Strategy

**Type:** Progressive 3D Model Loading

```typescript
// PHASE E: Ultra-progressive 3D loading
const [shouldLoadModel, setShouldLoadModel] = useState(false);

// Intersection observer triggers loading
useEffect(() => {
  if (media.type === "3d_model") {
    // Only load when:
    // 1. User clicks "Load 3D Model" button, OR
    // 2. Model visible for 2+ seconds
    const firstSeen = parseInt(containerRef.current?.dataset.firstSeen || "0");
    if (userRequestedLoad || (isIntersecting && Date.now() - firstSeen > 2000)) {
      setShouldLoadModel(true);
    }
  }
}, [media.type, isIntersecting, userRequestedLoad]);

// Render UnifiedModelViewer only when ready
{
  shouldLoadModel && (
    <UnifiedModelViewer
      asset={media}
      config={{
        cameraControls: true,
        autoRotate: true,
        backgroundColorHex: "transparent",
      }}
    />
  );
}
```

**3D Model Loading:** Never blocks page render, progressive enhancement with poster images

---

### 6. Contact Page (`/contact`)

#### Data Fetching

```typescript
// NO DATABASE QUERIES
// Footer configuration deprecated October 2025
```

#### Hardcoded Data

```typescript
<ContactInfo
  email="info@runapparel.com"
  phone="+1 (555) 123-4567"
  address="123 Manufacturing Street"
  city="Industrial City"
  country="Country"
  hours="Monday - Friday: 9:00 AM - 6:00 PM"
/>
```

---

## Media Asset Loading Patterns

### Pattern 1: Targeted Loading (Homepage)

**Endpoint:** `GET /api/media/batch/content?ids=1,2,3`

**Flow:**

1. Extract all referenced media IDs from data
2. Request batch with specific IDs
3. Backend returns optimized response:
   - Small files (<100KB): Data URI inlined
   - Large files: URL to `/api/media/{id}/content`

**Advantages:**

- Minimal payload
- Instant rendering for small assets
- Parallel loading for large assets

### Pattern 2: Batch Inclusion (About)

**Endpoint:** `GET /api/about-batch`

**Flow:**

1. Backend identifies all referenced media IDs
2. Joins with mediaAssets table
3. Returns media in `mediaAssets` field
4. Frontend uses MediaResolver service

**Advantages:**

- Single request
- No client-side ID extraction
- MediaResolver provides fallback logic

### Pattern 3: Load All + Filter (Sustainability)

**Endpoint:** `GET /api/media?all=true`

**Flow:**

1. Load all media assets
2. Client-side filtering by ID
3. Simple array.find() lookups

**Advantages:**

- Simple implementation
- Works for dynamic filtering

**Disadvantages:**

- Over-fetching
- Larger payload

### Pattern 4: Batch POST (Manufacturing)

**Endpoint:** `POST /api/media/batch`

**Flow:**

1. Collect required media IDs
2. POST request with IDs array
3. Extract from `results[].data` structure

**Advantages:**

- Flexible for large ID sets
- POST body supports many IDs

---

## Data Transformation Patterns

### Pattern 1: unwrapResult() Helper (Homepage)

**Purpose:** Handle cache-wrapped responses

```typescript
type MaybeCached<T> = { result: T } | T;

function unwrapResult<T>(x: MaybeCached<T>): T | undefined {
  if (!x) return undefined;
  if ("result" in x) return x.result;
  return x as T;
}

// Usage
const hero = unwrapResult(batchData?.hero);
const slogans = unwrapResult(batchData?.slogans) || [];
```

### Pattern 2: MediaResolver Service (About)

**Purpose:** Centralized media URL resolution with fallbacks

```typescript
class MediaResolver {
  static initialize(assets: MediaAsset[]) {
    this.assets = assets;
  }

  static getAsset(id?: number): MediaAsset | null {
    return this.assets.find((a) => a.id === id) || null;
  }

  static getAssetUrl(id?: number, fallbackId?: number): string | null {
    const asset = this.getAsset(id) || this.getAsset(fallbackId);
    if (!asset) return null;

    // Safety check for PostgreSQL overflow
    if (asset.id >= 1000000000000) return null;

    return `/api/media/${asset.id}/content`;
  }
}

// React Hook
const { getAsset, getAssetUrl } = useMediaResolver(mediaAssets);
```

### Pattern 3: View Model Normalization (Technology)

**Purpose:** Abstract schema inconsistencies

```typescript
// Database schema has legacy fields
type TechnologyHero = {
  id: number;
  title: string;
  subtitle: string;
  // May have: headline, subheadline, ctaText (legacy JSON)
};

// UI expects consistent structure
type HeroVM = {
  title: string;
  subtitle: string;
  primaryCtaText: string;
  primaryCtaLink: string;
};

// Normalizer bridges the gap
function normalizeHero(raw: TechnologyHero): HeroVM {
  return {
    title: raw.headline || raw.title || "Default",
    subtitle: raw.subheadline || raw.subtitle || "",
    primaryCtaText: raw.primaryCtaText || raw.ctaText || "Learn More",
    primaryCtaLink: raw.primaryCtaLink || "#",
  };
}
```

### Pattern 4: Memoized Calculations (Sustainability)

**Purpose:** Prevent recalculation on every render

```typescript
// Progress calculations
const goalsWithProgress = useMemo(
  () =>
    goals.map((goal) => ({
      ...goal,
      progress: calculateProgress(goal.currentValue, goal.targetValue),
    })),
  [goals],
);

// Fabric filtering
const sustainableFabrics = useMemo(() => {
  const activeFabrics = fabricsData.filter((f) => f.isActive);
  return (
    selectedIds?.map((id) => activeFabrics.find((f) => f.id === id))?.slice(0, 6) ||
    activeFabrics.slice(0, 6)
  );
}, [fabricsData, selectedIds]);
```

---

## Performance Optimizations

### 1. React Query Cache Configuration

---

## Shared Constants & Design System

### Technology Integration (`client/src/lib/technology-constants.ts`)

**Purpose:** Enforce consistent design tokens between Admin and Public views without duplicating magic numbers.

```typescript
// Shared defaults
export const TECHNOLOGY_THEME = {
  colors: {
    primary: "#5227FF",
    gradientStart: "#FF9FFC",
    gradientEnd: "#5227FF",
  },
  // ...
};

// Gradient settings
export const TECHNOLOGY_DEFAULTS = {
  gradientSettings: {
    // ... preset complex values
  },
};
```

**Benefits:**

- Single source of truth for "Glitch" theme
- Type-safe configuration
- Zero-runtime overhead (tree-shakeable)

```typescript
// Homepage & Technology: Fast updates
staleTime: 30 * 1000, // 30 seconds

// Manufacturing: Longer caching
staleTime: 30 * 60 * 1000, // 30 minutes
gcTime: 60 * 60 * 1000, // 1 hour
refetchOnWindowFocus: false,
```

**Rationale:**

- Homepage changes frequently (hero rotations)
- Manufacturing content is stable
- Prevents flickering with consistent staleTime across all queries

### 2. Progressive Loading (Technology 3D Models)

```typescript
// Never block page render
const [shouldLoadModel, setShouldLoadModel] = useState(false);

// Load conditions:
// 1. User clicks "Load 3D Model"
// 2. Model visible for 2+ seconds
useEffect(() => {
  const delay = userRequestedLoad ? 200 : 2000;
  setTimeout(() => setShouldLoadModel(true), delay);
}, [isIntersecting, userRequestedLoad]);
```

**Performance Impact:**

- Page loads instantly
- 3D models load on-demand
- Intersection observer prevents loading off-screen content

### 3. Batch Optimization Metrics (Homepage)

**Before Optimization:**

- 7 separate API calls
- ~200-400ms total load time

**After Optimization:**

- 1 batch API call
- ~50-100ms total load time
- 85.7% reduction in network requests

```typescript
class HomepageBatchLoader {
  static performanceMetrics = {
    batchTime: 0,
    separateTime: 0,
    requestsSaved: 6,
    cacheHits: 0,
    cacheMisses: 0,
  };
}
```

### 4. Memoization Strategy

```typescript
// Prevent hook order changes
const extractedMediaIds = useMemo(() => {
  // Ensure stable dependencies
  const stableProcessCards = Array.isArray(processCards) ? processCards : [];
  const stableProducts = Array.isArray(products) ? products : [];

  const ids = new Set<number>();
  stableProcessCards.forEach((card) => {
    if (card.iconMediaId) ids.add(card.iconMediaId);
  });

  return Array.from(ids);
}, [processCards.length, products.length]); // Stable dependencies
```

**Why:**

- Prevents unnecessary re-renders
- Stable hook execution order
- Efficient dependency tracking

### 5. Component-Level Optimizations

```typescript
// Memoized metric cards (Sustainability)
const MetricCard = memo(({ metric, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, delay: index * 0.1 }}
  >
    {/* Card content */}
  </motion.div>
));
MetricCard.displayName = "MetricCard";
```

**Benefits:**

- React.memo prevents re-renders when props unchanged
- Framer Motion animations only trigger once
- Staggered delays for smooth UI

---

## Critical Findings & Architecture Notes

### 1. Data Wrapping Inconsistency

**Issue:** Homepage batch response wraps data in `{ result: T }` format  
**Solution:** `unwrapResult()` helper function  
**Why:** Cache manager adds result wrapper, but not consistently across all endpoints

### 2. Schema Mismatches

**Technology Hero Fields:**

- Database lacks: `primaryButtonText`, `primaryButtonLink`
- Code expects: CTA text/link fields
- Solution: View model normalization with fallbacks

### 3. Contact Page Deprecation

**Date:** October 2025  
**Change:** Footer configuration system removed  
**Impact:** Contact info now hardcoded (no database queries)

### 4. Media URL Patterns

```typescript
// Pattern 1: Direct content endpoint
/api/media/${id}/content

// Pattern 2: Proxy endpoint (legacy)
/api/media/proxy/${id}

// Pattern 3: Data URI (small assets)
data:image/jpeg;base64,/9j/4AAQSkZJRg...

// Pattern 4: Optimized variant
/api/media/${id}/content?width=800&quality=85&format=webp
```

### 5. Intersection Observer Usage

**Homepage:** Lazy load secondary media  
**Technology:** Progressive 3D model loading  
**Sustainability:** Viewport-triggered animations

```typescript
const lazyLoadCallback = useCallback(() => {
  if (hasMore && !isLoadingMore && !hasTriggeredLazyLoad) {
    loadMoreAssets();
  }
}, [hasMore, isLoadingMore, hasTriggeredLazyLoad]);

const triggerRef = useIntersectionObserver(lazyLoadCallback, {
  rootMargin: "300px",
});
```

---

## Summary Statistics

| Page           | Data Strategy | API Calls | Media Strategy    | staleTime |
| -------------- | ------------- | --------- | ----------------- | --------- |
| Homepage       | Batch         | 1         | Targeted Loading  | 30s       |
| About          | Batch         | 1         | Batch Inclusion   | default   |
| Sustainability | Separate      | 6+        | Load All + Filter | default   |
| Manufacturing  | Separate      | 4         | Batch POST        | 30min     |
| Technology     | Separate      | 7         | Progressive 3D    | 30s       |
| Contact        | Hardcoded     | 0         | None              | N/A       |

**Total Database Tables:** 40+  
**Total Media Loading Patterns:** 4  
**Total Data Transformation Patterns:** 4  
**Performance Improvement (Homepage):** 85.7% reduction in requests

---

## Future Optimization Opportunities

1. **Consolidate Sustainability Queries** → Batch endpoint like Homepage/About
2. **Technology Batch Endpoint** → Reduce 7 calls to 1
3. **Manufacturing Media Streaming** → Progressive loading like 3D models
4. **Global Media Cache** → Shared MediaResolver across all pages
5. **Service Worker Caching** → Offline media asset support

---

**Documentation Maintained By:** Architecture Team  
**Review Cycle:** Quarterly  
**Last Architecture Audit:** October 2025
