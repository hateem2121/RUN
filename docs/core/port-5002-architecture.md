# Port 5002 Architecture & Engineering Standards

**Version:** 2.0.0
**Status:** Canonical Reference
**Last Updated:** February 2026

---

## 1. Overview

The RUN Apparel CMS System is engineered to operate exclusively on **Port 5002**. This design choice ensures predictable network behavior, simplifies development environment orchestration, and prevents port-collision issues common in monorepo architectures.

## 2. Theoretical Framework

### 2.1 The Gateway Principle

In both development and production, Port 5002 serves as the unified entry point for all system interactions (UI, API, and Admin).

### 2.2 Strict Port Compliance

Every service in the monorepo is configured with `strictPort: true`. If Port 5002 is unavailable, the system must fail to start rather than fallback to an arbitrary port.

---

## 3. Implementation Details

### 3.1 Backend (Express 5)

The server entry point (`server/index.ts`) hardcodes the listening port.

```typescript
const PORT = 5002;
app.listen(PORT, () => {
    console.log(`✓ Gateway active on port ${PORT}`);
});
```

### 3.2 Frontend (Vite 7)

The development server is configured to bind to 5002 and requires strict compliance.

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    port: 5002,
    strictPort: true,
  }
});
```

### 3.3 Proxy Logic

In development, the Express server acts as the primary orchestrator, using `vite-plugin-ssr` (or custom middleware) to serve the frontend via Port 5002, while also exposing API routes on the same port.

---

## 4. Verification & Governance

### 4.1 Automated Validation

The system includes a mandatory verification script: `scripts/verify-port-5002.js`.

### 4.2 Pre-Commit Enforcement

Port compliance is enforced via Husky pre-commit hooks:

```bash
npm run verify-port
```

### 4.3 Environment Variables

Environment variables MUST default to 5002:

- `PORT=5002`
- `VITE_API_BASE_URL=http://localhost:5002/api/v1`

---

## 5. Troubleshooting Port Collisions

If Port 5002 is occupied:

1. Identify the process: `lsof -i :5002`
2. Terminate the process: `npm run kill:5002` (or `kill -9 <PID>`)
3. Restart the system: `npm run dev`

---

**Source of Truth:** Port 5002 is mandatory for all RUN Apparel CMS services.
