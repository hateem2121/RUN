# Findings

## Test Coverage Remediation (July 27, 2026)
- **God Node Test Gaps**: The graph revealed 80 unverified "knowledge gaps" mapping to core functions. We remediated the highest risk vectors:
  - `MemoryStorage` map mutations are now verified in `memory-storage.test.ts`.
  - `SmartLogger` initialization and error serialization (`serializeError`) are unit tested to guarantee trace integrity.
  - `cn` (Tailwind Merge) utility resolution tested to prevent style conflicts in production.
- **Execution Environments**: Discovered that importing script utilities (`verify-docs-versions.ts`) was forcing `process.exit(0)` inside the Vitest runner. Fixed by wrapping CLI execution in `process.env.NODE_ENV !== "test"`.
- **UI Testing Approach**: Validated that `CustomDropdown` and `PublicHeroSection` can be rendered in JSDOM despite deep hooks into GSAP and `locomotive-scroll` by heavily stubbing intersection observers and window context.

## Discovered anti-patterns
- Found pervasive "AI slop" across the codebase:
  - 20+ instances of decorative border accents on rounded cards (e.g. `border-b-2`, `border-l-4`).
  - Numerous "tacky" bouncy/elastic easings (`animate-bounce` on scroll indicators and loaders, and `cubic-bezier(0.175, 0.885, 0.32, 1.275)` for CSS transitions).
  - Several AI-esque color palettes, primarily focusing on `purple-100/20 to-blue-100/20` and cyan on dark mode.
  - Instances of gradient text on titles using `bg-clip-text`.

## Fixed issues
- **Performance**: Resolved layout thrashing on the manufacturing title underline by changing the transition from `width` to `transform: scaleX()`.
- **Performance**: Removed `will-change-transform` across multiple homepage components (`Categories.tsx`, `Hero.tsx`, `Process.tsx`, `Slogans.tsx`, `Values.tsx`, `staggered-menu.tsx`, and `marquee-strip.tsx`) where it was causing GPU memory bloat and jank.
- **Design consistency**: 
  - Standardized all `purple` / `cyan` gradients and text to use the brand's standard `primary` and `technology-primary` tokens.
  - Replaced all elastic bounce easings with smooth linear pulses (`animate-pulse`) or a proper exponentially decaying bezier (`cubic-bezier(0.16, 1, 0.3, 1)`).
  - Stripped out side-tab colored borders and bottom border accents from rounded UI cards, restoring a clean structural grid appearance.
  - Subdued the decorative blueprint grid (`theme.css`) to align better with a professional aesthetic by reducing `color-mix` opacity to `4%`.
- **Security/Architecture**: Removed `express-mongo-sanitize` middleware (and related package) from `server/` since the backend uses PostgreSQL + Drizzle, avoiding unnecessary processing overhead.
- **Implementation Integrity**: Replaced raw `try/catch` blocks with the required `neverthrow` (`ResultAsync`) pattern across several CI scripts (`verify-email.ts`, `verify-docs-versions.ts`, `verify-tech-integrity.ts`). Replaced `console.log` instances with the central Pino `logger`.
- **Accessibility**: Restored touch targets in `CustomDropdown.tsx` to meet accessibility guidelines (minimum 44px).
- **Environment**: Fixed native module bindings build errors caused by corrupted optional dependencies and resolved strict Biome/TypeScript errors to ensure `verify:tech-integrity` passed.

## Verification
- Validated fixes using `node .gemini/config/skills/impeccable/scripts/detect.mjs --json client/app`. Only intentional items (like the blueprint grid) remain.
- CI Pipeline (`npm run verify:tech-integrity`) check passes cleanly.
