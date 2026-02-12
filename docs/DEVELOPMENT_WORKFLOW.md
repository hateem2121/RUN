# Development Workflow

**Version:** 2.0  
**Last Updated:** February 2026  
**System:** RUN APPAREL CMS (Port 5002)

---

## Overview

This workflow ensures **port 5002 compliance** at every stage of development. All verification steps include port checking as a mandatory requirement.

---

## 🚀 Daily Development Workflow

### 1. Start Development Session

```bash
# Pull latest changes
git pull origin main

# Install/update dependencies
npm install

# CRITICAL: Verify port 5002 configuration
npm run verify-port

# Start dev server (port 5002)
npm run dev
```

**Expected Output:**
```
✓ Server running on http://localhost:5002
✓ Admin panel: http://localhost:5002/admin
✓ API base: http://localhost:5002/api/v1
```

If you see a different port, **STOP** and fix the configuration.

---

### 2. Feature Development Process

#### Step 2.1: Planning (Required for Complex Features)

**Create implementation plan if:**
- More than 100 lines of code
- Multiple files affected
- Architectural changes
- New public page (requires admin counterpart)

**Plan Template:**

```markdown
# Implementation Plan: [Feature Name]

## Summary
[2-3 sentence overview]

## Port 5002 Verification
- [ ] No new port configurations introduced
- [ ] All API calls target http://localhost:5002
- [ ] Config files remain unchanged (or updated to 5002)

## Files to Create/Modify
- `path/to/file1.ts` - [changes]
- `path/to/file2.tsx` - [changes]

## Frontend-to-Admin Mapping (if creating new pages)
- Public route: `/[route]`
- Admin route: `/admin/[route]`
- API endpoint: `/api/[endpoint]`

## Success Criteria
- [ ] npm run verify-port passes
- [ ] npm run build passes
- [ ] npm run test passes
- [ ] Route mapping updated
- [ ] Documentation updated
```

#### Step 2.2: Implementation

**Follow this order:**

1. **Create/modify files**
2. **Update route mappings** (if new pages)
3. **Run verification commands**

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# PORT 5002 VERIFICATION (MANDATORY)
npm run verify-port

# Build verification
npm run build

# Run tests
npm run test
```

**All commands must pass before proceeding.**

#### Step 2.3: Testing

**Manual Testing Checklist:**

```
□ Public page loads at http://localhost:5002/[route]
□ Admin page loads at http://localhost:5002/admin/[route]
□ API calls work from public page
□ API calls work from admin page
□ Authentication works (for admin routes)
□ No console errors
□ No 404 errors in Network tab
```

**Automated Testing:**

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests (if applicable)
npm run test:e2e
```

---

### 3. Pre-Commit Process

**CRITICAL:** Run these commands before every commit:

```bash
# Port verification (MANDATORY)
npm run verify-port

# Code quality
npm run lint
npm run typecheck

# Tests
npm run test

# Build verification
npm run build
```

**Pre-commit hook automatically runs:**
- `lint-staged` (formats code)
- `npm run verify-port`

If any command fails, **fix before committing.**

---

### 4. Commit Process

**Commit Message Format:**

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Examples:**

```bash
# Feature commit
git commit -m "feat(products): add product filtering by category"

# Port fix commit
git commit -m "fix(config): correct vite config to use port 5002"

# Documentation commit
git commit -m "docs(readme): update port 5002 setup instructions"
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting
- `refactor` - Code restructuring
- `test` - Tests
- `chore` - Maintenance
- `port` - Port configuration fix (use this for port-related changes)

---

### 5. Pull Request Process

#### PR Checklist

Before creating a PR, verify:

**Port Compliance:**
- [ ] `npm run verify-port` passes
- [ ] No new port configurations introduced
- [ ] All URLs use `http://localhost:5002`

**Code Quality:**
- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run build` passes
- [ ] `npm run test` passes

**Frontend-Admin Mapping (if applicable):**
- [ ] Public route created/modified
- [ ] Admin route created/modified (if public route added)
- [ ] Public API endpoint created/modified
- [ ] Admin API endpoint created/modified (if public API added)
- [ ] Route mapping table updated

**Documentation:**
- [ ] README updated (if needed)
- [ ] Route mapping docs updated (if new pages)
- [ ] API docs updated (if new endpoints)

**Testing:**
- [ ] Manual testing completed
- [ ] Automated tests pass
- [ ] No console errors

#### PR Template

```markdown
## Description
[Brief description of changes]

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update
- [ ] Port configuration fix

## Port 5002 Compliance
- [ ] `npm run verify-port` passes
- [ ] No new port configurations
- [ ] All endpoints target port 5002

## Frontend-Admin Mapping
- [ ] N/A - No new pages
- [ ] Public route: `/[route]`
- [ ] Admin route: `/admin/[route]`
- [ ] Route mapping updated

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots (if UI changes)
[Add screenshots]

