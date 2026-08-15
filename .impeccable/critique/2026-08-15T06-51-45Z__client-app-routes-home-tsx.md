---
target: client/app/routes/home.tsx
total_score: 34
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
timestamp: 2026-08-15T06-51-45Z
slug: client-app-routes-home-tsx
---
Method: dual-agent (A: 232d38ee-72cf-4de3-848c-526efc6a350c · B: 5f5c7ab3-e815-43da-a3e3-6930098c1b56)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|:-----:|-----------|
| 1 | Visibility of System Status | 3.5/4 | Clear scroll velocity skewing and form submission states |
| 2 | Match System / Real World | 4.0/4 | Native B2B terminology (MOQ, GOTS, Prototyping, Logistics) |
| 3 | User Control and Freedom | 2.5/4 | Unlinked `<button>` in Process cards creates keyboard traps |
| 4 | Consistency and Standards | 3.0/4 | Accent color drift (electric blue vs brand lime & gold) |
| 5 | Error Prevention | 3.5/4 | Pre-flight email regex and specs character threshold |
| 6 | Recognition Rather Than Recall | 3.5/4 | Explicit MOQs and persistent floating dock navigation |
| 7 | Flexibility and Efficiency | 3.5/4 | Rapid keyboard shortcuts and floating dock navigation |
| 8 | Aesthetic and Minimalist Design | 3.5/4 | Strong brutalist-luxury balance; remove gradient text in Stats |
| 9 | Error Recovery | 3.5/4 | Inline pulsing error alerts and non-destructive forms |
| 10 | Help and Documentation | 2.5/4 | Missing technical tooltips for sustainable certifications |
| **Total** | | **34 / 40** | **Good (85.0% — Solid Foundation)** |

## Design Specificity Verdict

**Verdict: 8.5 / 10 — Distinctly Industrial & Artisanal B2B**

- **LLM Assessment**: High design specificity. The layout successfully establishes an industrial command-center aesthetic for RUN APPAREL (PVT) LTD with monospaced metadata brackets (`[ HQ COORDINATES ]`), production stats (135 yrs, 100k units/month), and kinetic velocity scroll physics.
- **Deterministic Scan**: 2 findings flagged:
  1. `gradient-text` in `Stats.tsx:151` (`bg-clip-text text-transparent bg-linear-to-r from-blue-600 to-blue-900`) — True positive anti-pattern per Rule §5.3.
  2. `marquee` in `Categories.tsx:125` — Domain-justified ticker with `prefers-reduced-motion` pause rules and offscreen intersection observers.

## Priority Issues

1. **[P1] Dead Interactive Arrow Control**
   - **Location:** `client/app/components/homepage/Process.tsx:215`
   - **Impact:** Unlinked `<button type="button">` traps keyboard and assistive users without navigation or modal triggering.
   - **Fix:** Connect to `/services` or remove `<button>` role.
   - **Suggested Command:** `/impeccable clarify client/app/components/homepage/Process.tsx`

2. **[P1] Misleading Catalogue Navigation Target**
   - **Location:** `client/app/components/homepage/FeaturedProducts.tsx:146`
   - **Impact:** "View Full Catalogue" anchors to `#catalogue` (animated category marquee) instead of the actual products directory.
   - **Fix:** Update link target to `/categories` or `/products`.
   - **Suggested Command:** `/impeccable clarify client/app/components/homepage/FeaturedProducts.tsx`

3. **[P2] Gradient Text Anti-Pattern**
   - **Location:** `client/app/components/homepage/Stats.tsx:151`
   - **Impact:** `bg-clip-text` on "Athletic Craftsmanship" produces poor contrast on varying backgrounds and violates Rule §5.3.
   - **Fix:** Replace with solid `text-primary` or `text-foreground`.
   - **Suggested Command:** `/impeccable quieter client/app/components/homepage/Stats.tsx`

4. **[P2] Raw Palette Color Leaks**
   - **Location:** `client/app/components/homepage/Stats.tsx` and `Values.tsx`
   - **Impact:** Ad-hoc Tailwind blue classes (`text-blue-400`, `from-blue-600`) dilute the core Manufacturing Gold (`#d4a853`) and Brand Lime (`#ccff00`) brand palette.
   - **Fix:** Migrate to `@theme` design tokens.
   - **Suggested Command:** `/impeccable colorize client/app/components/homepage/`

## Persona Red Flags

- **Alex (Enterprise Procurement Director)**: Unable to download an official Factory Capability Deck or tech-pack specifications directly from the hero or archive section.
- **Jordan (First-Time Brand Founder)**: The label `INITIALIZE ORDER` and placeholder `ENTER CORPORATION` feels intimidating for capsule inquiries; lacks an introductory sampling FAQ.
- **Sam (Keyboard & Screen Reader User)**: Process cards render non-functional buttons; inverted heading levels in `Process.tsx` (`<h3>` before `<h2>`).

## Minor Observations

- `ScrambleNumber` in `Stats.tsx` uses `<span className="sr-only">` to prevent screen reader stuttering.
- Reduced motion gracefully falls back to vertical layout in `Process.tsx`.
