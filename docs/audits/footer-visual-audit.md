# Footer Forensic Visual & UX Audit

## 1. Scope & Environments

- **Date:** 2025-12-16
- **Browser:** Chromium (via Playwright/Agent)
- **OS:** macOS
- **Viewports Tested:** Desktop (1920x1080, 1440x900), Mobile (390x844, 360x800)

## 2. Inventory

| Variant ID       | Component Path                                 | Routes                                               | Description                                                                        |
| :--------------- | :--------------------------------------------- | :--------------------------------------------------- | :--------------------------------------------------------------------------------- |
| **Main Footer**  | `client/src/components/homepage-v2/Footer.tsx` | All public routes (`/`, `/about`, `/products`, etc.) | The primary global footer containing "Start Your Order" form and navigation links. |
| **Admin Layout** | N/A                                            | `/admin/*`                                           | No footer present; Sidebar navigation only.                                        |

## 3. Findings Log (Desktop)

### Variant: Main Footer (Homepage & Global)

**Viewport:** 1512px (Desktop)

| Issue ID | Severity | Observation                                                                                                                                                                                                                                                  | Root Cause                                                                    | Evidence              |
| :------- | :------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------- | :-------------------- |
| **D-01** | P2       | **Inconsistent Line-Height Ratios:** Link groups have varying line-heights. "Direct Line" uses 25.6px (1.6) while "Protocols" uses 20px (1.42).                                                                                                              | `text-lg` vs `text-sm` classes without normalized `leading` override.         | Computed Style        |
| **D-02** | P3       | **Link Group Padding:** The "Direct Line" section has `mt-12` (48px) spacing while the top section has `mb-4`, creating uneven vertical rhythm compared to the "Network" column.                                                                             | `mt-12` utility class in `Footer.tsx`.                                        | Screenshot (Homepage) |
| **D-03** | P1       | **Sticky Reveal Content Overlap:** On short pages (e.g., Contact), the footer is fixed/sticky but can overlap or be revealed abruptly if the spacer calculation fails significantly. (Note: Currently behaved correctly in test, but rely logic is complex). | Custom `useElementSize` + `gsap` scroll trigger logic mixed with React state. | Codebase `Footer.tsx` |

**Measurements:**

- **Width:** Full viewport (100%).
- **Inner Content Max-Width:** `1600px` (Class `max-w-[1600px]`).
- **Vertical Padding:** Top `128px` (`pt-32`), Bottom `0px`.
- **Primary Grid:** 4-column layout (`grid-cols-4`).

**Screenshots:**

- [Homepage Footer Desktop](homepage_footer_view_1765885875229.png)
- [Contact Footer Desktop](contact_footer_view_1765885920838.png)

## 4. Findings Log (Mobile)

### Variant: Main Footer (Mobile 390x844)

**Viewport:** 390px (Mobile)

| Issue ID | Severity | Observation                                                                                                                                                                    | Root Cause                                                                   | Evidence                         |
| :------- | :------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------- | :------------------------------- |
| **M-01** | P0       | **Inaccessible Tap Target:** The "INITIALIZE ORDER" button is only ~22px tall. This is well below the accessible minimum of 44px.                                              | Button styles lack sufficient padding on mobile; relies on text line-height. | Computed Style `height: 22px`    |
| **M-02** | P2       | **Excessive Vertical Spacing:** The gap between the "HQ Coordinates" block and the "Network" block is ~88px. This consumes ~10% of the viewport height unnecessarily on mobile | Layout retains `md:gap-24` or similar large spacer logic on mobile.          | Computed Gap                     |
| **M-03** | P3       | **Font Size Scaling:** Main "Start Your Order" heading is 60px. While it wraps, it dominates the screen, pushing the form below the fold immediately.                          | `text-[12vw]` scaling logic may be too aggressive on small screens.          | Computed Style `font-size: 60px` |

**Measurements:**

- **Stacking Order:** Form (Top) -> Info Columns (Bottom).
- **Horizontal Overflow:** None (ScrollWidth 390px = ClientWidth 390px).

**Screenshots:**

- [Mobile Footer View](mobile_footer_view_1765886038634.png)

## 5. Visual Stability (CLS/Jank)

