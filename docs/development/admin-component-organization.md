# Admin Component Organization Guide

## Overview

This document provides guidance on organizing and maintaining the admin panel components in RUN Remix. The admin panel is a complex subsystem requiring clear domain boundaries and consistent patterns.

**Status:** Current State Documented  
**Last Updated:** February 2026  
**Complexity Level:** High (50+ admin components)

---

## Current Structure Analysis

### Admin Component Directory

```
client/app/components/admin/
├── index.ts                    # Barrel export
├── lazy-imports.tsx            # Lazy loading utilities
│
├── Core Layout Components
│   ├── admin-layout.tsx        # Main admin layout wrapper
│   ├── AdminBreadcrumb.tsx     # Navigation breadcrumbs
│   ├── AdminErrorBoundary.tsx  # Error handling
│   └── AdminLoadingState.tsx   # Loading states
│
├── Module Management (Top-Level)
│   ├── AboutManagement.tsx     # About page management
│   ├── admin-cms.tsx           # CMS functionality
│   ├── cross-page-dashboard.tsx # Cross-page analytics
│   ├── homepage-management.tsx  # Homepage content
│   ├── manufacturing-management.tsx # Manufacturing content
│   ├── navigation-management.tsx  # Navigation config
│   └── technology-management.tsx  # Technology page
│
├── Tab Content Components
│   ├── about-hero-tab.tsx
│   ├── about-locations-tab.tsx
│   ├── about-sections-tab.tsx
│   ├── about-statistics-tab.tsx
│   ├── about-team-message-tab.tsx
│   ├── CallToActionTabContent.tsx
│   ├── CertificationsTabContent.tsx
│   ├── FabricPortfolioTabContent.tsx
│   ├── FeaturesTabContent.tsx
│   ├── GoalsTabContent.tsx
│   ├── HeroTabContent.tsx
│   ├── InitiativesTabContent.tsx
│   ├── MetricsTabContent.tsx
│   ├── ReviewPublishTab.tsx
│   └── SectionHeadersTabContent.tsx
│
├── Feature Modules (Domain-Organized)
│   ├── categories/             # Category management
│   │   ├── CategoryDisplay.tsx
│   │   ├── CategoryDragOverlay.tsx
│   │   ├── CategoryForm.tsx
│   │   └── CategoryList.tsx
│   │
│   ├── certificate/            # Certificate management
│   │   ├── CertificateAnalytics.tsx
│   │   ├── CertificateForm.tsx
│   │   ├── CertificateInsights.tsx
│   │   ├── CertificateList.tsx
│   │   └── types.ts
│   │
│   ├── fabric/                 # Fabric management
│   │   ├── FabricCard.tsx
│   │   ├── FabricFilters.tsx
│   │   ├── FabricForm.tsx
│   │   ├── FabricStats.tsx
│   │   └── types.ts
│   │
│   ├── fiber/                  # Fiber management
│   │   ├── FiberDetails.tsx
│   │   ├── FiberForm.tsx
│   │   ├── FiberList.tsx
│   │   └── types.ts
│   │
│   ├── footer-management/      # Footer management
│   │   ├── FooterManagement.tsx
│   │   └── index.ts
│   │
│   ├── homepage/               # Homepage sections
│   │   ├── HomepageFeaturedTab.tsx
│   │   ├── HomepageHeroTab.tsx
│   │   ├── HomepageProcessCardsTab.tsx
│   │   ├── HomepageSectionsTab.tsx
│   │   └── HomepageSlogansTab.tsx
│   │
│   ├── manufacturing/          # Manufacturing content
│   │   ├── CapabilityManagement.tsx
│   │   ├── HeroManagement.tsx
│   │   ├── LivePreviewGrid.tsx
│   │   ├── ProcessManagement.tsx
│   │   ├── QualityManagement.tsx
│   │   └── README.md
│   │
│   ├── media-library/          # Media management
│   │   ├── MediaFiltersPanel.tsx
│   │   ├── MediaGrid.tsx
│   │   ├── MediaLibraryContainerEnhanced.tsx
│   │   ├── MediaLibraryContextEnhanced.tsx
│   │   ├── MediaLibraryTabsEnhanced.tsx
│   │   ├── MediaUploadEnhanced.tsx
│   │   └── MediaViewerModal.tsx
│   │
│   ├── navigation/             # Navigation management
│   │   ├── NavigationForm.tsx
│   │   └── NavigationItemList.tsx
│   │
│   ├── product-management-unified/  # Product management
│   │   ├── PerformanceMonitor.tsx
│   │   ├── ProductManagementUnified.tsx
│   │   ├── admin/
│   │   │   └── ProductCreateEditModal.tsx
│   │   ├── advanced/
│   │   │   ├── ProductAdvancedFilters.tsx
│   │   │   └── ProductBulkOperations.tsx
│   │   ├── core/
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductGrid.tsx
│   │   │   └── RelationshipIndicators.tsx
│   │   ├── sections/
│   │   │   ├── BasicInfoSection.tsx
│   │   │   ├── CategoryFabricSection.tsx
│   │   │   ├── CertificationsSection.tsx
│   │   │   ├── CustomizationSection.tsx
│   │   │   ├── MediaAssetsSection.tsx
│   │   │   └── SpecificationsSection.tsx
│   │   ├── shared/
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── logger.ts
│   │   │   ├── ProductDetailsPanel.tsx
│   │   │   ├── types.ts
│   │   │   └── utils.ts
│   │   └── hooks/
│   │       ├── index.ts
│   │       ├── useAccordionPersistence.ts
│   │       ├── useDebouncedSearch.ts
│   │       ├── useMediaOperations.ts
│   │       ├── useProductForm.ts
│   │       └── useSmartValidation.ts
│   │
│   ├── sustainability/          # Sustainability metrics
│   │   └── metrics-tab.tsx
│   │
│   └── technology/              # Technology page
│       ├── SortableResearchItem.tsx
│       ├── TechnologyCtaManagement.tsx
│       ├── TechnologyEquipmentManagement.tsx
│       ├── TechnologyGradientSettings.tsx
│       ├── TechnologyHeroManagement.tsx
│       ├── TechnologyInnovationManagement.tsx
│       ├── TechnologyResearchManagement.tsx
│       └── TechnologyRoadmapManagement.tsx
│
├── Shared Components
│   ├── ApiErrorFallback.tsx
│   ├── CertificateSelectionDialog.tsx
│   ├── DeleteConfirmationDialog.tsx
│   ├── IconPicker.tsx
│   ├── ManufacturingFormWrapper.tsx
│   ├── MediaSelectionWrapperUnified.tsx
│   ├── PerformanceMonitor.tsx
│   ├── StandardMediaSelectionDialog.tsx
│   ├── StatusBadge.tsx
│   ├── VirtualizedList.tsx
│   └── index.ts
│
├── Error Boundaries
│   └── error-boundaries/
│       └── AdminErrorBoundary.tsx
│
└── Utility Components
    ├── AdvancedOptionsTab.tsx
    ├── CustomDropdown.tsx
    ├── easing-selector.tsx
    ├── IconSelector.tsx
    ├── ModuleSearch.tsx
    ├── PlaceholderModule.tsx
    ├── ProductErrorBoundary.tsx
    ├── ProductsErrorFallback.tsx
    └── RobustSelect.tsx
```

