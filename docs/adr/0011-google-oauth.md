# ADR 0011: Google OAuth over Auth0/Clerk

**Status**: Accepted  
**Date**: 2026-01-13  
**Deciders**: Platform Team

## Context

We needed an authentication solution that:

- Integrates with our B2B customer base
- Minimizes external dependencies
- Provides secure session management
- Is cost-effective at scale

## Decision

We chose **Google OAuth 2.0 via Passport.js** over managed auth providers.

## Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| **Google OAuth** | Free, enterprise trust, simple | Single provider |
| **Auth0** | Multi-provider, MFA | Cost at scale, complexity |
| **Clerk** | Modern DX, components | Vendor dependency |
| **Supabase Auth** | OSS, integrated | Tied to Supabase |

## Rationale

1. **B2B Focus**: Google Workspace is ubiquitous in enterprise
2. **Zero Auth Cost**: No per-user pricing
3. **Proven Security**: Google handles credential security
4. **Passport.js**: Mature, well-documented integration
5. **Session Control**: Full control over session lifecycle

## Consequences

### Positive

- No authentication costs regardless of scale
- Enterprise customers already have Google accounts
- Session rotation and UA binding for security
- Simple implementation with passport-google-oauth20

### Negative

- Single identity provider (acceptable for B2B)
- Must manage sessions ourselves
- No built-in MFA (could add later)
