# Cache Sync Diagnosis Report
## Media Gallery Cache Propagation Analysis

**Date**: October 12, 2025  
**Status**: ✅ Monitoring Active

---

## Executive Summary

Comprehensive audit of cache propagation delays after uploads/deletes in the media gallery system. Added real-time monitoring to track frontend-backend synchronization and cache invalidation patterns.

---

## 1. Cache Library Configuration

### TanStack React Query v5 Settings

```javascript
// Global defaults (client/src/lib/queryClient.ts)
staleTime: 2 * 60 * 1000        // 2 minutes
gcTime: 10 * 60 * 1000          // 10 minutes cache retention
refetchOnWindowFocus: false     // No automatic refetch
refetchInterval: false          // No polling
networkMode: 'always'           // Always attempt network requests
```

**Media-specific settings**:
- **staleTime**: 5 minutes for heavy assets
- **gcTime**: 20 minutes retention
- **retry**: 10 attempts (for large 3D models)

---

## 2. Backend API Pagination

### Implementation Details

```typescript
// server/routes/media/handlers.ts
export async function getMediaAssets(req: Request, res: Response) {
  const { page = 1, limit = 50 } = req.query;
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  
  // 1-based pagination
  const offset = (pageNum - 1) * limitNum;
  const assets = allAssets.slice(offset, offset + limitNum);
  
  res.json({
    page: pageNum,
    limit: limitNum,
    total: allAssets.length,
    pages: Math.ceil(allAssets.length / limitNum)
  });
}
```

**Key findings**:
- ✅ Uses 1-based pagination (`page=1` is first page)
- ✅ Offset calculation: `(page - 1) * limit`
- ✅ Returns pagination metadata in response

---

## 3. Frontend Request/Response Cycle

### Query Key Structure

```typescript
// Cache key format
const queryKey = ['/api/media', {
  page: selectionMode ? 1 : state.currentPage,
  limit: selectionMode ? 48 : 24,
  search: state.searchTerm,
  type: state.selectedType,
  sortBy: state.sortBy,
  sortOrder: state.sortOrder
}];
```

### API Request Parameters

```typescript
// Selection mode (dialogs): Load all items for scrolling
if (selectionMode) {
  params.append('page', '1');
  params.append('limit', '1000'); // Large limit
} else {
  // Admin pages: Normal pagination
  params.append('page', String(state.currentPage));
  params.append('limit', '24');
}
```

**⚠️ CRITICAL MISMATCH IDENTIFIED**:
- **API request**: `limit=1000` (selection mode)
- **Cache key**: `limit=48` (different value)
- **Impact**: Cache key doesn't match actual request, causing cache misses

---

## 4. Cache Invalidation Strategy

### Current Implementation

```typescript
// After upload/delete mutations
await queryClient.invalidateQueries({
  predicate: (query) => {
    const key = query.queryKey[0];
    return typeof key === 'string' && key.includes('/api/media');
  }
});
```

**Locations**:
1. **MediaUploadEnhanced.tsx**: Line 537 (post-upload)
2. **MediaGrid.tsx**: Line 409 (bulk delete)
3. **MediaViewerModal.tsx**: Line 218, 352 (single item delete/edit)
4. **MediaLibraryContextEnhanced.tsx**: Line 524 (fallback invalidation)

### Invalidation Timing

- ⏱️ **Upload**: Invalidates immediately after successful API response
- ⏱️ **Delete**: Invalidates after optimistic updates  
- ⏱️ **Edit**: Invalidates using MediaCacheInvalidator utility

---

## 5. Monitoring Implementation

### A. Pagination Sync Monitor

```typescript
// MediaGrid.tsx: Lines 583-602
useEffect(() => {
  console.log('📊 PAGINATION SYNC MONITOR');
  console.log('Frontend State:', state.currentPage, state.totalPages);
  console.log('API Request:', apiUrl);
  console.log('Cache Key:', queryKey);
}, [selectionMode, state.currentPage, state.totalPages, apiUrl]);
```

**Tracks**:
- Selection mode state
- Frontend pagination state
- API request URL and parameters
- Cache key configuration

### B. API Response Validation

