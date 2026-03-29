# API Error & Response Specification

**Version:** 2.0 (2026-01-09)
**Status:** ACTIVE (RFC 7807 Compliant)

---

## 1. Overview

All API endpoints in the RUN-Remix system MUST return errors compliant with **RFC 7807: Problem Details for HTTP APIs**. This ensures interoperability, automated client parsing, and consistent observability.

## 2. Response Formats

### 2.1 Success Response (HTTP 2xx)

Success responses remain unchanged and should return the resource directly or a simple envelope.

```json
{
  "success": true,
  "data": {
    // ... payload ...
  },
  "requestId": "req_12345"
}
```

### 2.2 Error Response (HTTP 4xx/5xx)

ALL error responses MUST use the `application/problem+json` content type.

```json
{
  "type": "https://api.run-remix.com/errors/validation-failed",
  "title": "Validation Failed",
  "status": 400,
  "detail": "The request contained invalid parameters.",
  "instance": "/api/subscribe",
  "requestId": "req_12345",
  "invalid-params": {
    "email": ["Invalid email format"]
  }
}
```

## 3. Standard Field Definitions

| Field | Description |
| :--- | :--- |
| `type` | A URI reference that identifies the problem type. |
| `title` | A short, human-readable summary of the problem type (should not change for the same type). |
| `status` | The HTTP status code generated for this occurrence of the problem. |
| `detail` | A human-readable explanation specific to this occurrence of the problem. |
| `instance` | A URI reference that identifies the specific occurrence of the problem (usually the request path). |
| `requestId` | **Extension Field**: The unique trace ID for this request. |
| `invalid-params` | **Extension Field**: A map of validation errors (for 400 Bad Request). |

## 4. Standard Error Types

| HTTP Status | Type URI Suffix | Title |
| :---------- | :--- | :--- |
| **400**     | `/errors/validation-failed` | Validation Failed |
| **401**     | `/errors/unauthorized` | Unauthorized |
| **403**     | `/errors/forbidden` | Forbidden |
| **404**     | `/errors/resource-not-found` | Resource Not Found |
| **409**     | `/errors/conflict` | Resource Conflict |
| **429**     | `/errors/rate-limit-exceeded` | Rate Limit Exceeded |
| **500**     | `/errors/internal-error` | Internal Server Error |
| **503**     | `/errors/service-unavailable` | Service Unavailable |

## 5. Implementation Rules

1.  **Always** set `Content-Type: application/problem+json` for errors.
2.  **Never** leak stack traces in the `detail` field.
3.  **Validation**: Use `invalid-params` extension key for field-specific errors.
