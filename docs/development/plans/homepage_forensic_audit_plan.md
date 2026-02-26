# RUN APPAREL Homepage Forensic Audit - Investigation Plan

## Summary

This audit will conduct a comprehensive forensic-level investigation of the RUN APPAREL homepage, including both the frontend visitor interface and CMS admin control page. The investigation will use automated code analysis, runtime testing, and systematic investigation to discover technical issues, generate visual documentation with Mermaid diagrams, and provide a scored assessment with actionable fixes aligned with RUN Remix standards.

## Investigation Phases

### Phase 1: Discovery & System Mapping (COMPLETED)

**Status:** ✅ Completed

**Findings:**
- **Project Location:** `/Users/hateemjamshaid/Documents/RUN-Remix`
- **Architecture:** RUN Remix monorepo (client + server)
- **Tech Stack:** React 19, Vite 7, Tailwind V4, Express 5, Node.js ≥24
- **Port:** 5002 (confirmed)

**Frontend Homepage Files:**
- Route: `client/app/routes/_index.tsx` (homepage route)
- Data Hook: `client/app/hooks/use-homepage-data.ts` (fetches from `/api/homepage-batch`)
- Components: `client/app/components/homepage/` (dedicated directory)
- Theme Provider: `client/app/components/shared/theme-provider.tsx`

**CMS Admin Interface:**
- Route: `/admin/:module` dynamic routing in `client/app/routes.ts`
- Homepage Management: `client/app/components/admin/homepage-management.tsx`
- Admin Tabs:
  - `HomepageHeroTab.tsx` - Hero section editing
  - `HomepageSlogansTab.tsx` - Slogans editing
  - `HomepageProcessCardsTab.tsx` - Process cards editing
  - `HomepageSectionsTab.tsx` - Sections editing
  - `HomepageFeaturedTab.tsx` - Featured products editing

**Server API Routes:**
- Batch endpoint: `server/routes/resources/homepage-batch.routes.ts` (two-tier cache: 3min L1, 30min L2)
- CRUD endpoints: `server/routes/resources/homepage-management.routes.ts` (180-min TTL)

**Database Schema:**
- Tables: `homepageHero`, `homepageSections`, `homepageSlogans`, `homepageProcessCards`, `homepageSustainability`, `homepageFeaturedProductsSettings`
- Location: `server/migrations/schema.ts`

---

### Phase 2: Build Verification (NEXT)

**Command Execution Required:**
```bash
cd /Users/hateemjamshaid/Documents/RUN-Remix

# 2.1 TypeScript & Build Validation
npm run build 2>&1 | tee build-output.txt

# 2.2 Linting & Code Standards
npm run lint 2>&1 | tee lint-output.txt

# 2.3 Test Execution
npm run test 2>&1 | tee test-output.txt

# 2.4 Dependency Audit
npm audit 2>&1 | tee audit-output.txt
```

**Success Criteria:**
- ✅ Build completes without errors
- ✅ No TypeScript 'any' types detected
- ✅ Biome linting passes
- ✅ All tests pass with >80% coverage
- ✅ No critical vulnerabilities in dependencies

---

### Phase 3: Code Analysis - Frontend Homepage

**Files to Analyze:**
1. `client/app/routes/_index.tsx` - Main homepage route
2. `client/app/hooks/use-homepage-data.ts` - Data fetching hook
3. `client/app/components/homepage/*.tsx` - Homepage components

**Analysis Criteria:**
- ✅ React 19 compliance (no forwardRef)
- ✅ TypeScript strict mode (no 'any')
- ✅ Tailwind V4 patterns (CVA + cn())
- ✅ Dark/light mode implementation
- ✅ useEffect cleanup (no memory leaks)
- ✅ Accessibility features (ARIA, keyboard nav)

---

### Phase 4: Code Analysis - CMS Admin Page

**Files to Analyze:**
1. `client/app/components/admin/homepage-management.tsx`
2. `client/app/components/admin/homepage/*.tsx` (all tabs)
3. `server/routes/resources/homepage-management.routes.ts`
4. `server/lib/db/repositories/page-content-repository.ts`

**Analysis Criteria:**
- ✅ Zod validation schemas
- ✅ Error handling
- ✅ Admin-frontend data mapping
- ✅ Cache invalidation logic

