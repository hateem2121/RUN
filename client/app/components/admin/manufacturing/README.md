# Manufacturing Admin Components

## Code Quality Standards

### Console Logging Policy

- **NO** `console.log` statements in production code
- Use proper error boundaries for error handling
- Development-only logging must be wrapped in:

  ```tsx
  if (process.env.NODE_ENV === 'development') {
    console.log(...);
  }
  ```

### Biome Enforcement

Console logs are enforced via `biome.json`:

```json
{
  "linter": {
    "rules": {
      "suspicious": {
        "noConsoleLog": "error"
      }
    }
  }
}
```

Run `npm run lint` to verify compliance.

## Components

| Component | Status |
|-----------|--------|
| `HeroManagement.tsx` | ✅ Clean |
| `ProcessManagement.tsx` | ✅ Clean |
| `CapabilityManagement.tsx` | ✅ Clean |
| `QualityManagement.tsx` | ✅ Clean |
