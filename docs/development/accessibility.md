# Accessibility Testing Guide

> **WCAG 2.1 AA Compliance** for RUN Remix Platform
>
**Last Updated:** February 2026
> **Maintainer:** M. Hateem Jamshaid @ RUN APPAREL

---

## Overview

RUN Remix is committed to ensuring digital accessibility for people with disabilities. We continuously improve the user experience for everyone and apply the relevant accessibility standards.

### Standards Compliance

- **WCAG 2.1 Level AA** - Primary compliance target
- **Section 508** - US federal accessibility requirements
- **EN 301 549** - European accessibility standard
- **ADA** - Americans with Disabilities Act

---

## Automated Testing with axe-core

### Setup

The accessibility testing utilities are located at [`client/tests/accessibility.ts`](../../client/tests/accessibility.ts).

**Dependencies:**

- `vitest-axe` - axe-core integration for Vitest
- `axe-core` - Accessibility engine

### Basic Usage

```typescript
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { checkA11y, assertNoA11yViolations } from '@/tests/accessibility';
import { Button } from '@/components/ui/button';

describe('Button Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<Button>Click me</Button>);
    await assertNoA11yViolations(container);
  });

  it('should check specific WCAG tags', async () => {
    const { container } = render(<Button>Submit</Button>);
    const results = await checkA11y(container);
    expect(results.violations).toHaveLength(0);
  });
});
```

### Custom Matcher

Use the `toBeAccessible()` custom matcher for fluent assertions:

```typescript
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@/tests/accessibility'; // Import to register matcher
import { ProductCard } from '@/components/products/ProductCard';

describe('ProductCard', () => {
  it('should be accessible', async () => {
    const { container } = render(
      <ProductCard product={mockProduct} onSelect={() => {}} />
    );
    await expect(container).toBeAccessible();
  });
});
```

---

## Testing Utilities

### `checkA11y(container, config?)`

Run accessibility checks on a container element.

```typescript
const results = await checkA11y(container, {
  runOnly: {
    type: 'tag',
    values: ['wcag2a', 'wcag2aa'],
  },
});
```

### `assertNoA11yViolations(container, config?)`

Assert that a container has no accessibility violations. Throws with formatted violation details.

```typescript
await assertNoA11yViolations(container);
```

### `formatViolations(violations)`

Format axe-core violations into a readable string for error messages.

```typescript
const formatted = formatViolations(results.violations);
console.log(formatted);
```

### `ciReporter(results)`

Generate a CI-friendly report for accessibility test results.

```typescript
console.log(ciReporter(results));
```

### `getA11ySummary(results)`

Get a summary object with counts of different result types.

```typescript
const summary = getA11ySummary(results);
// { violations: 0, incomplete: 2, passes: 15, inapplicable: 8 }
```

### `assertAriaAttribute(element, attribute, expectedValue)`

Assert that an element has a specific ARIA attribute with expected value.

```typescript
assertAriaAttribute(button, 'label', 'Submit form');
assertAriaAttribute(dialog, 'modal', 'true');
```

### `assertTabOrder(container, expectedOrder)`

Assert that elements are in the correct tab order.

```typescript
assertTabOrder(container, [
  'button.submit',
  'a.cancel',
  'input.email',
]);
```

---

## WCAG 2.1 AA Requirements

### Perceivable

#### 1.1 Text Alternatives

- All images must have descriptive `alt` attributes
- Decorative images use `alt=""`
- Complex images have extended descriptions

```tsx
// ✅ Correct
<img src="/product.jpg" alt="RUN Performance T-Shirt in navy blue" />

// ❌ Wrong
<img src="/product.jpg" alt="image" />
<img src="/product.jpg" /> // Missing alt
```

#### 1.2 Time-based Media

- Video has captions and audio descriptions
- Audio has text transcripts

#### 1.3 Adaptable

- Use semantic HTML elements
- Form inputs have associated labels
- Use proper heading hierarchy

```tsx
// ✅ Correct
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/products">Products</a></li>
  </ul>
</nav>

// ❌ Wrong
<div onClick={navigate}>Products</div>
```

#### 1.4 Distinguishable

- Color contrast ratio of 4.5:1 for normal text
- Color contrast ratio of 3:1 for large text
- Text can be resized to 200% without loss of content

### Operable

#### 2.1 Keyboard Accessible

- All functionality available via keyboard
- No keyboard traps
- Custom components have proper focus management

```tsx
// ✅ Correct
<button
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
>
  Action
</button>
```

#### 2.2 Enough Time

- Users can extend time limits
- Moving content can be paused

#### 2.3 Seizures and Physical Reactions

- No content flashes more than 3 times per second

#### 2.4 Navigable

- Skip navigation links
- Descriptive page titles
- Logical focus order
- Visible focus indicators

```tsx
// ✅ Focus indicator
<button className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
  Click me
</button>
```

#### 2.5 Input Modalities

- Touch targets are at least 44x44 CSS pixels
- Motion can be disabled

### Understandable

#### 3.1 Readable

- Page language declared (`<html lang="en">`)
- Language changes marked up

#### 3.2 Predictable