---

### Phase 5: Runtime Analysis

**Commands to Execute:**
```bash
# 5.1 Page Load Testing
curl -I http://localhost:5002
time curl -s http://localhost:5002 > /dev/null

# 5.2 API Testing
curl http://localhost:5002/api/homepage-batch

# 5.3 Bundle Analysis (post-build)
ls -lh dist/assets/*.js
```

---

### Phase 6: Pattern Detection

**Search Patterns:**
```bash
# 6.1 Duplicate Code
find ./client/app/components -name "*.tsx" | xargs md5sum | sort | uniq -w32 -dD

# 6.2 Legacy Patterns
grep -rn "forwardRef" ./client
grep -rn ": any" ./client ./server

# 6.3 Memory Leaks
grep -rn "setInterval\|setTimeout" ./client --include="*.tsx" --include="*.ts"
grep -A 5 "useEffect" ./client/app/routes/_index.tsx

# 6.4 Dark Mode Issues
grep -rn "className=" ./client/app/routes/_index.tsx | grep -v "dark:"
```

---

### Phase 7: Database Schema Analysis

**Documentation Required:**
- ER diagram for homepage tables
- Foreign key relationships
- Index identification
- Data flow from CMS to frontend

---

### Phase 8: Report Generation

**Deliverables:**
1. `homepage_audit_report.md` - Full audit report
2. 5+ Mermaid diagrams embedded:
   - Architecture diagram
   - Data flow sequence diagram
   - Component dependency graph
   - Database ER diagram
   - Issue distribution charts

---

## Files to Examine

### Frontend Homepage
- `client/app/routes/_index.tsx` - Main route (GSAP, Lenis smooth scrolling)
- `client/app/hooks/use-homepage-data.ts` - React Query hook
- `client/app/components/homepage/` - Homepage components
- `client/app/components/shared/theme-provider.tsx` - Theme context

### CMS Admin
- `client/app/routes.ts` - Routing configuration
- `client/app/components/admin/homepage-management.tsx` - Main container
- `client/app/components/admin/homepage/*.tsx` - Admin tabs
- `client/app/hooks/use-admin-homepage-mutations.ts` - Admin mutations

### Backend
- `server/routes/resources/homepage-batch.routes.ts` - Batch API
- `server/routes/resources/homepage-management.routes.ts` - CRUD API
- `server/lib/db/repositories/page-content-repository.ts` - Repository
- `server/migrations/schema.ts` - Database schema

---

## Tools to Use

| Tool | Purpose |
|------|---------|
| `npm run build` | TypeScript validation |
| `npm run lint` | Biome code quality |
| `npm run test` | Test execution |
| `npm audit` | Vulnerability check |
| `curl` | Runtime testing |
| `grep/find` | Code pattern search |
| `cat/less` | File reading |

---

## Risks/Considerations

1. **CMS Admin Path:** Already discovered via dynamic routing `/admin/:module`
2. **Database Access:** Schema located in migrations, actual DB is Neon PostgreSQL
3. **Runtime Testing:** Requires localhost:5002 to be running
4. **Complexity:** Large codebase with multiple layers (client, server, database)

---

## Expected Deliverables

1. **Audit Report** (`homepage_audit_report.md`)
   - Executive summary with scores
   - Per-category assessments
   - Priority action plan
   - Before/after code examples

2. **Mermaid Diagrams:**
   - System architecture graph
   - Data flow sequence diagram
   - Component dependency graph
   - Database ER diagram
   - Issue distribution pie charts
   - Fix timeline Gantt chart

3. **Scoring:**
   - Overall score (0-100)
   - Per-category scores (UI/UX, Dark Mode, Performance, CMS Integration, Code Quality, TypeScript, Accessibility)

---

## Investigation Plan Approval

**STATUS:** Ready for execution

**Next Steps:**
1. User approves plan
2. Switch to Code mode to execute verification commands
3. Analyze discovered code
4. Generate final audit report

---

**Created:** 2026-02-15  
**Mode:** Architect  
**Project:** RUN APPAREL (PVT) LTD  
**Contact:** team@wear-run.com | +92-336-1777313
