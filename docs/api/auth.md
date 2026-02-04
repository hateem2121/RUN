# API Authentication

> **Strategy:** Google OAuth 2.0 + Sliding Sessions  
> **Session Store:** Upstash Redis (Serverless)

## Authentication Flow

1. **Initiate Login**
   - GET `/api/auth/google`
   - Redirects to Google Consent Screen

2. **Callback**
   - GET `/api/auth/google/callback`
   - Exchanges code for tokens
   - Creates session `sess:{id}` in Upstash Redis
   - Sets `connect.sid` cookie

3. **Session Security**
   - **Rotation:** Session ID rotates every 15 minutes.
   - **Binding:** User-Agent hash is bound to session.
   - **Expiry:** 7 days rolling.

## Admin Authorization

- Middleware: `requireAdmin` (server/services/auth-service.ts)
- Checks `is_admin` flag in PostgreSQL `users` table.
- Cached in memory for 1 minute.
