# Database Schema Deprecations & Migration Timeline

**Last Updated**: November 14, 2025  
**Status**: Active Deprecation Management

## Overview

This document tracks all deprecated database schema fields, their replacement approaches, and removal timelines. All deprecations follow a minimum 6-month grace period to ensure smooth migration for existing integrations.

---

## Active Deprecations

### 1. fabrics.composition (Zod Schema Only)

**Status**: ⚠️ **DEPRECATED** - Compatibility shim  
**Timeline**:
- **Deprecated Since**: September 2024
- **Removal Target**: March 2026 (6+ months)
- **Current Phase**: Monitoring usage with server-side telemetry

**Details**:
- **Field Type**: `string` (optional)
- **Database Status**: Field never existed in Drizzle table definition
- **Zod Status**: Present in `insertFabricSchema` for backward compatibility
- **Why Deprecated**: Replaced by structured `compositions` array for richer fiber data

**Replacement**:
```typescript
// DEPRECATED (Legacy string format)
{
  composition: "65% Polyester, 35% Cotton"
}

// REPLACEMENT (Structured array format)
{
  compositions: [
    {
      name: "Standard Blend",
      isDefault: true,
      fibers: [
        { fiberId: 1, percentage: "65" },  // Polyester
        { fiberId: 2, percentage: "35" }   // Cotton
      ]
    }
  ]
}
```

**Migration Path**:
1. Update API clients to use `compositions` array
2. Server-side mapping converts legacy `composition` strings to `compositions` array automatically
3. Monitor usage logs for zero `composition` submissions over 30-day window
4. Remove field from Zod schema after confirmed zero usage

**Monitoring & Telemetry**:
- **Status**: ✅ **MONITORING ACTIVE** (Phase 2 enforcement in place)
- **Implementation**: `server/lib/repositories/misc-repository.ts` lines 300-310
- **Instrumentation Code**:
  ```typescript
  // transformFabricForDatabase() method
  if (composition !== undefined) {
    logger.warn('[DEPRECATED_FIELD_USAGE] fabric.composition field used', {
      event: 'deprecated_field_composition',
      fabricName: name || 'unknown',
      hasCompositionsArray: !!compositions,
      compositionValue: composition,
      timestamp: new Date().toISOString(),
      deprecationRemovalDate: '2026-03',
    });
  }
  ```
- **Metrics Collection**: 
  - **Event Name**: `deprecated_field_composition`
  - **Log Level**: WARN (ensures visibility in monitoring dashboards)
  - **Log Location**: Smart logger JSON output (server/lib/smart-logger.ts)
  - **Query Filter**: `event == "deprecated_field_composition"`
  - **Alert Dashboard**: Monitor WARN-level logs in production log aggregator
- **Phase 2 Gate Process**:
  1. Filter logs for `deprecated_field_composition` events
  2. Verify zero events over 30-day rolling window
  3. Confirm gate before proceeding to Phase 3 removal
- **Traceability**: File reference with exact line numbers enables audit verification

**Impact Assessment**:
- Low risk - Field never persisted to database
- No data loss on removal
- Server-side compatibility layer handles legacy requests

---

## Deprecation Candidates (Pending Refactor)

### 2. products.relatedProductIds

**Status**: ⏳ **CANDIDATE FOR DEPRECATION** - Not yet deprecated  
**Timeline**:
- **Identified**: November 2025
- **Refactor Required**: Derive from `categoryProducts` context
- **Deprecation Date**: TBD (after refactor complete)
- **Removal Target**: TBD (6 months after deprecation)

**Details**:
- **Field Type**: `number[]` (JSONB array)
- **Database Status**: Active column, populated and queried
- **Current Usage**: Selected in `PRODUCT_DETAIL_COLUMNS` (line 121)
- **Why Pending Deprecation**: Redundant with context-based `categoryProducts`

**Current Behavior**:
```typescript
// Current approach (products table)
product.relatedProductIds = [1, 2, 3, 4, 5];

// Context includes (from getProductByPath)
context.categoryProducts = [...]; // Same category products
```

**Proposed Replacement**:
```typescript
// After refactor - derive from categoryProducts
const relatedProducts = context.categoryProducts
  .filter(p => p.id !== product.id)
  .slice(0, 10);
```

**Refactor Checklist**:
- [ ] Update frontend to consume `categoryProducts` from context
- [ ] Remove `relatedProductIds` from `PRODUCT_DETAIL_COLUMNS`
- [ ] Update product form to stop persisting `relatedProductIds`
- [ ] Verify no admin UI dependencies
- [ ] Add @deprecated JSDoc after refactor complete
- [ ] Set 6-month removal timeline

**Blocked By**: Frontend refactor to use context-based approach

---

## Already Removed (Historical Record)

### 3. categories.productCount

**Removed**: November 14, 2025  
**Reason**: Never updated - Dynamic COUNT queries used instead  
**Storage Saved**: ~4 bytes per category row

**Migration**: `migrations/cleanup/001_remove_dead_columns.sql`

---

### 4. products.categoryPath

**Removed**: November 14, 2025  
**Reason**: Never populated - Client-side breadcrumb computation used  
**Storage Saved**: ~500 bytes per product row

**Migration**: `migrations/cleanup/001_remove_dead_columns.sql`

---

### 5. media_assets.downloadCount