## Checklist
- [ ] Code follows project rules
- [ ] Self-reviewed code
- [ ] Commented complex logic
- [ ] Updated documentation
- [ ] No console warnings/errors
```

---

## 📋 Specific Workflows

### Workflow A: Adding a New Public Page

**Scenario:** Adding a new "Team" page

#### Step 1: Plan

```bash
# Create planning document
cat > implementation_plan.md << 'EOF'
# Implementation Plan: Team Page

## Summary
Create team member showcase page with admin management interface

## Port 5002 Verification
- All endpoints: http://localhost:5002/api/v1/team
- No new port configs

## Frontend-Admin Mapping
- Public: /team
- Admin: /admin/team
- API: /api/team (public), /admin/api/team (admin)

## Files to Create
- client/app/pages/TeamPage.tsx
- client/app/pages/admin/TeamManagementPage.tsx
- server/routes/api/team.ts
- server/services/teamService.ts

## Success Criteria
- [ ] npm run verify-port passes
- [ ] Both routes accessible at port 5002
- [ ] Route mapping updated
EOF
```

#### Step 2: Implement Public Route

```typescript
// client/app/routes/index.tsx
<Route path="/team" element={<TeamPage />} />
```

#### Step 3: Implement Admin Route (MANDATORY)

```typescript
// client/app/routes/admin.tsx
<Route path="/admin/team" element={<TeamManagementPage />} />
```

#### Step 4: Implement API Endpoints

```typescript
// server/routes/api/public.ts
router.get('/team', async (req, res) => {
  const members = await teamService.getAllPublished();
  res.json(members);
});

// server/routes/api/admin.ts
router.get('/admin/api/team', isAuthenticated, async (req, res) => {
  const members = await teamService.getAll();
  res.json(members);
});
```

#### Step 5: Update Route Mapping

```typescript
// shared/constants/routeMapping.ts
{
  public: '/team',
  admin: '/admin/team',
  description: 'Team Page / Team Management',
  apiEndpoint: '/api/team',
}
```

#### Step 6: Verify

```bash
npm run verify-port  # MUST pass
npm run build        # MUST pass
npm run test         # MUST pass
```

#### Step 7: Test Manually

```
✓ Visit http://localhost:5002/team
✓ Visit http://localhost:5002/admin/team
✓ Verify API calls work
✓ Check admin authentication
```

#### Step 8: Update Documentation

```bash
# Update docs/ROUTE_MAPPING.md
# Add entry: | /team | /admin/team | /api/team | Team page / management |
```

#### Step 9: Commit

```bash
git add .
git commit -m "feat(team): add team page with admin management

- Created public team showcase page
- Created admin team management interface
- Added public and admin API endpoints
- Updated route mapping documentation
- All endpoints use port 5002"
```

---

### Workflow B: Fixing a Port Configuration Bug

**Scenario:** Found a reference to port 3000

#### Step 1: Identify the Issue

```bash
# Search for wrong port references
grep -r "3000" --exclude-dir=node_modules .
grep -r "8080" --exclude-dir=node_modules .
grep -r "process.env.PORT" --exclude-dir=node_modules .
```

#### Step 2: Fix All Occurrences

```bash
# Example: Fix vite.config.ts
# Change: port: 3000
# To:     port: 5002
```

#### Step 3: Verify Fix

```bash
npm run verify-port  # MUST now pass
```

#### Step 4: Test

```bash
# Start dev server
npm run dev

# Verify it starts on port 5002
# Check logs for: "Server running on http://localhost:5002"
```

#### Step 5: Commit

```bash
git commit -m "port(vite): fix config to use port 5002 instead of 3000

- Updated vite.config.ts server.port to 5002
- Verified with npm run verify-port
- All services now consistently use port 5002"
```

---

### Workflow C: Code Review Process

**As a Reviewer:**

#### Port 5002 Compliance Check

```bash
# Checkout PR branch
git checkout pr-branch-name

# FIRST: Verify port compliance
npm run verify-port

# If fails, request changes immediately
```

#### Review Checklist

**Port Configuration:**
- [ ] No new ports introduced
- [ ] All URLs use `localhost:5002`
- [ ] `npm run verify-port` passes

**Code Quality:**
- [ ] Follows TypeScript strict mode
- [ ] No `any` types
- [ ] React 19 patterns (no forwardRef)
- [ ] Express 5 async handlers

**Architecture:**
- [ ] Business logic in services (not routes)
- [ ] Public/admin separation correct
- [ ] Route mapping updated (if new pages)

**Testing:**
- [ ] Tests included
- [ ] Tests pass
- [ ] Manual testing done

**Documentation:**
- [ ] README updated (if needed)
- [ ] Comments for complex logic
- [ ] API docs updated (if needed)

#### Approval Template

```
✅ **Approved**