---

## Organization Principles

### 1. Domain-Driven Structure

Each domain should have its own subdirectory with:
- **Components**: UI components specific to the domain
- **Types**: TypeScript interfaces and types
- **Hooks**: Custom hooks for the domain
- **Utils**: Domain-specific utilities
- **Index**: Barrel export for clean imports

**Example:**
```
fabric/
├── FabricCard.tsx       # Display component
├── FabricForm.tsx       # Form component
├── FabricFilters.tsx    # Filter UI
├── FabricStats.tsx      # Statistics display
├── types.ts             # TypeScript types
└── index.ts             # Barrel export
```

### 2. Component Categories

| Category | Purpose | Naming Convention |
|----------|---------|-------------------|
| **Container** | Data fetching, state management | `*Management.tsx`, `*Container.tsx` |
| **Form** | Data entry and editing | `*Form.tsx` |
| **Display** | Read-only presentation | `*Card.tsx`, `*List.tsx`, `*Display.tsx` |
| **Tab Content** | Tab panel content | `*Tab.tsx`, `*TabContent.tsx` |
| **Shared** | Reusable across domains | `*.tsx` (generic names) |
| **Types** | TypeScript definitions | `types.ts` |

### 3. Import Patterns

**Preferred:**
```typescript
// Domain-specific import
import { FabricCard, FabricForm } from '@/components/admin/fabric';

// Shared component import
import { StatusBadge, DeleteConfirmationDialog } from '@/components/admin/shared';
```

**Avoid:**
```typescript
// Deep relative imports
import { FabricCard } from '@/components/admin/fabric/FabricCard';
```

---

## Best Practices

### Component Size Guidelines

| Component Type | Target Size | Max Size |
|---------------|-------------|----------|
| Display Components | < 200 lines | 300 lines |
| Form Components | < 300 lines | 500 lines |
| Container Components | < 400 lines | 600 lines |
| Tab Content | < 300 lines | 500 lines |

