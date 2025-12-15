# Media Selection Flow Investigation Report
**Date:** October 13, 2025  
**Status:** Investigation Complete - Awaiting Implementation Approval

## Executive Summary

Investigation of media selection flow from admin to user pages revealed **3 critical issues** and **775+ TypeScript errors** requiring resolution across 4 investigation chunks.

### Critical Findings

1. **Property Name Mismatch (CHUNK 2)** ✅ Identified
   - `backgroundImageId` (schema) vs `backgroundMediaId` (code)
   - Location: `client/src/pages/homepage.tsx` lines 207-208
   - Impact: Media fails to display on homepage after admin selection

2. **Cache Invalidation Inconsistency (CHUNK 3)** ⚠️ Identified  
   - 30+ hardcoded query keys instead of centralized MediaQueryKeys
   - Inconsistent use of MediaCacheInvalidator
   - Risk: Stale data persists after updates/deletes

3. **Type Safety Violations (CHUNK 1)** 🔴 Critical
   - 40 errors in homepage.tsx
   - 660 errors in client components
   - 75 errors in server
   - Total: **775 TypeScript errors**

---

## CHUNK 1: TypeScript LSP & Data Model Debug

### ✅ COMPLETED: MediaAsset Type Verification
```typescript
// Confirmed present in shared/schema.ts:
isActive: boolean("is_active").default(true)
updatedAt: timestamp("updated_at").defaultNow()
folderId: integer("folder_id").references(() => folders.id)
downloadCount: integer("download_count").default(0)
lastAccessedAt: timestamp("last_accessed_at")
```

### 🔴 PENDING: TypeScript Error Resolution

#### Homepage Errors (40 total)
**File:** `client/src/pages/homepage.tsx`

| Line | Error | Fix Required |
|------|-------|--------------|
| 157-158 | Property 'result' missing | Add result property to batch response type |
| 207-209 | backgroundImageId doesn't exist on {} | Type hero object properly |
| 216-217 | mediaId missing from ProcessCard | Add mediaId or use imageId |
| 226-227 | mediaId vs mediaIds confusion | Use correct property name |
| 287-288 | videoMediaId doesn't exist | Remove or add to Product type |
| 422 | Null arithmetic operations | Add null checks for position sorting |
| 506, 535 | isPrimary not in MediaItem | Remove or add property |
| 564 | Type '"model"' not in union | Add 'model' to MediaItem type |

#### Client Component Errors (660 total)
**Top Issues:**
- `WebPOptimizationDemo.tsx`: size nullability issues
- `MediaCleanupPanel.tsx`: LinkOff import, API call type mismatch
- `ReviewPublishTab.tsx`: technicalSpecs, region missing
- `CategoryForm.tsx`: imageUrl property missing
- Manufacturing components: icon, title, checkpoints, standards missing

#### Server Errors (75 total)
Needs detailed analysis with full tsc output.

---

## CHUNK 2: Media Selection Flow Integrity

### ✅ INSTRUMENTED: Admin Selection Flow

**Logging Chain Implemented:**
```
STEP 1-2: StandardMediaSelectionDialog → logs asset selection
STEP 3: HomepageHeroManager → logs backgroundImageId update
STEP 4: Mutation → logs PATCH request/response
STEP 5: Cache invalidation → logs query keys invalidated
STEP 6: Homepage render → logs hero data and media loading
```

### 🔴 CRITICAL: Property Name Mismatch

**Problem:**
```typescript
// Line 207-208 (WRONG)
if (stableHero.backgroundMediaId) {
  basicIds.add(stableHero.backgroundMediaId);
}

// Line 304, 318 (CORRECT)
const heroBackgroundId = hero?.backgroundImageId;
```

**Schema Definition:**
```typescript
// shared/schema.ts line 340
backgroundImageId: integer("background_image_id")
  .references(() => mediaAssets.id, { onDelete: "set null" })
```