**Removed**: November 14, 2025  
**Reason**: Never updated - Usage tracking not implemented  
**Storage Saved**: ~4 bytes per media asset row

**Migration**: `migrations/cleanup/001_remove_dead_columns.sql`

---

### 6. media_assets.lastAccessedAt

**Removed**: November 14, 2025  
**Reason**: Never updated - Usage tracking not implemented  
**Storage Saved**: ~8 bytes per media asset row

**Migration**: `migrations/cleanup/001_remove_dead_columns.sql`

---

## Compatibility Aliases (Intentional, Not Deprecated)

These fields are intentionally duplicated or aliased for frontend/API compatibility. They are **NOT** scheduled for removal without extensive frontend refactoring.

### media_assets.size

**Purpose**: Frontend compatibility alias for `fileSize`  
**Status**: Active, extensively used  
**Rationale**: Frontend components exclusively consume `asset.size` rather than `asset.fileSize`

**Key Consuming Components** (16+ total):
- `client/src/components/ui/UnifiedModelViewer.tsx` - 3D model size validation (lines 205, 230, 867)
- `client/src/components/admin/media-library/MediaGrid.tsx` - File size display (line 210)
- `client/src/components/admin/media-library/MediaViewerModal.tsx` - Size calculation (line 396)
- `client/src/components/WebPOptimizationDemo.tsx` - Image optimization logic (lines 51, 253, 303)
- `client/src/lib/media-service.ts` - Large media detection (lines 257, 261)
- `client/src/lib/homepage-media-loader.ts` - Preload logic (lines 326-327)
- `client/src/components/products/UnifiedMediaTheater.tsx` - Media fallback (lines 411-412)
- Additional usage in: MediaLibraryContext, MediaUploadEnhanced, product sections

**Database SELECT**: `server/lib/repositories/media-repository.ts` line 135 (included in getMediaAssets query)

**Refactoring Requirement**: Minimum 16 frontend component updates + query changes before removal  
**Note**: Separate frontend refactoring task identified but NOT prioritized

---

### fabrics.weaveType

**Purpose**: Alias for `weave` field for backward compatibility  
**Status**: Active  
**Database Column**: Line 401 in shared/schema.ts  
**Consuming Code**: Admin fabric management forms for weave pattern selection

---

### certificates.issuingBody, documentUrl, imageUrl

**Purpose**: URL/field aliases for frontend compatibility  
**Status**: Active in certificates table  
**Rationale**: 
- `issuingBody` → alias for `issuingOrganization`
- `documentUrl` → URL alias for `documentId` (media reference)
- `imageUrl` → URL alias for `imageId` (media reference)  
**Database Columns**: Lines 1479-1481 in shared/schema.ts

---

### navigation.icon, homepage.icon

**Purpose**: Frontend alias for `iconName`  
**Status**: Active in multiple UI tables  
**Consuming Components**: Navigation system, homepage configuration panels  
**Database Columns**: 
- Line 846 (categories table)
- Line 938 (homepage sections)

---

### Various title/name aliases

**Purpose**: Frontend display name compatibility across tables  
**Status**: Active in:
- `homepage_hero.headline` → alias for `title` (line 1043)
- `homepage_hero.subheadline` → alias for `subtitle` (line 1044)
- `homepage_sections.title` → alias for `name` (line 1084)
- `technology_innovations.title` → alias for `name` (line 1118)
- `navigation_items.name/title/href` → aliases for label/url (lines 1613-1616)

---

## Deprecation Policy

### Timeline Requirements

1. **Minimum Grace Period**: 6 months from deprecation announcement
2. **Usage Monitoring**: 30-day zero-usage window required before removal
3. **Communication**: Deprecation warnings in API responses (when applicable)
4. **Documentation**: Clear migration paths documented before deprecation

### Deprecation Process

1. **Phase 1 - Announcement** (Month 0)
   - Add @deprecated JSDoc comments with @since and @remove dates
   - Update this document with deprecation details
   - Add server-side logging to track usage

2. **Phase 2 - Migration Support** (Months 1-5)
   - Provide migration guides and examples
   - Server-side compatibility shims for smooth transition
   - Monitor usage metrics and support integration updates

3. **Phase 3 - Removal Preparation** (Month 6)
   - Verify zero usage over 30-day window
   - Final communication to integration partners
   - Prepare removal migration script

4. **Phase 4 - Removal** (After Month 6)
   - Execute migration to drop column/field
   - Update schema documentation
   - Move to "Already Removed" section in this document

---

## Migration Support

For assistance with migrating off deprecated fields:

1. **Review replacement approach** in field-specific sections above
2. **Check code examples** for proper implementation patterns
3. **Test in development** before deploying to production
4. **Contact support** if custom migration assistance needed

---

## Change Log

### November 2025
- Added `fabrics.composition` deprecation documentation
- Identified `products.relatedProductIds` as deprecation candidate
- Documented 4 removed columns from Session 3 cleanup
- Created initial deprecation policy and timeline guidelines

---

## Related Documentation

- [`migrations/cleanup/001_remove_dead_columns.sql`](../migrations/cleanup/001_remove_dead_columns.sql) - Column removal migration
- [`shared/schema.ts`](../shared/schema.ts) - Source of truth for schema definitions
- [`server/lib/repositories/`](../server/lib/repositories/) - Repository layer using schema fields
