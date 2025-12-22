# System Error Codes

> Auto-generated from source code. Do not edit manually.

| Error Code | Status | Class Name | Description |
| :--- | :--- | :--- | :--- |
| **INVALID_INPUT** | 400 | `ValidationError` | Validation Failed |
| **BAD_REQUEST** | 400 | `BadRequestError` | Bad Request |
| **UNAUTHORIZED** | 401 | `UnauthorizedError` | Unauthorized |
| **FORBIDDEN** | 403 | `ForbiddenError` | Forbidden |
| **RESOURCE_NOT_FOUND** | 404 | `NotFoundError` | Resource Not Found |
| **CONFLICT** | 409 | `ConflictError` | Resource Conflict |
| **RATE_LIMIT_EXCEEDED** | 429 | `RateLimitError` | Too many requests, please try again later. |
| **INTERNAL_ERROR** | 500 | `InternalError` | Internal Server Error |

## Implementation Guide

Use these error classes in your controllers:

```typescript
import { NotFoundError, ValidationError } from '../errors/AppError';

// throw new NotFoundError("Product not found");
```
