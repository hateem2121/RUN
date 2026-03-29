# Encryption at Rest Documentation

**Status**: Active  
**Version**: 1.0  
**Last Updated**: January 2026

---

## Overview

This document details the encryption-at-rest implementation across all RUN Apparel platform data stores, ensuring compliance with security best practices and regulatory requirements.

---

## Encryption Summary

| Data Store | Encryption | Algorithm | Key Management |
|------------|------------|-----------|----------------|
| PostgreSQL (Neon) | ✅ Enabled | AES-256-GCM | Neon-managed |
| Redis (Upstash) | ✅ Enabled | AES-256 | Upstash-managed |
| Cloud Storage (GCS) | ✅ Enabled | AES-256 | Google-managed (GMEK) |
| Session Data | ✅ Enabled | AES-256 | Via Redis encryption |
| Backups | ✅ Enabled | AES-256 | Provider-managed |

---

## PostgreSQL (Neon Serverless)

### Encryption Details

| Aspect | Implementation |
|--------|----------------|
| **Algorithm** | AES-256-GCM |
| **Key Type** | Provider-managed (default) |
| **Scope** | All data at rest |
| **Compliance** | SOC 2 Type II, ISO 27001 |

### How It Works

1. All data written to disk is automatically encrypted
2. Encryption is transparent to the application
3. Keys are rotated according to Neon's security policies
4. Backups inherit the same encryption

### CMEK Option

For enhanced control, Customer-Managed Encryption Keys (CMEK) can be enabled:
- Requires Neon Enterprise plan
- Keys stored in AWS KMS or GCP KMS
- Customer controls key rotation

---

## Redis (Upstash)

### Encryption Details

| Aspect | Implementation |
|--------|----------------|
| **In Transit** | TLS 1.2+ enforced |
| **At Rest** | AES-256 |
| **Key Management** | Upstash-managed |
| **Data Replicas** | Encrypted identically |

### Data Stored

| Key Pattern | Data Type | Sensitivity |
|-------------|-----------|-------------|
| `sess:*` | Session data | High |
| `cache:*` | Application cache | Medium |
| `rate:*` | Rate limit counters | Low |

---

## Google Cloud Storage

### Encryption Details

| Aspect | Implementation |
|--------|----------------|
| **Default** | Google-managed encryption keys (GMEK) |
| **Algorithm** | AES-256 |
| **Key Rotation** | Automatic (Google-managed) |
| **Compliance** | SOC 1/2/3, ISO 27001, FedRAMP |

### Options

1. **GMEK (Current)**: Google manages keys automatically
2. **CMEK**: Customer-managed keys in Cloud KMS
3. **CSEK**: Customer-supplied keys (requires key management)

### Bucket Configuration

```bash
# Verify encryption on bucket
gsutil encryption get gs://run-apparel-assets/

# Expected output:
# Default encryption key: Google-managed
```

---

## Application-Level Encryption

### Sensitive Fields

For additional protection, certain fields are encrypted at the application level before storage:

| Field | Encryption | Purpose |
|-------|------------|---------|
| API Keys | AES-256-GCM | Double encryption |
| OAuth tokens | AES-256-GCM | Authentication secrets |
| Session secrets | Hash (SHA-256) | Not reversible |

### Implementation

```typescript
// Example: Encrypting sensitive data
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');

export function encrypt(plaintext: string): EncryptedData {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);
  // ... implementation
}
```

---

## Key Management Best Practices

### Current Implementation

| Practice | Status |
|----------|--------|
| Keys never in source code | ✅ |
| Keys in Secret Manager | ✅ |
| Separate keys per environment | ✅ |
| Key rotation schedule | ✅ Provider-managed |
| Access logging | ✅ Cloud Audit Logs |

### Rotation Schedule

| Key Type | Rotation Frequency | Method |
|----------|-------------------|--------|
| Database encryption | Automatic | Provider-managed |
| Session secret | Manual | Every 90 days |
| API keys | On demand | User-initiated |

---

## Compliance Mapping

| Requirement | GDPR | PCI-DSS | SOC 2 | Status |
|-------------|------|---------|-------|--------|
| Encryption at rest | Art. 32 | Req. 3.4 | CC6.1 | ✅ |
| Key management | Art. 32 | Req. 3.5 | CC6.1 | ✅ |
| Access controls | Art. 32 | Req. 7 | CC6.1 | ✅ |
| Audit trails | Art. 30 | Req. 10 | CC7.2 | ✅ |

---

## Verification Commands

```bash
# Verify Neon encryption (via console or API)
# All Neon databases have encryption enabled by default

# Verify GCS bucket encryption
gsutil encryption get gs://YOUR_BUCKET_NAME/

# Verify Upstash encryption
# Encryption is enabled by default, verify via Upstash console
```

---

*This document is part of the RUN Apparel Platform security documentation.*
