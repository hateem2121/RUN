---
trigger: always_on
---

# RUN APPAREL Project Rules

## Tech Stack
- Framework: React Router v7 (Remix-style, file-based routing)
- Styling: Tailwind CSS v4 with custom theme
- Animation: GSAP + ScrollTrigger + Locomotive Scroll (Framer Motion removed 2026-03-29)
- State: TanStack React Query v5 with server-side prefetching
- Build: Vite
- Language: TypeScript (strict mode)

## Architecture Patterns
- Route files in: client/app/routes/
- Components in: client/app/routes/ (page-specific) and client/app/components/ (shared)
- All public page data is CMS-managed via REST API (/api/*)
- API calls use apiRequest() from @/lib/queryClient
- Shared types in @shared/schemas and @shared/viewmodels
- Lazy loading for heavy components (use React.lazy + Suspense)

## Brand Typography
- Headlines: "Neue Stance" font-family (font-neue-stance CSS class)
- Subheadings: "Futura BT"  
- Body: "Helvetica Neue"
- NEVER substitute these fonts

## Dark Mode System
- Background: bg-[#0A0A0A] or bg-[#121212]
- Cards: glass-morphism using bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl
- Text: text-white (headlines), text-[#E3DFD6] (body), text-[#68869A] (muted)

## Code Standards
- Use cn() utility from @/lib/utils for conditional classes
- Use TypeScript strict typing — no 'any' types
- All new components must be responsive (mobile-first)
- Preserve existing API query keys and data structures
- Export components as named exports, not default (except route files)
- Performance: lazy-load anything over 50KB
- Keep existing ErrorBoundary patterns

## Page Accent Colors
- Manufacturing: #D4A853 (amber)
- Technology: #00D4FF (cyan)  
- Sustainability: #00C97B (emerald)

## Animation Library

- **GSAP exclusively** — Framer Motion fully removed (migration completed 2026-03-29, 73 files migrated)
- GSAP + ScrollTrigger for scroll-locking, horizontal scroll, marquee, count-up animations
- Locomotive Scroll for smooth scrolling (integrated with GSAP ScrollTrigger proxy)
- Installed packages: `gsap`, `@gsap/react`, `locomotive-scroll`
- Do **not** re-introduce `framer-motion` under any circumstance
