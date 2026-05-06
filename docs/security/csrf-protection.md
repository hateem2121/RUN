# CSRF Protection Strategy 🛡️

**Status:** Implemented (Double-Submit Cookie Pattern)  
**Reference:** [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)

The RUN Remix platform implements a stateless CSRF protection mechanism based on the **Double-Submit Cookie** pattern. This ensures that state-changing requests (POST, PUT, PATCH, DELETE) originate from our own application without requiring server-side session state for validation.

## 1. How it Works

1.  **Token Generation**: On every request, the `csrfTokenGenerator` middleware checks for a `csrf_token` cookie. If missing, it generates a cryptographically secure 32-byte hex token and sets it as a cookie.
2.  **Double Submission**:
    *   The browser automatically sends the `csrf_token` cookie with every request.
    *   The client-side application (React) reads the token from the cookie and includes it in a custom header: `x-csrf-token`.
3.  **Server Validation**: The `csrfValidator` middleware compares the token in the cookie with the token in the header. If they are exactly equal (verified using `crypto.timingSafeEqual`), the request is allowed.

## 2. Configuration

| Parameter | Value |
| :--- | :--- |
| **Cookie Name** | `csrf_token` |
| **Header Name** | `x-csrf-token` |
| **Cookie sameSite** | `strict` |
| **Cookie secure** | `true` (Production) / `false` (Dev) |
| **Token Length** | 32 bytes (Hex) |

## 3. Excluded Routes

Certain routes are excluded from CSRF validation:
-   **Auth Flows**: `/api/auth/google` (OAuth requires external redirects).
-   **Health Checks**: `/api/health`, `/api/health/detailed`.
-   **Public Forms**: `/api/inquiries` (Allows initial submission from public landing pages).
-   **Webhooks**: `/api/webhooks` (Verified via signature/HMAC instead).

## 4. Client Integration

The standard `apiRequest` utility in `client/app/lib/queryClient.ts` automatically handles the double submission by reading the `csrf_token` cookie and appending it to headers.

```typescript
// client/app/lib/queryClient.ts snippet
const csrfToken = getCookie('csrf_token');
if (csrfToken) {
  headers['x-csrf-token'] = csrfToken;
}
```

## 5. Security Invariants

-   **Timing Safe Comparison**: Tokens are compared using constant-time algorithms to prevent timing attacks.
-   **SameSite Strict**: The CSRF cookie is restricted to first-party context only.
-   **HttpOnly: false**: Note that the cookie is NOT HttpOnly because the client-side JavaScript MUST be able to read it to include it in the headers (required for the Double-Submit pattern).
