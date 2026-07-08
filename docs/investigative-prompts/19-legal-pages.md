# 🔍 INVESTIGATE: Legal Pages
**Route**: `/privacy + /terms`
**Agent Host**: Antigravity 2.0 Desktop · Agent Teams Panel
**Crawl Model**: `@gemini-3.5-flash`
**Synthesis Model**: `@claude-opus-4-6`
**Environment**: `http://localhost:5002/privacy + /terms`
**Scope**: Read-only · Do NOT modify source files
**Output**: `findings/legl/`
**Issue ID Prefix**: `LEGL-`

---
## Goal
Investigate both legal pages for content rendering, CMS management, SEO, and accessibility. These pages likely contain static JSX content — that itself is a finding.

---

## Context
**Source Files**: `client/app/routes/privacy.tsx`, `client/app/routes/terms.tsx`
**No loaders, no CMS APIs** — likely static JSX content.

---

## Pre-flight: Protocol 0

Run once before beginning. Log all output to `findings/legal/protocol-0.txt`.
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

### 1. Content Rendering
- [ ] `/privacy`: full privacy policy text renders, no truncation
- [ ] `/terms`: full terms and conditions text renders
- [ ] No placeholder tokens left: `[DATE]`, `[COMPANY NAME]`, `[LOREM IPSUM]`
- [ ] All headings and sections render with correct hierarchy

### 2. Static vs CMS (Critical Check)
- [ ] Read source files: is content hardcoded JSX strings or fetched from API?
- [ ] If fully hardcoded: document as P2 CMS gap (legal content must be editable without code deploy)
- [ ] If no CMS management: when was content last updated? Is it legally current?

### 3. SEO & HTTP Status
```bash
curl -sw "\nHTTP: %{http_code}\n" http://localhost:5002/privacy
curl -sw "\nHTTP: %{http_code}\n" http://localhost:5002/terms
```
- [ ] Both return HTTP 200 (not redirect or 404)
- [ ] Unique `<title>` and `<meta description>` on each page
- [ ] Content in initial HTML (static render — should be yes even without loader)
- [ ] `robots.txt`: legal pages should be indexable (verify not blocked)

### 4. Links & References
- [ ] Internal links navigate correctly
- [ ] External links (GDPR, privacy authorities): `target="_blank"` + `rel="noopener noreferrer"`
- [ ] Email addresses use `mailto:` links (not plain text)
- [ ] Last updated date: present and not in the distant past

### 5. Mobile Responsiveness
- [ ] Long-form text readable at 375px (correct line-height, font-size)
- [ ] No table overflow (if any legal tables present)

### 6. Accessibility
- [ ] Logical heading hierarchy throughout document
- [ ] All links descriptive (no "click here" without context)
- [ ] Color contrast ≥ 4.5:1 on all body text

### 7. TypeScript & Biome
```bash
npx biome check client/app/routes/privacy.tsx client/app/routes/terms.tsx
```
- [ ] Zero violations

---
## Artifacts to Produce

```
findings/legl/
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
### LEGL-001: [Title]
- **Axis**: [axis]  **File**: `path/to/file.tsx:Lnn`
- **Description**: What is wrong
- **Evidence**: screenshot ref | console error | curl output
- **Fix Direction**: Suggested approach only — no implementation
```

---
## Success Criteria

- [ ] `npm run verify:tech-integrity` output logged
- [ ] All 0 API endpoint(s) probed and logged in `api-probe.json`
- [ ] Screenshots captured at 375px, 768px, 1440px
- [ ] All 10 investigation axes completed
- [ ] `findings.md` produced with P0/P1/P2/P3 scoring
- [ ] `git diff --name-only` is clean (no source modifications)
