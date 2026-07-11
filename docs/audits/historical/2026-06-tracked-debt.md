# Tracked Debt Registry (D01-D04)

## D01: Permanently Removed Dependencies Present
**Severity:** P0 (Critical)
**Status:** Closed
**Location:** 
- `server/package.json`
- `client/package.json`

**Description:**
The codebase has residual instances of tools that are permanently forbidden per `gemini.md`.
- `bullmq` (`^5.78.1`) found in server layer.
- `connect-redis` (`^9.0.0`) found in server layer.
- `@sentry/node` (`^10.32.0`) found in server layer.
- `@sentry/react` (`^10.32.0`) found in client layer.

**Remediation Required:**
- Remove dependencies from `package.json` and uninstall them.
- Purge any dead code or configuration referencing these libraries.

## D02: Missing Locomotive Scroll & GSAP Version Mismatch
**Severity:** P1 (Major)
**Status:** Closed
**Location:** 
- `client/package.json`

**Description:**
The client workspace deviates from the strict animation/scroll dependencies.
- `locomotive-scroll` (target: 5.0.1) is completely missing.
- `gsap` is installed at `^3.14.2` (target: 3.15.0).

**Remediation Required:**
- Install `locomotive-scroll@5.0.1`.
- Update `gsap` to `^3.15.0`.

## D03: Tech Integrity Check
**Severity:** None
**Status:** Passed
**Location:** Monorepo
**Description:** `verify:tech-integrity` completed successfully. Tests passed, build succeeded, and the NPM security audit passed with allowlisted advisories.

## D04: Worker Payload Schema Location Deviation
**Severity:** P2 (Minor)
**Status:** Closed
**Location:** `shared/schemas/jobs.ts`
**Description:** The payload validations for Cloud Tasks (`inquiryEmailJobSchema`, `mediaProcessingJobSchema`) currently reside in `shared/schemas/jobs.ts`. However, the strict architectural specification mandates that these payload validations must exist in `shared/schemas/worker-payloads.ts`.
**Remediation Required:** Rename `jobs.ts` to `worker-payloads.ts` and update all corresponding import paths across the `server` and `shared` layers to align with the canonical file structure.
