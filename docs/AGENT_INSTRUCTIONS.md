# Agent Instructions

**For:** AI Coding Agents (Antigravity, Claude Code, etc.)  
**Version:** 3.0.0 (AntiGravity Protocol 0 Aligned)  
**Last Updated:** February 2026

---

## 🏛️ AntiGravity Project Constitution

**Primary Source of Truth (SSOT)**: [`gemini.md`](../gemini.md)

All agents working on this codebase MUST strictly adhere to the architectural invariants and design laws defined in `gemini.md`. This Protocol 0 constitution takes precedence over all other documentation, including this file.

---

## 🤖 Agent Role & Responsibilities

You are an AI coding agent working on the **RUN APPAREL CMS System**. This system has **strict port compliance requirements** that you MUST follow without exception.

---

## 🚨 CRITICAL RULE: PORT 5002 ABSOLUTE COMPLIANCE

**BEFORE doing ANYTHING else, read and internalize this:**

### The Port 5002 Law

**EVERY** service, configuration, API endpoint, and URL reference in this codebase MUST use port **5002**. This is **NON-NEGOTIABLE** and takes precedence over all other considerations except security.

### Your Port Responsibilities

**You MUST:**
1. ✅ Use port `5002` in ALL configurations you create or modify
2. ✅ Verify port compliance BEFORE implementing any feature
3. ✅ Run `npm run verify-port` after ANY configuration change
4. ✅ Alert the user if you find ANY non-5002 port references
5. ✅ Never suggest or implement alternative ports

**You MUST NEVER:**
1. ❌ Use environment variables without defaulting to `5002`
2. ❌ Use ports: 3000, 4000, 5000, 5001, 5003, 8080, 8000, or ANY other port
3. ❌ Make port "configurable" unless explicitly requested with 5002 as default
4. ❌ Proceed with implementation if port verification fails

---

## 🔍 Pre-Task Port Verification (MANDATORY)

**BEFORE implementing ANY task**, you MUST:

### Step 1: Check Current Port Configuration

```bash
# Verify port compliance
npm run verify-port
```

**If this fails:** STOP and report to user immediately. Do not proceed until fixed.

### Step 2: Identify Critical Files

Check these files for port `5002`:

```bash
# Check all critical configuration files
grep -E "port|PORT" vite.config.ts server/index.ts .env package.json
```

**Expected to see ONLY `5002` in results.**

### Step 3: Verify URLs in Codebase

```bash
# Check for localhost references
grep -r "localhost:" --exclude-dir=node_modules . | grep -v "5002"
```

**Should return NOTHING.** If it returns results, those are bugs to fix.

---

## 📋 Task Classification & Port Considerations

### Type 1: Port-Related Tasks

**Indicators:**
- Task mentions "port", "configuration", "server", "vite", "environment"
- Task involves modifying config files
- Task sets up new services

**Required Actions:**
1. Read `docs/core/port-5002-architecture.md` FIRST
2. Verify all changes use port `5002`
3. Run `npm run verify-port` BEFORE and AFTER changes
4. Update documentation if needed

**Example Task:**
> "Fix the development server configuration"

**Your Response:**
```markdown
I'll fix the development server configuration with port 5002 compliance.

First, let me verify the current port configuration:
[run: npm run verify-port]

Now I'll update the configuration files to ensure port 5002...
[implement changes]

Verifying port compliance after changes:
[run: npm run verify-port]

✅ Port 5002 compliance verified
```

---

### Type 2: New Page Tasks

**Indicators:**
- Task asks to create a new page
- Task mentions "add a page for..."
- Task involves new routes

**Required Actions:**
1. Read `docs/ROUTE_MAPPING.md` FIRST
2. Create BOTH public AND admin routes
3. Update `shared/constants/routeMapping.ts`
4. Ensure ALL API calls use `http://localhost:5002`
5. Document the mapping

**Example Task:**
> "Create a new testimonials page"

**Your Response:**
```markdown
I'll create a new testimonials page with both public and admin interfaces.

Plan:
- Public route: /testimonials (http://localhost:5002/testimonials)
- Admin route: /admin/testimonials (http://localhost:5002/admin/testimonials)
- API endpoints: 
  - GET /api/testimonials (public)
  - GET /admin/api/testimonials (admin, authenticated)
  - POST /admin/api/testimonials (admin, authenticated)

Let me verify port compliance first:
[run: npm run verify-port]

Now implementing...
[create files]

Updating route mapping:
[update shared/constants/routeMapping.ts]

Testing:
✓ Public page: http://localhost:5002/testimonials
✓ Admin page: http://localhost:5002/admin/testimonials
✓ API endpoints work on port 5002

✅ Feature complete with port 5002 compliance
```

