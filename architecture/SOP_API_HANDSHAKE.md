# SOP: API Handshake (Link Protocol)

## 1. Discovery
- Identify required external service (Shopify, Neon, Upstash, etc.).
- Locate credentials in `.env`.

## 2. Link Verification
- Create an atomic script in `scripts/verify-[service].ts`.
- Perform a "Ping" or "Whoami" request to verify connectivity.
- Return a deterministic JSON payload: `{ status: "ok", service: "name", latency: ms }`.

## 3. Self-Annealing
- If handshake fails, log the exact error and check for common failure modes (DNS, Credential expiry, Rate limits).
- Patch `.env.example` if a new variable is required.

## 4. Architectural Integration
- Only proceed to EXECUTION once the handshake script returns `"ok"`.
