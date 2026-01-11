# Penetration Testing Policy

**Status**: Active  
**Version**: 1.0  
**Last Updated**: January 2026  
**Owner**: Security Team

---

## Overview

This document establishes the penetration testing policy for the RUN Apparel B2B Platform as part of our security assurance program.

---

## Testing Schedule

| Test Type | Frequency | Scope | Timing |
|-----------|-----------|-------|--------|
| **Full Penetration Test** | Annually | All systems | Q1 each year |
| **Web Application Test** | Semi-annually | Frontend + API | Q1 and Q3 |
| **Infrastructure Test** | Annually | Cloud infrastructure | Q2 |
| **Social Engineering** | Annually | Employee awareness | Q4 |
| **Ad-hoc Testing** | As needed | Post major releases | Within 2 weeks |

---

## Scope Definition

### In-Scope

| Asset | Description |
|-------|-------------|
| Production Web Application | runapparel.com |
| Staging Environment | staging.runapparel.com |
| API Endpoints | api.runapparel.com/api/* |
| Admin Portal | runapparel.com/admin |
| Authentication Flows | OAuth, Session Management |

### Out-of-Scope

| Asset | Reason |
|-------|--------|
| Third-party services (Neon, Upstash) | Tested by vendors |
| Google Cloud infrastructure | Covered by Google's security |
| DDoS testing | Requires separate approval |

---

## Vendor Requirements

### Minimum Qualifications

- [ ] CREST certified or equivalent (OSCP, CEH)
- [ ] Minimum 3 years web application testing experience
- [ ] Experience with Node.js/React applications
- [ ] SOC 2 Type II compliant organization
- [ ] Professional liability insurance

### Deliverables Expected

1. Executive Summary (1-2 pages)
2. Technical Findings Report
3. Risk-ranked vulnerability list
4. Proof of Concept for critical/high findings
5. Remediation recommendations
6. Retest verification

---

## Engagement Process

### Pre-Test

1. **Scoping Call**: Define objectives, timing, and constraints
2. **Authorization**: Sign Rules of Engagement and NDA
3. **Credentials**: Provide test accounts if authenticated testing
4. **Notification**: Alert on-call team of testing window

### During Test

1. **Communication**: Daily status updates for critical findings
2. **Escalation**: Immediate notification for P1 vulnerabilities
3. **Logging**: Tester IP addresses whitelisted in monitoring

### Post-Test

1. **Draft Report**: Within 5 business days
2. **Findings Review**: Technical call to discuss results
3. **Remediation**: 30-day SLA for critical, 90-day for high
4. **Retest**: Verify fixes within 2 weeks of remediation
5. **Final Report**: After retest verification

---

## Remediation SLAs

| Severity | Definition | Remediation SLA |
|----------|------------|-----------------|
| **Critical** | Direct system compromise, data breach | 7 days |
| **High** | Significant security impact | 30 days |
| **Medium** | Limited impact, requires conditions | 90 days |
| **Low** | Informational, best practice | Next release |

---

## Reporting Requirements

### Findings Template

Each finding must include:

- **Title**: Clear description
- **Severity**: Critical/High/Medium/Low/Info
- **CVSS Score**: If applicable
- **Affected Component**: URL/endpoint
- **Description**: Technical explanation
- **Steps to Reproduce**: Detailed instructions
- **Evidence**: Screenshots, request/response
- **Recommendation**: How to fix
- **References**: CWE, OWASP, etc.

---

## 2026 Testing Calendar

| Quarter | Activity | Status |
|---------|----------|--------|
| Q1 2026 | Full Penetration Test | 📅 Scheduled |
| Q2 2026 | Infrastructure Review | ⏳ Pending |
| Q3 2026 | Web Application Test | ⏳ Pending |
| Q4 2026 | Social Engineering | ⏳ Pending |

---

## Approved Vendors

| Vendor | Contact | Last Engagement |
|--------|---------|-----------------|
| *[To be selected]* | - | - |

> [!IMPORTANT]
> Contact security@runapparel.com to initiate vendor selection process.

---

## Related Documentation

- [Threat Model](./threat-model.md)
- [Incident Response](../runbooks/incident-response.md)
- [Security Scanning Workflow](../../.github/workflows/security-scanning.yml)

---

*This document is reviewed annually and updated after each penetration test.*
