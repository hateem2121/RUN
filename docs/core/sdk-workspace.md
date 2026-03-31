# SDK Workspace Documentation

> **Package**: `@run-remix/sdk`  
> **Version**: 1.0.0  
> **Location**: `packages/sdk/`  
> **Last Updated**: February 2026

---

## Overview

The `@run-remix/sdk` package is the official TypeScript SDK for the RUN Remix CMS API. It provides a type-safe client for consuming the platform's REST API endpoints, with auto-generated types from the OpenAPI schema.

### Key Features

- **Type-Safe**: Auto-generated TypeScript types from OpenAPI schema
- **Retry Logic**: Built-in exponential backoff for transient failures
- **Rate Limit Handling**: Automatic retry with `Retry-After` header support
- **Modular Services**: Organized API methods by domain (products, media, categories, webhooks)
- **Custom Errors**: Rich error handling with `RunCMSError` class

---

## Installation

```bash
# From npm (when published)
npm install @run-remix/sdk

# From monorepo workspace
npm install @run-remix/sdk@workspace:*
```

---

## Quick Start

### Initialize the Client

```typescript
import { RunCMSClient } from "@run-remix/sdk";

const client = new RunCMSClient({
  baseUrl: "https://api.wear-run.com/api",
  apiKey: process.env.RUN_REMIX_API_KEY,
});
```

### Configuration Options

| Option | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `baseUrl` | `string` | Yes | - | API endpoint URL (trailing slash auto-removed) |
| `apiKey` | `string` | No | `undefined` | Bearer token for authentication |
| `maxRetries` | `number` | No | `3` | Maximum retry attempts for failed requests |
| `initialRetryDelay` | `number` | No | `1000` | Initial retry delay in milliseconds |

---

## API Reference

### Categories Service

```typescript
// List all categories with optional query parameters
const categories = await client.categories.list({
  limit: 20,
  offset: 0,
  active: "true"
});

// Create a new category
const newCategory = await client.categories.create({
  name: "Performance Wear",
  slug: "performance-wear",
  description: "High-performance sportswear category"
});
```

### Products Service

```typescript
// List products with filters
const products = await client.products.list({
  limit: 10,
  active: "true",
  category: "activewear"
});

// Get a single product by ID
const product = await client.products.get(123);
// or by SKU
const productBySku = await client.products.get("SKU-001");
```

### Media Service

```typescript
// List media assets
const media = await client.media.list({
  type: "image",
  limit: 50
});

// Get a single media item
const mediaItem = await client.media.get(456);
```

### Webhooks Service

```typescript
// List all webhook subscriptions
const webhooks = await client.webhooks.list();

// Subscribe to webhook events
const subscription = await client.webhooks.subscribe({
  url: "https://example.com/webhooks/run-remix",
  events: ["product.created", "product.updated", "order.completed"],
  secret: "webhook-signing-secret"
});
```

---

## Error Handling

The SDK throws `RunCMSError` for API errors, providing detailed error information:

```typescript
import { RunCMSClient, RunCMSError } from "@run-remix/sdk";

try {
  const product = await client.products.get("invalid-id");
} catch (error) {
  if (error instanceof RunCMSError) {
    console.error(`API Error (${error.status}): ${error.message}`);
    console.error("Error details:", error.data);
    
    // Handle specific status codes
    switch (error.status) {
      case 401:
        console.error("Authentication failed - check API key");
        break;
      case 404:
        console.error("Resource not found");
        break;
      case 429:
        console.error("Rate limit exceeded");
        break;
      case 500:
        console.error("Server error - will auto-retry");
        break;
    }
  } else {
    throw error; // Re-throw unexpected errors
  }
}
```

### RunCMSError Properties

| Property | Type | Description |
| :--- | :--- | :--- |
| `name` | `string` | Always `"RunCMSError"` |
| `message` | `string` | Human-readable error message |
| `status` | `number` | HTTP status code |
| `data` | `any` | Additional error details from API |

---

## Retry Behavior

The SDK automatically retries requests under these conditions:

### Rate Limiting (429)

- Reads `Retry-After` header if present
- Falls back to exponential backoff if header missing
- Respects `maxRetries` limit

### Server Errors (5xx)

