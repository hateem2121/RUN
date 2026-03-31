# WCAG 2.1 AA Accessibility Implementation Plan

## Executive Summary

Transform the RUN Remix CMS from "accessible foundations" (7/10) to "WCAG 2.1 AA compliant" (9/10) by implementing comprehensive keyboard navigation, screen reader support, color contrast fixes, semantic HTML improvements, ARIA patterns, automated accessibility testing, and legal compliance documentation.

**Target Standard:** WCAG 2.1 Level AA  
**Current State:** 7/10 (foundations present, gaps remain)  
**Target State:** 9/10 (WCAG 2.1 AA compliant)

---

## Current State Analysis

### Existing Strengths

- **Lighthouse CI configured** with 90% accessibility score requirement
- **Playwright E2E testing** infrastructure in place
- **Button component** has focus-visible styles implemented
- **Theme system** uses semantic color tokens via oklch color space
- **React 19** with functional components (no forwardRef issues)

### Identified Gaps

#### Color Contrast Issues

| Token | Current Value | Issue |
|-------|---------------|-------|
| `--muted-foreground` (light) | `oklch(0.45 0.02 240)` | Lightness 0.45 may fail 4.5:1 on white |
| `--muted-foreground` (dark) | `oklch(0.65 0.02 240)` | May fail on dark backgrounds |

#### Missing Accessibility Features

- Skip links not implemented
- ARIA landmarks incomplete
- Focus trap utility for modals missing
- Keyboard shortcuts not documented
- Screen reader testing not performed
- Form label associations need audit
- Alt text audit needed

---

## Implementation Phases

### Phase 1: Audit and Quick Wins

#### 1.1 Automated Accessibility Audit

**Objective:** Establish baseline and identify all violations

**Tasks:**

1. Run Lighthouse accessibility audit on all pages
2. Install and configure axe-core for component testing
3. Run axe-core scan on all components
4. Document all violations by severity (Critical, Serious, Moderate, Minor)
5. Create prioritized remediation list

**Files to Create/Modify:**

- `client/vitest.setup.ts` - Add axe-core configuration
- `docs/accessibility/audit-report.md` - Document findings

**Dependencies:**

- `jest-axe` or `vitest-axe` package

#### 1.2 Color Contrast Audit and Fixes

**Objective:** Ensure all text meets 4.5:1 contrast ratio

**Tasks:**

1. Audit all theme colors using contrast ratio calculator
2. Identify failing color combinations
3. Propose adjusted color values that maintain brand identity
4. Update theme.css with compliant colors
5. Verify contrast with automated tools

**Files to Modify:**

- `client/app/styles/theme.css` - Update color values

**Proposed Color Adjustments:**

```css
/* Light Mode - Increase contrast */
--muted-foreground: oklch(0.40 0.02 240); /* Was 0.45 */

/* Dark Mode - Increase contrast */
--muted-foreground: oklch(0.70 0.02 240); /* Was 0.65 */
```

#### 1.3 Alt Text and ARIA Labels

**Objective:** Ensure all images and icons have accessible names

**Tasks:**

1. Audit all `<img>` elements for alt text
2. Add `aria-hidden="true"` to decorative images
3. Add `aria-label` to icon-only buttons
4. Create alt text guidelines for content editors

**Files to Audit:**

- `client/app/components/products/*.tsx`
- `client/app/components/admin/*.tsx`
- `client/app/components/layout/*.tsx`

#### 1.4 Heading Hierarchy

**Objective:** Ensure proper heading structure (h1 → h2 → h3)

**Tasks:**

1. Audit all pages for heading hierarchy
2. Fix skipped heading levels
3. Ensure single h1 per page
4. Document heading structure guidelines

#### 1.5 HTML Lang Attribute

**Objective:** Declare page language for screen readers

**Tasks:**

1. Verify `lang="en"` on HTML element
2. Add `lang` attribute to foreign language content

**Files to Modify:**

- `client/app/root.tsx` - Ensure lang attribute

---

### Phase 2: Keyboard Navigation and Focus Management

#### 2.1 Visible Focus Indicators

**Objective:** Ensure all interactive elements have visible focus

**Tasks:**

1. Audit focus styles across all components
2. Ensure 3:1 contrast for focus indicators
3. Implement consistent focus ring pattern
4. Test focus visibility in both light and dark modes

**Implementation Pattern:**

