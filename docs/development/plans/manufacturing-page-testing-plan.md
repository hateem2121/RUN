# Manufacturing Page Testing Plan

## Summary
Comprehensive end-to-end testing for the Manufacturing page to ensure CMS updates reflect immediately on the public page with proper cache invalidation. This plan covers API endpoints, admin CMS components, public-facing components, and full E2E integration tests.

## Architecture Overview

```mermaid
flowchart TB
    subgraph Admin CMS
        HM[HeroManagement]
        PM[ProcessManagement]
        CM[CapabilityManagement]
        QM[QualityManagement]
    end

    subgraph API Layer
        HERO[/api/manufacturing-hero]
        PROC[/api/manufacturing-processes]
        CAP[/api/manufacturing-capabilities]
        QUAL[/api/manufacturing-qualities]
    end

    subgraph Cache Layer
        TC[Two-Tier Cache]
        CI[Cache Invalidation]
    end

    subgraph Public Page
        PHS[PublicHeroSection]
        PPS[PublicProcessSection]
        PCS[PublicCapabilitySection]
        PQS[PublicQualitySection]
    end

    HM --> HERO
    PM --> PROC
    CM --> CAP
    QM --> QUAL

    HERO --> CI
    PROC --> CI
    CAP --> CI
    QUAL --> CI

    CI --> TC

    TC --> PHS
    TC --> PPS
    TC --> PCS
    TC --> PQS
```

## Files to Create

### API Endpoint Tests
- `tests/unit/api/manufacturing-hero.test.ts` - Hero API endpoint tests
- `tests/unit/api/manufacturing-processes.test.ts` - Processes CRUD + reorder tests
- `tests/unit/api/manufacturing-capabilities.test.ts` - Capabilities CRUD tests
- `tests/unit/api/manufacturing-qualities.test.ts` - Qualities CRUD tests

### Admin CMS Component Tests
- `tests/unit/components/admin/HeroManagement.test.tsx` - Hero CMS form tests
- `tests/unit/components/admin/ProcessManagement.test.tsx` - Process CMS tests with DnD
- `tests/unit/components/admin/CapabilityManagement.test.tsx` - Capability CMS tests
- `tests/unit/components/admin/QualityManagement.test.tsx` - Quality CMS tests

### Public Component Tests
- `tests/unit/components/public/PublicHeroSection.test.tsx` - Hero rendering tests
- `tests/unit/components/public/PublicProcessSection.test.tsx` - Process rendering tests
- `tests/unit/components/public/PublicCapabilitySection.test.tsx` - Capability rendering tests
- `tests/unit/components/public/PublicQualitySection.test.tsx` - Quality rendering tests

### Integration Tests
- `tests/integration/manufacturing-cms-to-page.test.ts` - Full CMS-to-Page data flow
- `tests/integration/manufacturing-cache-invalidation.test.ts` - Cache invalidation verification

### E2E Tests
- `e2e/manufacturing-cms-e2e.spec.ts` - Full user flow E2E test

## Test Details

### 1. API Endpoint Tests

#### Hero API Tests - `manufacturing-hero.test.ts`
```typescript
describe('Manufacturing Hero API', () => {
  // GET /api/manufacturing-hero
  it('returns hero data with correct cache headers')
  it('returns null when no hero exists')
  it('handles production cache headers correctly')

  // PATCH /api/manufacturing-hero
  it('updates hero with valid data')
  it('requires admin authentication')
  it('validates input with Zod schema')
  it('invalidates cache after update')
  it('returns validation errors for invalid data')
})
```

#### Processes API Tests - `manufacturing-processes.test.ts`
```typescript
describe('Manufacturing Processes API', () => {
  // GET /api/manufacturing-processes
  it('returns all processes with cache hit headers')
  it('supports admin cache bypass via nocache query')

  // POST /api/manufacturing-processes
  it('creates new process with valid data')
  it('requires admin authentication')
  it('invalidates two-tier cache after creation')

  // PATCH /api/manufacturing-processes/:id
  it('updates existing process')
  it('returns 404 for non-existent process')

  // DELETE /api/manufacturing-processes/:id
  it('deletes process and invalidates cache')

  // PATCH /api/manufacturing-processes/reorder
  it('reorders processes with valid position array')
  it('validates reorder input schema')
})
```

### 2. Admin CMS Component Tests

#### HeroManagement Tests
```typescript
describe('HeroManagement', () => {
  it('renders loading state while fetching hero')
  it('populates form with existing hero data')
  it('submits form with updated headline and subheadline')
  it('opens background media picker dialog')
  it('opens video media picker dialog')
  it('clears selected background media')
  it('clears selected video')
  it('toggles isActive switch')
  it('shows success toast on successful update')
  it('shows error toast on failed update')
  it('updates bottom CTA fields')
})
```

