import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple class names into a single string, merging Tailwind CSS classes
 * to handle conflicts correctly.
 *
 * Usage:
 * className={cn("bg-red-500", condition && "text-white", "p-4 p-2")}
 * // Result: "bg-red-500 text-white p-2" (p-2 overrides p-4)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats bytes into a human-readable string (e.g., "1.5 MB").
 */
export function formatFileSize(bytes: number | undefined | null): string {
  if (bytes === null || bytes === undefined || Number.isNaN(bytes) || bytes < 0) {
    return "0 Bytes";
  }

  if (bytes === 0) {
    return "0 Bytes";
  }

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  if (i < 0 || i >= sizes.length) {
    return "0 Bytes";
  }

  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

/*
 * Project Tasks:
 *
 * ## Phase 2: Admin UI Audit
 * - [x] Layout & UI (Admin CMS)
 *
 * ## Phase 3: UX & Accessibility Investigation
 * - [/] Interaction Patterns
 * - [x] Accessibility Audit (WCAG AA)
 * - [/] Screen Reader Testing
 * - [x] Mobile & Touch Optimization
 *
 * ## Phase 4: Theme Mode Analysis
 * - [/] Dark Mode Implementation
 * - [/] Light Mode Implementation
 * - [/] Theme Transition & Persistence
 *
 * ## Phase 5: Technical & Performance Investigation
 * - [ ] Rendering & Hydration
 * - [ ] Memory Leak Detection
 * - [ ] Performance Metrics (LCP, CLS, TTI)
 * - [ ] Cache & Asset Loading
 */
