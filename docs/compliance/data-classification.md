# Data Classification Policy

**Status**: Active  
**Version**: 1.0  
**Last Updated**: January 2026  
**Compliance**: GDPR, CCPA

---

## Overview

This document defines how data is classified, handled, and protected within the RUN-Remix platform.

---

## Data Classification Levels

### Level 1: Public

Data that can be freely shared without restriction.

| Data Type | Examples | Handling |
|-----------|----------|----------|
| Marketing content | Product descriptions, blog posts | No restrictions |
| Public API data | Category listings, public products | Cache-friendly |

### Level 2: Internal

Business data not intended for public disclosure.

| Data Type | Examples | Handling |
|-----------|----------|----------|
| Analytics | Page views, conversion rates | Access logged |
| Operational | Error logs, performance metrics | 90-day retention |

### Level 3: Confidential

Sensitive business or customer data requiring protection.

| Data Type | Examples | Handling |
|-----------|----------|----------|
| Customer PII | Email, name, address | Encrypted at rest |
| Order data | Order history, pricing | Access controlled |
| Session data | Auth tokens, preferences | 7-day expiry |

### Level 4: Restricted

Highly sensitive data with strict access controls.

| Data Type | Examples | Handling |
|-----------|----------|----------|
| Credentials | API keys, passwords | Secret Manager |
| Financial | Payment tokens | Never stored |
| Admin access | Admin credentials | MFA required |

---

## Data Inventory

| Table/Collection | Classification | PII | Encrypted | Retention |
|------------------|----------------|-----|-----------|-----------|
| `users` | Confidential | Yes | Yes | Account lifetime |
| `sessions` | Confidential | Yes | Yes | 7 days |
| `products` | Internal | No | No | Indefinite |
| `orders` | Confidential | Yes | Yes | 7 years |
| `inquiries` | Confidential | Yes | Yes | 2 years |
| `audit_logs` | Internal | No | No | 1 year |
| `media_items` | Internal | No | No | Indefinite |

---

## PII Handling

### Personal Identifiable Information Fields

| Field | Table | Purpose | Legal Basis |
|-------|-------|---------|-------------|
| Email | users | Authentication | Contract |
| Name | users | Display | Consent |
| Address | orders | Shipping | Contract |
| Phone | inquiries | Support | Legitimate Interest |

### Data Minimization

- Only collect PII necessary for service delivery
- Anonymous analytics where possible
- No social security numbers or government IDs collected

---

## Data Subject Rights (GDPR)

### Right to Access (Art. 15)

**Request Process**:

1. User submits request via `/api/privacy/access`
2. Identity verified via email confirmation
3. Data exported within 30 days
4. Provided in JSON/CSV format

### Right to Erasure (Art. 17)

**Request Process**:

1. User submits request via `/api/privacy/delete`
2. Identity verified
3. Data marked for deletion
4. Hard delete within 72 hours
5. Confirmation email sent

**Exceptions**:

- Legal hold requirements (7-year order retention)
- Active disputes or support tickets

### Right to Portability (Art. 20)

**Export Format**: JSON  
**Included Data**: Profile, orders, preferences  
**Excluded**: Derived analytics, internal notes

---

## Retention Policy

| Data Category | Retention Period | Deletion Method |
|---------------|------------------|-----------------|
| User accounts | Until deletion requested | Soft then hard delete |
| Sessions | 7 days | Automatic expiry |
| Orders | 7 years | Archived after 2 years |
| Support tickets | 2 years | Anonymized |
| Audit logs | 1 year | Automatic purge |
| Analytics | 2 years | Aggregated after 90 days |

---

## Encryption Standards

### At Rest

| Data Type | Method | Key Management |
|-----------|--------|----------------|
| Database | AES-256 (Neon) | Managed by Neon |
| File storage | AES-256 (GCS) | Google-managed |
| Backups | AES-256 | Customer-managed keys available |

### In Transit

| Connection | Protocol | Certificate |
|------------|----------|-------------|
| Client ↔ LB | TLS 1.3 | Managed SSL |
| LB ↔ Cloud Run | TLS 1.3 | Internal |
| Server ↔ Database | TLS 1.3 | Neon-issued |

---

## Access Control

### Role-Based Access

| Role | PII Access | Admin Access | Audit Logged |
|------|------------|--------------|--------------|
| Anonymous | None | No | No |
| User | Own data only | No | No |
| Support | Read customer data | No | Yes |
| Admin | Full access | Yes | Yes |

### Audit Trail

All access to PII is logged with:

- User ID
- Action performed
- Timestamp
- IP address (pseudonymized)

---

## Incident Response

### Data Breach Procedure

1. **Detection**: Automated alerts via Sentry/monitoring
2. **Containment**: Immediate access revocation
3. **Assessment**: Determine scope and impact
4. **Notification**: Within 72 hours per GDPR Art. 33
5. **Remediation**: Address vulnerability
6. **Review**: Post-incident analysis

### Breach Notification

| Audience | Timeline | Method |
|----------|----------|--------|
| DPA (Supervisory Authority) | 72 hours | Official form |
| Affected Users | Without undue delay | Email |
| Internal Stakeholders | Immediate | Slack/PagerDuty |

---

## Compliance Checklist

- [x] Privacy policy published
- [x] Cookie consent implemented
- [x] Data export functionality
- [x] Account deletion process
- [x] Encryption at rest
- [x] Encryption in transit
- [x] Access logging
- [x] Retention policy defined
- [ ] Annual privacy impact assessment (scheduled Q2 2026)
- [ ] Third-party processor agreements (in progress)

---

## Related Documents

- [Threat Model](../security/threat-model.md)
- [Encryption at Rest](../security/encryption-at-rest.md)
- [Incident Response Runbook](../runbooks/incident-response.md)
