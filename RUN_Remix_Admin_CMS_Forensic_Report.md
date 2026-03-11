# RUN Remix Admin CMS: Forensic UI/UX & Architectural Report

**Document Version:** 1.0  
**Date:** March 4, 2026  
**Classification:** Technical Architecture Documentation  
**Scope:** Frontend CMS UI/UX Analysis & Frontend Mapping

---

## Executive Summary

The RUN Remix Admin CMS serves as the central nervous system for the RUN Apparel application, providing a comprehensive content management interface that drives dynamic content across the entire frontend ecosystem. This forensic analysis documents the complete administrative interface architecture, mapping every CMS module to its corresponding user-facing components.

**Key Architectural Principles Observed:**
- **Modular Component Architecture:** Heavy use of code-splitting and lazy loading
- **Unified Design System:** Consistent use of shadcn/ui components with Tailwind CSS
- **State Management:** React Query for server state, React Context for admin-level UI state
- **Performance Optimization:** Persistent accordion states, pagination over virtual scrolling
- **Error Boundaries:** Component-level error isolation throughout

---

## 1. Global Admin UI/UX & Navigation

### 1.1 Layout Architecture

**Primary Layout Component:** [`admin-layout.tsx`](client/app/components/admin/admin-layout.tsx:1)

The admin interface employs a collapsible sidebar navigation pattern built on a custom [`Sidebar`](client/app/components/ui/sidebar.tsx) component.

**Layout Structure:**
```
┌─────────────────────────────────────────────────────────────┐
│ [Logo] RUN APPAREL CMS                    [User Profile]    │
├──────────┬──────────────────────────────────────────────────┤
│          │  [Breadcrumb: Dashboard > Module]    [Search]    │
│ Sidebar  │                                                  │
│ (Collaps-│  ┌─────────────────────────────────────────────┐ │
│  ible)   │  │                                             │ │
│          │  │           Module Content Area               │ │
│ • Dash-  │  │                                             │ │
│   board  │  │                                             │ │
│ • Categ- │  │                                             │ │
│   ories  │  └─────────────────────────────────────────────┘ │
│ • Pro-   │                                                  │
│   ducts  │                                                  │
│ • ...    │                                                  │
│          │                                                  │
└──────────┴──────────────────────────────────────────────────┘
```

**Navigation Structure (23 Primary Modules):**

| Icon | Label | Route | Frontend Impact |
|------|-------|-------|-----------------|
| <LayoutDashboard> | Dashboard | `/admin` | Cross-page analytics overview |
| <LayoutList> | Categories | `/admin/categories` | `/categories/*` navigation tree |
| <Shirt> | Products | `/admin/products` | `/categories/$category/$product` |
| <ScrollText> | Fibers | `/admin/fibers` | Product detail fiber specifications |
| <FileText> | Fabrics | `/admin/fabrics` | Product fabric assignments |
| <Award> | Certificates | `/admin/certificates` | Sustainability page certificates |
| <Ruler> | Size Charts | `/admin/size-charts` | Product detail size selectors |
| <Zap> | Accessories | `/admin/accessories` | Product customization options |
| <Image> | Media | `/admin/media` | All image/video/3D model assets |
| <Database> | Storage Optimization | `/admin/storage-optimization` | Media cleanup & optimization |
| <Navigation> | Navigation | `/admin/navigation` | Site header/footer nav structure |
| <Mail> | Contact | `/admin/contact` | `/contact` page content |
| <ScrollText> | Footer | `/admin/footer` | Global footer configuration |
| <Inbox> | Inquiries | `/admin/inquiries` | Quote request management |
| <FileText> | Blog | `/admin/blog` | `/blog` content (if enabled) |
| <Home> | Homepage | `/admin/homepage` | `/` hero, sections, featured |
| <FileText> | About Us | `/admin/about` | `/about` page sections |
| <Leaf> | Sustainability | `/admin/sustainability` | `/sustainability` full page |
| <Wrench> | Manufacturing | `/admin/manufacturing` | `/manufacturing` capabilities |
| <Cpu> | Technology | `/admin/technology` | `/technology` showcase |

**Visual Design Tokens:**
- **Colors:** CSS variables (`--chart-1`, `--muted`, `--border`, etc.) with Tailwind's `bg-white dark:bg-neutral-900`
- **Spacing:** Consistent use of `space-y-6`, `p-8`, `gap-4` patterns
- **Typography:** `text-muted-foreground` for secondary text, `font-bold text-3xl` for headers
- **Animations:** Framer Motion (`motion.div`) for transitions, `animate-in fade-in-50` classes

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
- **Unsaved Changes Guard:** `navigateWithState()` checks `hasUnsavedChanges` before routing
- **Module Synchronization:** `setCurrentModule()` updates breadcrumb and navigation highlighting
- **Query Preservation:** Optional parameter retention during navigation

