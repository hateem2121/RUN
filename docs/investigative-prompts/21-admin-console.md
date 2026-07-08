# 🔍 INVESTIGATE: Admin Console
**Route**: `/admin + /admin/:module/*`
**Agent Host**: Antigravity 2.0 Desktop · Agent Teams Panel
**Crawl Model**: `@gemini-3.5-flash`
**Synthesis Model**: `@claude-opus-4-6`
**Environment**: `http://localhost:5002/admin + /admin/:module/*`
**Scope**: Read-only · Do NOT modify source files
**Output**: `findings/admn/`
**Issue ID Prefix**: `ADMN-`

---
## Goal
Investigate the full admin console for auth gating, CRUD functionality across all CMS modules, and the known slug-checker gap in product management.

---

## Context
**Source Files**:
- `client/app/routes/admin.tsx` — Auth-gated layout shell
- `client/app/routes/admin._index.tsx` — Admin dashboard
- `client/app/routes/admin.$module.tsx` — Dynamic CMS CRUD views

**Known Issues**:
- `useProductForm.ts`: TODO for slug-checker API not wired up (P1)
- Manufacturing route files: `.js` extension (P2 tech debt)

---

## Pre-flight: Protocol 0

Run once before beginning. Log all output to `findings/admin/protocol-0.txt`.
Continue regardless of failures — every failure is itself a finding.

```bash
npm run verify:tech-integrity   # 8-point integrity gate
npm run check                   # Biome 2.4.10 lint + TypeScript 6.0.3
npm run build                   # Zero-error production build
git diff --name-only            # Confirm no source files modified
```

---
## Agent Team Configuration (Antigravity 2.0 — Agent Teams Panel)

| Sub-Agent | Model | Responsibility |
|-----------|-------|----------------|
| Visual Crawler | `@gemini-3.5-flash` | Browser screenshots 375/768/1440px, layout, animation |
| CMS + API Auditor | `@gemini-3.5-flash` | Schema, endpoint probe, admin→frontend data flow |
| Perf + SEO + a11y | `@gemini-3.5-flash` | Web Vitals, metadata, Biome, accessibility |
| **Synthesizer** | **`@claude-opus-4-6`** | **Aggregates all output → `findings.md`** |

All three crawl agents run in **parallel**. Synthesizer runs after all complete (fan-in).

---

## Investigation Axes

### 1. Auth Gating
```bash
curl -sw "\nHTTP: %{http_code}\n" http://localhost:5002/admin        # Without session: expect redirect
curl -sw "\nHTTP: %{http_code}\n" http://localhost:5002/api/auth/user # Without session: expect 401
```
- [ ] Unauthenticated `/admin` → redirects to login (not renders or crashes)
- [ ] After mock login: `/admin` dashboard loads correctly
- [ ] Non-admin role: verify admin routes return access-denied (not silently expose)

### 2. Admin Dashboard
- [ ] `/admin`: dashboard renders all module navigation links
- [ ] Module counts/stats accurate (if shown)
- [ ] Navigation to each CMS module from dashboard works

### 3. Manufacturing Modules — CRUD (Priority)
For each of the 5 modules, test Create, Read, Update, Delete:
- [ ] `http://localhost:5002/admin/manufacturing-hero` — CRUD functional
- [ ] `http://localhost:5002/admin/manufacturing-processes` — CRUD functional, order editable
- [ ] `http://localhost:5002/admin/manufacturing-capabilities` — CRUD functional, counts editable
- [ ] `http://localhost:5002/admin/manufacturing-qualities` — CRUD functional
- [ ] `http://localhost:5002/admin/manufacturing-case-studies` — CRUD + image upload functional

### 4. Products Admin — Known P1 Gap
- [ ] `http://localhost:5002/admin/products`: list loads
- [ ] Create product with a duplicate slug:
  - Navigate to create product form
  - Enter a slug that already exists
  - Submit form
  - Expected failure: no slug uniqueness check (TODO not wired) → duplicate slug saved
  - Document as **P1**: slug collision causes SEO and routing issues in production
- [ ] Read `client/app/[path]/useProductForm.ts` and screenshot the TODO comment

### 5. Additional Module CRUD Spot Check (5 modules)
Pick 5 from admin nav and test CRUD:
- [ ] `admin/homepage-hero`
- [ ] `admin/homepage-slogans`
- [ ] `admin/about-timeline`
- [ ] `admin/sustainability`
- [ ] `admin/navigation-items`

### 6. Admin UI Quality
- [ ] All form inputs have `<label>` + `aria-label`
- [ ] Form validation errors display clearly
- [ ] Success/error feedback: `sonner` toasts (not custom notifications)
- [ ] TipTap rich text editors (if present): save without data loss
- [ ] Media upload: images upload, preview, save correctly
- [ ] No broken navigation links in admin shell

### 7–10. Standard Axes
Tablet responsiveness (admin usable on tablet), a11y (all inputs labeled), TypeScript/Biome.

---
## Artifacts to Produce

```
findings/admn/
├── findings.md            ← Severity-scored report (P0/P1/P2/P3)
├── protocol-0.txt         ← verify:tech-integrity output
├── api-probe.json         ← Raw endpoint responses
└── screenshots/
    ├── desktop-1440px.png
    ├── tablet-768px.png
    ├── mobile-375px.png
    ├── admin-manufacturing-hero.png
    ├── admin-products.png
```

Issue format in `findings.md`:
```
## P0 — Critical
### ADMN-001: [Title]
- **Axis**: [axis]  **File**: `path/to/file.tsx:Lnn`
- **Description**: What is wrong
- **Evidence**: screenshot ref | console error | curl output
- **Fix Direction**: Suggested approach only — no implementation
```

---
## Success Criteria

- [ ] `npm run verify:tech-integrity` output logged
- [ ] All 2 API endpoint(s) probed and logged in `api-probe.json`
- [ ] Screenshots captured at 375px, 768px, 1440px
- [ ] Admin module verified: `http://localhost:5002/admin/manufacturing-hero`
- [ ] Admin module verified: `http://localhost:5002/admin/products`
- [ ] All 10 investigation axes completed
- [ ] `findings.md` produced with P0/P1/P2/P3 scoring
- [ ] `git diff --name-only` is clean (no source modifications)