```css
/* Focus indicator utility */
@layer utilities {
  .focus-ring {
    outline: 2px solid var(--ring);
    outline-offset: 2px;
  }
  
  .focus-ring-high-contrast {
    outline: 3px solid var(--ring);
    outline-offset: 3px;
  }
}
```

**Files to Modify:**

- `client/app/index.css` - Add focus utilities
- `client/app/components/ui/*.tsx` - Apply focus styles

#### 2.2 Skip Links

**Objective:** Allow keyboard users to bypass navigation

**Tasks:**

1. Create SkipLink component
2. Add skip links to main content
3. Add skip links to main navigation
4. Style skip links to appear on focus only

**Files to Create:**

- `client/app/components/ui/skip-link.tsx`

**Implementation:**

```tsx
export function SkipLink({ targetId, children }: SkipLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
    >
      {children}
    </a>
  );
}
```

#### 2.3 Keyboard Shortcuts

**Objective:** Provide efficient keyboard navigation

**Tasks:**

1. Create useKeyboardShortcuts hook
2. Implement global shortcuts (Cmd+K for search, ? for help)
3. Create KeyboardShortcutsModal component
4. Document all shortcuts

**Shortcuts to Implement:**

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Focus search |
| `?` | Show keyboard shortcuts |
| `Escape` | Close modal/dialog |
| `Tab` | Next focusable element |
| `Shift + Tab` | Previous focusable element |

**Files to Create:**

- `client/app/hooks/use-keyboard-shortcuts.ts`
- `client/app/components/ui/keyboard-shortcuts-modal.tsx`

#### 2.4 Focus Trap for Modals

**Objective:** Trap focus within modal dialogs

**Tasks:**

1. Create useFocusTrap hook
2. Apply to all modal components
3. Ensure focus returns to trigger on close
4. Test with keyboard navigation

**Files to Create:**

- `client/app/hooks/use-focus-trap.ts`

**Implementation:**

```tsx
export function useFocusTrap(ref: RefObject<HTMLElement>, isActive: boolean) {
  useEffect(() => {
    if (!isActive || !ref.current) return;
    
    const focusableElements = ref.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    firstElement?.focus();
    
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    };
    
    ref.current.addEventListener('keydown', handleTab);
    return () => ref.current?.removeEventListener('keydown', handleTab);
  }, [ref, isActive]);
}
```

#### 2.5 Tab Order Testing

**Objective:** Ensure logical tab order on all pages

**Tasks:**

1. Test tab order on all public pages
2. Test tab order on all admin pages
3. Fix any illogical tab sequences
4. Document expected tab order for complex components

---

### Phase 3: Screen Reader Support

#### 3.1 ARIA Landmarks

**Objective:** Provide navigation landmarks for screen readers

**Tasks:**

1. Add role="banner" to header
2. Add role="navigation" with aria-label to nav elements
3. Add role="main" to main content
4. Add role="contentinfo" to footer
5. Add role="complementary" to sidebars

**Files to Modify:**

- `client/app/root.tsx`
- `client/app/components/layout/*.tsx`
- `client/app/components/navigation/*.tsx`

**Implementation Pattern:**

```tsx
<body>
  <a href="#main-content" className="skip-link">Skip to main content</a>
  
  <header role="banner">
    <nav role="navigation" aria-label="Main navigation">
      {/* Navigation items */}
    </nav>
  </header>
  
  <main id="main-content" role="main">
    {/* Main content */}
  </main>
  
  <aside role="complementary" aria-label="Sidebar">
    {/* Sidebar content */}
  </aside>
  
  <footer role="contentinfo">
    {/* Footer content */}
  </footer>
</body>
```

#### 3.2 ARIA Live Regions

**Objective:** Announce dynamic content changes

**Tasks:**

1. Create LiveRegion component
2. Add live regions for notifications
3. Add live regions for form validation errors
4. Add live regions for loading states

**Files to Create:**

- `client/app/components/ui/live-region.tsx`

**Implementation:**

```tsx
export function LiveRegion({ 
  children, 
  priority = 'polite' 
}: LiveRegionProps) {
  return (
    <div
      role={priority === 'assertive' ? 'alert' : 'status'}
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {children}
    </div>
  );
}
```

#### 3.3 ARIA States

**Objective:** Communicate component states to screen readers

**Tasks:**

1. Add aria-expanded to accordions and dropdowns
2. Add aria-selected to tabs
3. Add aria-checked to checkboxes
4. Add aria-disabled to disabled elements
5. Add aria-busy to loading states

**Components to Update:**