**CRITICAL:** Never create a public page without its admin counterpart!

---

### Type 3: API/Backend Tasks

**Indicators:**
- Task involves Express routes
- Task mentions API endpoints
- Task involves database operations

**Required Actions:**
1. Ensure server listens on port `5002`
2. Document endpoint URLs with `http://localhost:5002` prefix
3. Separate public (`/api/*`) and admin (`/admin/api/*`) endpoints
4. Use service layer for business logic

**Example Task:**
> "Add an endpoint to get user statistics"

**Your Response:**
```markdown
I'll add an endpoint for user statistics at:
- Admin: http://localhost:5002/admin/api/users/stats (authenticated)

This will be an admin-only endpoint since user statistics are sensitive.

[create service method]
[create route handler]
[add tests]

✅ Endpoint accessible at http://localhost:5002/admin/api/users/stats
```

---

### Type 4: Frontend/UI Tasks

**Indicators:**
- Task involves React components
- Task mentions styling or UI
- Task involves user interactions

**Required Actions:**
1. Ensure API calls target `http://localhost:5002`
2. Use environment variable: `VITE_API_BASE_URL`
3. Verify page loads at correct port during testing

**Example Task:**
> "Add a loading spinner to the products page"

**Your Response:**
```markdown
I'll add a loading spinner to the products page.

[create LoadingSpinner component]
[update ProductsPage to use spinner]

Testing:
✓ Page accessible at http://localhost:5002/products
✓ API calls to http://localhost:5002/api/v1/products work correctly
✓ Spinner shows during loading

✅ Feature complete
```

---

## 🧠 Cognitive Checklist (Run Mentally Before Acting)

Before implementing ANY task, answer these questions:

```
□ Does this task involve configuration files?
  → If YES: Verify port 5002 in all configs

□ Does this task create a new public page?
  → If YES: Must also create admin page

□ Does this task involve API endpoints?
  → If YES: Ensure localhost:5002 in all URLs

□ Does this task modify server startup?
  → If YES: Hardcode PORT = 5002

□ Can I run `npm run verify-port` to check my work?
  → If YES: Run it BEFORE and AFTER changes

□ Have I updated route mapping documentation?
  → If created new pages: Update docs/ROUTE_MAPPING.md

□ Have I tested on port 5002?
  → Always verify URLs in browser/curl
```

---

## 🎯 Implementation Patterns

### Pattern 1: Server Configuration

**When:** Creating or modifying server startup code

```typescript
// ✅ CORRECT - Always do this
const PORT = 5002; // Hardcoded, no env variable
app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Admin panel: http://localhost:${PORT}/admin`);
  console.log(`✓ API base: http://localhost:${PORT}/api`);
});

// ❌ WRONG - Never do this
const PORT = process.env.PORT || 3000; // FORBIDDEN
const PORT = parseInt(process.env.PORT); // FORBIDDEN
```

**After implementation:**
```bash
npm run verify-port  # MUST pass
```

---

### Pattern 2: Vite Configuration

**When:** Setting up or modifying Vite config

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    port: 5002,              // ✅ Hardcoded
    strictPort: true,        // ✅ Fail if unavailable
    proxy: {
      '/api': {
        target: 'http://localhost:5002',  // ✅ Port 5002
        changeOrigin: true,
      },
    },
  },
});
```

**After implementation:**
```bash
npm run verify-port  # MUST pass
npm run dev          # Verify starts on port 5002
```

---

### Pattern 3: API Client Configuration

**When:** Creating API utility functions

```typescript
// ✅ CORRECT
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002/api';

export async function getProducts() {
  const response = await fetch(`${API_BASE_URL}/products`);
  return response.json();
}

// ❌ WRONG
const API_BASE_URL = 'http://localhost:3000/api'; // Wrong port
```

**Environment file (.env):**
```bash
VITE_API_BASE_URL=http://localhost:5002/api/v1
```

---

### Pattern 4: Route Creation

**When:** Adding new pages

**Step-by-step:**

