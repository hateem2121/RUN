# React Query State Propagation - Admin to User Page

## Overview
This document traces how media selection in the admin panel propagates to the user-facing homepage using **React Query cache invalidation**.

## Propagation Mechanism: React Query

### Architecture
- **State Management**: React Query (TanStack Query v5)
- **Propagation Method**: Cache invalidation triggers automatic refetch
- **No Context/Redux**: Pure server-state synchronization via React Query

## Complete Propagation Flow

### STEP 1: Admin Selects Media
**File**: `HomepageHeroManager.tsx`
- User selects background image in modal
- Form state updates: `heroForm.backgroundImageId = <selected_id>`
- State is LOCAL until user clicks "Save"

### STEP 2: Admin Saves Changes
**File**: `HomepageHeroManager.tsx` → `handleSaveHero()`
```typescript
const updateHeroMutation = useMutation({
  mutationFn: async (data) => {
    return await apiRequest("PATCH", "/api/homepage-hero", data);
  },
  onSuccess: (data) => {
    // CRITICAL: Invalidate React Query cache
    queryClient.invalidateQueries({ queryKey: ["/api/homepage-hero"] });
    queryClient.invalidateQueries({ queryKey: ["/api/homepage-batch"] });
  }
});
```

**Logs**:
```
🎉 [STEP 5: MUTATION SUCCESS] Hero saved to database
🔄 [CACHE INVALIDATION] Invalidating React Query cache keys
✅ [CACHE INVALIDATION] Invalidated: ["/api/homepage-hero"]
✅ [CACHE INVALIDATION] Invalidated: ["/api/homepage-batch"]
🔔 [REACT QUERY] This triggers automatic refetch
```

### STEP 3: Backend Persists Data
**File**: `server/routes/modules/homepage-management-routes.ts`
- PATCH request updates database
- Sets `backgroundImageId` in `homepage_hero` table
- Backend also invalidates server-side cache

### STEP 4: React Query Auto-Refetch
**Trigger**: Cache invalidation from STEP 2

React Query automatically:
1. Marks cached data as stale
2. Triggers refetch for all components using those query keys
3. Updates component state with fresh data

### STEP 5: Homepage Receives Updated Data
**File**: `homepage.tsx`
```typescript
const { data: batchData } = useQuery<HomepageBatchData>({
  queryKey: ["/api/homepage-batch"],  // Matches invalidated key!
  staleTime: 30 * 1000,
});
```

When cache is invalidated, React Query:
- Detects stale data
- Fetches from `/api/homepage-batch`
- Receives updated `hero.backgroundImageId`
- Re-renders component with new data

**Logs**:
```
📥 [STEP 6: HOMEPAGE BATCH] Hero data fetched from API
🔹 Query key: ["/api/homepage-batch"]
🔹 Hero ID: 1
🔹 backgroundImageId: <new_id>
⏭️  NEXT: Component will render with this background image ID
```

### STEP 6: Media Loader Fetches Asset
**File**: `homepage-media-loader.ts`
```typescript
useHomepageMediaLoader(
  heroBackgroundId,  // New ID from refetched hero data
  // ...
)
```

**Logs**:
```
📥 [MEDIA LOADER HOOK] useHomepageMediaLoader called
🔹 heroMediaId: <new_id>
```

### STEP 7: Hero Component Renders
**File**: `scroll-responsive-hero.tsx`
```typescript
const heroMediaAsset = heroBackgroundId ? getAssetById(heroBackgroundId) : null;
```

**Logs**:
```
🎨 [STEP 7: HERO RENDER] Hero component rendering with media
🔹 Media asset ID: <new_id>
🔹 Media asset URL: <url>
✅ SUCCESS: Complete data flow from modal → admin → backend → database → user page
```

## Key Cache Invalidation Points

### Admin Side Invalidates:
```typescript
queryClient.invalidateQueries({ queryKey: ["/api/homepage-hero"] });
queryClient.invalidateQueries({ queryKey: ["/api/homepage-batch"] });
```

### User Side Listens:
```typescript
useQuery({ queryKey: ["/api/homepage-batch"] })  // Matches!
```

## Why This Works

### 1. **Automatic Refetch**
React Query automatically refetches when:
- Cache is invalidated via `queryClient.invalidateQueries()`
- Component using that query key is mounted
- Window is refocused (configurable)

### 2. **Shared Query Client**
Both admin and user pages use the **same** `queryClient` instance:
```typescript
// client/src/lib/queryClient.ts
export const queryClient = new QueryClient();
```

This ensures invalidation in admin affects queries in user pages.

### 3. **No Stale Closures**
React Query manages subscriptions internally:
- No closure issues
- No stale snapshot bugs
- Always fetches latest data

### 4. **Cross-Component Sync**
When admin invalidates `["/api/homepage-batch"]`:
- ALL components using this key refetch
- Homepage gets updated data
- No manual state propagation needed

## Testing the Flow

### Manual Test:
1. Open Admin → Homepage Management
2. Select background image → Save
3. Watch console for invalidation logs
4. Navigate to homepage `/`
5. Should see refetch logs (STEP 6)
6. New background should display

### Expected Console Output:
```
[ADMIN] 🎉 MUTATION SUCCESS
[ADMIN] 🔄 CACHE INVALIDATION
[ADMIN] ✅ Invalidated: ["/api/homepage-batch"]
[HOMEPAGE] 📥 HOMEPAGE BATCH - Hero data fetched
[HOMEPAGE] 🔹 backgroundImageId: <new_id>
[HOMEPAGE] 🎨 HERO RENDER - with new media
```

## Potential Issues & Debugging

### Issue: User page shows stale data
**Check**:
1. Are query keys identical?
   - Admin: `queryClient.invalidateQueries({ queryKey: ["/api/homepage-batch"] })`
   - User: `useQuery({ queryKey: ["/api/homepage-batch"] })`
2. Is `staleTime` too high? (currently 30s)
3. Is query client shared across both pages?

### Issue: Refetch not triggering
**Check**:
1. Console for invalidation logs
2. Network tab for API calls
3. React Query DevTools to see query status

### Issue: New data not rendering
**Check**:
1. Is component using correct property? (`backgroundImageId` not `backgroundMediaId`)
2. Does media loader receive new ID?
3. Does `getAssetById()` find the asset?

## Success Criteria ✅

- [x] Admin mutation invalidates correct query keys
- [x] Homepage query key matches invalidated key
- [x] Shared query client instance
- [x] Refetch triggers automatically
- [x] New data propagates to UI
- [x] No manual state management needed
- [x] Complete trace via console logs

## Architecture Benefits

1. **Declarative**: No manual state updates
2. **Type-Safe**: TypeScript ensures correct data flow
3. **Debuggable**: Clear console logs at each step
4. **Maintainable**: Single source of truth (server)
5. **Performant**: Automatic caching & deduplication
