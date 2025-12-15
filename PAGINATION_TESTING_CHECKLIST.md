# Pagination Testing Checklist - Media Picker Modal

## Quick Test (2 minutes)

### ✅ Open Modal & Check Visibility
1. Open Admin → Homepage Management
2. Click "Select Hero Background" button
3. **Expected**: Media picker modal opens
4. **Expected**: Pagination controls visible at bottom (if >24 items)

### ✅ Navigate Pages
1. Click "Next" or "Page 2" button
2. **Expected**: Different media items load
3. **Expected**: Page indicator updates (shows "2" active)

### ✅ Console Verification
Open browser DevTools → Console, look for:
```
📄 PAGINATION CLICK DETECTED
🔹 Previous Page: 1
🔹 New Page: 2

🔧 PAGINATION PARAMS BUILD:
  page: "2"
  limit: "24"

🌐 FETCH START:
  url: "/api/media?...&page=2&limit=24"

✅ FETCH SUCCESS:
  receivedItems: 24
  totalPages: 10
```

---

## Comprehensive Test Suite

### Test 1: Pagination Controls Rendered
**Location**: Any media picker modal (Hero, Product, Navigation, etc.)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open media picker modal | Modal opens with media grid |
| 2 | Count total items in database | >24 items (to ensure multiple pages) |
| 3 | Check bottom of modal | Pagination controls visible |
| 4 | Check console | `shouldShowPagination = true` logged |

**Pass Criteria**: ✅ Pagination visible when totalPages > 1

---

### Test 2: Click Pagination Controls
**Location**: Media picker modal, page 1

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open media picker modal | Shows page 1 (items 1-24) |
| 2 | Click "Next" button | Console logs "PAGINATION CLICK DETECTED" |
| 3 | Wait for fetch | Console logs "FETCH START" with page=2 |
| 4 | Wait for response | Console logs "FETCH SUCCESS" with 24 items |
| 5 | Check grid | Different media items loaded (page 2) |
| 6 | Check page indicator | Page 2 button highlighted |

**Pass Criteria**: ✅ API call triggered with correct page parameter

---

### Test 3: API Request Validation
**Location**: Browser DevTools → Network tab

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open Network tab | Clear any existing requests |
| 2 | Open media picker modal | GET /api/media?page=1&limit=24 |
| 3 | Click page 2 | GET /api/media?page=2&limit=24 |
| 4 | Click page 3 | GET /api/media?page=3&limit=24 |
| 5 | Click "Prev" (back to 2) | GET /api/media?page=2&limit=24 |

**Pass Criteria**: ✅ Each click sends correct page parameter

---

### Test 4: Backend Response Verification
**Location**: Network tab → Response

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to page 2 | Check response JSON |
| 2 | Verify structure | `{ success: true, data: { data: [...], pagination: {...} } }` |
| 3 | Count items | 24 items in `data.data` array |
| 4 | Check pagination metadata | `{ page: 2, totalPages: X, total: Y }` |
| 5 | Navigate to last page | Items count ≤ 24 (remaining items) |

**Pass Criteria**: ✅ Backend returns correct page data

---

### Test 5: Edge Cases

#### 5a. Last Page (Partial)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Calculate last page | If 238 total items, last page = 10 (238 ÷ 24 = 9.9) |
| 2 | Navigate to page 10 | Shows 22 items (238 - 216 = 22) |
| 3 | Check "Next" button | Disabled (no page 11) |

**Pass Criteria**: ✅ Partial last page handled correctly

#### 5b. Empty Results
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Apply filter (e.g., type=nonexistent) | 0 results |
| 2 | Check pagination | Hidden (`totalPages <= 1`) |
| 3 | Check message | "No media found" or empty state |

**Pass Criteria**: ✅ Pagination hidden for empty results

#### 5c. Single Page
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Apply filter to get <24 items | e.g., 15 items |
| 2 | Check pagination | Hidden (`totalPages = 1`) |
| 3 | Check item count | "15 media items" shown |