### 1.3 Breadcrumb Navigation

**Component:** [`AdminBreadcrumb.tsx`](client/app/components/admin/AdminBreadcrumb.tsx:1)

- Simple path-based breadcrumb: `Dashboard > [Module]`
- Module label mapping via `moduleLabels` record object
- Home icon link to `/admin` dashboard

### 1.4 Error Boundaries & Loading States

**Error Boundary Pattern:**
- [`AdminErrorBoundary`](client/app/components/admin/AdminErrorBoundary.tsx) - Top-level admin route wrapper
- Component-level boundaries in [`ErrorBoundary`](client/app/components/ui/ErrorBoundary.tsx)
- Module-specific fallbacks (e.g., [`ProductsErrorFallback`](client/app/components/admin/ProductsErrorFallback.tsx))

**Loading States:**
- [`AdminLoadingState`](client/app/components/admin/AdminLoadingState.tsx) - Skeleton placeholder
- Module loader with spinning indicator: `border-t-blue-600 animate-spin`

---

## 2. Module-by-Module Breakdown

### 2.1 Cross-Page Dashboard

**File:** [`cross-page-dashboard.tsx`](client/app/components/admin/cross-page-dashboard.tsx:1)  
**Route:** `/admin`  
**Frontend Mapping:** Aggregated view of `/sustainability`, `/manufacturing`, `/technology`

**UI Structure:**
```
┌────────────────────────────────────────────────────────────┐
│ Integrated Performance Dashboard                           │
├────────────────┬─────────────────┬─────────────────────────┤
│ Sustainability │ Manufacturing   │ Technology Innovation   │
│ Impact         │ Excellence      │                         │
│                │                 │                         │
│ • Goal Progress│ • Process Eff.  │ • Active Innovations    │
│ • Sustainable  │ • Quality Ctrl  │ • Research Progress     │
│   Fabrics      │ • Active Procs  │ • Active Projects       │
│ • Carbon Red.  │                 │                         │
│ [View Details] │ [View Details]  │ [View Details]          │
└────────────────┴─────────────────┴─────────────────────────┘
```

**Data Sources:**
- `/api/sustainability-metrics` → Progress bars for goals
- `/api/manufacturing-processes` → Efficiency calculations
- `/api/technology-innovations` → Active innovation counts
- `/api/fabrics` → Sustainable fabric filtering

**UX Patterns:**
- Recharts integration (BarChart, RadialBarChart) for KPI visualization
- Motion animations (`initial={{ opacity: 0, y: 20 }}`) on card entry
- Cross-functional synergy cards linking related modules

---

### 2.2 Unified Product Management

**File:** [`ProductManagementUnified.tsx`](client/app/components/admin/product-management-unified/ProductManagementUnified.tsx:1)  
**Route:** `/admin/products`  
**Frontend Mapping:** `/categories/$category/$product` (Product Detail Pages)

**Architecture Pattern:** Master-Detail with Modal Editing

```
┌─────────────────────────────────────────────────────────────────────┐
│ Product Management                              [+ New Product]     │
├────────────────────────────────┬────────────────────────────────────┤
│                                │                                    │
│  Search [________]  [Filter ▼] │  Product Details Panel (1/3 width) │
│                                │  ────────────────────────────────  │
│  ┌─────────────────────────┐   │  • Basic Info                      │
│  │ Product Card            │   │  • Media Gallery                   │
│  │ [Image] Product Name    │   │  • Specifications                  │
│  │ SKU: RUN-001    [Edit]  │   │  • Customization                   │
│  │ Category: Activewear    │   │  • Certifications                  │
│  └─────────────────────────┘   │                                    │
│                                │  [Close] [Edit Product]            │
│  Grid View / List View         │                                    │
│  Page 1 of 5  [Prev] [Next]    │                                    │
│                                │                                    │
└────────────────────────────────┴────────────────────────────────────┘
```

**Core Components:**