- Uses exponential backoff: `initialRetryDelay * 2^attempt`
- Default: 1000ms → 2000ms → 4000ms

### Network Errors

- Retries on connection failures
- Uses exponential backoff

### No Retry For

- 4xx errors (except 429)
- Malformed requests (400)
- Authentication failures (401)
- Authorization errors (403)
- Not found errors (404)

---

## Type Generation

Types are auto-generated from the OpenAPI schema:

```bash
# Generate types from OpenAPI spec
cd packages/sdk
npm run generate
```

This command runs:

```bash
npx openapi-typescript ../../openapi-spec.json -o src/generated/schema.d.ts
```

### Using Generated Types

```typescript
import type { paths } from "@run-remix/sdk";

// Type-safe query parameters
type ProductsQuery = paths["/products"]["get"]["parameters"]["query"];

// Type-safe request bodies
type CreateProductBody = paths["/products"]["post"]["requestBody"]["content"]["application/json"];

// Type-safe responses
type ProductResponse = paths["/products/{id}"]["get"]["responses"]["200"]["content"]["application/json"];
```

---

## Development

### Build

```bash
cd packages/sdk
npm run build
```

Outputs to `dist/`:

- `dist/index.js` - ESM entry point
- `dist/index.d.ts` - Type declarations

### Test

```bash
cd packages/sdk
npm test
```

### Project Structure

```
packages/sdk/
├── package.json           # Package configuration
├── tsconfig.json          # TypeScript config
├── src/
│   ├── index.ts           # Public exports
│   ├── client.ts          # RunCMSClient implementation
│   └── generated/
│       └── schema.d.ts    # Auto-generated OpenAPI types
└── examples/
    └── list-products.ts   # Usage example
```

---

## Integration with Main Platform

### From Client Application

```typescript
// client/app/lib/api-client.ts
import { RunCMSClient } from "@run-remix/sdk";

export const apiClient = new RunCMSClient({
  baseUrl: import.meta.env.VITE_API_URL,
  apiKey: import.meta.env.VITE_API_KEY,
});
```

### From Server Application

```typescript
// server/lib/api-client.ts
import { RunCMSClient } from "@run-remix/sdk";
import { env } from "../config/env.js";

export const internalApiClient = new RunCMSClient({
  baseUrl: `http://localhost:${env.PORT}/api`,
  apiKey: env.INTERNAL_API_KEY,
  maxRetries: 5,
  initialRetryDelay: 500,
});
```

---

## Best Practices

### 1. Singleton Pattern

Create a single client instance and reuse it:

```typescript
// ✅ Good - single instance
const client = new RunCMSClient(config);
export { client };

// ❌ Bad - new instance per request
async function getProducts() {
  const client = new RunCMSClient(config); // Don't do this
  return client.products.list();
}
```

### 2. Environment Variables

Store sensitive configuration in environment variables:

```typescript
const client = new RunCMSClient({
  baseUrl: process.env.RUN_REMIX_API_URL!,
  apiKey: process.env.RUN_REMIX_API_KEY,
});
```

### 3. Error Boundaries

Always wrap SDK calls in try/catch:

```typescript
async function fetchProducts() {
  try {
    const response = await client.products.list();
    return { success: true, data: response };
  } catch (error) {
    if (error instanceof RunCMSError) {
      return { success: false, error: error.message };
    }
    throw error;
  }
}
```

### 4. Type Safety

Leverage generated types for compile-time safety:

```typescript
import type { paths } from "@run-remix/sdk";

async function createProduct(data: paths["/products"]["post"]["requestBody"]["content"]["application/json"]) {
  return client.products.create(data);
}
```

---

## Versioning

The SDK follows semantic versioning:

- **Major**: Breaking API changes
- **Minor**: New features, backward compatible
- **Patch**: Bug fixes, backward compatible

### Compatibility

| SDK Version | API Version | Node.js |
| :--- | :--- | :--- |
| 1.x | v1 | ≥18 |

---

## Support

- **Documentation**: `docs/api/endpoints.md`
- **Issues**: GitHub Issues
- **Contact**: <team@wear-run.com>

---

**Maintained by**: RUN APPAREL Engineering Team  
**Last Updated**: February 2026
