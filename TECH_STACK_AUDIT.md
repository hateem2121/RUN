# Tech Stack Health, Security & Tooling Audit (Late 2025)

**Role:** Senior Full-Stack Technical Auditor
**Date:** December 22, 2025
**Project:** RUN-Remix (Custom React + Express)

## 1. Executive Summary

The project is running a modern stack (React 19, Express 5, Tailwind 4, Biome) but has a **CRITICAL** security vulnerability in its React version. The backend architecture is robust with proper async error handling and correlation IDs. Development tooling is largely up-to-date, though the VS Code debugging configuration needs adjustment for the Express backend.

| Category                    | Status          | Summary                                                                            |
| :-------------------------- | :-------------- | :--------------------------------------------------------------------------------- |
| **Security & Dependencies** | 🔴 **CRITICAL** | React 19.0.0 is vulnerable (CVE-2025-55182). Immediate update required.            |
| **Performance**             | 🟢 **OK**       | React Scan & Compiler active. `useOptimistic` utilized.                            |
| **Debugging & Tools**       | 🟡 **WARNING**  | VS Code `launch.json` targets Chrome (wrong port/target for server). Biome in use. |
| **Error Handling**          | 🟢 **OK**       | Backend: Native Async + AsyncLocalStorage. Frontend: Granular Boundaries present.  |
| **CSS & UI**                | 🟢 **OK**       | Tailwind 4 integrated via Vite.                                                    |

---

## 2. Detailed Findings

### 1. Security & Dependency Audit

- **React 19 Vulnerability (CVE-2025-55182)**:
  - **Current**: `^19.0.0`
  - **Risk**: High. The defined version falls within the vulnerable range (19.0.0 - 19.2.0).
  - **Action**: Update to `19.2.1` or later immediately.
- **Express 5.x**:
  - **Current**: `^5.1.0`
  - **Findings**: Correctly implemented without `express-async-errors`.
- **Deprecated Packages**:
  - `node-fetch`: `^2.7.0`.
  - **Recommendation**: Replace with native Node.js `fetch` (available in Node 18+ and Express 5 environments) to reduce bundle size and dependencies.

### 2. Performance & React Scan Integration

- **React Scan**: Integrated via `@react-scan/vite-plugin-react-scan`.
  - **Status**: Active in development mode.
- **React 19 Features**:
  - `babel-plugin-react-compiler`: **Active** (Target 19).
  - `useOptimistic`: **Found** (Used in `NewsletterSignup` and `EnhancedProductDetail`).
  - `useActionState`: **Not Found**. (Ensure new form actions use this or `useFormState` if strictly following React 19 patterns, though not critical if standard handlers work).

### 3. Debugging & Extensions

- **VS Code Debugger (`launch.json`)**:
  - **Status**: ❌ **Incorrect**. Configured for Chrome on port 8080.
  - **Reality**: Server runs on port 5001. No Node.js attach configuration found.
- **Extensions**:
  - **Tailwind CSS v4**: `@tailwindcss/vite` plugin active. Ensure "Tailwind CSS IntelliSense" extension is updated to v0.13+ (or v4 specific version).
  - **Linting**: **Biome** is used (`@biomejs/biome`) instead of ESLint/Prettier. This is a modern, faster alternative and is correctly configured (`biome.json` present).

### 4. Error Handling & Resilience

- **Backend**:
  - **Mechanism**: Native Express 5 Promise rejection handling.
  - **Tracing**: `AsyncLocalStorage` confirmed in `correlation-id.ts`. Status: **Excellent**.
- **Frontend**:
  - **Strategy**: Granular `ResourceErrorBoundary` used around resource routes.
  - **Global**: `window.onerror` and `unhandledrejection` listeners present in `App.tsx`.
  - **Recommendation**: Ensure a top-level React Error Boundary (wrapping `Router`) exists to catch render crashes outside of resource routes.

### 5. CSS & UI Audit

- **Tailwind CSS v4**:
  - **Engine**: Oxide engine active via `@tailwindcss/vite`.
  - **Optimization**: CSS processing is modern.
- **CLS**: `SmoothScrollLayout` and `LazyLoadingUtils` present to mitigate layout shifts.

---

## 3. Recommended Actions & Commands

### A. Critical Security Fix (React 19)

Update React to the safe version.

```bash
npm install react@^19.2.1 react-dom@^19.2.1
```

### B. Remove Deprecated Dependencies

Remove `node-fetch` and use native `fetch`.

```bash
npm uninstall node-fetch @types/node-fetch
```

### C. Fix VS Code Server Debugging

Create/Update `.vscode/launch.json` with a Node.js Attach config.

**Recommended `.vscode/launch.json` content:**

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Express Server",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/server/index.ts",
      "runtimeArgs": ["--loader", "tsx"],
      "env": { "NODE_ENV": "development", "PORT": "5001" },
      "console": "integratedTerminal"
    },
    {
      "type": "chrome",
      "request": "launch",
      "name": "Debug Client (Chrome)",
      "url": "http://localhost:5001",
      "webRoot": "${workspaceFolder}/client"
    }
  ]
}
```

### D. Recommended Free Tools (to verify correctness)

- **Biome** (Already Installed): Keep updated.
- **Totals** (VS Code Extension): For keeping track of TODOs.
- **Pretty TypeScript Errors**: VS Code extension for readable TS errors.

---

**Audit Status**: 🟡 **WARNING** (due to React CVE and Debugger Config).
**Code Health**: High.
