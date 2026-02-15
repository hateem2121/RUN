---
name: writing-plans
description: Use this skill when planning complex tasks that require multiple files, architecture changes, or coordination. Use this for creating detailed implementation plans before coding.
---

# Writing Plans

## Goal

Create comprehensive, actionable implementation plans that clearly communicate the approach, risks, and success criteria for complex development tasks before any code is written.

## Instructions

### Phase 1: Task Analysis

1. **Understand the Request**
   - What is being built or changed?
   - Why is this needed? (Business context)
   - Who will use this? (User context)
   - What are the constraints? (Technical context)

2. **Assess Complexity**
   - Simple (<100 lines, single file) → Implement directly
   - Complex (>100 lines, multiple files, architecture) → **PLAN FIRST**

3. **Identify Stakeholders**
   - Who needs to approve this plan?
   - Who will implement this?
   - Who will be affected by this change?

### Phase 2: Research & Discovery

1. **Explore Existing Code**
   - Search for similar patterns in codebase
   - Identify files that will be affected
   - Note any dependencies or integrations

2. **Check Documentation**
   - Review `docs/overview.md` for architecture context
   - Check `docs/core/architecture.md` for patterns
   - Review relevant skill files

3. **Identify Risks**
   - Breaking changes?
   - Performance implications?
   - Security considerations?
   - Data migration needed?

### Phase 3: Plan Structure

Use this template for all implementation plans:

```markdown
# Implementation Plan: [Feature Name]

## Summary
[2-3 sentence overview of what will be built and why]

## Files to Create/Modify
- `path/to/file1.tsx` - [What changes and why]
- `path/to/file2.ts` - [What changes and why]
- `path/to/file3.test.ts` - [Test coverage]

## Approach
1. [High-level step 1]
2. [High-level step 2]
3. [High-level step 3]
4. [Integration and testing]

## Risks/Considerations
- [Potential issue 1 and mitigation]
- [Breaking change warning if applicable]
- [Performance considerations]
- [Security implications]

## Success Criteria
- [ ] TypeScript builds without errors (`npm run build`)
- [ ] All tests pass with >80% coverage (`npm run test`)
- [ ] No console errors in browser
- [ ] Feature works as expected
- [ ] Biome linting passes
- [ ] [Feature-specific criteria]

## Rollback Plan
[How to undo changes if something goes wrong]
```

### Phase 4: Detailed Planning

1. **Files Section**
   - List every file that will be created or modified
   - Explain what changes and why for each file
   - Include test files
   - Order by implementation sequence

2. **Approach Section**
   - Break down into logical steps
   - Each step should be actionable
   - Include testing in the approach
   - Consider edge cases

3. **Risks Section**
   - Be honest about potential issues
   - Provide mitigation strategies
   - Highlight breaking changes prominently
   - Consider performance and security

4. **Success Criteria**
   - Must be measurable and verifiable
   - Include standard quality gates
   - Add feature-specific criteria
   - Define what "done" looks like

5. **Rollback Plan**
   - How to undo changes
   - Database rollback if applicable
   - Feature flags for gradual rollout

### Phase 5: Review & Refine

1. **Self-Review**
   - Is the plan complete?
   - Are all files accounted for?
   - Is the approach clear?
   - Are risks properly addressed?

2. **Stakeholder Review**
   - Present plan for approval
   - Address feedback
   - Update plan as needed

3. **Finalize**
   - Save plan to `plans/` directory
   - Get explicit approval before implementing

## Examples

### Example 1: Feature Implementation Plan

```markdown
# Implementation Plan: Product Search with Filters

## Summary
Implement a search feature for the product catalog with filtering by category, price range, and sustainability certifications. This enables B2B buyers to quickly find products matching their requirements.

## Files to Create/Modify
- `server/services/searchService.ts` - New service for search logic and filtering
- `server/routes/search.ts` - New API endpoints for search
- `shared/types/search.ts` - TypeScript types for search requests/responses
- `shared/validators/search.ts` - Zod schemas for search input validation
- `client/app/components/products/ProductSearch.tsx` - Search UI component
- `client/app/components/products/SearchFilters.tsx` - Filter panel component
- `client/app/pages/ProductsPage.tsx` - Integrate search into products page
- `server/services/searchService.test.ts` - Unit tests for search service
- `client/app/components/products/ProductSearch.test.tsx` - Component tests

## Approach
1. **Define Types and Validation** (shared/types/search.ts, shared/validators/search.ts)
   - Create SearchRequest, SearchResponse, FilterOptions types
   - Create Zod schemas for input validation
   - Export for use in both client and server

2. **Implement Search Service** (server/services/searchService.ts)
   - Create searchProducts() function with filtering logic
   - Implement pagination for large result sets
   - Add caching for popular searches using Redis
   - Write unit tests

3. **Create API Endpoints** (server/routes/search.ts)
   - POST /api/search - Main search endpoint
   - GET /api/search/filters - Get available filter options
   - Integrate validation middleware

4. **Build Search UI** (client/app/components/products/)
   - ProductSearch component with search input
   - SearchFilters component with category, price, certification filters
   - Integrate with TanStack Query for data fetching

5. **Integration** (client/app/pages/ProductsPage.tsx)
   - Add search to products page
   - Handle URL params for shareable searches
   - Add loading and error states

6. **Testing**
   - Unit tests for searchService
   - Component tests for ProductSearch
   - Integration test for full search flow

## Risks/Considerations
- **Performance**: Search on large catalogs may be slow → Add database indexes on searchable fields, implement caching
- **Breaking Change**: None - This is a new feature
- **Security**: Search input must be sanitized → Use Zod validation, parameterized queries
- **UX**: Too many filters may overwhelm users → Start with essential filters, add advanced options progressively

## Success Criteria
- [ ] TypeScript builds without errors (`npm run build`)
- [ ] All tests pass with >80% coverage (`npm run test`)
- [ ] Search returns relevant results within 500ms
- [ ] Filters work correctly for all combinations
- [ ] URL params allow shareable searches
- [ ] Mobile-responsive search UI
- [ ] Biome linting passes
- [ ] No console errors in browser

## Rollback Plan
Feature is additive with no breaking changes. If issues arise:
1. Remove search routes from server
2. Remove search components from products page
3. No database changes to rollback
```

