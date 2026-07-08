# 🔍 INVESTIGATE: User Dashboard
**Route**: `/dashboard`
**Agent Host**: Antigravity 2.0 Desktop · Agent Teams Panel
**Crawl Model**: `@gemini-3.5-flash`
**Synthesis Model**: `@claude-opus-4-6`
**Environment**: `http://localhost:5002/dashboard`
**Scope**: Read-only · Do NOT modify source files
**Output**: `findings/dash/`
**Issue ID Prefix**: `DASH-`

---
## Goal
Investigate the gated `/dashboard` route for auth gating correctness, session handling, role-based rendering, and UI completeness. Test both authenticated and unauthenticated states.

---

## Context
**Source File**: `client/app/routes/dashboard.tsx`
**Auth**: React Router loader checks session. Requires Google OAuth2 session (Redis).

### API Endpoints
| Endpoint | Purpose |
|----------|---------|
| `GET /api/auth/user` | Session metadata: role, email, name, permissions |
| `GET /api/auth/mock-login` | Dev-only: seed mock admin session |

---

## Pre-flight: Protocol 0

Run once before beginning. Log all output to `findings/dashboard/protocol-0.txt`.
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

### 1. Unauthenticated Access (Auth Gating)
- [ ] Visit `http://localhost:5002/dashboard` without session
  - Expected: redirect to `/api/auth/login` or a login page
  - Failure: page renders partially or throws error
- [ ] Verify redirect includes `returnTo` param pointing back to `/dashboard`
- [ ] HTTP response: should be 302 redirect, not 200

### 2. Authenticated Access
```bash
# Seed mock session (dev only)
curl -v http://localhost:5002/api/auth/mock-login
# Then check user data
curl -s http://localhost:5002/api/auth/user
```
- [ ] After mock login: `/dashboard` renders user's name, email, role
- [ ] `/api/auth/user` returns: `{name, email, role, permissions}` — valid shape
- [ ] `mock-login` endpoint is NOT accessible in production: verify `NODE_ENV` gate

### 3. Role-Based Rendering
- [ ] Admin role vs regular user: different dashboard UI?
- [ ] No admin-only elements visible to non-admin role
- [ ] Insufficient role: loader redirects or shows access-denied state

### 4. Session Security
- [ ] Session persists across page reload
- [ ] `GET /api/auth/logout`: session terminated, redirect to `/`
- [ ] Session cookie: `HttpOnly`, `Secure`, `SameSite=Strict` flags present?
  ```bash
  curl -v http://localhost:5002/api/auth/mock-login 2>&1 | grep -i "set-cookie"
  ```

### 5. Visual & UI
- [ ] Dashboard layout: orders, profiles, settings sections render
- [ ] No console errors in authenticated state
- [ ] Navigation within dashboard works

### 6–10. Standard Axes
Apply standard axes 6–10 (mobile, a11y, animation, TypeScript/Biome).

### SECURITY CHECKS
- [ ] `mock-login` returns 404/403 in production mode
- [ ] No sensitive data (tokens, raw session keys) in client-side console
- [ ] Swagger UI (`/docs`): returns 404 if `NODE_ENV=production`

---
## Artifacts to Produce

```
findings/dash/
├── findings.md            ← Severity-scored report (P0/P1/P2/P3)
├── protocol-0.txt         ← verify:tech-integrity output
├── api-probe.json         ← Raw endpoint responses
└── screenshots/
    ├── desktop-1440px.png
    ├── tablet-768px.png
    ├── mobile-375px.png
```

Issue format in `findings.md`:
```
## P0 — Critical
### DASH-001: [Title]
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
- [ ] All 10 investigation axes completed
- [ ] `findings.md` produced with P0/P1/P2/P3 scoring
- [ ] `git diff --name-only` is clean (no source modifications)