- Accordions
- Tab panels
- Dropdown menus
- Checkboxes and radio buttons
- Modal dialogs

#### 3.4 Form Accessibility

**Objective:** Ensure all forms are screen reader accessible

**Tasks:**

1. Associate all labels with inputs
2. Add aria-required to required fields
3. Add aria-describedby for help text
4. Add aria-invalid for error states
5. Implement error announcements

**Implementation Pattern:**

```tsx
<div className="form-field">
  <label htmlFor="email" id="email-label">
    Email Address
    <span aria-hidden="true">*</span>
  </label>
  
  <input
    id="email"
    type="email"
    aria-required="true"
    aria-invalid={!!error}
    aria-describedby={error ? 'email-error' : 'email-help'}
  />
  
  {error ? (
    <p id="email-error" role="alert" className="error">
      {error}
    </p>
  ) : (
    <p id="email-help" className="help-text">
      We will never share your email
    </p>
  )}
</div>
```

#### 3.5 Screen Reader Testing

**Objective:** Verify compatibility with major screen readers

**Tasks:**

1. Test with VoiceOver (macOS)
2. Test with NVDA (Windows)
3. Document screen reader testing procedures
4. Create screen reader testing checklist
5. Record issues and fixes

**Testing Checklist:**

- [ ] All headings announced correctly
- [ ] Landmarks announced
- [ ] Skip links work
- [ ] Tab order logical
- [ ] Focus indication visible
- [ ] Form labels announced
- [ ] Error messages announced
- [ ] Success notifications announced
- [ ] Modal focus trapped
- [ ] Toggle states announced

---

### Phase 4: Automated Testing and Compliance

#### 4.1 axe-core Integration

**Objective:** Automate accessibility testing in CI/CD

**Tasks:**

1. Install vitest-axe package
2. Configure axe for WCAG 2.1 AA
3. Create accessibility test utilities
4. Add tests to critical components

**Files to Create:**

- `client/vitest.setup.ts` - Configure axe
- `client/app/components/__tests__/accessibility.test.tsx`

**Implementation:**

```tsx
import { configureAxe, toHaveNoViolations } from 'vitest-axe';
import { expect } from 'vitest';

expect.extend(toHaveNoViolations);

export const axe = configureAxe({
  rules: {
    'wcag2a': { enabled: true },
    'wcag2aa': { enabled: true },
    'wcag21a': { enabled: true },
    'wcag21aa': { enabled: true },
  },
});
```

#### 4.2 Playwright Accessibility Tests

**Objective:** E2E accessibility testing

**Tasks:**

1. Install @axe-core/playwright
2. Create accessibility test suite
3. Test all major pages
4. Integrate with CI/CD

**Files to Create:**

- `tests/e2e/accessibility.spec.ts`

