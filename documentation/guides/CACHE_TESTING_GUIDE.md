# Media Cache Synchronization Testing Guide
## Comprehensive Manual & Automated Testing Checklist

**Test Date:** October 2025  
**Purpose:** Verify 100% DB/API/UI synchronization with zero phantom entries

---

## 🎯 Success Criteria
- ✅ 100% match between Database, API, and UI
- ✅ Zero phantom entries after delete operations
- ✅ No duplication or lost records after mutations
- ✅ Pagination and filters always accurate
- ✅ Instant UI reflection across all pages and contexts

---

## 🤖 Automated Tests

### Access the Test Runner
1. Navigate to `/admin/test-runner` in your browser
2. Click "Run All Tests" button
3. Wait for test execution to complete
4. Review results dashboard

### Expected Test Coverage
1. **Upload → Database Storage → API Retrieval Flow**
   - File upload success
   - Database persistence verification
   - API list retrieval consistency

2. **Frontend Cache Invalidation After Upload**
   - Pre/post-invalidation cache state
   - Cache refresh behavior
   - Data consistency verification

3. **Admin Interface Data Refresh**
   - Initial data fetch
   - Admin component invalidation patterns
   - Query pattern compatibility

### Success Metrics
- All tests should pass (100% success rate)
- Cache invalidation < 50ms
- Data refetch < 200ms
- Data consistency rate: 100%

---

## 📋 Manual Test Scenarios

### Scenario 1: Rapid Media Upload Testing
**Objective:** Verify immediate UI reflection after multiple rapid uploads

#### Steps:
1. Navigate to `/admin/media`
2. Upload 3-5 images in rapid succession (< 5 seconds apart)
3. Observe the media grid during uploads

#### ✅ Pass Criteria:
- Each upload appears immediately in the grid (within 1-2 seconds)
- No duplicate entries appear
- Upload count matches number of files uploaded
- All uploads visible in pagination
- Thumbnail generation completes successfully

#### ❌ Fail Indicators:
- Uploads missing from grid
- Duplicate entries in different pages
- Stale cache showing old data
- Need to manually refresh browser to see uploads

---

### Scenario 2: Media Deletion Testing
**Objective:** Verify instant disappearance across all contexts

#### Steps:
1. Navigate to `/admin/media`
2. Note the current media count
3. Select a media item from the grid
4. Click delete and confirm
5. Immediately check:
   - Media grid (same page)
   - Navigate to different pagination page and back
   - Open media picker in Products page
   - Check media library in other admin sections

#### ✅ Pass Criteria:
- Deleted item disappears from grid immediately (< 1 second)
- Item removed from all pagination pages
- Item not visible in media pickers
- Total count decrements correctly
- No "phantom" entries that can be clicked but error out

#### ❌ Fail Indicators:
- Deleted item still visible in grid
- Item appears in some contexts but not others
- Clicking deleted item shows error
- Count doesn't update
- Ghost entries that disappear on page refresh

---

### Scenario 3: Pagination & Filter Testing
**Objective:** Verify cache accuracy during navigation

#### Steps:
1. Navigate to `/admin/media`
2. If less than 50 items, upload more to create multiple pages
3. Test sequence:
   a. Navigate to page 2
   b. Upload a new item
   c. Return to page 1
   d. Verify new item appears
   e. Delete an item from page 1
   f. Navigate to page 2
   g. Navigate back to page 1
   h. Verify item still deleted

#### ✅ Pass Criteria:
- New uploads appear on correct page (usually page 1)
- Deletions persist across page navigation
- Page counts update correctly
- No items appear on multiple pages
- Filters maintain accuracy after mutations

#### ❌ Fail Indicators:
- Stale data when navigating between pages
- Items appearing on wrong pages
- Inconsistent counts
- Filters showing outdated results

---

### Scenario 4: Multi-Context Synchronization
**Objective:** Verify mutations sync across all UI contexts

#### Test Setup:
1. Open media library in main tab (`/admin/media`)
2. Open products management in second tab (`/admin/products`)
3. Open categories in third tab (`/admin/categories`)

#### Steps:
1. In Tab 1 (Media): Upload a new image
2. In Tab 2 (Products): Open media picker
3. In Tab 3 (Categories): Open media picker

#### ✅ Pass Criteria:
- New upload visible in all media pickers immediately
- No need to close/reopen pickers
- Consistent data across all tabs
- Real-time synchronization

#### ❌ Fail Indicators:
- New upload missing from pickers
- Different data shown in different contexts
- Need to refresh tabs to see changes