#### 2.2.1 Product Grid ([`ProductGrid.tsx`](client/app/components/admin/product-management-unified/core/ProductGrid.tsx:1))
- **Pagination:** Traditional pagination (20 items/page), virtual scrolling eliminated
- **View Modes:** Grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`) or List
- **Filtering:** Category, fabric, status filters with search
- **Bulk Operations:** Multi-select with bulk delete/activate

#### 2.2.2 Product Create/Edit Modal ([`ProductCreateEditModal.tsx`](client/app/components/admin/product-management-unified/admin/ProductCreateEditModal.tsx:1))

**Modal Structure (6 Collapsible Sections):**

| Section | Icon | Fields | Frontend Impact |
|---------|------|--------|-----------------|
| Basic Info | <Package> | name, sku, description, shortDescription, slug, sortOrder, isActive, isFeatured | Product header, SEO meta |
| Category & Fabric | <Tag> | categoryId, fabricId, fiberIds | Product classification |
| Media Assets | <Camera> | primaryImageId, primaryVideoId, imageIds[], videos[], modelFileId | [`UnifiedMediaTheater`](client/app/components/products/UnifiedMediaTheater.tsx) |
| Specifications | <Settings> | weight, dimensions, material, careInstructions | [`ExpandableProductSections`](client/app/components/products/ExpandableProductSections.tsx) |
| Certifications | <Star> | certificateIds[] | [`ProductBadges`](client/app/components/products/ProductBadges.tsx) |
| Customization & SEO | <Palette> | customizationOptions[], metaTitle, metaDescription | SEO head, inquiry options |

**Form Management:**
- Custom hook: [`useProductForm`](client/app/components/admin/product-management-unified/shared/hooks/useProductForm.ts) with useReducer pattern
- Accordion persistence: [`useAccordionPersistence`](client/app/components/admin/product-management-unified/shared/hooks/useAccordionPersistence.ts)
- Validation: [`useSmartValidation`](client/app/components/admin/product-management-unified/shared/hooks/useSmartValidation.ts)

**Media Integration:**
- Uses [`StandardMediaSelectionDialog`](client/app/components/admin/shared/StandardMediaSelectionDialog.tsx) for asset picking
- Supports images, videos, and 3D models (GLB/GLTF)
- Primary image/video star-toggle system

---

### 2.3 Media Library

**File:** [`MediaLibraryContainerEnhanced.tsx`](client/app/components/admin/media-library/MediaLibraryContainerEnhanced.tsx:1)  
**Route:** `/admin/media`  
**Frontend Mapping:** All media assets across the site

**UI Structure:**
```
┌─────────────────────────────────────────────────────────────────────┐
│ Media Library                                [Upload] [Cleanup DB]  │
├─────────────────────────────────────────────────────────────────────┤
│ Filters: [Type ▼] [Status ▼] | Showing X of Y assets                │
│                                                                     │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐    │
│ │ [Image]     │ │ [Video ▶]   │ │ [3D Model]  │ │ [Image]     │    │
│ │ filename    │ │ filename    │ │ filename    │ │ filename    │    │
│ │ ☑ 1024 KB  │ │ ☑ 2.4 MB   │ │ ☑ 5.1 MB   │ │ ☑ 856 KB   │    │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘    │
│                                                                     │
│ [Previous] Page 1 of 5 [Next]                                       │
└─────────────────────────────────────────────────────────────────────┘
```

**Key Features:**
- **Grid/List Toggle:** Visual or detailed list view
- **Type Filtering:** image, video, 3d_model, document
- **Batch Operations:** Multi-select with bulk delete
- **3D Preview:** [`UnifiedModelViewer`](client/app/components/ui/UnifiedModelViewer.tsx) integration
- **Database Cleanup:** Orphaned file detection and removal

**Media Picker Integration:**
All modules use [`StandardMediaSelectionDialog`](client/app/components/admin/shared/StandardMediaSelectionDialog.tsx) with:
- `contentType="media-library"` for consistent sizing
- `preferredSize="5xl"` for optimal viewport
- Lazy-loaded [`MediaSelectionWrapperUnified`](client/app/components/admin/shared/MediaSelectionWrapperUnified.tsx)

---

### 2.4 Category Management

**File:** [`category-management-simplified.tsx`](client/app/components/admin/category-management-simplified.tsx:1)  
**Route:** `/admin/categories`  
**Frontend Mapping:** `/categories/*` routes, navigation hierarchy

**UI Structure:**
```
┌─────────────────────────────────────────────────────────────────────┐
│ Categories                                [+ New] [Advanced/Simple] │
├─────────────────────────────────────────────────────────────────────┤
│ Search [____________] [All Categories ▼] [☑ Show Deleted]           │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ ☑  Activewear              [Edit] [Delete]           12 products│ │
│ │     └─ ☑  T-Shirts         [Edit] [Delete]            5 products│ │
│ │     └─ ☑  Hoodies          [Edit] [Delete]            7 products│ │
│ ├─────────────────────────────────────────────────────────────────┤ │
│ │ ☑  Outerwear               [Edit] [Delete]            3 products│ │
│ └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

**Key Features:**
- **Tree/Hierarchy View:** Parent-child category relationships
- **Drag-and-Drop Reordering:** [`@dnd-kit`](https://dndkit.com) integration
- **Soft Delete:** Toggle to show/hide deleted categories
- **Product Count:** Live count per category
- **Featured Content Cards:** 4-card layout editor (Hero, Showcase, Features, CTA)

**Category Form Tabs:**
1. **Basic:** name, slug, description, parentId, sortOrder, isActive
2. **Media:** imageUrl, bannerUrl with media picker
3. **SEO:** metaTitle, metaDescription
4. **Featured Content:** 4-card editor for category landing pages

---

### 2.5 Manufacturing Management

**File:** [`manufacturing-management.tsx`](client/app/components/admin/manufacturing-management.tsx:1)  
**Route:** `/admin/manufacturing`  
**Frontend Mapping:** `/manufacturing` (Public Capability Showcase)

**Tab Structure:**

| Tab | Component | Frontend Section |
|-----|-----------|------------------|
| Hero | [`HeroManagement`](client/app/components/admin/manufacturing/HeroManagement.tsx) | [`PublicHeroSection`](client/app/components/public/manufacturing/PublicHeroSection.tsx) |
| Processes | [`ProcessManagement`](client/app/components/admin/manufacturing/ProcessManagement.tsx) | [`ManufacturingProcessFlow`](client/app/components/products/ManufacturingProcessFlow.tsx) |
| Capabilities | [`CapabilityManagement`](client/app/components/admin/manufacturing/CapabilityManagement.tsx) | [`PublicCapabilitySection`](client/app/components/public/manufacturing/PublicCapabilitySection.tsx) |
| Quality | [`QualityManagement`](client/app/components/admin/manufacturing/QualityManagement.tsx) | [`PublicQualitySection`](client/app/components/public/manufacturing/PublicQualitySection.tsx) |

**Hero Management Fields:**
- Title, subtitle, description
- Background media (image/video)
- CTA buttons (primary/secondary text + links)
- Active toggle

**Process Management:**
- Sortable process cards with drag-and-drop
- Process name, description, duration, icon
- Media assignments
- Step sequencing

---

### 2.6 Sustainability Management

**File:** [`unified-sustainability-management.tsx`](client/app/components/admin/unified-sustainability-management.tsx:1)  
**Route:** `/admin/sustainability`  
**Frontend Mapping:** `/sustainability` (Full Page)

**Tab Architecture (8 Tabs):**

```
[Hero] [Metrics] [Goals] [Initiatives] [Features] [Fabric Portfolio] [Certifications] [CTA]
```

| Tab | Content | Frontend Component |
|-----|---------|-------------------|
| Hero | Background media, title, subtitle, scroll indicator | Hero section with parallax |
| Metrics | Sortable impact metrics (water saved, carbon reduced) | [`MetricsSection`](client/app/components/sustainability/sections/MetricsSection.tsx) |
| Goals | Timeline goals with progress tracking | [`GoalsSection`](client/app/components/sustainability/sections/GoalsSection.tsx) |
| Initiatives | Sortable initiative cards | [`InitiativesSection`](client/app/components/sustainability/sections/InitiativesSection.tsx) |
| Features | Feature highlights with icons | [`FeaturesSection`](client/app/components/sustainability/sections/FeaturesSection.tsx) |
| Fabric Portfolio | Sustainable fabric showcase | [`FabricPortfolioSection`](client/app/components/sustainability/sections/FabricPortfolioSection.tsx) |
| Certifications | Certificate assignments | [`CertificatesSection`](client/app/components/sustainability/sections/CertificatesSection.tsx) |
| CTA | Call-to-action configuration | [`CTASection`](client/app/components/sustainability/sections/CTASection.tsx) |

**Sortable Components Pattern:**
All tabs use `@dnd-kit` for drag-and-drop reordering:
- `SortableMetricItem` - Metrics cards
- `SortableInitiativeItem` - Initiative cards
- `SortableGoalItem` - Goal timeline items

---

### 2.7 Technology & Innovation

**File:** [`technology-management.tsx`](client/app/components/admin/technology-management.tsx:1)  
**Route:** `/admin/technology`  
**Frontend Mapping:** `/technology` (Technology Showcase)

**Tab Architecture (6 Tabs):**

| Tab | Component | Frontend Section |
|-----|-----------|------------------|
| Hero | [`TechnologyHeroManagement`](client/app/components/admin/technology/TechnologyHeroManagement.tsx) | Hero with background media |
| Innovations | [`TechnologyInnovationManagement`](client/app/components/admin/technology/TechnologyInnovationManagement.tsx) | [`TechnologyStackSection`](client/app/components/technology/TechnologyStackSection.tsx) |
| Equipment | [`TechnologyEquipmentManagement`](client/app/components/admin/technology/TechnologyEquipmentManagement.tsx) | Equipment gallery |
| Research | [`TechnologyResearchManagement`](client/app/components/admin/technology/TechnologyResearchManagement.tsx) | Research project listings |
| Roadmap | [`TechnologyRoadmapManagement`](client/app/components/admin/technology/TechnologyRoadmapManagement.tsx) | [`RoadAheadTimeline`](client/app/components/technology/RoadAheadTimeline.tsx) |
| CTA | [`TechnologyCtaManagement`](client/app/components/admin/technology/TechnologyCtaManagement.tsx) | Call-to-action section |

**Innovation Management Features:**
- Drag-and-drop sortable innovation cards
- Category badges (Materials, Process, Digital, etc.)
- Benefits list management
- Technical details JSON editor
- Related products linking
- Status workflow (Research → Development → Production)

---

### 2.8 Fiber Management

**File:** [`fiber-management.tsx`](client/app/components/admin/fiber-management.tsx:1)  
**Route:** `/admin/fibers`  
**Frontend Mapping:** Product detail fiber specifications

**UI Pattern:** List/Grid/Detailed View Toggle

**Fiber Form Fields:**
- Name, type (dropdown: Cotton, Polyester, Wool, etc. or custom)
- Description
- Properties (tag-based input)
- Sustainability score (1-5)
- Environmental impact notes
- Active toggle

**Data Flow:**
```
Admin Form → /api/fibers (POST/PATCH) → Product Detail Fiber Section
```

---

### 2.9 Fabric Management (Enhanced V2)

**File:** [`fabric-management-enhanced-v2.tsx`](client/app/components/admin/fabric-management-enhanced-v2.tsx:1)  
**Route:** `/admin/fabrics`  
**Frontend Mapping:** Product fabric assignments, sustainability fabric portfolio

**Card Expansion Pattern:**
```
┌─────────────────────────────────────────────┐
│ [Swatch] Fabric Name            [▼ Expand]  │
│ Type: Jersey | Weight: 180 GSM              │
├─────────────────────────────────────────────┤
│ (Expanded)                                  │
│ • Classification: Type, Weight, Origin      │
│ • Performance: Stretch, Breathability       │
│ • Durability: Wash Cycles, Pilling          │
│ • Sustainability: Score, Certifications     │
│ • Care Instructions                         │
│ [Edit] [Duplicate] [Delete]                 │
└─────────────────────────────────────────────┘
```

**Section Collapse States:**
- `classification`, `performance`, `durability`, `sustainability`, `care`

---

### 2.10 Certificate Management

**File:** [`certificate-management.tsx`](client/app/components/admin/certificate-management.tsx:1)  
**Route:** `/admin/certificates`  
**Frontend Mapping:** [`CertificatesSection`](client/app/components/sustainability/sections/CertificatesSection.tsx), Product badges

**Management Tabs:**
1. **Certificates Grid/List** - Main management interface
2. **Analytics** - Usage statistics, validity tracking
3. **Insights** - Recommendations, expiration alerts

**Certificate Fields:**
- Name, type (OEKO-TEX, GOTS, BCI, etc.)
- Issuing organization
- Document (PDF upload via media picker)
- Badge image (PNG/SVG for display)
- Validity dates
- Description
- Active toggle

---

### 2.11 Static Page Overrides

#### 2.11.1 Homepage Management

**File:** [`homepage-management.tsx`](client/app/components/admin/homepage-management.tsx:1)  
**Route:** `/admin/homepage`  
**Frontend Mapping:** `/` (Landing Page)

**Tab Structure:**

| Tab | Component | Frontend Section |
|-----|-----------|------------------|
| Hero | [`HomepageHeroTab`](client/app/components/admin/homepage/HomepageHeroTab.tsx) | [`Hero`](client/app/components/homepage/Hero.tsx) |
| Slogans | [`HomepageSlogansTab`](client/app/components/admin/homepage/HomepageSlogansTab.tsx) | [`Values`](client/app/components/homepage/Values.tsx) |
| Process Cards | [`HomepageProcessCardsTab`](client/app/components/admin/homepage/HomepageProcessCardsTab.tsx) | [`Process`](client/app/components/homepage/Process.tsx) |
| Sections | [`HomepageSectionsTab`](client/app/components/admin/homepage/HomepageSectionsTab.tsx) | Dynamic content sections |
| Featured | [`HomepageFeaturedTab`](client/app/components/admin/homepage/HomepageFeaturedTab.tsx) | [`FeaturedProducts`](client/app/components/homepage/FeaturedProducts.tsx) |

#### 2.11.2 About Page Management

**File:** [`AboutManagement.tsx`](client/app/components/admin/AboutManagement.tsx:1)  
**Route:** `/admin/about`  
**Frontend Mapping:** `/about`

**Tab Structure:**

| Tab | Component | Content |
|-----|-----------|---------|
| Hero | [`AboutHeroTab`](client/app/components/admin/about-hero-tab.tsx) | Title, subtitle, background media |
| Statistics | [`AboutStatisticsTab`](client/app/components/admin/about-statistics-tab.tsx) | Animated counters |
| Team | [`AboutTeamMessageTab`](client/app/components/admin/about-team-message-tab.tsx) | Leadership message |
| Locations | [`AboutLocationsTab`](client/app/components/admin/about-locations-tab.tsx) | Office/showroom locations |
| Sections | [`AboutSectionsTab`](client/app/components/admin/about-sections-tab.tsx) | Content blocks |

#### 2.11.3 Footer Management

**File:** [`FooterManagement.tsx`](client/app/components/admin/footer-management/FooterManagement.tsx:1)  
**Route:** `/admin/footer`  
**Frontend Mapping:** Global [`Footer`](client/app/components/layout/Footer.tsx)

**Tab Structure:**

| Tab | Content |
|-----|---------|
| General | Company info, contact form heading, brand text |
| Navigation | Dynamic column management (useFieldArray) |
| Social | Social media links (LinkedIn, Instagram, etc.) |
| Legal | Privacy policy, terms links |
| Certificates | Certificate ID assignments for footer display |

**Dynamic Field Arrays:**
- `navigationColumns` - Repeating navigation sections
- `socialLinks` - Social media entries
- `legalLinks` - Legal document links

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

**Usage Pattern:**
- Standard trigger: Ghost button with Trash2 icon
- AlertDialog from Radix UI
- Destructive styling: `bg-red-600 hover:bg-red-700`

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

**Key Features:**
- Lazy-loaded to prevent circular dependencies
- `contentType="media-library"` for consistent 5xl sizing
- Integrates with [`MediaLibraryEnhancedProvider`](client/app/components/admin/media-library/MediaLibraryContextEnhanced.tsx)

### 3.2 Form Input Components

#### Collapsible Sections
**Pattern:** All product/entity forms use [`Collapsible`](client/app/components/ui/collapsible.tsx) for progressive disclosure

```
┌─────────────────────────────────────────┐
│ [Icon] Section Title              [▼]   │
├─────────────────────────────────────────┤
│ (CollapsibleContent)                    │
│ • Field 1 [________]                    │
│ • Field 2 [________]                    │
└─────────────────────────────────────────┘
```

**Completion Indicators:**
- Empty circle: 0% complete
- AlertCircle: Partial completion
- CheckCircle: 100% complete

#### Tag/Chip Input Pattern
Used in: Customization options, fiber properties, certificate tags

```typescript
// Array field management
const addTag = () => setTags([...tags, ""]);
const updateTag = (index, value) => { /* update array */ };
const removeTag = (index) => { /* filter array */ };
```

#### Sortable Lists
**Library:** `@dnd-kit/core` + `@dnd-kit/sortable`

**Pattern:**
1. `DndContext` with `PointerSensor` and `KeyboardSensor`
2. `SortableContext` with `verticalListSortingStrategy`
3. Individual `useSortable()` hooks for items
4. `CSS.Transform.toString(transform)` for positioning

### 3.3 Rich Input Components

#### Media Grid with Selection
**Component:** [`MediaGrid.tsx`](client/app/components/admin/media-library/MediaGrid.tsx:1)

**Features:**
- Checkbox selection with stopPropagation
- Hover overlay with file info
- Asset type badges (Optimized, Uploading)
- 3D model preview thumbnail
- Batch selection mode

#### Icon Selector
Used across: Sustainability metrics, Technology innovations

**Pattern:**
```typescript
const IconComponent = {
  Leaf, Droplets, Wind, Recycle, TreePine, Target, TrendingUp
}[iconName] || Leaf;
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
<div className="py-4 text-center text-muted-foreground">
  <p>No items to display</p>
  <p className="text-sm">Create your first item to get started</p>