1. **Create public route:**
```typescript
// client/app/routes/index.tsx
<Route path="/new-page" element={<NewPage />} />
```

2. **Create admin route (REQUIRED):**
```typescript
// client/app/routes/admin.tsx
<Route path="/admin/new-page" element={<NewPageAdmin />} />
```

3. **Create API endpoints:**
```typescript
// Public
router.get('/api/new-page', async (req, res) => {
  const data = await service.getPublished();
  res.json(data);
});

// Admin
router.get('/admin/api/new-page', isAuthenticated, async (req, res) => {
  const data = await service.getAll();
  res.json(data);
});
```

4. **Update route mapping:**
```typescript
// shared/constants/routeMapping.ts
{
  public: '/new-page',
  admin: '/admin/new-page',
  description: 'Description',
  apiEndpoint: '/api/new-page',
}
```

5. **Verify:**
```bash
npm run verify-port
curl http://localhost:5002/new-page
curl http://localhost:5002/admin/new-page
```

---

## 🚫 Anti-Patterns (NEVER DO THESE)

### Anti-Pattern 1: Environment Variable Port

```typescript
// ❌ NEVER
const PORT = process.env.PORT;
app.listen(PORT);

// ✅ CORRECT
const PORT = 5002;
app.listen(PORT);
```

### Anti-Pattern 2: Public Page Without Admin

```typescript
// ❌ NEVER - Missing admin counterpart
<Route path="/products" element={<ProductsPage />} />
// Missing: <Route path="/admin/products" ... />

// ✅ CORRECT - Both routes
<Route path="/products" element={<ProductsPage />} />
<Route path="/admin/products" element={<ProductsManagementPage />} />
```

### Anti-Pattern 3: Mixed Port References

```typescript
// ❌ NEVER - Inconsistent ports
const API_URL = 'http://localhost:3000/api';
const ADMIN_URL = 'http://localhost:5002/admin';

// ✅ CORRECT - Consistent port 5002
const API_URL = 'http://localhost:5002/api';
const ADMIN_URL = 'http://localhost:5002/admin';
```

### Anti-Pattern 4: Skipping Verification

```bash
# ❌ NEVER - No verification
git commit -m "feat: add feature"

# ✅ CORRECT - Always verify
npm run verify-port
npm run build
npm run test
git commit -m "feat: add feature"
```

---

## 📝 Response Templates

### Template 1: Starting a Task

```markdown
I'll implement [task description] with port 5002 compliance.

**Pre-flight checks:**
[run: npm run verify-port]
✅ Current configuration is port 5002 compliant

**Implementation plan:**
- [Step 1]
- [Step 2]
- [Step 3]

Let me proceed...
```

### Template 2: Found Port Issue

```markdown
⚠️ **Port Compliance Issue Detected**

While analyzing the codebase, I found a port configuration issue:
- File: `[filename]`
- Line: `[line number]`
- Issue: Using port [wrong port] instead of 5002

**Recommendation:**
Before implementing the requested feature, we should fix this port issue to maintain system consistency.

Should I:
1. Fix the port issue first, then implement the feature?
2. Proceed with the feature and note the port issue for later?

I recommend option 1 to maintain port 5002 compliance.
```

### Template 3: Creating New Page

```markdown
I'll create [page name] with full frontend-to-admin connectivity.

**Architecture:**
- Public route: http://localhost:5002/[route]
- Admin route: http://localhost:5002/admin/[route]
- Public API: http://localhost:5002/api/v1/[endpoint]
- Admin API: http://localhost:5002/admin/api/[endpoint]

**Files to create:**
- `client/app/pages/[Page].tsx`
- `client/app/pages/admin/[Page]Admin.tsx`
- `server/routes/api/[endpoint].ts`
- `server/services/[service].ts`

**Route mapping update:**
Will add entry to `shared/constants/routeMapping.ts`

Implementing...
```

### Template 4: Task Complete

```markdown
✅ **Task Complete**

**Implementation summary:**
- [What was built]
- [Files modified]

**Verification results:**
✓ `npm run verify-port` - PASSED
✓ `npm run build` - PASSED
✓ `npm run test` - PASSED

**Testing:**
✓ Public page: http://localhost:5002/[route]
✓ Admin page: http://localhost:5002/admin/[route]
✓ API endpoints working on port 5002

**Documentation updated:**
✓ Route mapping table
✓ [Any other docs]

The feature is ready for review.
```