**If a component exceeds these limits:**
1. Extract sub-components
2. Move logic to custom hooks
3. Create domain-specific utilities

### State Management

```typescript
// ✅ PREFERRED: Local state with custom hooks
function FabricManagement() {
  const { fabrics, loading, error, refetch } = useFabrics();
  const { selectedId, selectFabric } = useFabricSelection();
  
  // Component logic
}

// ❌ AVOID: Prop drilling
function FabricManagement() {
  const [fabrics, setFabrics] = useState([]);
  const [loading, setLoading] = useState(false);
  // ... many useState calls
}

// ✅ PREFERRED: Context for complex shared state
// MediaLibraryContextEnhanced.tsx pattern
```

### Error Handling

```typescript
// ✅ ALWAYS wrap admin sections in error boundaries
import { AdminErrorBoundary } from '@/components/admin/AdminErrorBoundary';

function AdminPage() {
  return (
    <AdminErrorBoundary>
      <ModuleManagement />
    </AdminErrorBoundary>
  );
}
```

### Loading States

```typescript
// ✅ Use consistent loading patterns
import { AdminLoadingState } from '@/components/admin/AdminLoadingState';

function FabricManagement() {
  const { data, isLoading } = useQuery();
  
  if (isLoading) {
    return <AdminLoadingState message="Loading fabrics..." />;
  }
  
  return <FabricList data={data} />;
}
```

---

## Migration Recommendations

### Current Issues

1. **Flat Tab Components**: Many `*TabContent.tsx` files at root level
2. **Mixed Naming**: Some use PascalCase, others use kebab-case
3. **Large Files**: Several components exceed 500 lines
4. **Inconsistent Exports**: Mix of default and named exports

### Recommended Actions

#### Phase 1: Group Tab Content by Domain

Move tab content files into their respective domain directories:

```
# Current
about-hero-tab.tsx
about-locations-tab.tsx

# Proposed
about/
├── tabs/
│   ├── HeroTab.tsx
│   ├── LocationsTab.tsx
│   ├── SectionsTab.tsx
│   ├── StatisticsTab.tsx
│   └── TeamMessageTab.tsx
├── AboutManagement.tsx
├── types.ts
└── index.ts
```

#### Phase 2: Standardize Naming

| Current | Proposed |
|---------|----------|
| `about-hero-tab.tsx` | `about/tabs/HeroTab.tsx` |
| `CategoryForm.tsx` | `categories/CategoryForm.tsx` (already correct) |
| `accessory-management-enhanced.tsx` | `accessories/AccessoryManagement.tsx` |

#### Phase 3: Extract Large Components

Components exceeding 500 lines should be split:

| Component | Current Lines | Action |
|-----------|---------------|--------|
| `CategoryForm.tsx` | ~1,100 | Split into sub-forms |
| `ProductCreateEditModal.tsx` | ~1,100 | Extract sections |
| `MediaGrid.tsx` | ~1,000 | Extract grid item component |
| `MediaUploadEnhanced.tsx` | ~900 | Extract upload zones |

---

## New Domain Template

When creating a new admin domain, use this structure:

```
new-domain/
├── components/
│   ├── NewDomainCard.tsx      # Display component
│   ├── NewDomainForm.tsx      # Form component
│   ├── NewDomainList.tsx      # List view
│   └── NewDomainFilters.tsx   # Filter controls
├── hooks/
│   ├── useNewDomain.ts        # Data fetching
│   ├── useNewDomainForm.ts    # Form logic
│   └── index.ts
├── types.ts                   # TypeScript definitions
├── utils.ts                   # Domain utilities
├── NewDomainManagement.tsx    # Main container
└── index.ts                   # Barrel export
```

---

## Testing Guidelines

### Test File Location

```
fabric/
├── FabricCard.tsx
├── FabricCard.test.tsx        # Co-located test
├── FabricForm.tsx
├── FabricForm.test.tsx
└── ...
```

### Test Coverage Requirements

| Component Type | Coverage Target |
|---------------|-----------------|
| Form Components | 85%+ |
| Container Components | 80%+ |
| Display Components | 70%+ |
| Utility Functions | 90%+ |

---

## References

- [AGENTS.md](../../audit-reports/AGENTS.md) - Server directory structure
- [Architecture Documentation](../core/architecture.md) - Overall system architecture
- [Developer Workflow](../guides/developer-workflow.md) - Development standards
- [Testing Documentation](./testing.md) - Testing standards

---

**Version:** 1.0.0 | **For:** M. Hateem Jamshaid @ RUN APPAREL (PVT) LTD