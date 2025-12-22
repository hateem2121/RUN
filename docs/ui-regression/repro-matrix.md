# UI/UX Regression Repro Matrix

| ID  | Component / Route          | Issue                | Expected Behavior                                   | Actual Behavior                                                                                                                  | Dev vs Prod            |
| --- | -------------------------- | -------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| 1   | `FloatingDockHeader` / All | **Z-Index Stacking** | Header stays above content, Dropdowns above Header. | Dropdowns or Modals may fall behind sticky elements or other overlays due to `z-modal` (1050) vs `z-index-modal` (100) mismatch. | Likely affects both.   |
| 2   | `Modal` / All              | **Z-Index Stacking** | Modal Overlay covers EVERYTHING except Toast.       | Appears behind elements using legacy Z-index scale (1000+).                                                                      | Likely affects both.   |
| 3   | `App.tsx`                  | **Dual Router**      | Only `wouter` artifacts present.                    | `client/src/routes` (TanStack Router) exists; potential for confusing imports.                                                   | Build artifact bloat.  |
| 4   | First Load / All           | **Hydration**        | Zero flicker, matching HTML.                        | Mismatch due to extensions or non-deterministic rendering; `validateHydration` script active.                                    | Prod impacts user exp. |
| 5   | `QueryClient` / SSR        | **Data Safety**      | Unique Cache per Request.                           | Potential shared state if singleton pattern persists in `lib/queryClient.ts`.                                                    | SSR specific.          |

## Evidence Plan

- **Z-Index:** Inspect `client/src/index.css` and `client/src/styles/z-index-stack.css` (Completed in Audit).
- **Router:** Verify `package.json` and file tree (Completed in Audit).
- **Hydration:** Check `entry-client.tsx` logs.
