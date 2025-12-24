/**
 * DOM Sanitizer for Browser Extension Attributes
 *
 * Browser extensions (Grammarly, LastPass, etc.) inject attributes into the DOM
 * that cause React 19 hydration mismatches. This utility removes these attributes
 * before hydration to prevent console warnings and Sentry noise.
 *
 * Run this BEFORE hydrateRoot() in entry-client.tsx
 */

const EXTENSION_ATTRIBUTES = [
  // Grammarly
  "data-gramm",
  "data-gramm_editor",
  "data-enable-grammarly",
  // LastPass
  "data-lp-id",
  "data-lp-version",
  // 1Password
  "data-1p-id",
  // Bitwarden
  "data-bi-id",
  // Generic extension markers
  "cz-shortcut-listen",
  "data-lt-installed",
  // Browser-specific
  "data-extension-installed",
] as const;

/**
 * Removes browser extension-injected attributes from the DOM.
 * Should be called synchronously before React hydration.
 */
export function sanitizeExtensionAttributes(): void {
  if (typeof document === "undefined") return;

  EXTENSION_ATTRIBUTES.forEach((attr) => {
    try {
      const elements = document.querySelectorAll(`[${attr}]`);
      elements.forEach((el) => el.removeAttribute(attr));
    } catch {
      // Attribute selector might be invalid for some edge cases
    }
  });
}

/**
 * Checks if the current environment likely has extension interference.
 * Useful for conditional logging or telemetry.
 */
export function hasExtensionAttributes(): boolean {
  if (typeof document === "undefined") return false;

  return EXTENSION_ATTRIBUTES.some((attr) => document.querySelector(`[${attr}]`) !== null);
}
