# SOP: API Handshake (Link Protocol)

## 1. Discovery

- Identify required external service (Neon, Upstash, Resend, etc.).
- Locate credentials in `.env` and verify via `scripts/audit-env.ts` (if applicable).

## 2. Link Verification

- Utilize atomic scripts in `scripts/verify-[service].ts` (e.g., `verify-db.ts`, `verify-redis.ts`).
- Perform a "Ping" or "Whoami" request to verify connectivity.
- Scripts must return a deterministic JSON payload or exit with code 0 on success.

## 3. Self-Annealing

- If handshake fails, log the exact error and check for common failure modes (DNS, Credential expiry, Rate limits).
- Patch `.env.example` if a new variable is required.
- Do not bypass handshake failures in production.

## 4. Architectural Integration

- Only proceed to EXECUTION once the handshake script returns `"ok"` or exits successfully.
- Integration tests in `tests/integration` should rely on these handshakes for environment validation.