#### ProcessManagement Tests
```typescript
describe('ProcessManagement', () => {
  it('renders empty state when no processes exist')
  it('renders list of existing processes')
  it('opens create dialog when Add Process clicked')
  it('creates new process with form data')
  it('opens edit dialog with process data')
  it('updates existing process')
  it('deletes process with confirmation')
  it('supports drag-and-drop reordering')
  it('shows live preview when enabled')
  it('selects process media via media picker')
  it('removes individual media items')
  it('validates required form fields')
})
```

### 3. Public Component Tests

#### PublicHeroSection Tests
```typescript
describe('PublicHeroSection', () => {
  it('renders hero headline and subheadline')
  it('renders CTA button with correct link')
  it('displays stats with icons')
  it('renders background media when provided')
  it('renders video when provided')
  it('handles missing hero data gracefully')
  it('applies correct dark theme styling')
})
```

#### PublicProcessSection Tests
```typescript
describe('PublicProcessSection', () => {
  it('renders all active processes')
  it('displays process steps in order')
  it('shows efficiency percentage for each process')
  it('displays process duration')
  it('renders process media/images')
  it('filters out inactive processes')
  it('handles empty processes array')
})
```

### 4. Integration Tests

#### CMS-to-Page Data Flow
```typescript
describe('Manufacturing CMS-to-Page Integration', () => {
  it('updates hero in CMS and reflects on public page', async () => {
    // 1. Update hero via CMS API
    // 2. Fetch public page data
    // 3. Verify updated content appears
  })

  it('creates process in CMS and appears on public page', async () => {
    // 1. Create process via API
    // 2. Fetch public processes
    // 3. Verify new process appears
  })

  it('reorders processes and reflects new order on page', async () => {
    // 1. Reorder processes via API
    // 2. Fetch public processes
    // 3. Verify new order
  })

  it('deletes process and removes from public page', async () => {
    // 1. Delete process via API
    // 2. Fetch public processes
    // 3. Verify process removed
  })
})
```

#### Cache Invalidation Tests
```typescript
describe('Manufacturing Cache Invalidation', () => {
  it('invalidates manufacturing cache on hero update')
  it('invalidates two-tier cache on process creation')
  it('invalidates cache on process update')
  it('invalidates cache on process deletion')
  it('invalidates cache on process reorder')
  it('verifies X-Cache-Hit header changes after invalidation')
})
```

### 5. E2E Tests

#### Full User Flow
```typescript
describe('Manufacturing Page E2E', () => {
  it('admin can update hero and see changes on public page', async () => {
    // 1. Login as admin
    // 2. Navigate to manufacturing CMS
    // 3. Update hero headline
    // 4. Save changes
    // 5. Navigate to public manufacturing page
    // 6. Verify updated headline appears
  })

  it('admin can create, edit, delete processes', async () => {
    // Full CRUD flow with visual verification
  })

  it('public page loads with cached data', async () => {
    // Verify cache headers and performance
  })
})
```

## Testing Approach

### Phase 1: API Layer Testing
1. Start with API endpoint tests using Vitest
2. Mock database layer for unit tests
3. Use test database for integration tests
4. Verify Zod validation schemas
5. Test authentication middleware

### Phase 2: Component Testing
1. Test admin CMS components with React Testing Library
2. Mock API calls with MSW or vi.fn()
3. Test form validation and submission
4. Test drag-and-drop with DnD Kit test utilities
5. Test media picker integration

### Phase 3: Public Component Testing
1. Test rendering with various data states
2. Test with missing/null data
3. Verify accessibility attributes
4. Test responsive behavior

### Phase 4: Integration Testing
1. Test full data flow from CMS to public page
2. Verify cache invalidation works correctly
3. Test with real database (test instance)
4. Verify React Query cache updates

### Phase 5: E2E Testing
1. Use Playwright for full user flow tests
2. Test admin authentication flow
3. Verify visual rendering
4. Test performance metrics

## Risks and Considerations

### Technical Risks
- **Cache Timing**: Two-tier cache may have race conditions
  - Mitigation: Add delays in tests to account for cache propagation
- **DnD Testing**: Drag-and-drop can be flaky in tests
  - Mitigation: Use DnD Kit's test utilities, avoid full drag simulation
- **Media Picker**: Complex dialog interactions
  - Mitigation: Mock media picker responses, test in isolation

### Test Data Management
- Use factory functions for test data
- Clean up test database between tests
- Use transactions for rollback in integration tests

### Coverage Targets
- API Routes: 85%+
- Admin Components: 80%+
- Public Components: 75%+
- Integration Tests: Critical paths covered

## Verification Commands

```bash
# Run all manufacturing tests
npm run test -- --grep manufacturing

# Run with coverage
npm run test -- --coverage --grep manufacturing

# Run E2E tests
npx playwright test e2e/manufacturing-cms-e2e.spec.ts

# Verify tech integrity
npm run verify:tech-integrity
```

## Success Criteria

1. All API endpoints have comprehensive tests
2. Admin CMS components handle all user interactions
3. Public components render correctly with all data states
4. Cache invalidation is verified to work correctly
5. E2E tests pass consistently
6. Coverage targets are met
7. No TypeScript errors in test files
8. All tests follow RUN Remix naming conventions
