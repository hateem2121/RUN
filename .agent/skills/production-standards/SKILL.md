---
name: production-standards
description: |
  Standards for performance, security, and accessibility (WCAG AA).
  Triggers: "performance optimization", "security audit", "accessibility checkout", "WCAG"
---

# Performance, Security & Accessibility

## Performance
- **Lazy Loading**: Heavy components must be code-split.
- **Image Optimization**: Use responsive images (WebP) and lazy loading.
- **3D Models**: Keep GLB files <2MB.
- **Caching**: Implement Redis caching for expensive API responses.

## Security
- **Authentication**: JWT validation in middleware.
- **Input Validation**: ALWAYS use Zod for external data.
- **Rate Limiting**: Implement on sensitive endpoints (auth/API).
- **SQL Injection**: Parameterized queries only.

## Accessibility (WCAG AA)
- **Keyboard Navigation**: All interactive elements must be keyboard-accessible.
- **ARIA**: Proper labels for screen readers.
- **Focus Management**: Manage focus for modals and dialogs.
- **Color Contrast**: Ensure 4.5:1 ratio for normal text.

## Checklists
Refer to `development-workflow-testing.md` and `performance-security-accessibility.md` for full production-ready checklists.
