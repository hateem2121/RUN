## Description
<!-- Brief description of what this PR does -->

## Type of Change
- [ ] 🐛 Bug fix (non-breaking change that fixes an issue)
- [ ] ✨ New feature (non-breaking change that adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📚 Documentation update
- [ ] 🔧 Refactoring (no functional changes)
- [ ] 🧪 Test improvements

## Related Issues
<!-- Link to related issues: Fixes #123, Relates to #456 -->

## Checklist

### Code Quality
- [ ] Biome checks pass (`npm run check`)
- [ ] TypeScript compiles without errors (`npm run typecheck`)
- [ ] Tests pass (`npm run test`)
- [ ] Coverage maintained above 70% threshold

### Security & SSR
- [ ] No `window`/`document` access at module top-level (SSR-safe)
- [ ] Input validation uses Zod schemas
- [ ] No hardcoded secrets or credentials

### Styling
- [ ] Using semantic design tokens (no raw `gray-*` colors)
- [ ] Using `cn()` for className composition
- [ ] Tailwind classes follow project conventions

### Accessibility
- [ ] Focus states implemented with `focus-visible:ring-2`
- [ ] ARIA labels present where needed
- [ ] Keyboard navigation works correctly

### Documentation
- [ ] README updated (if applicable)
- [ ] ADR created for architectural decisions
- [ ] API documentation updated (if API changes)

## Screenshots/Recordings
<!-- If applicable, add screenshots or recordings to help explain your changes -->

## Testing Instructions
<!-- Steps to test this PR locally -->
1. 
2. 
3. 

## Additional Notes
<!-- Any additional context or notes for reviewers -->
