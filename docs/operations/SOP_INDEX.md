# RUN APPAREL CMS — Standard Operating Procedures (SOP Index)

**Version:** 4.1.2  
**Platform:** React 19 / Express 5 / Vite 8 / Neon Serverless PostgreSQL  
**Document Purpose:** Centralized operational guide and single source of truth for development, migrations, 3D assets, deployments, and incident rollbacks.

---

## 1. Code Changes & Development Workflow (SOP-01)

1. **Verify Source First:** Always confirm file paths and export shapes before adding imports.
2. **Execute Invariant Checks:** Ensure all changes adhere to React 19 standards (raw `ref`, `<form action={fn}>`, no `forwardRef`).
3. **Run Pre-Commit Verification:**

   ```bash
   npm run check:apply
   npm run check
   npm test
   ```

---

## 2. Neon Database Migrations & Safety (SOP-02)

1. **Pre-Migration Snapshot:** Always create a point-in-time branch snapshot before applying schema changes:

   ```bash
   npm run neon:snapshot
   ```

2. **Execute Migration:**

   ```bash
   npm run migrate:deploy
   ```

3. **Verify Fixtures & Egress:**

   ```bash
   npm run verify:clean-seed
   npm run verify:egress
   ```

---

## 3. 3D Model Optimization Pipeline (SOP-03)

1. **Target Budget:** All 3D GLB models must be $\le 1.5$ MB with Draco compression.
2. **Fallback Strategy:** When 3D rendering is unavailable or WebGL context is lost, components must gracefully fallback to `/images/placeholders/product-placeholder.webp`.
3. **Viewer Standard:** Use `LazyUnifiedModelViewer` with dynamic Level of Detail (LOD) and 200ms recovery gates.

---

## 4. Production Deployment & Verification (SOP-04)

1. **Quality Gates Check:** Run Protocol 0 validation:

   ```bash
   npm run verify:tech-integrity
   ```

2. **Build Verification:**

   ```bash
   npm run verify:build
   ```

3. **Container Build & Deploy:** Cloud Run deployment with native Google Cloud Tasks for async webhooks.

---

## 5. Deployment Rollback & Incident Response (SOP-05)

1. **Traffic Rollback:** Instant traffic diversion to previous known healthy revision in Google Cloud Run.
2. **Database Point-in-Time Recovery (PITR):** Reset branch state or restore from snapshot:

   ```bash
   neon branches reset <branch-id> --parent main
   ```

3. **Cache Flush:** Trigger automated cache invalidation across memory and Postgres L1 tiers.
