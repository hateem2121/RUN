# RUN Remix — Site Investigation Rules

## Environment
- Server port: 5002 (never 3000)
- Base URL: http://localhost:5002
- Mode: Read-only investigation — never write to source files

## Scope
- Do NOT create, edit, or delete files in client/, server/, or shared/
- All output goes exclusively to findings/[page-name]/ directories
- Run: git diff --name-only after completion to verify source is clean

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
