# Implementation Plan: P0 Critical Security Findings

This plan details the systematic remediation of the 5 Critical (P0) findings identified in the RUN Remix security and architecture audits. All changes strictly adhere to the project's technical specifications and system invariants.

## User Review Required
> [!IMPORTANT]
> - **P0-1 (PII Redaction):** `req.body` will now be sanitized securely before any logging occurs.
> - **P0-3 (SVG XSS):** This adds `isomorphic-dompurify` to sanitize `.svg` file contents.
> - **P0-5 (OIDC):** This adds `google-auth-library` and replaces raw header spoofing checks.
> 
> Please review the changes below and approve to begin the implementation phase.

## Proposed Changes

---

### Security Infrastructure

#### [NEW] `server/lib/sanitize-for-logging.ts`
- Implement a recursive function `sanitizeForLogging(obj)` that redacts sensitive PII fields (`email`, `password`, `token`, `secret`, `ssn`, `cardnumber`, etc.).

#### [NEW] `server/lib/__tests__/sanitize-for-logging.test.ts`
- Unit tests for the new `sanitizeForLogging` covering nested objects, arrays, and partial key strings.

#### [NEW] `server/lib/verify-cloud-task-token.ts`
- Function `verifyCloudTaskToken(req: Request)` that extracts a Bearer token and verifies it using `OAuth2Client.verifyIdToken()` from `google-auth-library`.

#### [NEW] `server/lib/__tests__/verify-cloud-task-token.test.ts`
- Unit tests mocking `OAuth2Client.verifyIdToken`.

---

### Routing & Middleware Configurations

#### [MODIFY] `server/boot/middleware.ts`
- Change `nonceMiddleware` to be fully synchronous using `randomBytes` directly from `node:crypto` (`base64url`).
- Unmount `errorHandler` and replace it with `productionErrorHandler`.

#### [DELETE] `server/middleware/errorHandler.ts`
- Remove this file entirely as its logic is now delegated to `productionErrorHandler.ts`.

#### [MODIFY] `server/middleware/production-error-handler.ts`
- Include `req.body` (sanitized with `sanitizeForLogging`) within `errorDetails` and the error context logged by `logger.error(...)`.

#### [MODIFY] `server/middleware/rbac.ts`
- Replace `process.env.NODE_ENV === "development"` check with `BYPASS_RBAC_FOR_TESTING` feature flag check. If true, log `logger.warn("[RBAC] ⚠️ Role check bypassed...")`.
- Update `requireRole` array checking to correctly iterate over all `allowedRoles`.

#### [MODIFY] `server/services/auth-service.ts`
- Remove the unsafe `NODE_ENV === "development"` bypass inside `requireAdmin` (lines 371-373).

#### [MODIFY] `shared/schemas/env.schema.ts`
- Include `BYPASS_RBAC_FOR_TESTING` boolean flag with a Zod `.refine()` that strictly prevents it from being true in production.
- Include `CLOUD_TASKS_AUDIENCE` and `CLOUD_TASKS_SERVICE_ACCOUNT_EMAIL` as required strings config explicitly handling the worker OIDC verification logic in a production setting.

---

### File Processing & Workers

#### [MODIFY] `server/multer-optimized.ts`
- Replace `valid: true` shortcut with explicit parsing path for `image/svg+xml`.
- Use `isomorphic-dompurify` to strip `<script>`, `onload`, etc. Reallocate the sanitized DOM to the `file.buffer`.

#### [MODIFY] `server/routes/worker.ts`
- Strip the `X-CloudTasks-QueueName` header spoofing check.
- Replace with dynamic header verification using the new `verifyCloudTaskToken(req)` library utility.

## Open Questions
- Is there any specific error handling preferred for the Vitest configurations regarding DOMPurify if it encounters malformed XML schemas, apart from `{ valid: false }`? We plan on returning `{ valid: false, reason: "Invalid or unparseable SVG content" }`.

## Verification Plan

### Automated Tests
- Run `npm install isomorphic-dompurify google-auth-library` along with their `@types`.
- Add new unit tests for `sanitizeForLogging`, `verifyCloudTaskToken`, role bypass, SVG parsing, and synchronous nonce generation.
- Execute `npm run test` and `npm run verify:tech-integrity` ensuring 100% pass rate.
- Run `npm run build` checking for zero syntax or TypeScript errors.

### Manual Verification
- A local QA run will visually inspect log dumps upon endpoint failure to verify PII values like "email" and "password" show up strictly as `"[REDACTED]"`.
