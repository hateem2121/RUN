# API Error Contract Standard

**Status**: Active
**Implementation**: `server/middleware/production-error-handler.ts`

---

## 1. Overview

All API endpoints in RUN-Remix MUST return errors in a consistent JSON format. Clients (React Query, fetchers) rely on this structure to parse messages and field-level validation errors.

## 2. Standard Error Response Shape

Every error response (4xx, 5xx) must follow this schema:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE_STRING",
    "message": "Human readable message for UI display",
    "details": {
      // Optional: Field-specific validation errors or context
    }
  },
  "requestId": "correlation-id-uuid"
}
```

### Field Definitions

- `success`: Always `false` for errors.
- `error.code`: A stable, machine-readable string (enum) for client logic.
  - Examples: `VALIDATION_ERROR`, `UNAUTHORIZED`, `NOT_FOUND`, `INTERNAL_SERVER_ERROR`, `RATE_LIMITED`.
- `error.message`: English description. Safe to display in a "Toast" or "Alert" for generic errors.
- `error.details`: Arbitrary JSON object.
  - For Validation: `{"email": "Invalid format", "password": "Too short"}`
- `requestId`: The `x-correlation-id` for tracking this error in logs.

---

## 3. Common Error Codes

| Status Code | Error Code              | Description                     | Client Action                          |
| :---------- | :---------------------- | :------------------------------ | :------------------------------------- |
| **400**     | `VALIDATION_ERROR`      | Request body/params invalid.    | Highlight form fields using `details`. |
| **400**     | `BAD_REQUEST`           | Malformed JSON or syntax.       | Show generic error toast.              |
| **401**     | `UNAUTHORIZED`          | Missing/Invalid Token.          | Redirect to `/login`.                  |
| **403**     | `FORBIDDEN`             | Valid token, but no permission. | Show "Access Denied" page.             |
| **404**     | `NOT_FOUND`             | Resource does not exist.        | Show 404 Component.                    |
| **429**     | `RATE_LIMITED`          | Too many requests.              | Show "Try again in X minutes".         |
| **500**     | `INTERNAL_SERVER_ERROR` | Unexpected crash.               | Show "Something went wrong" + Retry.   |
| **503**     | `SERVICE_UNAVAILABLE`   | Database/Upstream down.         | Retry with backoff.                    |

---

## 4. Frontend Types (TypeScript)

The frontend `ApiError` type should match this contract:

```typescript
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string | any>;
  };
  requestId?: string;
}
```

## 5. Middleware Implementation

The `productionErrorHandler` in Express automatically formats unknown errors into this structure:

```javascript
// Pseudo-code implementation
app.use((err, req, res, next) => {
  const code = err.code || "INTERNAL_SERVER_ERROR";
  const status = err.status || 500;

  res.status(status).json({
    success: false,
    error: {
      code,
      message: status === 500 ? "Internal Service Error" : err.message,
    },
    requestId: req.id, // from logging middleware
  });
});
```
