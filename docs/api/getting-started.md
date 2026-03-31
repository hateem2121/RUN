# Getting Started with RUN Remix API

Welcome to the RUN Remix API. Our API provides programmatic access to the sportswear manufacturing CMS, allowing you to manage products, categories, media, and inquiries.

## Core Concepts

### Base URL

All API requests should be made to:

- Production: `https://wear-run.com/api`
- Development: `http://localhost:5002/api`

### Response Format

The API follows a standard JSON response format for all success and error states.

**Success Response:**

```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response:**

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": []
  }
}
```

## Security & Authentication

RUN Remix supports two main authentication methods:

1. **Session-based (Browser):** Used for the CMS dashboard.
2. **Bearer Token (M2M):** Used for server-to-server or SDK integrations.

See the [Authentication Guide](./authentication-guide.md) for details.

## Rate Limiting

To ensure stability, we enforce rate limits on all endpoints:

- **Public endpoints:** 60 requests per minute.
- **Admin endpoints:** 300 requests per minute.

If you exceed these limits, the API will return a `429 Too Many Requests` status.

## Next Steps

- Explore the [API Reference](/api-docs) for detailed endpoint specifications.
- Set up [Webhooks](./webhooks-guide.md) to receive real-time updates.
- Try out requests in the [Interactive Playground](/developer/playground).
