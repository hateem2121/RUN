# RUN Remix — Active Development Rules

## Environment
- Server port: 5002 (never 3000)
- Base URL: http://localhost:5002
- Mode: Active Development — full read/write access to client/, server/, and shared/

## Scope
- Full implementation access across the monorepo.
- Follow B.L.A.S.T. execution order for all tasks.
- Always run `npm run verify:tech-integrity` before considering a feature complete.

## Documentation & Markdown Constraints
- **Identity:** All generated documentation, SOPs, and code comments must reflect RUN APPAREL (PVT) LTD's "100% B2B, premium sustainable manufacturing identity."
- **Link Checking:** `npm run check:docs` runs rigorously in CI. To prevent pipeline failures:
  - Do not hyperlink private repository URLs (use `<repository-url>` or plain text).
  - Do not hyperlink local files with line-number fragments (e.g., `[file.ts](file.ts:10)`). Use inline code ticks instead.

## Browser Viewports
- Mobile:  375px
- Tablet:  768px
- Desktop: 1440px
- Wide:    1920px (check max-width constraints)

## Severity Scoring
- P0: Critical — broken, crash, security issue, data missing
- P1: Major — feature broken, SEO invisible, significant a11y failure
- P2: Minor — layout issue, slow endpoint, non-critical warning
- P3: Cosmetic — visual polish, minor inconsistency

## Model Routing
- Crawling, screenshots, API probing: @gemini-3.5-flash
- Report synthesis, pattern analysis: @claude-opus-4-6

## Tech Stack Hard Rules (for TypeScript/Biome/animation checks)
- React 19.2.6: no forwardRef, named exports, form action= not onSubmit
- Tailwind 4.3.0: @theme + @utility syntax, no arbitrary values
- Zod 4.4.3: error: param only (not message:, required_error:)
- Biome 2.4.10: noExplicitAny + noMisusedPromises active
- GSAP 3.15.0 only: zero framer-motion imports allowed (hard rule)
- Scroll library: locomotive-scroll 5.0.1 only (lenis is strictly forbidden)
- sonner ^2.0.7: no custom toast implementations
- neverthrow Result types in service layer: no raw throw statements
- Port: 5002 always — never 3000