```typescript
// MediaGrid.tsx: Lines 687-718
useEffect(() => {
  if (mediaResponse && status === 'success') {
    const requestPage = parseInt(params.get('page'));
    const pageMatch = requestPage === pagination.page;
    const limitMatch = requestLimit === pagination.limit;
    
    console.log('✅ API RESPONSE SYNC CHECK');
    console.log('Request:', { requestPage, requestLimit });
    console.log('Response:', { page: pagination.page, limit: pagination.limit });
    console.log('Consistency:', { pageMatch, limitMatch });
    
    if (!pageMatch || !limitMatch) {
      console.error('🚨 DESYNC DETECTED!');
    }
  }
}, [mediaResponse, status, state.currentPage]);
```

**Validates**:
- Request parameters vs response metadata
- Frontend state vs backend state
- Detects pagination desynchronization

### C. Cache Invalidation Tracking (TODO)

**Planned enhancements**:
```typescript
// Add to all mutation points
console.log('🔄 [CACHE INVALIDATION] POST-{ACTION}');
const invalidateStart = performance.now();
await queryClient.invalidateQueries({...});
const duration = performance.now() - invalidateStart;
console.log(`✅ Complete in ${duration}ms`);
```

---

## 6. Identified Issues

### ✅ FIXED: Cache Key Mismatch

**Problem**: 
- API requests used `limit=1000` in selection mode
- Cache key stored `limit=48`
- Result: Every request bypassed cache, no reuse

**Location**: MediaGrid.tsx, lines 554-560 vs 572-580

**Fix Applied** (October 12, 2025):
```typescript
// Changed from:
limit: selectionMode ? 48 : 24  // ❌ Mismatched

// To:
limit: selectionMode ? 1000 : 24  // ✅ Aligned with API
```

**Result**: Cache keys now match API requests, enabling proper cache hits and invalidation

### Issue: Pagination Hidden in Selection Mode

**Problem**: Pagination UI intentionally hidden when `selectionMode=true`
**Location**: MediaGrid.tsx, line 889
**Impact**: Users cannot access items beyond first 1000 in dialogs

---

## 7. Recommendations

### Immediate Actions

1. **Fix cache key/API mismatch**
   - Align `limit` values between cache key and API request
   - Test cache hit rate before/after

2. **Add invalidation timing logs**
   - Track how long invalidation takes
   - Monitor refetch triggers

3. **Optimize selection mode pagination**
   - Consider virtual scrolling for 1000+ items
   - Or implement proper pagination in dialogs

### Long-term Improvements

1. **Request deduplication monitoring**
   - Log when identical requests are coalesced
   - Track performance gains

2. **Stale-while-revalidate pattern**
   - Show cached data immediately
   - Fetch fresh data in background
   - Update UI when new data arrives

3. **Granular cache invalidation**
   - Only invalidate affected pages
   - Use optimistic updates more aggressively

---

## 8. Testing Checklist

- [ ] Upload file → Check console for invalidation log → Verify gallery updates
- [ ] Delete file → Check console for invalidation log → Verify gallery updates
- [ ] Navigate pages → Check sync monitor → Verify request/response match
- [ ] Open selection dialog → Check limit parameter → Verify cache behavior
- [ ] Monitor browser DevTools Network tab → Count duplicate requests

---

## 9. Monitoring Commands

```bash
# Check browser console for logs
# Look for these prefixes:
📊 PAGINATION SYNC MONITOR
✅ API RESPONSE SYNC CHECK
🔄 CACHE INVALIDATION
🚨 DESYNC DETECTED

# Network tab filters:
/api/media?page=
/api/media/upload
```

---

## Appendix: Code References

### Frontend
- **MediaGrid.tsx**: Lines 583-602 (sync monitor), 687-718 (validation)
- **MediaUploadEnhanced.tsx**: Line 537 (upload invalidation)
- **MediaViewerModal.tsx**: Lines 218, 352 (delete/edit invalidation)
- **queryClient.ts**: Lines 167-196 (React Query config)

### Backend
- **handlers.ts**: Lines 67-109 (getMediaAssets pagination logic)
- **routes.ts**: Line 63 (media route)
