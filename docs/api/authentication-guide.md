# API Authentication

RUN Remix uses two primary authentication methods depending on the use case.

## 1. Session-Based Authentication (Dashboard)

This is used by the CMS frontend. It uses Google OAuth 2.0 to establish a secure session stored in Redis.

- **Entry Point:** `GET /api/login`
- **Protocol:** OpenID Connect / OAuth 2.0
- **Storage:** Secure HttpOnly cookies (`connect.sid`)
- **Security:** CSRF protection enabled.

### Flow

1. Redirect the user to `/api/login`.
2. After successful Google login, the user is redirected back to the app.
3. Subsequent requests include the `connect.sid` cookie automatically.

## 2. Bearer Token Authentication (API/SDK)

For service-to-server communication or custom applications, use a Bearer token.

**Header Format:**

```http
Authorization: Bearer <your_access_token>
```

### Obtaining an API Token

*Currently, API tokens are issued by the business development team. Contact [team@wear-run.com](mailto:team@wear-run.com) to request a client ID and secret.*

## Admin Privileges

Administrative actions (Creating Products, Managing Webhooks, etc.) require the `admin` role.

- If using Session Auth, the logged-in user must have the `is_admin` flag.
- If using Bearer Auth, the token must have the `admin` scope.

## Error Handling

If authentication fails, the API returns:

- `401 Unauthorized`: Missing or invalid authentication.
- `403 Forbidden`: Authenticated, but lacking required permissions (e.g., non-admin trying to delete).