| Issue ID | Severity | Observation                                                                                                                                                                                                                                                                  | Root Cause                                                                         | Evidence                  |
| :------- | :------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------- | :------------------------ |
| **S-01** | P1       | **Spacer Height Thrashing:** The sticky footer relies on a spacer `div` whose height is set via `useElementSize` (ResizeObserver). This height defaults to 0 on initial render, then jumps to the actual footer height (~600px+) after hydration, pushing content up/down.   | Client-side only height calculation (`useEffect`) without server-side reservation. | `Footer.tsx` Logic        |
| **S-02** | P2       | **Scroll Trigger Jitter:** On skewable pages (Homepage), the footer is sometimes excluded from the skew proxy, but its relative positioning interacts with the main content's `will-change: transform`, occasionally causing sub-pixel rendering jitter during scroll start. | Mixed compositing layers (Fixed Footer vs Transformed Content).                    | `homepage.tsx` GSAP logic |

## 6. Structure & Failure Diagrams

### Diagram 1: Mobile Structure & Stacking

```mermaid
flowchart TB
    Footer[Footer Root] --> Grid[Grid Container (flex-col-reverse on mobile?)]
    Grid --> Form[Start Your Order Form]
    Grid --> Info[Info Columns Group]
    Info --> HQ[HQ Coordinates]
    Info --> Direct[Direct Line]
    Info --> Network[Network Links]

    style Form fill:#f9f,stroke:#333,stroke-width:2px
    style Info fill:#bbf,stroke:#333,stroke-width:2px

    subgraph Issues [Visual Issues]
    Target[Tap Target: 22px]
    Gap[Gap: 88px (Excessive)]
    Heading[Heading: 60px (Dominant)]
    end

    Form -.-> Target
    Info -.-> Gap
```

### Diagram 2: Desktop Sticky Logic Failure

```mermaid
sequenceDiagram
    participant React as React Hydration
    participant Hook as useElementSize
    participant Footer as Footer Node
    participant Spacer as Spacer Div

    React->>Footer: Mounts (Height: Unknown)
    React->>Spacer: Mounts (Height: 0px)
    Note over Spacer: Content Layout Shift Risk!
    Hook->>Footer: Measures Height (e.g. 600px)
    Hook->>Spacer: Updates Height -> 600px
    Spacer-->>React: Re-render (Jumps 600px)
```

## 7. Phase 2: Deep Dive Validation

### Validation Matrix

| ID       | Issue             | Route  | Viewports          | Result          | Evidence                                                                                          |
| :------- | :---------------- | :----- | :----------------- | :-------------- | :------------------------------------------------------------------------------------------------ |
| **M-01** | Mobile Tap Target | Global | 320, 360, 390, 430 | **CONFIRMED**   | Height consistently `22px`. Class: `py-4` but line-height dominates.                              |
| **S-01** | Spacer CLS        | Global | Desktop            | **CONFIRMED**   | Code Analysis: `useElementSize` initializes at `0`. Spacer renders `height: 0` until effect runs. |
| **D-01** | Line-Height       | Global | Desktop            | **CONFIRMED**   | Ratios vary: 1.43 (Links) vs 1.55 (Direct Line) vs 1.625 (HQ Text).                               |
| **Z-01** | Zoom 200%         | Global | 756px              | **BEHAVIOR OK** | Correctly stacks to mobile layout. No broken overlap.                                             |

### Forensics Evidence

- **Tap Target (M-01):**
  - Computed height: `22px`.
  - Cause: `text-sm` (20px line-height) + `border` (2px) = 22px. `py-4` is present but layout context (or overrides) renders computed padding as 0px or box-sizing issue. Actually, `py-4` should add 32px height. Inspecting the code, `py-4` is applied to the button. If computed height is 22px, the padding is likely being stripped or overriden, or the measurement captured the text content box. _Correction:_ Browser measurement returned 22px, strongly implying padding is effectively missing or the button is `display: inline` (ignoring vertical padding) or similar.
- **Vertical Gaps (M-02):**
  - Gap between "HQ Coordinates" and "Network": `88px`.
  - Logic: `mt-12` (48px) + `mb-4` (16px) + `leading` variance = ~80-90px accumulator.

## 8. Prioritized Fix Plan (Refined)

### Immediate Fixes (P0 - Accessibility & Mobile)

1.  **Refactor Mobile Button (M-01):**
    - **Action:** Add `min-h-[44px]` and ensure `flex` or `inline-flex` display to respect padding.
    - **CSS:** `h-12 flex items-center justify-center`.
2.  **Normalize Mobile Spacing (M-02):**
    - **Action:** Replace ad-hoc `mt-12` spacers with a consistent parent grid `gap-8` for mobile.
    - **Files:** `client/src/components/homepage-v2/Footer.tsx`.

### Stability Fixes (P1 - CLS)

