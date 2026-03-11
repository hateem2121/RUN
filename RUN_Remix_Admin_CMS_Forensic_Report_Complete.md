# RUN Remix Admin CMS: Complete Forensic UI/UX & Architectural Report

**Document Version:** 2.0  
**Date:** March 4, 2026  
**Classification:** Technical Architecture Documentation  
**Scope:** Complete Frontend CMS UI/UX Analysis & Frontend Mapping

---

## Executive Summary

The RUN Remix Admin CMS serves as the central nervous system for the RUN Apparel application, providing a comprehensive content management interface that drives dynamic content across the entire frontend ecosystem. This forensic analysis documents the complete administrative interface architecture, mapping all 17+ CMS modules to their corresponding user-facing components.

**Key Architectural Principles:**
- **Modular Component Architecture:** 3,000+ line monoliths decomposed into focused sub-components
- **Unified Design System:** shadcn/ui components with Tailwind CSS, CSS variables
- **State Management:** React Query for server state, React Context for UI state
- **Performance Optimization:** Lazy loading, pagination, memoization
- **Error Resilience:** Multi-level error boundaries from route to component

---

## 1. Global Admin UI/UX & Navigation

### 1.1 Layout Architecture

**Primary Layout Component:** [`admin-layout.tsx`](client/app/components/admin/admin-layout.tsx:1)

The admin interface employs a collapsible sidebar navigation pattern built on a custom [`Sidebar`](client/app/components/ui/sidebar.tsx) component.