**Pass Criteria**: ✅ Single page shows count, no pagination

---

### Test 6: Rapid Navigation (No Debouncing)
**Location**: Media picker modal

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click Next rapidly 3 times | 3 separate "CLICK DETECTED" logs |
| 2 | Check API calls | 3 separate fetch requests (page 2, 3, 4) |
| 3 | Wait for final response | Shows page 4 items |
| 4 | Click Prev twice rapidly | 2 separate fetch requests (page 3, 2) |
| 5 | Check final state | Shows page 2 items |

**Pass Criteria**: ✅ No debouncing - each click triggers immediate fetch

---

### Test 7: Cache Behavior
**Location**: Media picker modal

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to page 2 | Fetches and displays page 2 |
| 2 | Navigate to page 3 | Fetches and displays page 3 |
| 3 | Navigate back to page 2 | May use cache (30s staleTime) OR refetch |
| 4 | Check console | If cached: no new fetch. If fresh: fetch logged |
| 5 | Upload new media | Cache invalidated |
| 6 | Navigate to page 1 | Fresh fetch with new item |

**Pass Criteria**: ✅ Cache works, invalidates on mutation

---

### Test 8: Selection Mode Verification
**Location**: Different modal contexts

| Component | Trigger | Expected Behavior |
|-----------|---------|-------------------|
| Hero Management | "Select Background" | Pagination works, page=1,2,3... |
| Product Form | "Select Image" | Pagination works, page=1,2,3... |
| Navigation Form | "Select Icon" | Pagination works, page=1,2,3... |
| Manufacturing Section | "Select Image" | Pagination works, page=1,2,3... |

**Pass Criteria**: ✅ Pagination works in ALL modal contexts

---

### Test 9: State Synchronization
**Location**: Console logs

| Step | Action | Console Output |
|------|--------|----------------|
| 1 | Click page 2 | "Previous Page: 1" → "New Page: 2" |
| 2 | Check params build | "currentPage: 2" → "page: '2'" |
| 3 | Check query key | `queryKey: ['apimedia', 'paginated', {page: 2, ...}]` |
| 4 | Check fetch URL | `url: "/api/media?...&page=2&limit=24"` |
| 5 | Check response | "receivedItems: 24", "page: 2" |

**Pass Criteria**: ✅ Complete state flow traced in logs

---

### Test 10: No Stuck States
**Location**: Media picker modal

| Scenario | Action | Expected Result |
|----------|--------|-----------------|
| Dialog close mid-fetch | Navigate to page 2 → close dialog immediately | No errors, query cancels gracefully |
| Rapid open/close | Open modal → close → open → close (5x) | No stuck loaders, fresh data each time |
| Filter during pagination | On page 3 → change filter | Resets to page 1 with new results |
| Sort during pagination | On page 2 → change sort order | Resets to page 1 with new order |

**Pass Criteria**: ✅ No stuck, frozen, or error states

---

## Console Debugging Checklist

### Expected Console Output (Happy Path)

