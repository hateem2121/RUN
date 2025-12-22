# UI Audit Reproduction Notes

This document captures the reproduction steps, evidence, and root causes for the identified visual regressions.

## 1. Statistic Ticker Corruption

- **Route**: `/` (Homepage)
- **Steps**: Refresh page, watch "YEARS OF HERITAGE" section counters.
- **Evidence**:
  - **Symptoms**: Scrambled numeric symbols and/or visible `sr-only` content during initial paint.
  - **DOM Snapshot**:
    ```html
    <div class="...">
      <span class="sr-only">135</span>
      <span aria-hidden="true">!!%</span>
      <!-- Corrupted during animation start -->
    </div>
    ```
  - **Computed Styles (`sr-only`)**:
    - `position: absolute`
    - `clip: rect(0px, 0px, 0px, 0px)`
    - **Risk**: If Tailwind fails to load (due to FOUC or network), `sr-only` falls back to `display: inline`, making the screen-reader text visible alongside the ticker.

## 2. FOUC Selection Mismatch (Permanent Hiding)

- **Route**: Global
- **Steps**: Open any route, observe initial white screen.
- **Evidence**:
  - **Node**: `#root`
  - **State**: `opacity: 0` (Inline style or critical CSS).
  - **Mechanism**: `index.html` targets `#root` but the transition logic depends on a body class `css-loaded` which may be delayed or fail.
  - **Computed Style**: `opacity: 0` (Verified on HEAD).

## 3. Layout Overlap

- **Route**: `/test-fixes`
- **Steps**: Navigate to `/test-fixes`, scroll to "Ref Forwarding" or "Transition Smoothness".
- - **Viewport**: 1200px (Desktop) and 375px (Mobile).
- **Evidence**:
  - **Overlap**: Header "3. Transition Smoothness" collides with CTA text.
  - **Colliding Nodes**: `h2` and `div.cta-container`.
  - **Root Cause**: Lack of explicit vertical spacing/gaps during slow asset loading.

## 4. Font Preload Warning

- **Route**: Global
- **Console Warning**: `The resource .../fonts/NeueStance-Regular.ttf was preloaded using link preload but not used within a few seconds`.
- **Root Cause**: The URL preloaded in `index.html` does not perfectly match the source URL used by Vite/Tailwind in the final CSS bundle, or the font weight/family name mismatch causes double-fetching or ignoring.

## 5. Style Diagnostic Bug (False Positive)

- **Route**: Global (Dev)
- **Console Log**: `🎨 Style Audit: {tailwindImported: false, ...}`
- **Verification**: Tailwind _is_ active (computed styles show utility classes), but the detection logic in `audit-styles.ts` fails to find the specific "tailwind" string in the bundled stylesheet hrefs.
