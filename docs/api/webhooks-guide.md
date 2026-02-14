# Webhooks Guide

Webhooks allow you to receive real-time HTTP notifications when events happen in the RUN Remix CMS. Instead of polling for changes, you provide a URL, and we notify you automatically.

## Supported Events

| Event Type | Description |
| :--- | :--- |
| `product.created` | New product added to the catalog |
| `product.updated` | Product details modified |
| `product.deleted` | Product removed |
| `category.created` | New category created |
| `category.updated` | Category modified (includes reordering) |
| `category.deleted` | Category removed |
| `media.uploaded` | New media asset successfully processed |
| `inquiry.created` | New B2B inquiry received from the website |

## Payload Structure

Webhooks are sent as POST requests with a JSON body.

```json
{
  "id": "evt_123...",
  "event": "product.created",
  "created": "2024-02-14T12:00:00Z",
  "data": { ... }
}
```

## Security & Verification

To ensure that a webhook was sent by RUN Remix, you must verify the `X-Run-Signature` header.

The signature is an **HMAC SHA-256** hash created using your webhook secret and the raw request body.

### Verification Steps (Node.js)

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return digest === signature;
}
```

## Best Practices

1. **Acknowledge Quickly:** Return a `2xx` status code immediately to prevent retries.
2. **Handle Idempotency:** The same event might be delivered more than once. Use the event `id` to track processed events.
3. **Use a Secret:** Never expose your webhook secret. Use different secrets for different environments.