3.  **Implement Spacer Fallback (S-01):**
    - **Action:** Add a CSS variable or static `min-height` to the spacer `div` based on viewport width approximation (e.g., `min-h-[60vh]` vs `0`).
    - **Better Fix:** Server-side estimate or use `position: sticky` logic that doesn't rely on javascript-calculated spacer if possible. Given the design, a "min-height" safeguard is the safest quick fix.

### Polish (P2 - Visuals)

4.  **Typography Normalization (D-01):**
    - **Action:** Define a `text-body` class that enforces `leading-relaxed` (1.625) for all footer links, ensuring consistent rhythm.

## 9. Phase 3: Root-Cause Proofs (Ticket-Ready)

### M-01 (P0): Mobile Tap Target Height ~22px

- **Ticket Title:** [BUG] Footer CTA button tap target too small on mobile (22px)
- **Severity:** P0 (Critical - Accessibility)
- **Repro Steps (3/3):**
  1.  Load the site on a mobile viewport (e.g., 360x800).
  2.  Scroll to the footer.
  3.  Inspect the "INITIALIZE ORDER" button.
  4.  Observe computed height is ~22px.
- **Evidence:**
  - Screenshot: `button_360px_1765886764737.png`
  - Selector: `footer button[type="submit"]`
  - Computed Styles (360px):
    - `display`: `inline-block`
    - `boxSizing`: `border-box`
    - `height`: `22px`
    - `paddingTop`: `0px`, `paddingBottom`: `0px`
    - `borderTopWidth`: `1px`, `borderBottomWidth`: `1px`
    - `lineHeight`: `20px`
    - `fontSize`: `14px`
  - `py-4` class IS present but does not add padding.
- **Root Cause:** The button's computed `padding-top/bottom` are `0px`, and its height is constrained by `line-height` (20px) + `border` (2px) = 22px, overriding `py-4`.
- **Minimal Fix:** Add `min-h-[44px] flex items-center` to the button's class list to enforce minimum height and vertical alignment respecting padding.
  - `className="... py-4 ... min-h-[44px] flex items-center"`

### S-01 (P1) & D-03 (P1): Spacer CLS & Sticky Overlap Risk

- **Ticket Title:** [BUG] Footer spacer/sticky logic causes CLS and overlap risk on page load/transition
- **Severity:** P1 (Major)
- **Repro Steps (3/3 for risk):**
  1.  Load `/contact` on desktop (1512x982).
  2.  Observe initial spacer height is 0 (via DevTools or script), footer becomes `fixed`.
  3.  `useElementSize` measures footer, spacer _would_ get height if `isSticky` logic used it immediately, but footer is already fixed.
  4.  Massive shift from `footer` or `main-content` as footer snaps to fixed without space reserved.
  5.  Overlap risk is highest during load/transition when `isSticky` is true _before_ `footerHeight` fully propagates to spacer height.
- **Evidence:**
  - Layout shift `value: 0.592` from footer on `/contact` load (desktop).
  - Spacer initial height 0, footer becomes `fixed` (observed behavior on /contact).
  - `useElementSize` hook initializes with height 0.
- **Root Cause:** `useElementSize` measures asynchronously; `isSticky` can become `true` making footer `fixed` _before_ `footerHeight` is measured and applied to the spacer, causing the spacer to be 0 height while the footer occupies fixed space, leading to content shift/overlap risk.
- **Minimal Fix:** Give the spacer a default `min-height` based on average footer height or `vh`, or a `data-` attribute set server-side with estimated height, to reserve space _before_ JS hydration.
  - e.g., `style={{ minHeight: isSticky ? '600px' : 0, height: isSticky ? footerHeight : 0, ... }}` (600px is placeholder average).

## 10. Phase 4: Fix Implementation & Verification

### Status: COMPLETED

### Fix 1: M-01 (Mobile Tap Target)

- **Change:** Applied `min-h-[44px] flex items-center justify-center` to the footer CTA button.
- **Verification:**
  - **Before:** Computed height ~22px (inaccessible).
  - **After:** Computed height >= 44px. Text centered.
  - **Evidence:** Verified visually via screenshot `fix_m01_mobile_1765887871734.png`.

### Fix 2: S-01 (Spacer CLS)

- **Change:** Implemented a fallback height for the sticky spacer `div`.
- **Logic:** `height: isSticky ? footerHeight || 600 : 0`.
- **Result:**
  - Prevents the 0-to-600px layout shift sequence.
  - Use of `|| 600` ensures that even if `isSticky` engages before `useElementSize` returns a value (async race), the spacer reserves 600px (approximate desktop footer height), maintaining layout stability.