**Implementation:**

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test('homepage has no violations', async ({ page }) => {
    await page.goto('/');
    
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    expect(results.violations).toEqual([]);
  });
  
  test('admin dashboard has no violations', async ({ page }) => {
    await page.goto('/admin');
    
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    expect(results.violations).toEqual([]);
  });
});
```

#### 4.3 Lighthouse CI Enhancement

**Objective:** Strengthen accessibility assertions

**Tasks:**

1. Update lighthouserc.js with specific assertions
2. Add more pages to test
3. Increase accessibility score requirement to 95

**Files to Modify:**

- `lighthouserc.js`

**Updated Configuration:**

```javascript
module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:5002/',
        'http://localhost:5002/products',
        'http://localhost:5002/admin',
        'http://localhost:5002/admin/products',
      ],
      numberOfRuns: 3,
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'color-contrast': 'error',
        'image-alt': 'error',
        'button-name': 'error',
        'link-name': 'error',
        'valid-lang': 'error',
        'html-has-lang': 'error',
        'label': 'error',
        'aria-allowed-attr': 'error',
        'aria-required-attr': 'error',
        'aria-required-children': 'error',
        'aria-required-parent': 'error',
        'aria-roles': 'error',
        'aria-valid-attr': 'error',
        'aria-valid-attr-value': 'error',
      },
    },
  },
};
```

#### 4.4 Accessibility Statement

**Objective:** Document commitment to accessibility

**Tasks:**

1. Write accessibility statement
2. Include conformance status
3. Document accessibility features
4. Provide feedback mechanism
5. Include known limitations

**Files to Create:**

- `docs/accessibility/accessibility-statement.md`
- `client/app/pages/accessibility-statement.tsx` (public page)

#### 4.5 VPAT Document

**Objective:** Create Voluntary Product Accessibility Template

**Tasks:**

1. Create VPAT template
2. Document WCAG 2.1 AA conformance
3. Include remarks for each criterion
4. Prepare for government/education contracts

**Files to Create:**

- `docs/accessibility/vpat.md`

#### 4.6 Keyboard Shortcuts Documentation

**Objective:** Document all keyboard navigation

**Tasks:**

1. Create keyboard shortcuts reference
2. Include in help modal
3. Add to accessibility statement
4. Create printable reference card

**Files to Create:**

- `docs/accessibility/keyboard-shortcuts.md`

---

## Files Summary

### Files to Create

| File | Purpose |
|------|---------|
| `client/app/components/ui/skip-link.tsx` | Skip navigation link |
| `client/app/hooks/use-focus-trap.ts` | Focus trap for modals |
| `client/app/hooks/use-keyboard-shortcuts.ts` | Global keyboard shortcuts |
| `client/app/components/ui/keyboard-shortcuts-modal.tsx` | Shortcuts help modal |
| `client/app/components/ui/live-region.tsx` | Screen reader announcements |
| `client/vitest.setup.ts` | Axe-core test configuration |
| `tests/e2e/accessibility.spec.ts` | E2E accessibility tests |
| `docs/accessibility/audit-report.md` | Initial audit findings |
| `docs/accessibility/accessibility-statement.md` | Public statement |
| `docs/accessibility/vpat.md` | Compliance template |
| `docs/accessibility/keyboard-shortcuts.md` | Shortcuts reference |

### Files to Modify

| File | Changes |
|------|---------|
| `client/app/styles/theme.css` | Color contrast fixes |
| `client/app/index.css` | Focus utilities |
| `client/app/root.tsx` | Lang attribute, landmarks |
| `client/app/components/ui/button.tsx` | Enhanced focus styles |
| `lighthouserc.js` | Stronger assertions |
| Various component files | ARIA attributes, alt text |

---

## Success Criteria

### Phase 1 Complete When

- [ ] Lighthouse Accessibility score ≥80 on all pages
- [ ] All Level A violations documented
- [ ] Color contrast meets 4.5:1 minimum
- [ ] All images have alt text
- [ ] Heading hierarchy correct

### Phase 2 Complete When

- [ ] All functionality available via keyboard
- [ ] Focus indicators visible (3:1 contrast)
- [ ] Skip links implemented and working
- [ ] No keyboard traps
- [ ] Tab order logical on all pages

### Phase 3 Complete When

- [ ] All pages tested with NVDA and VoiceOver
- [ ] ARIA landmarks on all pages
- [ ] Live regions announce updates
- [ ] Forms fully accessible
- [ ] All interactive elements have accessible names

### Phase 4 Complete When

- [ ] Lighthouse Accessibility score ≥95
- [ ] WCAG 2.1 Level AA checklist complete
- [ ] Accessibility statement published
- [ ] VPAT created
- [ ] Automated testing in CI/CD
- [ ] Zero Level A violations
- [ ] <5 Level AA violations (documented with remediation plan)

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Color changes affect brand identity | Propose accessible alternatives that maintain brand feel |
| Third-party components non-compliant | Wrap with accessible alternatives or contribute fixes |
| Screen reader inconsistencies | Test with multiple screen readers, prioritize NVDA/VoiceOver |
| Performance impact from ARIA | Keep ARIA minimal, prefer native HTML semantics |
| User testing recruitment | Partner with disability organizations, offer compensation |

---

## Constraints

### Must Not Change

- React 19 framework
- Tailwind V4 styling approach
- Current design system colors (can adjust for contrast)
- Existing component architecture

### Compliance Requirements

- **Target:** WCAG 2.1 Level AA (minimum)
- **No tolerance:** Level A violations
- **Acceptance criteria:** Lighthouse Accessibility score ≥90

### Budget Constraints

- No third-party accessibility audit budget currently
- Self-assessment and automated testing only
- User testing with people with disabilities to be planned

---

## Next Steps

1. **Approve this plan** - Review and confirm approach
2. **Switch to Code mode** - Begin Phase 1 implementation
3. **Run initial audit** - Establish baseline metrics
4. **Iterate through phases** - Systematic implementation

---

**Document Version:** 1.0  
**Created:** February 2026  
**Author:** Kilo Code for RUN APPAREL (PVT) LTD