---

## 🔧 Debugging Guide for Agents

### Issue: "npm run verify-port" fails

**Diagnosis:**
```bash
# Run verification
npm run verify-port

# Example output:
❌ vite.config.ts contains forbidden port (not 5002)
❌ server/index.ts contains forbidden port (not 5002)
```

**Solution:**
1. Open each file mentioned
2. Search for port references
3. Change ALL to `5002`
4. Re-run `npm run verify-port`

---

### Issue: Dev server starts on wrong port

**Diagnosis:**
```bash
# Check vite config
cat vite.config.ts | grep port

# Check server config
cat server/index.ts | grep PORT
```

**Solution:**
```typescript
// Fix vite.config.ts
server: {
  port: 5002,
  strictPort: true,
}

// Fix server/index.ts
const PORT = 5002;
```

---

### Issue: API calls failing with 404

**Diagnosis:**
```bash
# Check browser console
# Look for: Failed to fetch http://localhost:[wrong-port]/api/...
```

**Solution:**
```typescript
// Fix API base URL in .env
VITE_API_BASE_URL=http://localhost:5002/api/v1

// Fix API client code
const API_BASE_URL = 'http://localhost:5002/api';
```

---

## 📊 Self-Assessment Checklist

After completing ANY task, verify:

```
Agent Self-Assessment:

□ I ran `npm run verify-port` and it passed
□ I checked all new/modified files for port references
□ All port references are `5002`
□ If I created a public page, I also created an admin page
□ I updated route mapping documentation (if applicable)
□ I tested URLs manually with port 5002
□ I ran `npm run build` and it passed
□ I ran `npm run test` and it passed
□ My commit message mentions port compliance (if relevant)
□ Documentation reflects port 5002
```

**Only proceed to next task if ALL checkboxes are ticked.**

---

## 🎓 Learning Resources

**Read these BEFORE implementing complex features:**

1. `docs/PORT_5002_ARCHITECTURE.md` - System architecture
2. `docs/ROUTE_MAPPING.md` - Frontend-admin mapping
3. `RULES.md` - Coding standards (Rule #0 is port compliance)
4. `WORKFLOW.md` - Development processes

**When in doubt:**
- Search for similar patterns in existing code
- Check `shared/constants/routeMapping.ts` for examples
- Run `npm run verify-port` frequently
- Ask user for clarification

---

## 🚀 Quick Start for New Agents

**First time working on this project? Do this:**

```bash
# 1. Read critical documentation
cat RULES.md | head -100     - [ ] **Port 5002 System Architecture** (`docs/core/tech-stack.md`)

# 2. Verify current state
npm run verify-port

# 3. Check route mappings
cat shared/constants/routeMapping.ts

# 4. Start dev server
npm run dev

# 5. Test port 5002
curl http://localhost:5002/api/v1/health
```

**Now you're ready to implement tasks!**

---

## 💡 Pro Tips for AI Agents

1. **Always verify port FIRST** - It saves time
2. **Read route mapping** - Before creating new pages
3. **Use existing patterns** - Check similar implementations
4. **Test manually** - Don't assume it works
5. **Update docs** - Future you will thank you
6. **Ask when uncertain** - Better than wrong assumptions

---

## 🎯 Success Criteria

**You're doing well if:**
- ✅ `npm run verify-port` never fails on your changes
- ✅ Every public page has an admin counterpart
- ✅ User never has to ask about port issues
- ✅ All your commits pass CI/CD pipeline
- ✅ Documentation stays up-to-date

**You need to improve if:**
- ❌ Forgetting to create admin routes
- ❌ Using wrong ports in configurations
- ❌ Skipping verification steps
- ❌ Not updating documentation

---

## 📞 When to Ask for Help

**Ask the user if:**
1. Port verification fails and you can't identify the issue
2. Unsure whether to create public or admin route
3. Existing code contradicts these instructions
4. Architecture decision needed
5. Breaking changes required

**Don't ask if:**
1. Port should be 5002 (it always should)
2. Whether to verify port (always do)
3. Whether to create admin route (always do for public pages)

---

**Remember:** Port 5002 compliance is not optional. It's the foundation of this system.

**Version:** 2.0  
**Maintained by:** Development Team  
**For questions:** See `TROUBLESHOOTING.md`
