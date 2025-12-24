# Visual Health & Performance Report

**Date:** December 22, 2025
**Status:** ⚠️ **MISMATCH DETECTED**

## 1. Hydration Mismatch Audit (React 19)

| File                                    | Risk Level  | Finding                                                                                                                                                                                    |
| :-------------------------------------- | :---------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `client/src/hooks/use-theme.ts`         | 🔴 **HIGH** | Reads `localStorage` and `window.matchMedia` during initial state initialization. This causes the client initial render to differ from the server HTML (which assumes `light` or default). |
| `client/src/hooks/use-local-storage.ts` | 🔴 **HIGH** | Reads `localStorage` during initialization.                                                                                                                                                |
| `client/src/hooks/use-mobile.tsx`       | 🟡 **LOW**  | Initializes as `undefined` (safe), but triggers an immediate layout shift when `useEffect` runs.                                                                                           |

**Remediation Action:**
Modified `client/src/entry-client.tsx` to include `onRecoverableError` logger, which will now explicitly surface these mismatches in the console.

## 2. FOUC & CSS Audit

| Item                | Status    | Notes                                                                       |
| :------------------ | :-------- | :-------------------------------------------------------------------------- |
| **Critical CSS**    | 🟢 **OK** | `index.html` contains inline styles for `body` background and basic layout. |
| **FOUC Prevention** | 🟢 **OK** | `.main-content` opacity transition is present in `index.html`.              |
| **Tailwind v4**     | 🟢 **OK** | `index.css` correctly uses `@source` to scan component files.               |

## 3. Visual Stability (CLS)

| Component            | Status         | Notes                                                                                                                                        |
| :------------------- | :------------- | :------------------------------------------------------------------------------------------------------------------------------------------- |
| `SmoothScrollLayout` | 🟢 **STABLE**  | Uses `useLayoutEffect` for initialization; no layout thrashing detected.                                                                     |
| `Images`             | 🟡 **WARNING** | `index.html` sets `max-width: 100%` but explicit `width/height` attributes should be enforced on all `<img>` tags in JSX to prevent reflows. |

---

## 4. Remediation Code Snippets

### Fix for `use-theme.ts` (Hydration Safe)

```typescript
export function useTheme() {
  // 1. Initialize with server-safe default
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // 2. Read storage only after mount
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
    }
  }, []);

  // ... (rest of the effect to apply class)
}
```

### Fix for `use-local-storage.ts`

```typescript
export function useLocalStorage<T>(key: string, initialValue: T) {
  // 1. Always start with initialValue (match server)
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // 2. Hydrate from storage in effect
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.warn(error);
    }
  }, [key]);

  // ... (setter remains the same)
}
```
