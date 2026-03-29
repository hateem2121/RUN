/**
 * Accessibility Testing Utilities for RUN Remix
 *
 * This module provides axe-core integration for automated accessibility testing
 * in Vitest unit tests. It follows WCAG 2.1 AA standards.
 *
 * @module client/tests/accessibility
 * @see docs/development/accessibility.md
 */

import type { AxeResults, Result } from "axe-core";
import { expect } from "vitest";
import { axe } from "vitest-axe";

/**
 * WCAG 2.1 AA compliance configuration for axe-core
 */
export const defaultAxeConfig = {
  runOnly: {
    type: "tag" as const,
    values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
  },
};

/**
 * Run accessibility checks on a container element
 *
 * @param container - The HTML element to test
 * @param config - Optional axe-core configuration
 * @returns Promise resolving to axe results
 *
 * @example
 * ```tsx
 * import { render } from '@testing-library/react';
 * import { checkA11y } from '@/tests/accessibility';
 *
 * it('should have no accessibility violations', async () => {
 *   const { container } = render(<Button>Click me</Button>);
 *   const results = await checkA11y(container);
 *   expect(results.violations).toHaveLength(0);
 * });
 * ```
 */
export async function checkA11y(
  container: Element,
  config: Partial<typeof defaultAxeConfig> = {},
): Promise<AxeResults> {
  const mergedConfig = { ...defaultAxeConfig, ...config };
  return axe(container, mergedConfig);
}

/**
 * Assert that a container has no accessibility violations
 * Throws an error with formatted violation details if violations are found
 *
 * @param container - The HTML element to test
 * @param config - Optional axe-core configuration
 *
 * @example
 * ```tsx
 * import { render } from '@testing-library/react';
 * import { assertNoA11yViolations } from '@/tests/accessibility';
 *
 * it('should be accessible', async () => {
 *   const { container } = render(<Button>Click me</Button>);
 *   await assertNoA11yViolations(container);
 * });
 * ```
 */
export async function assertNoA11yViolations(
  container: Element,
  config: Partial<typeof defaultAxeConfig> = {},
): Promise<void> {
  const results = await checkA11y(container, config);

  if (results.violations.length > 0) {
    const formattedViolations = formatViolations(results.violations);
    throw new Error(`Accessibility violations found:\n${formattedViolations}`);
  }
}

/**
 * Format axe-core violations into a readable string for error messages
 *
 * @param violations - Array of axe-core violation results
 * @returns Formatted string of violations
 */
export function formatViolations(violations: Result[]): string {
  return violations
    .map((violation) => {
      const nodes = violation.nodes.map((node) => `  - ${node.html}`).join("\n");

      return (
        `[${violation.impact?.toUpperCase() ?? "UNKNOWN"}] ${violation.id}\n` +
        `  ${violation.description}\n` +
        `  Help: ${violation.helpUrl}\n` +
        `  Affected nodes:\n${nodes}`
      );
    })
    .join("\n\n");
}

/**
 * Custom Vitest matcher to check for no accessibility violations
 * Usage: expect(container).toBeAccessible()
 *
 * @param received - The HTML element to test
 * @param config - Optional axe-core configuration
 */
export async function toBeAccessible(
  received: Element,
  config: Partial<typeof defaultAxeConfig> = {},
): Promise<{ pass: boolean; message: () => string }> {
  const results = await checkA11y(received, config);

  if (results.violations.length === 0) {
    return {
      pass: true,
      message: () => "Expected element to have accessibility violations, but none were found.",
    };
  }

  return {
    pass: false,
    message: () =>
      `Expected element to be accessible, but found ${results.violations.length} violation(s):\n${formatViolations(
        results.violations,
      )}`,
  };
}

/**
 * CI-friendly reporter for accessibility violations
 * Outputs violations in a format suitable for CI logs
 *
 * @param results - axe-core results
 * @returns Formatted report string
 */
export function ciReporter(results: AxeResults): string {
  const lines: string[] = ["=".repeat(60), "ACCESSIBILITY AUDIT REPORT", "=".repeat(60), ""];

  if (results.violations.length === 0) {
    lines.push("✅ No accessibility violations found!");
  } else {
    lines.push(`❌ Found ${results.violations.length} violation(s):\n`);

    for (const violation of results.violations) {
      lines.push(`[${violation.impact?.toUpperCase() ?? "UNKNOWN"}] ${violation.id}`);
      lines.push(`  ${violation.description}`);
      lines.push(`  Affected: ${violation.nodes.length} node(s)`);
      lines.push(`  ${violation.helpUrl}`);
      lines.push("");
    }
  }

  lines.push("=".repeat(60));
  lines.push(`Tests: ${results.testEngine.name} v${results.testEngine.version}`);
  lines.push(`Timestamp: ${results.timestamp}`);
  lines.push("=".repeat(60));

  return lines.join("\n");
}

/**
 * Get a summary of accessibility test results
 *
 * @param results - axe-core results
 * @returns Summary object with counts
 */
export function getA11ySummary(results: AxeResults): {
  violations: number;
  incomplete: number;
  passes: number;
  inapplicable: number;
} {
  return {
    violations: results.violations.length,
    incomplete: results.incomplete.length,
    passes: results.passes.length,
    inapplicable: results.inapplicable.length,
  };
}

/**
 * Assert that an element has a specific ARIA attribute with expected value
 *
 * @param element - The HTML element to test
 * @param attribute - The ARIA attribute name (without 'aria-' prefix)
 * @param expectedValue - The expected attribute value
 *
 * @example
 * ```tsx
 * assertAriaAttribute(button, 'label', 'Submit form');
 * assertAriaAttribute(dialog, 'modal', 'true');
 * ```
 */
export function assertAriaAttribute(
  element: Element,
  attribute: string,
  expectedValue: string,
): void {
  const ariaAttribute = `aria-${attribute}`;
  const actualValue = element.getAttribute(ariaAttribute);

  if (actualValue === null) {
    throw new Error(`Expected element to have attribute "${ariaAttribute}", but it was not found.`);
  }

  if (actualValue !== expectedValue) {
    throw new Error(
      `Expected attribute "${ariaAttribute}" to be "${expectedValue}", but got "${actualValue}".`,
    );
  }
}

/**
 * Assert that elements are in the correct tab order
 * Verifies that focusable elements have appropriate tabindex values
 *
 * @param container - The container element to check
 * @param expectedOrder - Array of expected element selectors in tab order
 *
 * @example
 * ```tsx
 * assertTabOrder(container, ['button.submit', 'a.cancel', 'input.email']);
 * ```
 */
export function assertTabOrder(container: Element, expectedOrder: string[]): void {
  const focusableSelectors = [
    "button:not([disabled])",
    "a[href]",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    '[tabindex]:not([tabindex="-1"])',
  ].join(", ");

  const focusableElements = Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors));

  for (let i = 0; i < expectedOrder.length; i++) {
    const expectedElement = container.querySelector(expectedOrder[i]);

    if (!expectedElement) {
      throw new Error(`Expected element "${expectedOrder[i]}" not found in container.`);
    }

    if (focusableElements[i] !== expectedElement) {
      throw new Error(
        `Expected "${expectedOrder[i]}" to be at position ${i + 1} in tab order, ` +
          `but found "${focusableElements[i]?.tagName.toLowerCase()}" instead.`,
      );
    }
  }
}

// Register custom matchers
expect.extend({
  toBeAccessible,
});