**Impact:**
- Media selected in admin saves correctly as `backgroundImageId`
- Homepage tries to load using `backgroundMediaId` (doesn't exist)
- Result: No media displays despite successful save

### ✅ READY TO TEST: Cache Invalidation
```typescript
// Already invalidating:
queryClient.invalidateQueries({ queryKey: ["/api/homepage-hero"] });
queryClient.invalidateQueries({ queryKey: ["/api/homepage-batch"] });
```

---

## CHUNK 3: Centralized Cache & Invalidation

### Current State Analysis

#### MediaQueryKeys Factory (Exists)
**File:** `client/src/lib/media-query-keys.ts`
```typescript
export const MediaQueryKeys = {
  all: ['/api/media'],
  lists: () => [...MediaQueryKeys.all, 'list'],
  list: (filters: string) => [...MediaQueryKeys.lists(), { filters }],
  // ... more patterns
}
```

#### Hardcoded Query Keys Found (30+ instances)

**Examples:**
```typescript
// HomepageHeroManager.tsx
queryClient.invalidateQueries({ queryKey: ["/api/homepage-hero"] });
queryClient.invalidateQueries({ queryKey: ["/api/homepage-batch"] });

// HomepageProcessManager.tsx  
queryClient.invalidateQueries({ queryKey: ["/api/homepage-process-cards"] });

// sync-monitor.ts
queryClient.invalidateQueries({ queryKey: ['/api/about-hero'] });
queryClient.invalidateQueries({ queryKey: ['/api/about-sections'] });
// ... 18 more hardcoded keys
```

#### Inconsistent Invalidator Usage

**MediaCacheInvalidator exists but:**
- Used in 3 files only
- Many components bypass it
- No enforcement of centralized pattern

### Recommended Refactoring

1. **Extend MediaQueryKeys:**
   - Add homepage keys
   - Add page-specific keys
   - Standardize all API endpoints

2. **Enforce MediaCacheInvalidator:**
   - All mutations use service
   - No direct invalidateQueries calls
   - Centralized logic

3. **Pattern Example:**
```typescript
// BEFORE (scattered)
queryClient.invalidateQueries({ queryKey: ["/api/homepage-hero"] });

// AFTER (centralized)
MediaQueryKeys.homepage.hero()
MediaCacheInvalidator.invalidateHomepageHero(queryClient);
```

---

## CHUNK 4: E2E Integration Test Plan

### Test Scenarios

#### 1. Upload New Media
- [ ] Image upload (JPG, PNG, WebP)
- [ ] Video upload (MP4, WebM)
- [ ] 3D Model upload (GLB, GLTF)
- [ ] Document upload (PDF)

**Expected:** 200 OK, media appears in library

#### 2. Admin Selection Flow
- [ ] Open StandardMediaSelectionDialog
- [ ] Select media asset
- [ ] Click Save Hero Section
- [ ] Verify PATCH /api/homepage-hero succeeds
- [ ] Check request payload includes backgroundImageId

**Expected:** Network tab shows 200 OK, payload correct

#### 3. User Page Display (Critical)
- [ ] Navigate to homepage (/) 
- [ ] Check React Query DevTools
- [ ] Verify cache shows updated hero data
- [ ] Confirm media displays visually
- [ ] No manual refresh needed

**Expected:** Instant update, correct media shows

#### 4. Delete Asset
- [ ] Delete media from library
- [ ] Check all pages using that media
- [ ] Verify no 404s
- [ ] Confirm placeholder/fallback shows

**Expected:** Clean removal, no errors

### DevTools Checklist

**React Query DevTools:**
- [ ] Query keys match MediaQueryKeys pattern
- [ ] Stale queries refetch after invalidation
- [ ] No duplicate cache entries
- [ ] Cache timestamps update correctly

**Network Tab:**
- [ ] All requests return 200 OK
- [ ] No 404s on media paths
- [ ] PATCH payloads match schema
- [ ] Response data complete

**Console Logs:**
- [ ] No TypeScript errors
- [ ] Instrumentation logs show flow
- [ ] No cache warnings
- [ ] No missing property errors

---

## Action Items Priority

### 🔥 CRITICAL (Block User Pages)
1. Fix backgroundImageId vs backgroundMediaId (CHUNK 2)
2. Fix homepage.tsx type errors (CHUNK 1)
3. Test media display propagation (CHUNK 4)

### ⚠️ HIGH (Type Safety)
4. Fix 660 client component errors (CHUNK 1)
5. Fix 75 server errors (CHUNK 1)

### 📋 MEDIUM (Technical Debt)
6. Refactor hardcoded query keys (CHUNK 3)
7. Implement MediaQueryKeys factory (CHUNK 3)
8. Enforce MediaCacheInvalidator usage (CHUNK 3)

### ✅ LOW (Enhancement)
9. Full E2E test suite (CHUNK 4)
10. Performance monitoring (CHUNK 4)

---

## Files Requiring Changes

### Immediate (CHUNK 1 & 2)
- `client/src/pages/homepage.tsx` - 40 errors + property fix
- `client/src/components/WebPOptimizationDemo.tsx`
- `client/src/components/admin/MediaCleanupPanel.tsx`
- `client/src/components/admin/ReviewPublishTab.tsx`
- `client/src/components/admin/categories/CategoryForm.tsx`
- Manufacturing components (multiple)

### Cache Refactor (CHUNK 3)
- `client/src/pages/admin/content-management/homepage/HomepageHeroManager.tsx`
- `client/src/pages/admin/content-management/homepage/HomepageProcessManager.tsx`
- `client/src/lib/sync-monitor.ts`
- `client/src/hooks/useManufacturingMutations.ts`
- 15+ other files with hardcoded keys

### Test Files (CHUNK 4)
- Create E2E test suite
- Add React Query DevTools monitoring
- Network request validation

---

## Success Criteria

### CHUNK 1: TypeScript ✅
- [ ] `tsc --noEmit` passes (0 errors)
- [ ] LSP shows no diagnostics
- [ ] MediaAsset autocomplete works everywhere
- [ ] LSP responds instantly

### CHUNK 2: Media Flow ✅
- [ ] Media selected in admin displays on user page
- [ ] No manual refresh required
- [ ] React Query DevTools shows correct cache
- [ ] Logs show complete flow (Steps 1-6)

### CHUNK 3: Cache ✅
- [ ] All invalidations use MediaQueryKeys
- [ ] MediaCacheInvalidator enforced
- [ ] Delete/edit updates UI instantly
- [ ] No phantom/stale entries

### CHUNK 4: E2E ✅
- [ ] All upload types work
- [ ] Admin selection propagates
- [ ] User pages update immediately
- [ ] Delete cleans up completely
- [ ] Zero 404s or console errors

---

## Current Status

**Investigation:** ✅ Complete  
**Implementation:** ⏸️ Awaiting Approval  
**Testing:** ⏸️ Awaiting Implementation

**Next Steps:**
1. Review and approve task list
2. Prioritize critical fixes
3. Execute implementation plan
4. Run E2E test suite
5. Document final results

---

## Appendix: Error Logs

### TypeScript Error Summary
```
Client errors: 660
Server errors: 75
LSP diagnostics: 40 (homepage.tsx)
Total: 775 errors
```

### Cache Invalidation Audit
```
Hardcoded keys found: 30+
MediaQueryKeys usage: Minimal
MediaCacheInvalidator usage: 3 files only
Centralization: 0%
```

### Property Name Issues
```
backgroundImageId (schema) ✅
backgroundMediaId (code) ❌ - NOT IN SCHEMA
```
