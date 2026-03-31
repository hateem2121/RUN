# GDPR & CCPA Compliance Documentation

**Status**: Active  
**Version**: 1.0  
**Last Updated**: January 2026  
**Data Protection Officer**: <dpo@runapparel.com> *(Pending assignment - contact <security@runapparel.com>)*

---

## Overview

This document outlines how the RUN Apparel B2B Platform complies with:

- **GDPR** (General Data Protection Regulation) - EU
- **CCPA** (California Consumer Privacy Act) - California, USA

---

## Data Inventory

### Personal Data Collected

| Data Type | Purpose | Lawful Basis | Retention |
|-----------|---------|--------------|-----------|
| Email address | Account identification, communication | Contract performance | Account lifetime + 2 years |
| Name (first, last) | Personalization, business communication | Contract performance | Account lifetime + 2 years |
| Profile image (via OAuth) | User identification in UI | Legitimate interest | Account lifetime |
| IP address | Security, abuse prevention | Legitimate interest | 90 days |
| Session data | Authentication state | Contract performance | Session duration (7 days max) |
| Usage analytics | Product improvement | Legitimate interest (anonymized) | 26 months |

### Sensitive Data

| Data Type | Handling |
|-----------|----------|
| Payment information | NOT stored - handled by payment processor |
| Business addresses | Encrypted at rest, access-controlled |

---

## Data Subject Rights Implementation

### GDPR Rights (EU Users)

| Right | Implementation | Endpoint/Process |
|-------|----------------|------------------|
| **Right to Access** | User can download their data | `/api/user/data-export` |
| **Right to Rectification** | User can edit profile settings | `/admin/profile` |
| **Right to Erasure** | Account deletion with cascade | `/api/user/delete-account` |
| **Right to Portability** | JSON export of all user data | `/api/user/data-export?format=json` |
| **Right to Object** | Marketing opt-out | `/api/user/preferences` |
| **Right to Restrict** | Account suspension option | Support ticket |

### CCPA Rights (California Users)

| Right | Implementation |
|-------|----------------|
| **Right to Know** | Data export + privacy policy |
| **Right to Delete** | Account deletion |
| **Right to Opt-Out** | No data sale (we don't sell data) |
| **Right to Non-Discrimination** | Equal service regardless of privacy choices |

---

## Data Processing Agreements

### Third-Party Processors

| Processor | Purpose | DPA Status | Data Location |
|-----------|---------|------------|---------------|
| Google Cloud (Cloud Run) | Hosting | ✅ Signed | US (us-central1) |
| Neon | Database | ✅ Signed | US |
| Upstash | Redis caching | ✅ Signed | US/EU |
| Sentry | Error tracking | ✅ Signed | US |
| Google OAuth | Authentication | ✅ Google DPA | Global |

---

## Technical Safeguards

### Encryption

| Layer | Implementation |
|-------|----------------|
| **In Transit** | TLS 1.3 enforced via HSTS |
| **At Rest (Database)** | AES-256 (Neon managed) |
| **At Rest (Cache)** | TLS connection to Upstash |
| **At Rest (Storage)** | Google-managed encryption keys |
| **Backups** | Encrypted (Neon managed) |

### Access Controls

| Control | Implementation |
|---------|----------------|
| Authentication | Google OAuth 2.0 with session rotation |
| Authorization | Role-based (Admin/User) |
| Session Security | 15-minute rotation, UA binding |
| Admin Access | API key + session required |
| Audit Logging | All admin actions logged |

### Data Minimization

- Only collect data necessary for service provision
- Anonymize analytics data after 90 days
- Auto-delete inactive sessions after 7 days
- Log rotation with 90-day retention

---

## Data Retention Policy

| Data Category | Retention Period | Deletion Method |
|---------------|------------------|-----------------|
| Active user data | Account lifetime | User-initiated or inactivity |
| Deleted user data | 30 days (recovery window) | Permanent deletion |
| Audit logs | 2 years | Automated purge |
| Error logs (Sentry) | 90 days | Automated purge |
| Analytics | 26 months | Aggregation/deletion |
| Backups | 30 days | Rotation |

---

## Breach Notification Procedures

### Detection

- Sentry alerting for anomalous errors
- Cloud Audit logs for access monitoring
- Weekly security review

### Response Timeline

| Action | GDPR Requirement | Our Target |
|--------|------------------|------------|
| Internal notification | - | < 1 hour |
| Supervisory authority | 72 hours | < 48 hours |
| Data subjects | "Without undue delay" | < 72 hours |

### Incident Response

See: [docs/runbooks/incident-response.md](../runbooks/incident-response.md)

---

## Privacy by Design

### Implemented Principles

1. **Proactive not Reactive**: Security built into architecture
2. **Privacy as Default**: Minimal data collection by default
3. **Privacy Embedded**: Security middleware stack
4. **Full Functionality**: Privacy doesn't reduce features
5. **End-to-End Security**: TLS, session security, encryption
6. **Visibility**: Audit logs, user data access
7. **User-Centric**: Easy data export and deletion

---

## User-Facing Disclosures

### Required Documents

| Document | Location | Last Review |
|----------|----------|-------------|
| Privacy Policy | `/privacy` | January 2026 |
| Cookie Policy | `/cookies` | January 2026 |
| Terms of Service | `/terms` | January 2026 |

### Cookie Consent

- Banner displayed on first visit
- Granular consent options (Essential, Analytics, Marketing)
- Consent stored with timestamp
- Easy withdrawal via settings

---

## Annual Review Checklist

- [ ] Data inventory audit
- [ ] Third-party DPA verification
- [ ] Retention policy enforcement check
- [ ] Privacy policy update review
- [ ] Employee training completion
- [ ] Penetration test results review
- [ ] Incident response drill completion

---

## Contacts

| Role | Contact |
|------|---------|
| Data Protection Officer | [dpo@runapparel.com] |
| Privacy Inquiries | [privacy@runapparel.com] |
| Data Subject Requests | [privacy@runapparel.com] |

---

*This document is reviewed quarterly and updated as regulations evolve.*