- Consistent navigation
- Consistent identification
- No unexpected context changes

#### 3.3 Input Assistance

- Error identification
- Labels and instructions
- Error suggestion
- Error prevention for legal/financial transactions

### Robust

#### 4.1 Compatible

- Valid HTML
- Name, Role, Value for custom components
- Status messages announced

---

## Component Testing Checklist

When testing a component for accessibility, verify:

### Interactive Elements

- [ ] All buttons have accessible names
- [ ] Links have descriptive text (not "click here")
- [ ] Form inputs have associated labels
- [ ] Error messages are linked to inputs
- [ ] Required fields are indicated

### Focus Management

- [ ] Focus is visible on all interactive elements
- [ ] Tab order is logical
- [ ] Focus is trapped in modals
- [ ] Focus returns to trigger element when modal closes

### Screen Reader Support

- [ ] Images have appropriate alt text
- [ ] Icons have aria-labels or are hidden
- [ ] Dynamic content changes are announced
- [ ] Landmarks are properly marked up

### Color and Contrast

- [ ] Text meets contrast requirements
- [ ] Information is not conveyed by color alone
- [ ] Focus indicators are visible

---

## Running Accessibility Tests

### Unit Tests

```bash
# Run all tests including accessibility
npm run test

# Run specific accessibility test file
npm run test -- --grep "accessibility"
```

### Manual Testing

#### Browser DevTools

1. Open Chrome DevTools
2. Go to **Lighthouse** tab
3. Select **Accessibility** audit
4. Run audit

#### Screen Reader Testing

- **macOS**: VoiceOver (Cmd+F5)
- **Windows**: NVDA (free) or JAWS
- **iOS**: VoiceOver (Settings > Accessibility)
- **Android**: TalkBack (Settings > Accessibility)

#### Keyboard Testing

1. Navigate using Tab, Shift+Tab
2. Activate using Enter, Space
3. Escape should close modals/dropdowns
4. Arrow keys for menus and grids

---

## CI Integration

Accessibility tests run automatically in CI as part of the test suite. Violations will fail the build.

```yaml
# .github/workflows/ci.yml
- name: Run accessibility tests
  run: npm run test -- --coverage
```

### CI Report Output

```
============================================================
ACCESSIBILITY AUDIT REPORT
============================================================

❌ Found 2 violation(s):

[CRITICAL] button-name
  Buttons must have discernible text
  Affected: 3 node(s)
  https://dequeuniversity.com/rules/axe/4.8/button-name

[SERIOUS] color-contrast
  Elements must meet minimum color contrast ratio
  Affected: 1 node(s)
  https://dequeuniversity.com/rules/axe/4.8/color-contrast

============================================================
Tests: axe-core v4.8.4
Timestamp: 2026-02-14T12:00:00.000Z
============================================================
```

---

## Common Violations and Fixes

### button-name

**Issue:** Buttons must have discernible text.

```tsx
// ❌ Violation
<button onClick={handleClick}>
  <Icon name="menu" />
</button>

// ✅ Fixed
<button onClick={handleClick} aria-label="Open menu">
  <Icon name="menu" aria-hidden="true" />
</button>
```

### color-contrast

**Issue:** Insufficient color contrast.

```tsx
// ❌ Violation: Contrast ratio 2.5:1
<p className="text-gray-400">Low contrast text</p>

// ✅ Fixed: Contrast ratio 4.5:1
<p className="text-gray-600">Better contrast text</p>
```

### form-field-multiple-labels

**Issue:** Form field has multiple labels.

```tsx
// ❌ Violation
<label htmlFor="email">Email</label>
<input id="email" aria-label="Email address" />

// ✅ Fixed
<label htmlFor="email">Email address</label>
<input id="email" />
```

### landmark-unique

**Issue:** Landmarks must have unique names.

```tsx
// ❌ Violation
<nav>...</nav>
<nav>...</nav>

// ✅ Fixed
<nav aria-label="Main navigation">...</nav>
<nav aria-label="Footer navigation">...</nav>
```

### heading-order

**Issue:** Heading levels should increase by one.

```tsx
// ❌ Violation
<h1>Main Title</h1>
<h3>Section</h3> <!-- Skipped h2 -->

// ✅ Fixed
<h1>Main Title</h1>
<h2>Section</h2>
```

---

## Resources

### Documentation

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [axe-core Rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)

### Tools

- [axe DevTools](https://www.deque.com/axe/devtools/) - Browser extension
- [WAVE](https://wave.webaim.org/) - Web accessibility evaluation tool
- [Pa11y](https://pa11y.org/) - Automated accessibility testing CLI

### Training

- [WebAIM](https://webaim.org/) - Web accessibility training
- [A11y Project](https://www.a11yproject.com/) - Community resource

---

## Contact

For accessibility questions or to report an accessibility issue:

- **Email:** <team@wear-run.com>
- **Phone:** +92-336-1777313
- **Address:** RUN APPAREL (PVT) LTD, Sialkot, Pakistan

---

**Version:** 1.0.0 | **For:** M. Hateem Jamshaid @ RUN APPAREL (PVT) LTD
