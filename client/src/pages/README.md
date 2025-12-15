# Manufacturing Page Architecture

## Overview

Public-facing manufacturing page showcasing company's manufacturing capabilities, processes, and quality standards.

## Data Loading Strategy

### Optimization History

BEFORE (Legacy - DEPRECATED):

- 5 separate network requests
- Individual useQuery hooks for each section
- Total load time: ~1500ms
- Waterfall loading effect
- Poor cache efficiency

AFTER (Current - Optimized):

- Single batch endpoint: /api/manufacturing-batch
- Unified useQuery hook
- Total load time: ~400ms
- 73% performance improvement
- Efficient cache utilization

### Current Implementation

File: client/src/pages/manufacturing.tsx

Data Fetching:

```typescript
const { data, isLoading, error } = useQuery(
  ["manufacturing-batch"],
  async () => {
    const response = await fetch("/api/manufacturing-batch");
    if (!response.ok) throw new Error("Failed to fetch manufacturing data");
    return response.json();
  },
  {
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 30, // 30 minutes
  },
);
```

Batch Response Structure:

```typescript
{
  hero: { title, subtitle, description, imageUrl, ... },
  processes: [{ id, title, description, order, ... }],
  capabilities: [{ id, title, description, iconName, ... }],
  qualities: [{ id, title, description, ... }]
}
```

### Cache Configuration

staleTime (5 minutes):

- Manufacturing content changes infrequently
- Background refetch after 5 minutes while showing cached data
- Balances freshness with performance

cacheTime (30 minutes):

- Data kept in memory for 30 minutes after last use
- Instant loading for users navigating back to page
- Reduces server load

Cache Invalidation:

- Automatic: After staleTime expires (5 min)
- Manual: Admin updates trigger queryClient.invalidateQueries(['manufacturing-batch'])
- User-initiated: Hard refresh (Ctrl+F5) bypasses cache

### Performance Targets

Network:

- Single API request to /api/manufacturing-batch
- Response time: < 500ms (current: ~400ms)
- Payload size: < 100KB compressed
- Cache hit rate: > 80% on subsequent visits

Core Web Vitals:

- Time to First Byte (TTFB): < 200ms
- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 2.5s
- Cumulative Layout Shift (CLS): < 0.1

### Monitoring & Alerts

Performance Degradation Indicators:

- Batch API response > 1000ms: Investigate database query performance
- Cache hit rate < 70%: Review staleTime/cacheTime configuration
- TTI > 3s: Check for render blocking resources

### Component Structure

manufacturing.tsx
├── ManufacturingLoadingSkeleton (shown during isLoading)
├── ErrorBoundary (shown on error)
└── Loaded State:
├── PublicHeroSection (uses data.hero)
├── PublicProcessSection (uses data.processes)
├── PublicCapabilitySection (uses data.capabilities)
└── PublicQualitySection (uses data.qualities)

### Recent Changes

2025-12-09: Migrated from 5 separate queries to single batch endpoint (P1 Performance Optimization)
