# Admin Console Setup Guide

This guide explains how to set up and use the Replit Auth-protected admin console.

## Overview

The admin console is protected by Replit Auth with role-based access control. Users must:
1. Be **authenticated** (logged in with Replit account)
2. Have **admin permission** (isAdmin=true in database)

## Cost Optimization

Admin status checks use a 5-minute LRU cache to reduce PostgreSQL queries by ~95%:
- First admin check: Queries database
- Subsequent checks (5 min): Served from cache
- Cache automatically invalidates after 5 minutes

## Initial Setup

### 1. Verify Database Tables

The users and sessions tables should already exist from the migration:

```sql
-- Check if tables exist
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'sessions');
```

If tables are missing, run the migration SQL from `shared/schema.ts`.

### 2. First Login

1. Navigate to `/api/login` in your browser
2. Complete Replit Auth (OAuth flow)
3. You'll be redirected back to the homepage
4. Your user account is automatically created in the database with `isAdmin=false`

### 3. Promote User to Admin

**IMPORTANT**: Admin promotion must be done manually via SQL to prevent privilege escalation attacks.

```sql
-- Replace 'USER_ID_HERE' with your Replit user ID
-- You can find your ID by checking the users table after first login
UPDATE users 
SET "isAdmin" = true 
WHERE id = 'USER_ID_HERE';
```

To find your user ID:
```sql
SELECT id, email, "firstName", "lastName", "isAdmin" 
FROM users 
ORDER BY "createdAt" DESC 
LIMIT 10;
```

### 4. Verify Admin Access

1. Log out if needed: Visit `/api/logout`
2. Log back in: Visit `/api/login`
3. Check your status: Visit `/api/auth/user` (should show `isAdmin: true`)
4. Access admin console: Navigate to `/admin` in URL bar

## Using the Admin Console

### Accessing the Console

There is **no admin button in the navigation** by design. Access the admin console by typing `/admin` directly in your browser's URL bar:

```
https://your-app.replit.dev/admin
```

### What Happens

**If Not Authenticated:**
- Automatically redirected to `/api/login`
- After login, redirected back to `/admin`

**If Authenticated But Not Admin:**
- See "Access Denied" page
- Shows your email and "Return to Home" button
- Cannot access admin routes

**If Authenticated AND Admin:**
- Full access to admin console
- All `/api/admin/*` routes available

## Admin Console Features

Once logged in as admin, you have access to:

- Products Management
- Categories Management
- Media Library
- Fabrics & Materials
- Certificates
- Size Charts
- Accessories
- Navigation Settings
- Homepage Content
- About Page
- Sustainability Page
- Manufacturing Page
- Technology Page
- Contact Form Settings
- Footer Configuration
- Inquiry Management
- Storage Optimization

## Security Architecture

### Backend Protection (Enforced)

All `/api/admin/*` routes are protected by the `requireAdmin` middleware:

```typescript
// server/middleware/auth.ts
export const requireAdmin: RequestHandler = async (req, res, next) => {
  // 1. Check authentication
  // 2. Check admin status (cache-first)
  // 3. Block if not admin (403)
};
```

This protection is **server-side enforced** - cannot be bypassed by frontend manipulation.

### Frontend Protection (UI Only)

The `ProtectedAdminRoute` component provides UI-level protection:
- Shows loading spinner during auth check
- Redirects to login if not authenticated
- Shows "Access Denied" if not admin

**IMPORTANT**: Frontend protection is for UX only. Real security happens on the backend.

### Admin Status Cache

Located in `server/lib/admin-cache.ts`:
- LRU cache with 5-minute TTL
- Stores: userId → isAdmin boolean
- Reduces database load by ~95%
- Automatically invalidates on update

To manually clear the cache:
```bash
POST /api/admin/cache/clear
```

## Troubleshooting

### "Access Denied" Despite Being Admin

1. Check database: Verify `isAdmin=true` in users table
2. Clear admin cache: `POST /api/admin/cache/clear`
3. Log out and log back in: Visit `/api/logout` then `/api/login`
4. Check session: Verify cookie is set in browser dev tools

### Session Expires Quickly

Sessions last 7 days by default. If experiencing frequent logouts:
1. Check browser cookie settings (must allow cookies)
2. Verify `SESSION_SECRET` is set in Replit Secrets
3. Check PostgreSQL sessions table for active sessions

### Database Connection Issues

If authentication fails with database errors:
1. Verify `DATABASE_URL` in Replit Secrets
2. Check NEON database is active (not paused)
3. Test connection: `GET /api/health/db`

## API Endpoints

### Public Endpoints
- `GET /api/login` - Start Replit Auth flow
- `GET /api/logout` - End session and logout
- `GET /api/callback` - OAuth callback (auto-handled)

### Authenticated Endpoints
- `GET /api/auth/user` - Get current user profile + admin status

### Admin-Only Endpoints
- `GET /api/admin/*` - All admin console API routes
- `POST /api/admin/cache/clear` - Clear admin status cache
- `GET /api/admin/cache/stats` - View cache statistics

## Environment Variables Required

```bash
# Replit Auth (auto-provided)
REPL_ID=your-repl-id

# Session Secret (manual)
SESSION_SECRET=your-random-secret-key

# Database (manual)
DATABASE_URL=postgresql://...
```

## Production Checklist

Before deploying to production:

- [ ] All environment variables set in Replit Secrets
- [ ] At least one user promoted to admin
- [ ] Test login flow works
- [ ] Test admin route protection
- [ ] Verify session persistence (test across page reloads)
- [ ] Test cache performance (admin status checks should be fast)
- [ ] Configure HTTPS/SSL for secure cookies

## Cache Performance Metrics

Expected performance after warm-up:
- First admin check: ~50-100ms (database query)
- Cached admin checks: <1ms (memory lookup)
- Cache hit rate target: >95%
- Cache invalidation: Automatic after 5 minutes

View cache stats:
```bash
GET /api/admin/cache/stats
```

## Support

If you encounter issues:
1. Check server logs for auth errors
2. Verify database schema matches `shared/schema.ts`
3. Test with different browser (clear cookies)
4. Check Replit deployment logs

## Security Notes

- **Never** commit `SESSION_SECRET` to git
- **Never** expose admin status check logic to frontend
- **Always** verify admin status on backend before sensitive operations
- Admin promotion is **manual only** - cannot be done via API
- Sessions stored in PostgreSQL for persistence across deployments