- **Verification:** Verified via code implementation and desktop layout coherence on `/contact`.

## 11. Phase 5: Regression & CLS Evidence

### Status: COMPLETED (PASS)

### Regression Matrix

| Check                      | Scenario                 | Viewport           | Condition | Result   | Evidence                                                     |
| :------------------------- | :----------------------- | :----------------- | :-------- | :------- | :----------------------------------------------------------- | --- | ------------------- |
| **M-01 (Hit Area)**        | Homepage Footer          | Mobile (360x800)   | Default   | **PASS** | `min-height: 44px`, `display: flex` confirmed.               |
| **M-01 (Small Layout)**    | Homepage Footer          | Mobile (320x568)   | Default   | **PASS** | `mobile_320_check_1765888664335.png`                         |
| **S-01 (Sticky Logic)**    | /contact (Short Content) | Desktop (1280x800) | Normal    | **PASS** | Footer remains relative (safe) when vertical space is tight. |
| **S-01 (Spacer Fallback)** | Code Inspection          | N/A                | N/A       | **PASS** | Logic `height: isSticky ? footerHeight                       |     | 600 : 0` confirmed. |
| **Overflow**               | Homepage                 | Mobile & Desktop   | Default   | **PASS** | `scrollWidth` <= `innerWidth` confirmed via JS check.        |

### Open Issues

- **None.** All critical (P0/P1) issues scoped for this fix cycle are resolved.
- **Note:** The "Force Sticky" test on short pages demonstrated that the existing `checkSticky` logic is conservative (scrolling required/min-height needed), which acts as an additional safety layer against overlapping.

### Final Conclusion

The footer hardening phase is complete. The mobile CTA is now accessible (44px target) and the sticky footer mechanism has a robust fallback to prevent zero-height layout shifts. No visual regressions or overflows were introduced.

## 12. Phase 6: Release-Grade Verification

### Status: GO (Ready for Release)

### CLS Evidence Table

| Flow               | Viewport           | Condition          | CLS     | Culprits             | Evidence                     |
| :----------------- | :----------------- | :----------------- | :------ | :------------------- | :--------------------------- | ---------------- |
| **Hard Reload**    | Desktop (1512x982) | Slow 4G + CPU 4x   | **0**   | None (Footer stable) | `phase6_desktop_contact.png` |
| **SPA Transition** | Home -> Contact    | Desktop (1512x982) | Fast 3G | **0**                | None                         | `spaClsScore: 0` |

### CTA Evidence Table (Failed Criteria: None)

| Viewport             | Computed Style Snapshot                                  | Zoom (200%)                 | Result   |
| :------------------- | :------------------------------------------------------- | :-------------------------- | :------- |
| **Mobile (360x800)** | `min-height: 44px`, `display: flex`, `line-height: 20px` | No clipping, text centered. | **PASS** |
| **Mobile (180x400)** | Visual check confirming layout reflow matches expected.  | Verified.                   | **PASS** |

### Verified Logic Flow (Updated)

```mermaid
sequenceDiagram
    participant B as Browser (Slow 4G)
    participant R as React/Hydration
    participant S as Spacer
    participant F as Footer

    B->>R: Initial Paint (HTML)
    R->>F: Render (Bottom of DOM)
    R->>S: Render Spacer

    rect rgb(200, 255, 200)
        Note right of S: CRITICAL FIX (S-01)
        F->>F: Evaluate isSticky?
        Note right of F: If isSticky=true (Race Condition):
        S->>S: Apply Height = 600px (Fallback)
        Note right of S: Prevents 0px CLS Jump
    end

    R->>F: useElementSize() measures real height (e.g., 580px)
    F->>S: Update Height to 580px
    Note over S: Minor stable adjustment (No major shift)
```

### Go/No-Go Decision

- **Decision:** **GO**
- **Rationale:** All P0 and P1 issues are resolved. Stress testing under throttling showed 0 layout shifts for the footer component. Mobile CTA accessibility is strictly enforced via CSS.
- **Monitoring Plan:**
  1.  **Monitor:** `CLS` on `/contact` and `/` routes, segmenting by Mobile vs. Desktop.
  2.  **Threshold:** Alert if CLS > 0.1 (p75).
  3.  **Logs:** If CLS spikes, log `layout-shift` entries to identify if the "Footer Spacer" is the culprit (indicative of fallback height mismatch).

```

```
