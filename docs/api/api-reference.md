# Enhanced API Documentation Guide

## Overview

The RUN Apparel B2B Platform API is documented via **OpenAPI 3.0** with auto-generated Swagger UI available at `/api/docs`.

---

## API Base URLs

| Environment | Base URL |
|-------------|----------|
| Development | `http://localhost:5001/api` |
| Staging | `https://staging.runapparel.com/api` |
| Production | `https://api.runapparel.com/api` |

---

## Authentication

All protected endpoints require session-based authentication via **Google OAuth 2.0**.

### Authentication Flow

1. **Initiate Login**: `GET /api/auth/google`
2. **OAuth Callback**: `GET /api/auth/google/callback`
3. **Session Cookie**: `connect.sid` is set automatically
4. **Logout**: `POST /api/auth/logout`

### Admin Endpoints

Admin routes (`/api/admin/*`) require:
- Valid session cookie
- User role: `admin`
- API key header for sensitive operations: `X-API-Key: <key>`

---

## Rate Limiting

| Endpoint Category | Limit | Window |
|-------------------|-------|--------|
| Public API | 100 req | 1 min |
| Authenticated | 500 req | 1 min |
| Admin | 1000 req | 1 min |
| Media Upload | 10 req | 1 min |

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704672000
```

---

## Standard Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2026-01-12T18:00:00Z"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid product ID format",
    "details": [
      { "field": "id", "message": "Must be a valid UUID" }
    ]
  },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2026-01-12T18:00:00Z"
  }
}
```

---

## Error Codes Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request body/params failed validation |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource does not exist |
| `CONFLICT` | 409 | Resource already exists |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server-side error |
| `SERVICE_UNAVAILABLE` | 503 | Downstream service error |

---

## Core Endpoints

### Products

#### List Products

```http
GET /api/products?page=1&limit=20&category=running
```

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page (max 100) |
| category | string | - | Filter by category slug |
| sort | string | createdAt | Sort field |
| order | string | desc | Sort order (asc/desc) |

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 145,
      "totalPages": 8
    }
  }
}
```

---

#### Get Product

```http
GET /api/products/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716",
    "slug": "performance-running-tee",
    "name": "Performance Running Tee",
    "description": "...",
    "priceData": { "base": 4500, "currency": "USD" },
    "category": { "id": "...", "name": "Running" },
    "materials": [...],
    "media": [...]
  }
}
```

---

### Categories

#### List Categories

```http
GET /api/categories
```

#### Get Category with Products

```http
GET /api/categories/:slug/products
```

---

### Media

#### Upload Media

```http
POST /api/media/upload
Content-Type: multipart/form-data

file: <binary>
type: "image" | "model" | "video"
productId?: <uuid>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "url": "https://storage.googleapis.com/...",
    "type": "image",
    "mimeType": "image/webp",
    "size": 45230
  }
}
```

---

### Health Checks

#### Basic Health

```http
GET /api/health
```

**Response:** `200 OK` or `503 Service Unavailable`

#### Database Health

```http
GET /api/health/db
```

**Response:**
```json
{
  "status": "healthy",
  "latency": 12,
  "poolMetrics": {
    "totalQueries": 15000,
    "successfulQueries": 14998,
    "averageQueryTime": 8
  }
}
```

---

## Caching Headers

Responses include caching headers for CDN optimization:

```http
Cache-Control: public, max-age=3600, s-maxage=86400
ETag: "abc123"
Vary: Accept-Encoding
```

---

## API Versioning

The API currently uses URL path versioning for major changes:

- Current: `/api/v1/*` (aliased to `/api/*`)
- Legacy: `/api/v0/*` (deprecated, removed 2026-06-01)

---

## SDK & Postman Collection

- **TypeScript SDK**: Generated from OpenAPI spec
- **Postman Collection**: [Download](./postman-collection.json)
- **OpenAPI Spec**: Available at `/api/docs/openapi.json`

---

## Contact

For API support, contact: **api-support@runapparel.com**