---

### Scenario 5: Bulk Operations Testing
**Objective:** Verify cache handles batch operations correctly

#### Steps:
1. Navigate to `/admin/media`
2. Select 5-10 items using checkboxes
3. Perform bulk delete
4. Immediately observe:
   - Grid updates
   - Pagination changes
   - Total count
   - Navigate between pages

#### ✅ Pass Criteria:
- All selected items disappear immediately
- Count decreases by exact number deleted
- No partial deletions (all or nothing)
- Page structure updates correctly
- No phantom entries remain

#### ❌ Fail Indicators:
- Some items remain visible
- Inconsistent counts
- Items appear deleted but return on refresh
- Pagination broken after bulk delete

---

### Scenario 6: Edge Case Testing

#### Test 6a: Delete Last Item on Page
1. Navigate to last page of media
2. Delete all items on that page
3. Verify:
   - Redirects to previous page automatically
   - No empty page remains
   - Counts update correctly

#### Test 6b: Upload While Filtering
1. Apply a file type filter (e.g., "Images only")
2. Upload a new image
3. Verify new image appears in filtered view
4. Upload a different file type
5. Verify it doesn't appear in filtered view

#### Test 6c: Search + Mutation
1. Search for specific media
2. Delete a search result
3. Verify it disappears from search results
4. Clear search
5. Verify it's deleted from full list

---

## 🔍 Cache Debugging Checklist

If tests fail, check these debug points:

### Frontend Cache State
```javascript
// In browser console
window.__REACT_QUERY_DEVTOOLS__.cache
```

### Network Tab Inspection
1. Open DevTools > Network
2. Filter by "media"
3. Verify API responses match UI state
4. Check for 304 (cached) vs 200 (fresh) responses

### Query Key Inspection
```javascript
// Verify all media queries use 'apimedia' namespace
queryClient.getQueryCache().getAll()
  .filter(q => JSON.stringify(q.queryKey).includes('media'))
  .map(q => q.queryKey)
```

---

## 📊 Test Results Template

### Test Run: [Date/Time]
| Test Scenario | Status | Notes |
|--------------|--------|-------|
| Rapid Upload | ✅/❌ | |
| Single Delete | ✅/❌ | |
| Pagination | ✅/❌ | |
| Multi-Context Sync | ✅/❌ | |
| Bulk Operations | ✅/❌ | |
| Edge Cases | ✅/❌ | |

### Performance Metrics
- Cache invalidation time: ___ms
- UI update latency: ___ms
- API response time: ___ms

### Issues Found
1. [Issue description]
2. [Issue description]

---

## 🚀 Quick Smoke Test (2 minutes)

For rapid verification after changes:

1. **Upload** → Check immediate grid update ✅/❌
2. **Delete** → Check instant disappearance ✅/❌  
3. **Navigate pages** → Check data consistency ✅/❌
4. **Open picker** → Check latest data visible ✅/❌

If all 4 pass, cache synchronization is working correctly.

---

## 📝 Notes for Developers

### Query Key Standards (October 2025)
- ALL media queries MUST use `MediaQueryKeys` from `@/lib/media-query-keys`
- ALL mutations MUST call `invalidateMediaQueries(queryClient)`
- NO ad-hoc literal keys allowed (enforced in code review)

### Common Pitfalls to Avoid
1. Using literal query keys like `['/api/media']` instead of `MediaQueryKeys`
2. Forgetting to invalidate cache in mutation callbacks
3. Using ad-hoc query keys in individual components
4. Not testing multi-context synchronization

### Debug Commands
```typescript
// Force cache reset (emergency only)
import { forceResetMediaCache } from '@/lib/queryClient';
await forceResetMediaCache();

// Invalidate all media queries
import { invalidateMediaQueries } from '@/lib/media-query-keys';
invalidateMediaQueries(queryClient);
```

---

## ✅ Final Verification Checklist

Before marking cache synchronization as complete:

- [ ] All automated tests pass
- [ ] All manual scenarios pass
- [ ] No phantom entries observed
- [ ] Pagination always accurate
- [ ] Multi-context sync working
- [ ] Bulk operations work correctly
- [ ] Edge cases handled properly
- [ ] Performance metrics within acceptable range
- [ ] Code review standards documented
- [ ] Team trained on new patterns

---

**Last Updated:** October 13, 2025  
**Maintained By:** Development Team  
**Review Frequency:** After any cache-related changes