**Port Compliance:** ✓ Verified port 5002
**Code Quality:** ✓ Passes all checks
**Testing:** ✓ Tests pass, manually verified
**Documentation:** ✓ Updated appropriately

Nice work!
```

#### Request Changes Template

```
⚠️ **Changes Requested**

**Port Compliance Issues:**
- [ ] Found reference to port 3000 in `file.ts` line 42
- [ ] `npm run verify-port` fails with error: [error]

**Code Quality Issues:**
- [ ] Using `any` type in `file.ts` line 15
- [ ] Missing admin route for new public page

Please fix and re-request review.
```

---

## 🚨 Emergency Workflows

### Emergency: Production Port Issue

**Symptoms:** Production app not accessible or running on wrong port

#### Step 1: Check Current Configuration

```bash
# SSH into production server
ssh production-server

# Check what's running
lsof -i :5002
ps aux | grep node
```

#### Step 2: Verify Environment Variables

```bash
# Check .env file
cat /app/.env | grep PORT

# Should show: PORT=5002
```

#### Step 3: Check Server Logs

```bash
# Check startup logs
pm2 logs cms-app --lines 50

# Look for: "Server running on http://localhost:5002"
```

#### Step 4: Restart with Correct Port

```bash
# Set port explicitly
PORT=5002 pm2 restart cms-app

# Verify
curl http://localhost:5002/api/v1/health
```

#### Step 5: Update Configuration

```bash
# Fix .env
echo "PORT=5002" > /app/.env

# Restart
pm2 restart cms-app

# Save PM2 config
pm2 save
```

---

### Emergency: Dev Server Won't Start (Port Conflict)

**Symptoms:** `Error: Port 5002 is already in use`

#### Solution:

```bash
# Find process on port 5002
lsof -i :5002

# Kill the process
kill -9 <PID>

# OR kill all node processes
killall node

# Restart dev server
npm run dev
```

---

## 🔄 CI/CD Pipeline Workflow

### GitHub Actions Pipeline

**File:** `.github/workflows/ci.yml`

```yaml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Verify Port 5002 Compliance
        run: npm run verify-port
      
      - name: Lint
        run: npm run lint
      
      - name: Type Check
        run: npm run typecheck
      
      - name: Build
        run: npm run build
      
      - name: Test
        run: npm run test
      
      - name: Upload Coverage
        uses: codecov/codecov-action@v3

  deploy:
    needs: verify
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Production
        run: |
          # Deployment script
          # Ensures PORT=5002 in production
```

**Pipeline enforces:**
1. ✅ Port 5002 verification FIRST
2. ✅ Code quality checks
3. ✅ Build verification
4. ✅ Test execution
5. ✅ Deployment (if all pass)

---

## 📊 Weekly Maintenance Workflow

**Every Monday morning:**

### 1. Port Audit

```bash
# Full codebase port audit
npm run verify-port

# Check docker configs
grep -r "5002" docker-compose.yml

# Check nginx configs
grep -r "5002" nginx.conf
```

### 2. Dependency Updates

```bash
# Check for updates
npm outdated

# Update dependencies
npm update

# Verify port config still correct
npm run verify-port
```

### 3. Documentation Review

```bash
# Check if route mappings are current
cat docs/ROUTE_MAPPING.md

# Verify README has correct port info
grep "5002" README.md
```

---

## 📚 Quick Reference Commands

### Daily Development

```bash
npm run dev              # Start dev server (port 5002)
npm run verify-port      # Verify port 5002 compliance
npm run lint             # Lint code
npm run typecheck        # Type check
npm run test             # Run tests
npm run build            # Build for production
```

### Port Management

```bash
npm run verify-port      # Check port compliance
lsof -i :5002           # What's on port 5002?
kill -9 $(lsof -t -i:5002)  # Kill port 5002 process
```

### Testing

```bash
npm run test             # Unit tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
npm run test:integration # Integration tests
```

### Git Operations

```bash
git add .
npm run verify-port      # Before commit
git commit -m "type(scope): message"
git push origin branch-name
```

---

## 🎯 Success Metrics

**Daily Goals:**
- ✅ All commits pass `npm run verify-port`
- ✅ Zero port-related bugs reported
- ✅ 100% route mapping coverage (public ↔ admin)

**Weekly Goals:**
- ✅ Port audit passes
- ✅ All PRs include port verification
- ✅ Documentation up to date

**Monthly Goals:**
- ✅ Zero production port incidents
- ✅ Team trained on port compliance
- ✅ Automated checks catching all issues

---

## 🆘 Help & Support

**Port Issues:**
- Check `docs/TROUBLESHOOTING.md`
- Run `npm run verify-port` for diagnostics

**General Development:**
- See `RULES.md` for coding standards
- See `README.md` for setup instructions

**Questions:**
- Ask in #development Slack channel
- Tag @team-lead for urgent issues

---

**Maintained by:** Development Team  
**Version:** 2.0  
**Last Review:** February 2026  
**Next Review:** May 2026