```javascript
// 1. PAGINATION CLICK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 PAGINATION CLICK DETECTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔹 Previous Page: 1
🔹 New Page: 2
🔹 Total Pages: 10
🔹 Timestamp: 2025-10-13T06:30:45.123Z
🔹 Action: Dispatching SET_CURRENT_PAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Page state updated - query should refetch

// 2. PARAMS BUILD
🔧 PAGINATION PARAMS BUILD: {
  selectionMode: true,
  currentPage: 2,
  page: "2",
  limit: "24",
  queryString: "sortBy=uploadedAt&sortOrder=desc&page=2&limit=24"
}

// 3. QUERY KEY
🔑 QUERY KEY: ["apimedia", "paginated", {page: 2, limit: 24, ...}]

// 4. SYNC MONITOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 PAGINATION SYNC MONITOR - MediaGrid
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔹 Props:
  - selectionMode: true
  - isStandalone: false
🔹 Frontend State:
  - currentPage: 2 (1-based)
  - totalPages: 10
🔹 API Request:
  - URL: /api/media?sortBy=uploadedAt&sortOrder=desc&page=2&limit=24
  - page param: 2 (sent to backend)
  - limit param: 24 (sent to backend)
🔹 Cache Key:
  - page: 2
  - limit: 24
  - queryKey: ["apimedia", "paginated", {...}]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 5. FETCH START
🌐 FETCH START: {
  url: "/api/media?sortBy=uploadedAt&sortOrder=desc&page=2&limit=24",
  page: "2",
  limit: "24",
  timestamp: "2025-10-13T06:30:45.456Z"
}

// 6. FETCH SUCCESS
✅ FETCH SUCCESS: {
  url: "/api/media?sortBy=uploadedAt&sortOrder=desc&page=2&limit=24",
  page: "2",
  receivedItems: 24,
  totalPages: 10,
  totalItems: 238,
  timestamp: "2025-10-13T06:30:45.789Z"
}

// 7. VISIBILITY CHECK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 PAGINATION VISIBILITY CHECK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔹 Mode:
  - selectionMode: true
  - isStandalone: false
🔹 Pagination State:
  - pagination.totalPages: 10
  - pagination.total: 238
  - pagination.page: 2
  - pagination.limit: 24
  - displayAssets.length: 24
  - totalAssets: 238
🔍 Visibility Logic:
  - OLD Condition: !selectionMode && totalPages > 1 ❌ (was hiding in modal)
  - NEW Condition: totalPages > 1 ✅ (shows in both standalone & modal)
  - totalPages > 1 = true (10 > 1)
  - shouldShowPagination = true
  - Will render pagination: ✅ YES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Regression Testing

After confirming pagination works, verify these still function:

- [ ] Media upload still works
- [ ] Media selection (single/multi) works
- [ ] Media deletion works
- [ ] Filters still work (type, search, folder)
- [ ] Sorting still works (name, date, size)
- [ ] Lightbox/viewer still opens
- [ ] Cache invalidation after mutations
- [ ] Standalone media library pagination
- [ ] Modal close/open doesn't leak memory

---

## Known Limitations & Future Enhancements

### Current Implementation
- ✅ Standard pagination (24 items per page)
- ✅ No debouncing (immediate fetch on click)
- ✅ 30-second cache staleness
- ✅ Automatic cache invalidation on mutations

### Possible Future Improvements
- 🔮 Virtual scrolling for very large datasets (1000+ items)
- 🔮 Infinite scroll option as alternative to pagination
- 🔮 Configurable page size (12/24/48 items)
- 🔮 Pagination state persistence across dialog re-opens
- 🔮 Prefetch next page on hover for faster UX

---

## Debugging Commands

If pagination fails, run these in browser console:

```javascript
// 1. Check current state
window.__MEDIA_LIBRARY_STATE__ // If exposed

// 2. Check React Query cache
queryClient.getQueryData(['apimedia', 'paginated', {page: 2, limit: 24}])

// 3. Force refetch
queryClient.refetchQueries({predicate: (query) => query.queryKey[0] === 'apimedia'})

// 4. Check network requests
performance.getEntriesByType('resource').filter(r => r.name.includes('/api/media'))

// 5. Inspect current page state
// (Add temporary console.log in setCurrentPage or use React DevTools)
```

---

## Sign-Off Checklist

Before considering pagination fix complete:

- [x] Issue #1 fixed: Pagination controls visible in modals
- [x] Issue #2 fixed: Pagination actually fetches different pages
- [x] Comprehensive logging added for debugging
- [x] Testing checklist created
- [x] Documentation updated
- [ ] All tests passed (run through checklist above)
- [ ] No regressions in other features
- [ ] Code reviewed
- [ ] Ready for production
