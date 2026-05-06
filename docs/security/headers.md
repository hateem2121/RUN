# Security Headers Strategy 🛡️

**Status:** Implemented (via Helmet.js)  
**Reference:** [OWASP Secure Headers Project](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html)

The RUN Remix platform implements a strict security header policy to protect users against various web attacks, including XSS, Clickjacking, and MIME sniffing.

## 1. Content Security Policy (CSP)

We use a strict CSP configured via `helmet` in `server/boot/middleware.ts`.

| Directive | Configuration | Justification |
| :--- | :--- | :--- |
| **script-src** | `'self'`, `'unsafe-inline'`, `*.google.com`, `*.gstatic.com` | Allows our own scripts, Google Model Viewer, and inline scripts (required by React Router/SSR). |
| **frame-src** | `'self'`, `*.google.com` | Allows Google Maps and Model Viewer iframes. |
| **connect-src** | `'self'`, `*.google.com`, `*.gstatic.com`, `vitals.vercel-insights.com` | Allows API calls and performance monitoring. |
| **img-src** | `'self'`, `data:`, `*.google.com`, `*.gstatic.com`, `https://*` | Allows images from our CDN and external sources (configured for flexibility). |
| **font-src** | `'self'`, `https:`, `data:`, `http://localhost:5002` | Allows Google Fonts and local development fonts. |

## 2. Standard Security Headers

| Header | Value | Justification |
| :--- | :--- | :--- |
| **Strict-Transport-Security (HSTS)** | `max-age=15552000; includeSubDomains` | Enforces HTTPS for 180 days (Production only). |
| **X-Content-Type-Options** | `nosniff` | Prevents the browser from MIME-sniffing away from the declared Content-Type. |
| **X-Frame-Options** | `SAMEORIGIN` | Protects against clickjacking by preventing the site from being embedded in iframes on other domains. |
| **X-XSS-Protection** | `0` | Disables the old browser XSS filter (as recommended by modern standards when CSP is used). |
| **Referrer-Policy** | `no-referrer-when-downgrade` | Controls how much referrer information is sent with requests. |

## 3. Proxy Trust (GCLB)

In production, we configure Express to trust the Google Cloud Load Balancer (GCLB) headers:

```typescript
// server/server.ts
app.set("trust proxy", 1);
```

This ensures that `req.ip` and `req.protocol` are correctly resolved from `X-Forwarded-For` and `X-Forwarded-Proto`.

## 4. Cross-Origin Policies

-   **CrossOriginEmbedderPolicy**: Set to `false` in `middleware.ts` to allow 3D models and external media that may not send the COEP header.
-   **CORS**: Strictly enforced origin validation in production using the `STRICT_ALLOWED_ORIGINS` environment variable.
