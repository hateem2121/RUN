# 🔧 Chapter 6: The "Oops!" Runbook & FAQ

**Topic:** Troubleshooting, FAQs & Common Fixes  
**Metaphor:** "The First-Aid Kit for When Things Go Wonky"  

---

## 🩹 Don't Panic: The Factory First-Aid Kit

Even the best rocket scientists and master builders run into glitches from time to time.

Here is our friendly first-aid guide to solve the most common questions and errors in 30 seconds!

```
┌────────────────────────────────────────────────────────────────────────┐
│                   THE "OOPS!" SYMPTOM-TO-CURE MATRIX                   │
├───────────────────────────────────┬────────────────────────────────────┤
│  🔴 WHAT HAPPENED? (Symptom)      │  🟢 HOW TO FIX IT (The Cure)       │
├───────────────────────────────────┼────────────────────────────────────┤
│  "Server says port in use / 3000" │  ► Remember: port is ALWAYS 5002!  │
│                                   │    Check running processes on 5002.│
│                                   │                                    │
│  "Biome formatting error in CI"   │  ► Run `npm run check:apply` to    │
│                                   │    auto-format all code in 1s.     │
│                                   │                                    │
│  "3D jersey is just a gray box"   │  ► Enable WebGL acceleration in    │
│                                   │    your browser settings.          │
│                                   │                                    │
│  "Database has no products"       │  ► Run `npm run db:seed` to fill   │
│                                   │    all 5 core categories.          │
│                                   │                                    │
│  "TypeScript compiler error"      │  ► Run `npm run typecheck` to find │
│                                   │    the exact file and line number. │
└───────────────────────────────────┴────────────────────────────────────┘
```

---

## ❓ Frequently Asked Questions (FAQ)

### Q1: Why does RUN Remix run on port 5002 instead of 3000?

**Answer:** Port 3000 is often used by many other web projects (like Next.js or React apps). To prevent accidental collisions and make sure our backend and frontend talk to each other without confusion, RUN Remix is hardcoded to run strictly on **port 5002**.

### Q2: How do I test the Admin Panel on my computer?

**Answer:** Simply navigate to `http://localhost:5002/api/auth/mock-login?returnTo=/admin/dashboard` in your browser. In local development mode, this automatically logs you in as Super Admin (`hateem@wear-run.com`) so you can test product catalogs and factory analytics!

### Q3: What is the fastest way to check if my code is ready to ship?

**Answer:** Run our master pre-flight check in your terminal:

```bash
npm run verify:tech-integrity
```

If all 8 tests pass (0 errors), your code is 100% production ready!

---

## 🧭 Still Need Help?

- Check our [Full Technical Troubleshooting Runbook](./../TROUBLESHOOTING.md).
- Ask in our [GitHub Discussions](<repository-url>/discussions).
- Open a [Bug Report](./../../.github/ISSUE_TEMPLATE/bug_report.yml).