</div>
```

---

## 4. Route Architecture

### 4.1 Admin Route Structure

```
/admin                    → AdminIndex (Dashboard)
/admin/dashboard          → CrossPageDashboard
/admin/:module            → AdminModule (Dynamic module loader)
```

### 4.2 Module Resolution Mapping

| URL Module | Component | Lazy Import Path |
|------------|-----------|------------------|
| `products` | ProductManagementUnified | `@/components/admin/product-management-unified` |
| `categories` | CategoryManagementSimplified | `@/components/admin/category-management-simplified` |
| `media` | MediaLibraryContainerEnhanced | `@/components/admin/media-library` |
| `fabrics` | FabricManagementEnhancedV2 | `@/components/admin/fabric-management-enhanced-v2` |
| `fibers` | FiberManagement | `@/components/admin/fiber-management` |
| `certificates` | CertificateManagement | `@/components/admin/certificate-management` |
| `homepage` | HomepageManagement | `@/components/admin/homepage-management` |
| `about` | AboutManagement | `@/components/admin/AboutManagement` |
| `sustainability` | UnifiedSustainabilityManagement | `@/components/admin/unified-sustainability-management` |
| `manufacturing` | ManufacturingManagement | `@/components/admin/manufacturing-management` |
| `technology` | TechnologyManagement | `@/components/admin/technology-management` |
| `footer` | FooterManagement | `@/components/admin/footer-management` |
| `contact` | ContactPageSettings | `@/components/admin/contact-management` |
| `inquiries` | InquiryManagement | `@/components/admin/inquiry-management` |

---

## 5. Frontend Mapping Matrix

### 5.1 Component-to-Route Correlation

| CMS Module | Admin Route | Frontend Route | Primary Components Affected |
|------------|-------------|----------------|----------------------------|
| Products | `/admin/products` | `/categories/$category/$product` | `ProductCard`, `UnifiedMediaTheater`, `ExpandableProductSections` |
| Categories | `/admin/categories` | `/categories/*`, `/categories/$category` | `CategoryFeaturedContent`, `CategoryContextSidebar` |
| Homepage | `/admin/homepage` | `/` | `Hero`, `FeaturedProducts`, `Process`, `Values`, `Stats` |
| About | `/admin/about` | `/about` | `AboutHero`, `AboutStatistics`, `AboutTeam`, `AboutLocations` |
| Sustainability | `/admin/sustainability` | `/sustainability` | `CertificatesSection`, `MetricsSection`, `GoalsSection` |
| Manufacturing | `/admin/manufacturing` | `/manufacturing` | `PublicHeroSection`, `PublicCapabilitySection`, `PublicQualitySection` |
| Technology | `/admin/technology` | `/technology` | `TechnologyStackSection`, `RoadAheadTimeline`, `InteractiveExperienceSection` |
| Footer | `/admin/footer` | Global | `Footer`, `FooterInquiryForm` |
| Media | `/admin/media` | Global | All media-consuming components |
| Certificates | `/admin/certificates` | `/sustainability`, Products | `CertificatesSection`, `ProductBadges` |
| Fibers | `/admin/fibers` | Product Detail | Fiber specification display |
| Fabrics | `/admin/fabrics` | Product Detail, Sustainability | Fabric cards, portfolio sections |

### 5.2 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CMS Admin Interface                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   Forms     │  │   Tables    │  │   Media     │  │   Tabs      │ │
│  │  (Inputs)   │  │  (Lists)    │  │  (Picker)   │  │ (Sections)  │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘ │
└─────────┼────────────────┼────────────────┼────────────────┼────────┘
          │                │                │                │
          ▼                ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        React Query Cache Layer                       │
│  • Optimistic Updates  • Background Refetch  • Stale-while-revalidate│
└─────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        REST API Endpoints                            │
│  /api/products  /api/categories  /api/media  /api/fabrics  etc.      │
└─────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        User-Facing Frontend                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   Routes    │  │  Components │  │    Media    │  │    SEO      │ │
│  │  (Remix)    │  │  (React)    │  │  (Images)   │  │  (Meta)     │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 6. Key Design Patterns & Best Practices

### 6.1 Component Architecture

**Monolith Decomposition:**
- Original components (3,000+ lines) decomposed into modular sub-components
- Each tab/section as independent module
- Feature flag protection during transitions (`useTechnologyFeatureFlags`)

**Lazy Loading Strategy:**
```typescript
const Component = lazy(() => 
  import("@/path/to/Component").then(m => ({ 
    default: m.Component 
  }))
);
```

### 6.2 State Management Patterns

**Form State:**
- `useReducer` for complex forms (ProductCreateEditModal)
- `useState` for simple entity management
- `react-hook-form` with `useFieldArray` for dynamic lists (FooterManagement)

**Server State:**
- TanStack Query (React Query) for all API interactions
- Optimistic updates with rollback on error
- Cache invalidation on mutations

**UI State:**
- React Context for global admin state
- Local state for component-level UI
- Persistent accordion states via localStorage

### 6.3 Error Handling

**Hierarchy:**
1. Route-level: `AdminErrorBoundary`
2. Module-level: `ErrorBoundary` wrapper per tab
3. Component-level: Try-catch in event handlers
4. API-level: Toast notifications for mutations

### 6.4 Performance Optimizations

- **Code Splitting:** All modules lazy-loaded
- **Pagination:** Traditional pagination over virtual scrolling
- **Memoization:** `React.memo` on list items, `useMemo` for computed data
- **Media Optimization:** Signed URLs, lazy loading, WebP conversion
- **Query Caching:** 10-minute stale time for media assets

---

## 7. Appendix: Component Inventory

### 7.1 Admin UI Components (Internal)

| Component | Location | Purpose |
|-----------|----------|---------|
| `AdminLayout` | `admin-layout.tsx` | Shell with sidebar navigation |
| `AdminBreadcrumb` | `AdminBreadcrumb.tsx` | Path-based navigation |
| `AdminLoadingState` | `AdminLoadingState.tsx` | Skeleton loader |
| `AdminErrorBoundary` | `AdminErrorBoundary.tsx` | Error fallback |
| `ModuleSearch` | `ModuleSearch.tsx` | Global module finder |
| `PlaceholderModule` | `PlaceholderModule.tsx` | Coming soon placeholder |

### 7.2 Shared Dialog Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `DeleteConfirmationDialog` | `shared/DeleteConfirmationDialog.tsx` | Delete confirmation |
| `StandardMediaSelectionDialog` | `shared/StandardMediaSelectionDialog.tsx` | Media picker |
| `ApiErrorFallback` | `shared/ApiErrorFallback.tsx` | API error display |

### 7.3 Form Section Components

| Component | Location | Used By |
|-----------|----------|---------|
| `BasicInfoSection` | `product-management-unified/sections/` | ProductCreateEditModal |
| `MediaAssetsSection` | `product-management-unified/sections/` | ProductCreateEditModal |
| `CategoryFabricSection` | `product-management-unified/sections/` | ProductCreateEditModal |
| `SpecificationsSection` | `product-management-unified/sections/` | ProductCreateEditModal |
| `CertificationsSection` | `product-management-unified/sections/` | ProductCreateEditModal |
| `CustomizationSection` | `product-management-unified/sections/` | ProductCreateEditModal |

### 7.4 Media Library Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `MediaLibraryContainerEnhanced` | `media-library/` | Main container |
| `MediaGrid` | `media-library/MediaGrid.tsx` | Asset grid display |
| `MediaFiltersPanel` | `media-library/MediaFiltersPanel.tsx` | Filter sidebar |
| `MediaUploadEnhanced` | `media-library/MediaUploadEnhanced.tsx` | Upload interface |
| `MediaViewerModal` | `media-library/MediaViewerModal.tsx` | Asset preview |

---

## 8. Conclusion

The RUN Remix Admin CMS demonstrates a mature, well-architected content management system with:

1. **Clear separation of concerns** between admin interface and public frontend
2. **Consistent UX patterns** across all modules (tabs, modals, collapsibles)
3. **Performance-conscious design** with code-splitting and lazy loading
4. **Comprehensive content coverage** spanning all major business domains
5. **Scalable architecture** supporting modular decomposition and feature flags

The 1:1 mapping between CMS sections and frontend routes ensures content editors have direct control over all user-facing content while maintaining a clean, intuitive administrative interface.

---

**Document End**  
*Generated: March 4, 2026*  
*Classification: Technical Documentation*