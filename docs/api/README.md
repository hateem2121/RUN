# RUN Apparel API Documentation

**Environment:** Port 5002
**API Versions:** v1 (Canonical)
**Format:** REST / JSON

---

## 1. Introduction

The RUN Apparel API provides programmatic access to the sportswear manufacturing system. It is split into two distinct security domains:

- **Public API (`/api/v1/*`)**: Optimized for high-performance frontend rendering. Returns only published content.
- **Admin API (`/admin/api/*`)**: Protected management interface for CMS operations.

## 2. Core Resources

For detailed endpoint specifications, see the following sub-documents:

| Resource | Description | Documentation |
| :--- | :--- | :--- |
| **Products** | Activewear, Teamwear, Outerwear, Casualwear catalog | [endpoints.md](./endpoints.md) |
| **Authentication** | JWT-based auth and lifecycle | [auth.md](./auth.md) |
| **Schema** | Database and validation schema reference | [schema-reference.md](./schema-reference.md) |
| **Errors** | Standardized error codes and handling | [ERROR_CODES.md](./ERROR_CODES.md) |

## 3. Global Invariants

- **Base URL**: `http://localhost:5002/api/v1`
- **Port**: Strictly 5002
- **Authentication**: JWT sent via `Authorization: Bearer <token>` or httpOnly cookies.
- **Rate Limiting**: Applied to Public API endpoints to ensure system stability.

## 4. Development & Testing

- **Local Discovery**: Testing available via Vitest and Playwright.
- **Reference Code**: See `server/routes/api/` for implementation details.

---

**Maintained by:** Development Team  
**Last Updated:** February 2026
