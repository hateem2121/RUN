## 🧱 Pull Request Summary

<!-- 🎈 5th-Grader Prompt: Describe what your Lego brick does and why the factory needs it! -->

### 🌟 What Changed

- Summary of changes

### 🎯 Why Was This Needed

- Motivation and context

---

## 🏷️ Type of Change

- [ ] 🐛 **Bug Fix** (fixes a broken button, layout glitch, or crash)
- [ ] ✨ **New Feature** (adds a new 3D model, garment tool, or CMS screen)
- [ ] 📚 **Documentation** (improves guides, Wiki pages, or SOPs)
- [ ] 🎨 **Design / Polish** (improves colors, fonts, or animations)
- [ ] 🛡️ **Security / Compliance** (tightens safety rules or dependency upgrades)
- [ ] 🧪 **Testing** (adds new unit, integration, or visual tests)

---

## 📋 Master Builder's Self-Verification Checklist

Before requesting a review, please confirm you have checked these safety lights:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   PRE-FLIGHT VERIFICATION STATUS                       │
├───────────────────────────────────┬────────────────────────────────────┤
│  COMMAND                          │  EXPECTED OUTCOME                  │
├───────────────────────────────────┼────────────────────────────────────┤
│  `npm run verify:tech-integrity`  │  🟢 All 8 checks exit 0 cleanly    │
│  `npm run check`                  │  🟢 0 TypeScript & Biome errors    │
│  `npm run test`                   │  🟢 All Vitest unit suites pass    │
│  `npm run check:docs`             │  🟢 0 broken markdown links        │
└───────────────────────────────────┴────────────────────────────────────┘
```

- [ ] 🔌 **Dev Port:** Runs exclusively on port **5002** (never 3000).
- [ ] 🛡️ **Safety Contracts:** Service methods use `neverthrow` results (no raw throws).
- [ ] 🪟 **SSR Safe:** No direct `window`/`document` access during module load.
- [ ] 📦 **Monorepo Discipline:** Shared types and schemas live in `@run-remix/shared`.
- [ ] 🎨 **Design System:** Uses Tailwind v4 `@theme` tokens in `theme.css`.

---

## 📸 Screenshots & Proof (Optional but Awesome!)

<!-- Paste terminal output, before/after screenshots, or a fun demo recording here -->
