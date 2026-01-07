# API Error & Response Specification

**Version:** 1.0 (2025-12-19)
**Status:** DRAFT (Implementation in Progress)

---

## 1. Overview

All API endpoints in the RUN-Remix system MUST return a consistent JSON text envelope. This contract ensures that the frontend can reliably parse responses without ad-hoc `try/catch` logic or guessing the error shape.

## 2. Response Envelopes

### 2.1 Success Envelope (HTTP 2xx)

```json
{
  "success": true,
  "data": {
    // ... payload ...
  },
  "meta": {
    "requestId": "req_12345",
    "timestamp": 1700000000
  }
}
```

### 2.2 Error Envelope (HTTP 4xx/5xx)

```json
{
  "success": false,
  "error": {
    "type": "ValidationError",
    "code": "INVALID_INPUT",
    "message": "The provided email is invalid.",
    "details": {
      "email": ["Invalid email format"]
    },
    "requestId": "req_12345",
    "timestamp": 1700000000
  }
}
```

## 3. Standard Error Types

| HTTP Status | Error Type           | Error Code            | Description                                                    |
| :---------- | :------------------- | :-------------------- | :------------------------------------------------------------- |
| **400**     | `ValidationError`    | `INVALID_INPUT`       | Zod schema validation failed. `details` contains field errors. |
| **400**     | `BadRequestError`    | `BAD_REQUEST`         | Generic bad request (malformed JSON, etc.).                    |
| **401**     | `UnauthorizedError`  | `UNAUTHORIZED`        | Missing or invalid authentication token.                       |
| **403**     | `ForbiddenError`     | `FORBIDDEN`           | Authenticated but permissions denied.                          |
| **404**     | `NotFoundError`      | `RESOURCE_NOT_FOUND`  | The requested resource (ID, route) does not exist.             |
| **409**     | `ConflictError`      | `CONFLICT`            | Resource state conflict (e.g., duplicate email).               |
| **429**     | `RateLimitError`     | `RATE_LIMIT_EXCEEDED` | Too many requests.                                             |
| **500**     | `InternalError`      | `INTERNAL_ERROR`      | Unhandled server exception.                                    |
| **503**     | `ServiceUnavailable` | `SERVICE_UNAVAILABLE` | Database or external service is down.                          |

## 4. Implementation Rules

1. **Never** return a plain string or raw object. Always wrap in `SuccessEnvelope` or `ErrorEnvelope`.
2. **Never** leak stack traces in the `message` field.
3. **Always** include `requestId` for correlation.
4. **Validation**: Use `details` to map field names to error arrays.

## 5. Frontend Consumption

The frontend `api.ts` client is the **only** place allowed to unwrap these envelopes. It should:

1. Check `success`.
2. If `true`, return `data`.
3. If `false`, throw a typed `ApiError` containing the envelope's error object.