**Visual Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│ ◐ RUN APPAREL CMS                                          👤   │
├─────────┬───────────────────────────────────────────────────────┤
│         │ Dashboard > Module                        [Search ⌘K] │
│ Sidebar │                                                       │
│  [▶]    │  ┌─────────────────────────────────────────────────┐│
│         │  │                                                 ││
│ • Dashboard│         Module Content Area                    ││
│ • Categories                                              ││
│ • Products │                                                 ││
│ • Media  │                                                 ││
│ • ...    │                                                 ││
│         │  └─────────────────────────────────────────────────┘│
└─────────┴───────────────────────────────────────────────────────┘
```

**Navigation Modules (20+ Primary Routes):**

| Icon | Label | Route | Frontend Impact |
|------|-------|-------|-----------------|
| <LayoutDashboard> | Dashboard | `/admin` | Cross-page analytics overview |
| <LayoutList> | Categories | `/admin/categories` | `/categories/*` navigation tree |
| <Shirt> | Products | `/admin/products` | `/categories/$category/$product` |
| <ScrollText> | Fibers | `/admin/fibers` | Product detail fiber specs |
| <FileText> | Fabrics | `/admin/fabrics` | Product fabric assignments |
| <Award> | Certificates | `/admin/certificates` | Sustainability/certification pages |
| <Ruler> | Size Charts | `/admin/size-charts` | Product size selectors |
| <Zap> | Accessories | `/admin/accessories` | Product customization options |
| <Image> | Media | `/admin/media` | All image/video/3D assets |
| <Database> | Storage Optimization | `/admin/storage-optimization` | Media cleanup & optimization |
| <Navigation> | Navigation | `/admin/navigation` | Floating dock nav items |
| <Mail> | Contact | `/admin/contact` | `/contact` page content |
| <ScrollText> | Footer | `/admin/footer` | Global footer configuration |
| <Inbox> | Inquiries | `/admin/inquiries` | B2B quote request management |
| <FileText> | Blog | `/admin/blog` | `/blog` content management |
| <Home> | Homepage | `/admin/homepage` | `/` hero, sections, featured |
| <FileText> | About Us | `/admin/about` | `/about` page sections |
| <Leaf> | Sustainability | `/admin/sustainability` | `/sustainability` full page |
| <Wrench> | Manufacturing | `/admin/manufacturing` | `/manufacturing` showcase |
| <Cpu> | Technology | `/admin/technology` | `/technology` showcase |

### 1.2 State Management Architecture

**Admin Context:** [`AdminContext.tsx`](client/app/context/AdminContext.tsx:1)

```typescript
interface AdminContextState {
  currentModule: string;        // Active module identifier
  isLoading: boolean;           // Global loading state
  error: Error | null;          // Error boundary integration
  sidebarOpen: boolean;         // Sidebar visibility
  queryParams: URLSearchParams; // URL state preservation
  hasUnsavedChanges: boolean;   // Navigation guard trigger
}
```

**Key UX Patterns:**
- **Unsaved Changes Guard:** `navigateWithState()` checks `hasUnsavedChanges`
- **Module Synchronization:** Automatic breadcrumb and highlighting updates
- **Query Preservation:** Optional parameter retention during navigation

### 1.3 Global Search

**Component:** [`ModuleSearch.tsx`](client/app/components/admin/ModuleSearch.tsx:1)

- Keyboard shortcut: `⌘K` (via `useHotkeys`)
- Command palette interface using `CommandDialog`
- Module name + icon search
- Instant navigation on selection

### 1.4 Breadcrumb Navigation

**Component:** [`AdminBreadcrumb.tsx`](client/app/components/admin/AdminBreadcrumb.tsx:1)

```
┌─ Home Icon → Dashboard → [Module Name]
```

- Path-based breadcrumb parsing
- Module label mapping via `moduleLabels` record
- Active module highlighting

### 1.5 Error Boundaries & Loading States

**Error Boundary Hierarchy:**
1. **Route Level:** `AdminErrorBoundary` - Catches all admin route errors
2. **Module Level:** `ErrorBoundary` wrapper per tab
3. **Component Level:** Try-catch in event handlers
4. **API Level:** `ApiErrorFallback` for fetch failures

**Loading States:**
- `AdminLoadingState` - Full-page skeleton
- `ModuleLoader` - Inline spinner with "Loading module..."
- `PlaceholderModule` - Migration pending indicator

---

## 2. Module-by-Module Breakdown

### 2.1 Main Dashboard (AdminCMS)

**File:** [`admin-cms.tsx`](client/app/components/admin/admin-cms.tsx:1)  
**Route:** `/admin` (default view)  
**Frontend Mapping:** Module overview, quick access to all CMS areas

**UI Pattern:** Module Card Grid

```
┌─────────────────────────────────────────────────────────────────────┐
│ Dashboard                                              [Version]    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │ 📦 Products │ │ 📁 Categories│ │ 🖼️ Media   │ │ 🧵 Fabrics  │   │
│  │    127      │ │     15      │ │    423     │ │     32      │   │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │
│                                                                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │ 🧬 Fibers   │ │ 📜 Size     │ │ 🎨 Printing │ │ 🧭 Website  │   │
│  │    18       │ │   Charts    │ │ Accessories│ │   Nav       │   │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Module Cards (17 Total):**

| Module | Count Display | Description |
|--------|---------------|-------------|
| Products | `products?.length` | Create, update, categorize with images/3D |
| Categories | `categories?.length` | Hierarchical product structuring |
| Media | `media?.length` | Centralized repository with tagging |
| Fabrics | `fabrics?.length` | Fabric types, compositions, properties |
| Fibers | `fibers?.length` | Material traceability |
| Certificates | `certificates?.length` | Compliance & sustainability certs |
| Size Charts | `sizeCharts?.length` | Per-category/region sizing |
| Accessories | `accessories?.length` | Customization options |
| Navigation | `navigationItems?.length` | Floating dock nav items |
| Contact | `1` | Contact page configuration |
| Inquiries | Sum of `inquiryStats.byStatus` | B2B customer inquiries |
| Homepage | `5` | Hero, slogans, process cards, featured, sustainability |
| About Us | `6` | Hero, timeline, locations, sections, stats, team |
| Sustainability | `4` | Hero, metrics, initiatives, goals |
| Manufacturing | `4` | Hero, processes, capabilities, quality |
| Technology | `4` | Hero, innovations, equipment, research |
| Footer | `1` | Footer configuration |

---

### 2.2 Cross-Page Dashboard

**File:** [`cross-page-dashboard.tsx`](client/app/components/admin/cross-page-dashboard.tsx:1)  
**Route:** `/admin` (integrated view)  
**Frontend Mapping:** Aggregated view of `/sustainability`, `/manufacturing`, `/technology`

**Dashboard Sections:**

| Section | Data Source | Metrics Displayed |
|---------|-------------|-------------------|
| Sustainability Impact | `/api/sustainability-metrics`, `/api/fabrics` | Goal progress, sustainable fabrics, carbon reduction |
| Manufacturing Excellence | `/api/manufacturing-processes`, `/api/manufacturing-qualities` | Process efficiency, quality controls, active processes |
| Technology Innovation | `/api/technology-innovations`, `/api/technology-research` | Active innovations, research progress, active projects |

**Cross-Functional Synergies:**
- Sustainability × Manufacturing: Combined efficiency scores
- Technology × Sustainability: Material innovations count
- Manufacturing × Technology: Quality-enhanced processes

**Visual Components:**
- Recharts BarChart, RadialBarChart for KPIs
- Progress bars for completion metrics
- Motion animations on card entry

---

### 2.3 Unified Product Management

**File:** [`ProductManagementUnified.tsx`](client/app/components/admin/product-management-unified/ProductManagementUnified.tsx:1)  
**Route:** `/admin/products`  
**Frontend Mapping:** `/categories/$category/$product`

**Architecture Pattern:** Master-Detail with Modal Editing

```
┌───────────────────────────────────────────────────────────────────────┐
│ Products                                    [+ New Product] [Filters] │
├───────────────────────────────┬───────────────────────────────────────┤
│                               │                                       │
│ Search [____________]         │  Product Details Panel                │
│ [Grid ▼] [List ▼]             │  ─────────────────────────────────    │
│                               │  Name: Premium Running Tee            │
│ ┌─────────────────────────┐   │  SKU: RUN-TSH-001                     │
│ │ [Image]                 │   │  Category: Activewear > T-Shirts      │
│ │ Premium Running Tee     │   │  Price: $89.00                        │
│ │ SKU: RUN-TSH-001        │   │                                       │
│ │ [Edit] [Delete]         │   │  Media: [img] [img] [video] [3D]      │
│ └─────────────────────────┘   │                                       │
│                               │  [Close] [Edit Product]               │
│ ┌─────────────────────────┐   │                                       │
│ │ [Image]                 │   │                                       │
│ │ Pro Training Shorts     │   │                                       │
│ │ SKU: RUN-SHR-002        │   │                                       │
│ └─────────────────────────┘   │                                       │
│                               │                                       │
│ Page 1 of 5 [Prev] [Next]     │                                       │
│                               │                                       │
└───────────────────────────────┴───────────────────────────────────────┘
```

#### 2.3.1 Product Grid

**Component:** [`ProductGrid.tsx`](client/app/components/admin/product-management-unified/core/ProductGrid.tsx:1)

- **Pagination:** 20 items/page (virtual scrolling eliminated)
- **View Modes:** Grid (responsive: 1/2/3/4 cols) or List
- **Filtering:** Category, fabric, status, search
- **Bulk Operations:** Multi-select with bulk actions

#### 2.3.2 Product Create/Edit Modal

**Component:** [`ProductCreateEditModal.tsx`](client/app/components/admin/product-management-unified/admin/ProductCreateEditModal.tsx:1)

**6 Collapsible Sections:**

| Section | Icon | Key Fields | Frontend Component |
|---------|------|------------|-------------------|
| Basic Info | <Package> | name, sku, description, shortDescription, slug, sortOrder, isActive, isFeatured | Product header, SEO meta |
| Category & Fabric | <Tag> | categoryId, fabricId, fiberIds | Product classification |
| Media Assets | <Camera> | primaryImageId, primaryVideoId, imageIds[], videos[], modelFileId | [`UnifiedMediaTheater`](client/app/components/products/UnifiedMediaTheater.tsx) |
| Specifications | <Settings> | weight, dimensions, material, careInstructions | [`ExpandableProductSections`](client/app/components/products/ExpandableProductSections.tsx) |
| Certifications | <Star> | certificateIds[] | [`ProductBadges`](client/app/components/products/ProductBadges.tsx) |
| Customization & SEO | <Palette> | customizationOptions[], metaTitle, metaDescription | SEO head, inquiry options |

**Form Management:**
- `useProductForm` - useReducer pattern for complex state
- `useAccordionPersistence` - localStorage for section states
- `useSmartValidation` - Real-time field validation

---

### 2.4 Media Library

**File:** [`MediaLibraryContainerEnhanced.tsx`](client/app/components/admin/media-library/MediaLibraryContainerEnhanced.tsx:1)  
**Route:** `/admin/media`  
**Frontend Mapping:** All media assets site-wide

**UI Structure:**
```
┌─────────────────────────────────────────────────────────────────────┐
│ Media Library                    [Upload] [Cleanup DB] [Filters]    │
├─────────────────────────────────────────────────────────────────────┤
│ Type: [All ▼] Status: [All ▼] Search: [__________]                  │
│                                                                     │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                │
│ │ [Image]  │ │ [Video ▶]│ │ [3D]     │ │ [Image]  │                │
│ │ ☑ photo  │ │ ☑ promo  │ │ ☑ shoe   │ │ ☑ fabric │                │
│ │ 1.2 MB   │ │ 5.4 MB   │ │ 12 MB    │ │ 856 KB   │                │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘                │
│                                                                     │
│ [Previous] Page 1 of 8 [Next]                                       │
└─────────────────────────────────────────────────────────────────────┘
```

**Key Features:**
- Grid/List view toggle
- Type filtering: image, video, 3d_model, document
- Batch operations with multi-select
- 3D model preview via `UnifiedModelViewer`
- Database cleanup for orphaned files
- Signed URL generation for secure access

---

### 2.5 Category Management

**File:** [`category-management-simplified.tsx`](client/app/components/admin/category-management-simplified.tsx:1)  
**Route:** `/admin/categories`  
**Frontend Mapping:** `/categories/*`, category navigation tree

**UI Pattern:** Tree View with Drag-and-Drop

**Key Features:**
- Hierarchical parent-child relationships
- Drag-and-drop reordering (`@dnd-kit`)
- Soft delete with restore option
- Product count per category
- Featured content 4-card editor

**Category Form Tabs:**
1. **Basic:** name, slug, description, parentId, sortOrder, isActive
2. **Media:** imageUrl, bannerUrl with media picker
3. **SEO:** metaTitle, metaDescription
4. **Featured Content:** Card1-4 editor for landing pages

---

### 2.6 Size Chart Management (Enhanced)

**File:** [`size-chart-management-enhanced.tsx`](client/app/components/admin/size-chart-management-enhanced.tsx:1)  
**Route:** `/admin/size-charts`  
**Frontend Mapping:** Product detail size selectors

**UI Pattern:** List with Completeness Indicators

```
┌─────────────────────────────────────────────────────────────────────┐
│ Size Charts                                           [+ New Chart] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐│
│ │ Men's T-Shirts - US                              [Edit] [Delete]││
│ │ 🇺🇸 US | 👕 Tops                                                 ││
│ │ Completeness: ████████░░ 80%                                    ││
│ │ 16/20 measurements complete                                     ││
│ └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐│
│ │ Women's Leggings - EU                            [Edit] [Delete]││
│ │ 🇪🇺 EU | 👖 Bottoms                                              ││
│ │ Completeness: ██████████ 100% ✓                                 ││
│ └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

**Features:**
- Region flags (US, EU, UK, CN, JP, INTL)
- Type categorization (Tops, Bottoms, Full Body)
- Completeness progress bars
- Measurement validation
- Size table editor (XS, S, M, L, XL, etc.)

---

### 2.7 Accessory Management (Enhanced)

**File:** [`accessory-management-enhanced.tsx`](client/app/components/admin/accessory-management-enhanced.tsx:1)  
**Route:** `/admin/accessories`  
**Frontend Mapping:** Product customization options

**Category System:**

| Category | Icon | Color |
|----------|------|-------|
| customization | <Palette> | purple |
| hardware | <Wrench> | blue |
| finishing | <Scissors> | green |
| trim | <Layers> | orange |
| packaging | <Package> | muted |

**Features:**
- Category-based organization
- Media preview thumbnails
- Description and specifications
- Product linking
- Active/inactive toggle

---

### 2.8 Fiber Management

**File:** [`fiber-management.tsx`](client/app/components/admin/fiber-management.tsx:1)  
**Route:** `/admin/fibers`  
**Frontend Mapping:** Product fiber specifications

**Form Fields:**
- Name, type (Cotton, Polyester, Wool, etc. or custom)
- Description
- Properties (tag-based input, comma-separated)
- Sustainability score (1-5 rating)
- Environmental impact notes
- Active toggle

**Data Transformation:**
```typescript
// Properties string → Object
"breathable, moisture-wicking, sustainable"
↓
{ "breathable": true, "moisture-wicking": true, "sustainable": true }
```

---

### 2.9 Fabric Management (Enhanced V2)

**File:** [`fabric-management-enhanced-v2.tsx`](client/app/components/admin/fabric-management-enhanced-v2.tsx:1)  
**Route:** `/admin/fabrics`  
**Frontend Mapping:** Product fabric assignments, sustainability portfolio

**Card Expansion Pattern:**
```
┌─────────────────────────────────────────────────────────────────────┐
│ [Swatch] Organic Cotton Jersey     Weight: 180 GSM    [▼ Expand]   │
├─────────────────────────────────────────────────────────────────────┤
│ (Expanded View)                                                     │
│                                                                     │
│ Classification        Performance        Durability                 │
│ • Type: Jersey        • Stretch: 15%     • Wash Cycles: 100+       │
│ • Weight: 180gsm      • Breathability    • Pilling: Grade 4        │
│ • Origin: Turkey        Excellent                                       │
│                                                                     │
│ Sustainability         Care Instructions                            │
│ • Score: 5/5 ✓        • Machine wash cold                          │
│ • GOTS Certified      • Tumble dry low                             │
│ • OEKO-TEX ✓          • Do not bleach                              │
│                                                                     │
│ [Edit] [Duplicate] [Delete]                                         │
└─────────────────────────────────────────────────────────────────────┘
```

**Collapsible Sections:** classification, performance, durability, sustainability, care

---

### 2.10 Certificate Management

**File:** [`certificate-management.tsx`](client/app/components/admin/certificate-management.tsx:1)  
**Route:** `/admin/certificates`  
**Frontend Mapping:** [`CertificatesSection`](client/app/components/sustainability/sections/CertificatesSection.tsx)

**Management Tabs:**
1. **Certificates** - Grid/List view with filters
2. **Analytics** - Usage statistics, validity tracking
3. **Insights** - Expiration alerts, recommendations

**Certificate Types:**
- OEKO-TEX
- GOTS (Global Organic Textile Standard)
- BCI (Better Cotton Initiative)
- Bluesign
- Fair Trade
- Custom

**Fields:**
- Name, type, issuing organization
- Document (PDF via media picker)
- Badge image (PNG/SVG display)
- Validity dates (issue date, expiry date)
- Description
- Active status

---

### 2.11 Navigation Management

**File:** [`navigation-management.tsx`](client/app/components/admin/navigation-management.tsx:1)  
**Route:** `/admin/navigation`  
**Frontend Mapping:** [`floating-dock-navbar`](client/app/components/navigation/floating-dock-header.tsx)

**UI Pattern:** Sortable List with Icon Selection

```
┌─────────────────────────────────────────────────────────────────────┐
│ Website Navigation                                    [+ Add Item]  │
├─────────────────────────────────────────────────────────────────────┤
│ Drag and drop to reorder. Active items appear in the floating dock. │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐│
│ │ ☰ Home                                  [Edit] [Delete]    ● Active││
│ ├─────────────────────────────────────────────────────────────────┤│
│ │ 🛍️ Shop                                 [Edit] [Delete]    ● Active││
│ ├─────────────────────────────────────────────────────────────────┤│
│ │ ♻️ Sustainability                       [Edit] [Delete]    ● Active││
│ ├─────────────────────────────────────────────────────────────────┤│
│ │ ℹ️ About Us                             [Edit] [Delete]   ○ Inactive││
│ └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

**Icon Types:**
1. **Tabler Icons:** 30+ predefined icons (IconHome, IconShoppingCart, IconLeaf, etc.)
2. **Media Icons:** Custom SVG/PNG upload via media picker

**Fields:**
- Label, href (route path)
- Icon type (tabler/media)
- Icon name or mediaId
- sortOrder
- isActive

---

### 2.12 Manufacturing Management

**File:** [`manufacturing-management.tsx`](client/app/components/admin/manufacturing-management.tsx:1)  
**Route:** `/admin/manufacturing`  
**Frontend Mapping:** `/manufacturing`

**4-Tab Structure:**

| Tab | Component | Frontend Section |
|-----|-----------|------------------|
| Hero | `HeroManagement` | `PublicHeroSection` |
| Processes | `ProcessManagement` | `ManufacturingProcessFlow` |
| Capabilities | `CapabilityManagement` | `PublicCapabilitySection` |
| Quality | `QualityManagement` | `PublicQualitySection` |

**Process Management:**
- Sortable process cards (drag-and-drop)
- Process name, description, duration
- Icon selection
- Media assignments
- Step sequencing

---

### 2.13 Sustainability Management

**File:** [`unified-sustainability-management.tsx`](client/app/components/admin/unified-sustainability-management.tsx:1)  
**Route:** `/admin/sustainability`  
**Frontend Mapping:** `/sustainability`

**8-Tab Architecture:**

| Tab | Content | Frontend Component |
|-----|---------|-------------------|
| Hero | Background media, title, subtitle | Hero section with parallax |
| Metrics | Impact metrics (water, carbon, energy) | `MetricsSection` |
| Goals | Timeline goals with progress | `GoalsSection` |
| Initiatives | Sortable initiative cards | `InitiativesSection` |
| Features | Feature highlights | `FeaturesSection` |
| Fabric Portfolio | Sustainable fabrics | `FabricPortfolioSection` |
| Certifications | Certificate assignments | `CertificatesSection` |
| CTA | Call-to-action config | `CTASection` |

**Sortable Patterns:**
- `SortableMetricItem` - Drag-and-drop metrics
- `SortableInitiativeItem` - Initiative cards
- `SortableGoalItem` - Timeline goals

---

### 2.14 Technology Management

**File:** [`technology-management.tsx`](client/app/components/admin/technology-management.tsx:1)  
**Route:** `/admin/technology`  
**Frontend Mapping:** `/technology`

**6-Tab Architecture:**

| Tab | Component | Frontend Section |
|-----|-----------|------------------|
| Hero | `TechnologyHeroManagement` | Hero section |
| Innovations | `TechnologyInnovationManagement` | `TechnologyStackSection` |
| Equipment | `TechnologyEquipmentManagement` | Equipment gallery |
| Research | `TechnologyResearchManagement` | Research listings |
| Roadmap | `TechnologyRoadmapManagement` | `RoadAheadTimeline` |
| CTA | `TechnologyCtaManagement` | Call-to-action |

**Innovation Management:**
- Drag-and-drop sortable cards
- Categories: Materials, Process, Digital, Automation
- Benefits list (array of strings)
- Technical details (JSON)
- Related products linking
- Status workflow: Research → Development → Production

---

### 2.15 Homepage Management

**File:** [`homepage-management.tsx`](client/app/components/admin/homepage-management.tsx:1)  
**Route:** `/admin/homepage`  
**Frontend Mapping:** `/` (Landing page)

**5-Tab Structure:**

| Tab | Component | Frontend Section |
|-----|-----------|------------------|
| Hero | `HomepageHeroTab` | `Hero` |
| Slogans | `HomepageSlogansTab` | `Values` |
| Process Cards | `HomepageProcessCardsTab` | `Process` |
| Sections | `HomepageSectionsTab` | Dynamic sections |
| Featured | `HomepageFeaturedTab` | `FeaturedProducts` |

---

### 2.16 About Page Management

**File:** [`AboutManagement.tsx`](client/app/components/admin/AboutManagement.tsx:1)  
**Route:** `/admin/about`  
**Frontend Mapping:** `/about`

**5-Tab Structure:**

| Tab | Component | Content |
|-----|-----------|---------|
| Hero | `AboutHeroTab` | Title, subtitle, background media |
| Statistics | `AboutStatisticsTab` | Animated counters |
| Team | `AboutTeamMessageTab` | Leadership message |
| Locations | `AboutLocationsTab` | Office/showroom locations |
| Sections | `AboutSectionsTab` | Content blocks |

---

### 2.17 Footer Management

**File:** [`FooterManagement.tsx`](client/app/components/admin/footer-management/FooterManagement.tsx:1)  
**Route:** `/admin/footer`  
**Frontend Mapping:** Global `Footer`

**5-Tab Structure:**

| Tab | Content |
|-----|---------|
| General | Company name, address, phone, email, brand text |
| Navigation | Dynamic columns (useFieldArray) |
| Social | Social media links (LinkedIn, Instagram, Twitter, etc.) |
| Legal | Privacy policy, terms links |
| Certificates | Certificate IDs for footer display |

**Dynamic Arrays:**
- `navigationColumns` - Footer column management
- `socialLinks` - Social entries
- `legalLinks` - Legal document links

---

### 2.18 Contact Page Settings

**File:** [`ContactPageSettings.tsx`](client/app/components/admin/contact-management/ContactPageSettings.tsx:1)  
**Route:** `/admin/contact`  
**Frontend Mapping:** `/contact`

**Form Schema (Zod):**
- `heroTitle` - Page header
- `email`, `phone` - Contact details
- `locationLine1`, `locationLine2` - Address
- `locationButtonText` - CTA text
- `tradingHours` - Array of { label, value }
- `socialLinks` - Record of platform URLs
- `platformOptions` - Preferred contact methods
- `formButtonText`, `formPrivacyText` - Form labels
- `successHeading`, `successMessage` - Form success state

---

### 2.19 Inquiry Management

**File:** [`index.tsx`](client/app/components/admin/inquiry-management/index.tsx:1)  
**Route:** `/admin/inquiries`  
**Frontend Mapping:** Contact form submissions

**UI Pattern:** Split View (List + Details)

```
┌─────────────────────────────────────────────────────────────────────┐
│ Inquiry Management                                                  │
├─────────────────────────────────────────────────────────────────────┤
│ [All] [New] [Active] [Archived]                                     │
│                                                                     │
│ ┌───────────────────────────────┐ ┌─────────────────────────────────┐│
│ │ Inquiry List                  │ │ Inquiry Details                 ││
│ ├───────────────────────────────┤ │                                 ││
│ │ ★ New - John Doe              │ │ From: John Doe                  ││
│ │   john@company.com            │ │ Email: john@company.com         ││
│ │   2 hours ago                 │ │ Company: Acme Corp              ││
│ ├───────────────────────────────┤ │                                 ││
│ │ ○ Read - Jane Smith           │ │ Message:                        ││
│ │   jane@brand.com              │ │ Interested in bulk order...     ││
│ │   1 day ago                   │ │                                 ││
│ └───────────────────────────────┘ │ Preferred: WhatsApp             ││
│                                   │                                 ││
│                                   │ [Mark Responded] [Archive]      ││
│                                   │                                 ││
└───────────────────────────────────┴─────────────────────────────────┘
```

**Status Workflow:**
`new` → `read` → `responded` → `archived`

---

### 2.20 Blog Management

**File:** [`blog-management.tsx`](client/app/components/admin/blog-management.tsx:1)  
**Route:** `/admin/blog`  
**Frontend Mapping:** `/blog`

**Features:**
- Post list with search
- Category management
- Rich text content editing
- SEO fields (metaTitle, metaDescription, slug, canonicalUrl, ogImage)
- Featured image selection
- Status workflow: `draft` → `published` → `archived`
- Zod schema validation (`insertBlogPostSchema`)

---

## 3. Interaction & Input Modalities

### 3.1 Standard Dialog Patterns

#### Delete Confirmation Dialog
**Component:** [`DeleteConfirmationDialog.tsx`](client/app/components/admin/shared/DeleteConfirmationDialog.tsx:1)

```typescript
interface DeleteConfirmationDialogProps {
  onConfirm: () => void;
  title: string;
  description: string;
  trigger?: React.ReactNode;
  confirmText?: string;
  variant?: "destructive" | "default";
}
```

**Usage:**
- Default trigger: Ghost button with Trash2 icon
- Destructive styling: `bg-red-600 hover:bg-red-700`
- AlertDialog from Radix UI

#### Media Selection Dialog
**Component:** [`StandardMediaSelectionDialog.tsx`](client/app/components/admin/shared/StandardMediaSelectionDialog.tsx:1)

```typescript
interface StandardMediaSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (assets: MediaAsset[] | MediaAsset) => void;
  mediaPickerTarget: string;  // Context identifier
  selectionMode: "single" | "multiple";
  maxSelection?: number;
  initialSelectedIds?: number[];
}
```

**Features:**
- `contentType="media-library"` for 5xl sizing
- Lazy-loaded to prevent circular dependencies
- Integrates with `MediaLibraryEnhancedProvider`

### 3.2 Form Input Components

#### Collapsible Sections (Accordion Pattern)
Used in: Product forms, fabric forms, sustainability tabs

```
┌─────────────────────────────────────────────────────────────────────┐
│ [Icon] Section Title                        [● Complete] [▼]       │
├─────────────────────────────────────────────────────────────────────┤
│ (CollapsibleContent - Expanded)                                     │
│ • Field 1 [________________]                                        │
│ • Field 2 [________________]                                        │
│ • Field 3 [________________]                                        │
└─────────────────────────────────────────────────────────────────────┘
```

**Completion Indicators:**
- Empty circle: 0% complete
- AlertCircle (amber): Partial completion
- CheckCircle (green): 100% complete

#### Tag/Chip Input Pattern
Used in: Fiber properties, customization options, blog keywords

**Implementation:**
```typescript
const [tags, setTags] = useState<string[]>([]);
const addTag = (value: string) => setTags([...tags, value]);
const removeTag = (index: number) => 
  setTags(tags.filter((_, i) => i !== index));
```

#### Sortable Lists
**Library:** `@dnd-kit/core` + `@dnd-kit/sortable`

**Pattern:**
1. `DndContext` with sensors (Pointer, Keyboard)
2. `SortableContext` with strategy
3. `useSortable()` hook per item
4. `CSS.Transform.toString(transform)` for positioning

### 3.3 Rich Input Components

#### Media Grid
**Component:** [`MediaGrid.tsx`](client/app/components/admin/media-library/MediaGrid.tsx:1)

- Checkbox selection
- Hover overlay with file info
- Type badges (Optimized, Uploading)
- 3D preview thumbnails
- Batch selection mode

#### Icon Selector
**Navigation Form:** [`NavigationForm.tsx`](client/app/components/admin/navigation/NavigationForm.tsx:57)

30+ Tabler Icons predefined:
```typescript
const TABLER_ICONS = [
  { value: "IconHome", label: "Home", component: IconHome },
  { value: "IconShoppingCart", label: "Cart", component: IconShoppingCart },
  // ... 28 more icons
];
```

### 3.4 Loading & Empty States

#### Skeleton Loaders
```tsx
<div className="space-y-4">
  {[...Array(6)].map((_, i) => (
    <div key={i} className="h-10 animate-pulse rounded bg-muted" />
  ))}
</div>
```

#### Empty State Pattern
```tsx
<div className="py-8 text-center">
  <Ruler className="mx-auto mb-4 h-12 w-12 text-muted-300" />
  <p className="font-medium">No items created yet</p>
  <p className="text-sm">Create your first item to get started</p>
</div>
```

#### Placeholder Module
**Component:** [`PlaceholderModule.tsx`](client/app/components/admin/PlaceholderModule.tsx:1)

Used for modules in migration:
- Wrench icon indicator
- "Migration Pending" status badge
- Dashed border styling

---

## 4. Route Architecture

### 4.1 Admin Route Structure

```
/admin                    → AdminIndex (Dashboard)
/admin/:module            → AdminModule (Dynamic loader)
```

### 4.2 Module Resolution

| URL Module | Component | Lazy Import Path |
|------------|-----------|------------------|
| `products` | ProductManagementUnified | `product-management-unified` |
| `categories` | CategoryManagementSimplified | `category-management-simplified` |
| `media` | MediaLibraryContainerEnhanced | `media-library` |
| `fabrics` | FabricManagementEnhancedV2 | `fabric-management-enhanced-v2` |
| `fibers` | FiberManagement | `fiber-management` |
| `certificates` | CertificateManagement | `certificate-management` |
| `size-charts` | SizeChartManagementEnhanced | `size-chart-management-enhanced` |
| `accessories` | AccessoryManagementEnhanced | `accessory-management-enhanced` |
| `navigation` | NavigationManagement | `navigation-management` |
| `homepage` | HomepageManagement | `homepage-management` |
| `about` | AboutManagement | `AboutManagement` |
| `sustainability` | UnifiedSustainabilityManagement | `unified-sustainability-management` |
| `manufacturing` | ManufacturingManagement | `manufacturing-management` |
| `technology` | TechnologyManagement | `technology-management` |
| `footer` | FooterManagement | `footer-management` |
| `contact` | ContactPageSettings | `contact-management` |
| `inquiries` | InquiryManagement | `inquiry-management` |
| `blog` | BlogManagement | `blog-management` |

---

## 5. Frontend Mapping Matrix

### 5.1 Complete Component-to-Route Correlation

| CMS Module | Admin Route | Frontend Route | Primary Components Affected |
|------------|-------------|----------------|----------------------------|
| Products | `/admin/products` | `/categories/$category/$product` | `ProductCard`, `UnifiedMediaTheater`, `ExpandableProductSections` |
| Categories | `/admin/categories` | `/categories/*` | `CategoryFeaturedContent`, `CategoryContextSidebar` |
| Homepage | `/admin/homepage` | `/` | `Hero`, `FeaturedProducts`, `Process`, `Values`, `Stats` |
| About | `/admin/about` | `/about` | `AboutHero`, `AboutStatistics`, `AboutTeam`, `AboutLocations` |
| Sustainability | `/admin/sustainability` | `/sustainability` | `CertificatesSection`, `MetricsSection`, `GoalsSection` |
| Manufacturing | `/admin/manufacturing` | `/manufacturing` | `PublicHeroSection`, `PublicCapabilitySection`, `PublicQualitySection` |
| Technology | `/admin/technology` | `/technology` | `TechnologyStackSection`, `RoadAheadTimeline`, `InteractiveExperienceSection` |
| Footer | `/admin/footer` | Global | `Footer`, `FooterInquiryForm` |
| Navigation | `/admin/navigation` | Global | `floating-dock-header` |
| Media | `/admin/media` | Global | All media-consuming components |
| Certificates | `/admin/certificates` | `/sustainability`, Products | `CertificatesSection`, `ProductBadges` |
| Size Charts | `/admin/size-charts` | Product Detail | Size selector dropdowns |
| Accessories | `/admin/accessories` | Product Detail | Customization options |
| Fibers | `/admin/fibers` | Product Detail | Fiber specification display |
| Fabrics | `/admin/fabrics` | Product Detail, Sustainability | Fabric cards, portfolio |
| Contact | `/admin/contact` | `/contact` | `contact-form`, `contact-info-cards` |
| Blog | `/admin/blog` | `/blog` | Blog posts, article pages |
| Inquiries | `/admin/inquiries` | Backend only | B2B lead management |

### 5.2 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Admin CMS Interface                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │  Forms   │ │  Tables  │ │  Media   │ │   Tabs   │ │  Dialogs │  │
│  │ (Inputs) │ │ (Grids)  │ │ (Picker) │ │(Sections)│ │ (Modals) │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘  │
└───────┼────────────┼────────────┼────────────┼────────────┼────────┘
        │            │            │            │            │
        ▼            ▼            ▼            ▼            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     React Query Cache Layer                          │
│  • Optimistic Updates  • Background Refetch  • Stale-while-revalidate│
└─────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        REST API Layer                                │
│  /api/products  /api/categories  /api/media  /api/fabrics  etc.      │
└─────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      User-Facing Frontend                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │  Routes  │ │Components│ │   Media  │ │   SEO    │ │  Layout  │  │
│  │ (Remix)  │ │ (React)  │ │ (Assets) │ │ (Meta)   │ │ (Shared) │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 6. Key Design Patterns & Best Practices

### 6.1 Component Architecture

**Monolith Decomposition Example:**
```
Original: technology-management.tsx (3,176 lines)
    ↓
Decomposed:
├── TechnologyHeroManagement.tsx
├── TechnologyInnovationManagement.tsx
├── TechnologyEquipmentManagement.tsx
├── TechnologyResearchManagement.tsx
├── TechnologyRoadmapManagement.tsx
└── TechnologyCtaManagement.tsx
```

**Feature Flag Protection:**
```typescript
const featureFlags = useTechnologyFeatureFlags();
if (!featureFlags.useModularTechnologyComponents) {
  return <LegacyModeFallback />;
}
```

### 6.2 State Management

**Server State (React Query):**
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ["/api/endpoint"],
  staleTime: 10 * 60 * 1000, // 10 minutes
  gcTime: 15 * 60 * 1000,    // 15 minutes
});
```

**Form State Patterns:**
- Simple: `useState` for entity management
- Complex: `useReducer` (Product forms)
- Dynamic: `react-hook-form` with `useFieldArray` (Footer columns)

### 6.3 Error Handling

**Multi-Level Hierarchy:**
1. Route: `AdminErrorBoundary`
2. Module: `ErrorBoundary` per tab
3. Component: Try-catch in handlers
4. API: Toast notifications

**ApiErrorFallback Pattern:**
```typescript
<ApiErrorFallback 
  error={error} 
  moduleName="Product Management"
  resetErrorBoundary={reset}
/>
```

### 6.4 Performance Optimizations

| Technique | Implementation | Benefit |
|-----------|----------------|---------|
| Code Splitting | `React.lazy()` + `Suspense` | Reduced initial bundle |
| Pagination | 20 items/page | Memory efficiency |
| Memoization | `React.memo`, `useMemo` | Reduced re-renders |
| Query Caching | React Query staleTime | Reduced API calls |
| Media Signed URLs | Batch fetch | Faster image loading |

---

## 7. Appendix: Complete Component Inventory

### 7.1 Admin UI Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `AdminLayout` | `admin-layout.tsx` | Shell with sidebar |
| `AdminBreadcrumb` | `AdminBreadcrumb.tsx` | Path navigation |
| `AdminLoadingState` | `AdminLoadingState.tsx` | Skeleton loader |
| `AdminErrorBoundary` | `AdminErrorBoundary.tsx` | Error fallback |
| `ModuleSearch` | `ModuleSearch.tsx` | Global ⌘K search |
| `PlaceholderModule` | `PlaceholderModule.tsx` | Migration placeholder |
| `AdminCMS` | `admin-cms.tsx` | Main dashboard |
| `CrossPageDashboard` | `cross-page-dashboard.tsx` | Analytics overview |

### 7.2 Shared Dialog Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `DeleteConfirmationDialog` | `shared/DeleteConfirmationDialog.tsx` | Delete confirmation |
| `StandardMediaSelectionDialog` | `shared/StandardMediaSelectionDialog.tsx` | Media picker |
| `ApiErrorFallback` | `shared/ApiErrorFallback.tsx` | API error display |

### 7.3 Product Management Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `ProductManagementUnified` | `product-management-unified/` | Main container |
| `ProductGrid` | `product-management-unified/core/` | Product listing |
| `ProductCard` | `product-management-unified/core/` | Product card |
| `ProductCreateEditModal` | `product-management-unified/admin/` | Create/edit form |
| `BasicInfoSection` | `product-management-unified/sections/` | Basic fields |
| `MediaAssetsSection` | `product-management-unified/sections/` | Media management |
| `CategoryFabricSection` | `product-management-unified/sections/` | Classification |
| `SpecificationsSection` | `product-management-unified/sections/` | Technical specs |
| `CertificationsSection` | `product-management-unified/sections/` | Certificates |
| `CustomizationSection` | `product-management-unified/sections/` | Custom options |

### 7.4 Media Library Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `MediaLibraryContainerEnhanced` | `media-library/` | Main container |
| `MediaGrid` | `media-library/MediaGrid.tsx` | Asset grid |
| `MediaFiltersPanel` | `media-library/MediaFiltersPanel.tsx` | Filters sidebar |
| `MediaUploadEnhanced` | `media-library/MediaUploadEnhanced.tsx` | Upload interface |
| `MediaViewerModal` | `media-library/MediaViewerModal.tsx` | Asset preview |
| `MediaLibraryContextEnhanced` | `media-library/MediaLibraryContextEnhanced.tsx` | State management |

### 7.5 Category Management Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `CategoryManagementSimplified` | `category-management-simplified.tsx` | Main container |
| `CategoryForm` | `categories/CategoryForm.tsx` | Create/edit form |
| `CategoryList` | `categories/CategoryList.tsx` | Tree view |

### 7.6 Material Management Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `FiberManagement` | `fiber-management.tsx` | Fiber CRUD |
| `FabricManagementEnhancedV2` | `fabric-management-enhanced-v2.tsx` | Fabric CRUD |
| `FiberForm` | `fiber/FiberForm.tsx` | Fiber form |
| `FiberList` | `fiber/FiberList.tsx` | Fiber listing |
| `FabricForm` | `fabric/FabricForm.tsx` | Fabric form |
| `FabricCard` | `fabric/FabricCard.tsx` | Fabric card |
| `FabricFilters` | `fabric/FabricFilters.tsx` | Filter panel |
| `FabricStats` | `fabric/FabricStats.tsx` | Statistics |

### 7.7 Certificate Management Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `CertificateManagement` | `certificate-management.tsx` | Main container |
| `CertificateForm` | `certificate/CertificateForm.tsx` | Certificate form |
| `CertificateList` | `certificate/CertificateList.tsx` | List view |
| `CertificateAnalytics` | `certificate/CertificateAnalytics.tsx` | Usage stats |
| `CertificateInsights` | `certificate/CertificateInsights.tsx` | Recommendations |

### 7.8 Static Page Management Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `HomepageManagement` | `homepage-management.tsx` | Homepage editor |
| `HomepageHeroTab` | `homepage/HomepageHeroTab.tsx` | Hero section |
| `HomepageSlogansTab` | `homepage/HomepageSlogansTab.tsx` | Values slogans |
| `HomepageProcessCardsTab` | `homepage/HomepageProcessCardsTab.tsx` | Process cards |
| `HomepageSectionsTab` | `homepage/HomepageSectionsTab.tsx` | Content sections |
| `HomepageFeaturedTab` | `homepage/HomepageFeaturedTab.tsx` | Featured products |
| `AboutManagement` | `AboutManagement.tsx` | About page editor |
| `AboutHeroTab` | `about-hero-tab.tsx` | Hero section |
| `AboutStatisticsTab` | `about-statistics-tab.tsx` | Stats counters |
| `AboutTeamMessageTab` | `about-team-message-tab.tsx` | Team message |
| `AboutLocationsTab` | `about-locations-tab.tsx` | Office locations |
| `AboutSectionsTab` | `about-sections-tab.tsx` | Content sections |
| `FooterManagement` | `footer-management/FooterManagement.tsx` | Footer editor |

### 7.9 Business Page Management Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `ManufacturingManagement` | `manufacturing-management.tsx` | Manufacturing editor |
| `HeroManagement` | `manufacturing/HeroManagement.tsx` | Hero section |
| `ProcessManagement` | `manufacturing/ProcessManagement.tsx` | Process workflow |
| `CapabilityManagement` | `manufacturing/CapabilityManagement.tsx` | Capabilities |
| `QualityManagement` | `manufacturing/QualityManagement.tsx` | Quality standards |
| `UnifiedSustainabilityManagement` | `unified-sustainability-management.tsx` | Sustainability editor |
| `HeroTabContent` | `HeroTabContent.tsx` | Hero section |
| `MetricsTabContent` | `MetricsTabContent.tsx` | Impact metrics |
| `GoalsTabContent` | `GoalsTabContent.tsx` | Timeline goals |
| `InitiativesTabContent` | `InitiativesTabContent.tsx` | Initiatives |
| `CertificationsTabContent` | `CertificationsTabContent.tsx` | Certificates |
| `TechnologyManagement` | `technology-management.tsx` | Technology editor |
| `TechnologyHeroManagement` | `technology/TechnologyHeroManagement.tsx` | Hero section |
| `TechnologyInnovationManagement` | `technology/TechnologyInnovationManagement.tsx` | Innovations |
| `TechnologyEquipmentManagement` | `technology/TechnologyEquipmentManagement.tsx` | Equipment |
| `TechnologyResearchManagement` | `technology/TechnologyResearchManagement.tsx` | Research |
| `TechnologyRoadmapManagement` | `technology/TechnologyRoadmapManagement.tsx` | Roadmap |
| `TechnologyCtaManagement` | `technology/TechnologyCtaManagement.tsx` | CTA section |

### 7.10 Navigation & Communication Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `NavigationManagement` | `navigation-management.tsx` | Nav editor |
| `NavigationForm` | `navigation/NavigationForm.tsx` | Nav item form |
| `NavigationItemList` | `navigation/NavigationItemList.tsx` | Sortable list |
| `ContactPageSettings` | `contact-management/ContactPageSettings.tsx` | Contact config |
| `InquiryManagement` | `inquiry-management/index.tsx` | Inquiry manager |
| `InquiryList` | `inquiry-management/InquiryList.tsx` | Inquiry list |
| `InquiryDetails` | `inquiry-management/InquiryDetails.tsx` | Inquiry details |
| `BlogManagement` | `blog-management.tsx` | Blog editor |
| `SEOPreview` | `blog/SEOPreview.tsx` | SEO preview |

### 7.11 Utility Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `SizeChartManagementEnhanced` | `size-chart-management-enhanced.tsx` | Size chart CRUD |
| `AccessoryManagementEnhanced` | `accessory-management-enhanced.tsx` | Accessory CRUD |

---

## 8. Conclusion

The RUN Remix Admin CMS is a mature, well-architected content management system with comprehensive coverage of all business domains. Key architectural achievements include:

1. **Complete Content Coverage** - 20+ modules spanning products, content, business pages, and configuration
2. **Consistent UX Patterns** - Unified media picker, delete dialogs, collapsible sections
3. **Performance Architecture** - Code-splitting, lazy loading, React Query caching
4. **Scalable Design** - Modular decomposition from monolithic components
5. **Developer Experience** - Feature flags, error boundaries, hotkey support

The 1:1 mapping between CMS sections and frontend routes ensures content editors maintain full control over the user-facing experience through an intuitive, professional administrative interface.

---

**Document End**  
*Generated: March 4, 2026*  
*Classification: Technical Documentation*  
*Version: 2.0 - Complete Analysis*