### Example 2: Refactoring Plan

```markdown
# Implementation Plan: Extract Authentication Logic to Service Layer

## Summary
Refactor authentication logic from route handlers into a dedicated authService. This improves testability, reduces code duplication, and follows the service-based architecture pattern.

## Files to Create/Modify
- `server/services/authService.ts` - New service with authentication logic
- `server/routes/auth.ts` - Simplify routes to delegate to service
- `server/middleware/auth.ts` - Update to use authService
- `server/services/authService.test.ts` - Comprehensive service tests
- `server/routes/auth.test.ts` - Update route tests

## Approach
1. **Create AuthService** (server/services/authService.ts)
   - Extract login logic from routes
   - Extract registration logic from routes
   - Extract token validation logic
   - Add proper error handling with custom errors

2. **Update Routes** (server/routes/auth.ts)
   - Replace inline logic with authService calls
   - Keep routes thin (only request/response handling)
   - Maintain same API contract

3. **Update Middleware** (server/middleware/auth.ts)
   - Use authService for token validation
   - Remove duplicate JWT handling code

4. **Testing**
   - Write comprehensive tests for authService
   - Update route tests to mock service
   - Ensure same behavior as before

## Risks/Considerations
- **Breaking Change**: None - Internal refactoring only, API contract unchanged
- **Testing**: Must ensure same behavior → Comprehensive test suite before and after
- **Performance**: Should be identical → Benchmark before/after

## Success Criteria
- [ ] TypeScript builds without errors
- [ ] All existing tests still pass
- [ ] New service tests achieve 90%+ coverage
- [ ] No changes to API behavior
- [ ] Routes are thin (only call service and return response)
- [ ] Biome linting passes

## Rollback Plan
Git revert to previous commit. No database or config changes.
```

### Example 3: Database Migration Plan

```markdown
# Implementation Plan: Add Product Customization Fields

## Summary
Add support for product customization options (embroidery, printing) to the product schema. This enables B2B clients to specify custom branding on products.

## Files to Create/Modify
- `shared/schema.ts` - Add customization tables to Drizzle schema
- `server/services/productService.ts` - Add customization methods
- `server/routes/products.ts` - Add endpoints for customization
- `client/app/components/products/CustomizationOptions.tsx` - UI for customization
- `server/migrations/add_customization.ts` - Database migration script

## Approach
1. **Schema Design** (shared/schema.ts)
   - Create `product_customizations` table
   - Create `customization_options` table
   - Add relationships to products table

2. **Migration Script** (server/migrations/add_customization.ts)
   - Write migration to add new tables
   - Include rollback migration
   - Test on staging database first

3. **Service Layer** (server/services/productService.ts)
   - Add getCustomizationOptions()
   - Add updateProductCustomization()
   - Add validation for customization data

4. **API Endpoints** (server/routes/products.ts)
   - GET /api/products/:id/customizations
   - PUT /api/products/:id/customizations

5. **UI Component** (client/app/components/products/CustomizationOptions.tsx)
   - Build customization selection UI
   - Handle file uploads for logos
   - Preview customization

## Risks/Considerations
- **Breaking Change**: Schema change requires migration → Run during low-traffic period
- **Data Integrity**: Existing products need default values → Add migration to set defaults
- **Performance**: New tables may affect queries → Add proper indexes
- **Rollback**: Database rollback required if issues → Keep migration reversible

## Success Criteria
- [ ] Migration runs successfully on staging
- [ ] TypeScript builds without errors
- [ ] All tests pass
- [ ] Existing products still work
- [ ] Customization UI is functional
- [ ] Database indexes created
- [ ] Biome linting passes

## Rollback Plan
1. Run down migration: `npm run db:rollback`
2. Revert code changes
3. Clear any cached customization data
```

## Plan Quality Checklist

```markdown
## Completeness
- [ ] Summary clearly explains what and why
- [ ] All files listed with explanations
- [ ] Approach has clear, sequential steps
- [ ] Risks are identified with mitigations
- [ ] Success criteria are measurable
- [ ] Rollback plan exists

## Clarity
- [ ] Another developer could implement from this plan
- [ ] Technical terms are explained
- [ ] Dependencies are noted
- [ ] Edge cases are considered

## Alignment
- [ ] Follows RUN Remix architecture patterns
- [ ] Uses correct tech stack (React 19, Express 5, etc.)
- [ ] Follows naming conventions
- [ ] Places files in correct directories

## Risk Assessment
- [ ] Breaking changes are highlighted
- [ ] Security implications considered
- [ ] Performance impact assessed
- [ ] Data migration needs identified
```

## Constraints

- **NEVER** skip planning for complex tasks
- **NEVER** implement before plan is approved
- **NEVER** omit the rollback plan
- **ALWAYS** list all affected files
- **ALWAYS** include test files
- **ALWAYS** get explicit approval before implementing

## Anti-Gravity Alignment

- **B.L.A.S.T. Methodology**: Planning is the Blueprint (B) phase
- **Progressive Disclosure**: Core template here; detailed examples in `references/`
- **Quality Gates**: Plan approval is a quality gate

## Related Skills

- `executing-plans` - Implement approved plans
- `verification-before-completion` - Verify implementation
- `test-driven-development` - Write tests during implementation
