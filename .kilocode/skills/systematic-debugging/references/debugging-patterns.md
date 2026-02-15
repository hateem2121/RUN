# Systematic Debugging Reference Guide

## Debugging Philosophy

### The Scientific Method Applied to Debugging
Debugging is not random guessing—it's a systematic process of observation, hypothesis formation, and verification.

```
┌─────────────────────────────────────────────────────────────────┐
│                  DEBUGGING WORKFLOW                              │
│                                                                  │
│    ┌───────────┐    ┌─────────────┐    ┌─────────────┐         │
│    │  OBSERVE  │───►│  HYPOTHESIZE │───►│   ISOLATE   │         │
│    │  Gather   │    │   Form       │    │   Narrow    │         │
│    │  Facts    │    │   Theories   │    │   Down      │         │
│    └───────────┘    └─────────────┘    └─────────────┘         │
│          ▲                                     │                 │
│          │                                     ▼                 │
│    ┌───────────┐                        ┌─────────────┐         │
│    │  VERIFY   │◄───────────────────────│    FIX      │         │
│    │  Confirm  │                        │   Implement │         │
│    │  Solution │                        │   Solution  │         │
│    └───────────┘                        └─────────────┘         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Phase 1: Observe (Gather Information)

### Error Classification

| Error Type | Characteristics | Example |
|------------|-----------------|---------|
| **Syntax** | Prevents code from running | `Unexpected token` |
| **Runtime** | Crashes during execution | `TypeError: undefined is not a function` |
| **Logic** | Runs but wrong result | Calculation returns incorrect value |
| **Performance** | Slow but correct | API takes 30s to respond |
| **Intermittent** | Occurs randomly | Race condition |

### Information Gathering Checklist

```markdown
## Error Report Template

### What Happened
- Error message: [Exact error text]
- Stack trace: [Full stack trace]
- Error type: [Syntax/Runtime/Logic/Performance/Intermittent]

### When It Happened
- Timestamp: [When did it occur?]
- Frequency: [Always/Sometimes/Once]
- Trigger: [What action caused it?]

### Environment
- Node version: [node -v]
- Browser: [Chrome 120, Firefox 121, etc.]
- OS: [macOS, Windows, Linux]
- Dependencies: [Recently changed?]

### Recent Changes
- Last working commit: [git hash]
- Recent changes: [What was modified?]
- New dependencies: [Any new packages?]
```

### Log Analysis Patterns

```typescript
// ✅ Good logging for debugging
logger.info('Processing order', {
  orderId: order.id,
  userId: user.id,
  itemCount: order.items.length,
  timestamp: new Date().toISOString(),
});

// ❌ Bad logging - not useful for debugging
logger.info('Processing order');
logger.info(JSON.stringify(order)); // Too verbose, hard to parse
```

### Browser DevTools Techniques

```javascript
// Console methods for debugging
console.table(arrayOfObjects); // Display as table
console.group('Group name'); // Group related logs
console.groupEnd();
console.time('Operation'); // Measure time
console.timeEnd('Operation');
console.trace(); // Show call stack

// Breakpoint debugging
debugger; // Programmatic breakpoint

// Conditional breakpoints in DevTools
// Right-click line → Add conditional breakpoint → condition
```

## Phase 2: Hypothesize (Form Theories)

### Common Root Causes

#### 1. Null/Undefined Errors
```typescript
// Pattern: Accessing property on null/undefined
const user = getUser(); // Returns null
user.name; // TypeError: Cannot read property 'name' of null

// Fix: Optional chaining and nullish coalescing
const name = user?.name ?? 'Unknown';
```

#### 2. Type Coercion Issues
```typescript
// Pattern: Unexpected type coercion
if (value) { } // Truthy check fails for 0, '', false, null, undefined

// Fix: Explicit type checking
if (value !== null && value !== undefined) { }
if (typeof value === 'string') { }
```

#### 3. Async Timing Issues
```typescript
// Pattern: Race condition
let data = null;
fetchData().then(result => { data = result; });
console.log(data); // null - promise not resolved yet

// Fix: Proper async handling
const data = await fetchData();
console.log(data);
```

#### 4. State Mutation
```typescript
// Pattern: Accidental state mutation
const newState = state;
newState.items.push(newItem); // Mutates original state!

// Fix: Immutable updates
const newState = {
  ...state,
  items: [...state.items, newItem],
};
```

#### 5. Closure Issues
```typescript
// Pattern: Stale closure
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}
// Logs: 3, 3, 3 (not 0, 1, 2)

// Fix: Use let or IIFE
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}
```

### Hypothesis Formation Template

```markdown
## Hypothesis: [Title]

### Observation
[What I observed]

### Theory
[What I think is happening]

### Evidence For
- [Supporting evidence 1]
- [Supporting evidence 2]

### Evidence Against
- [Contradicting evidence 1]

### Test
[How I will verify this hypothesis]

### Expected Result
[What I expect if hypothesis is correct]
```

## Phase 3: Isolate (Narrow Down)

### Binary Search Debugging

```typescript
// Technique: Comment out half the code
// If error persists, it's in the remaining half
// If error disappears, it's in the commented half

function complexFunction() {
  // Part A - Comment out
  // const resultA = processA();
  // validateA(resultA);
  
  // Part B - Keep active
  const resultB = processB();
  validateB(resultB);
  
  return resultB;
}
```

### Minimal Reproduction

```typescript
// Step 1: Create minimal test case
describe('Bug reproduction', () => {
  it('should reproduce the bug', () => {
    // Minimal code to trigger the bug
    const input = { value: 0 };
    const result = processValue(input);
    expect(result).toBe(0); // Fails with actual bug
  });
});

// Step 2: Remove dependencies one by one
// Step 3: Simplify data structures
// Step 4: Remove async operations if possible
```

### Git Bisect for Finding Regressions

```bash
# Find the commit that introduced a bug
git bisect start
git bisect bad HEAD          # Current commit has bug
git bisect good v1.0.0       # This version was working

# Git will checkout commits, mark each:
git bisect good  # If bug not present
git bisect bad   # If bug present

# When found:
git bisect reset
```

### Network Request Debugging

```typescript
// Intercept and log all fetch requests
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  console.log('Fetch called with:', args);
  const response = await originalFetch(...args);
  console.log('Fetch response:', response);
  return response;
};
```

## Phase 4: Fix (Implement Solution)

### Fix Implementation Checklist

```markdown
## Before Implementing Fix

- [ ] Hypothesis verified with test
- [ ] Root cause identified with certainty
- [ ] Fix approach documented
- [ ] Considered edge cases
- [ ] No breaking changes to API

## During Implementation

- [ ] Write failing test first (TDD)
- [ ] Make minimal changes
- [ ] Add defensive coding
- [ ] Update documentation

## After Implementation

- [ ] All tests pass
- [ ] No new warnings
- [ ] Code reviewed
- [ ] Documented in commit message
```

### Defensive Coding Patterns

```typescript
// Input validation
function processUser(user: unknown): User {
  if (!user || typeof user !== 'object') {
    throw new ValidationError('Invalid user object');
  }
  
  if (!('id' in user) || typeof user.id !== 'string') {
    throw new ValidationError('User must have string id');
  }
  
  return user as User;
}

// Boundary checks
function getItem(items: Item[], index: number): Item | undefined {
  if (index < 0 || index >= items.length) {
    return undefined;
  }
  return items[index];
}

// Error boundaries
try {
  await riskyOperation();
} catch (error) {
  if (error instanceof NetworkError) {
    // Handle network errors
  } else if (error instanceof ValidationError) {
    // Handle validation errors
  } else {
    // Re-throw unknown errors
    throw error;
  }
}
```

## Phase 5: Verify (Confirm Resolution)

### Verification Checklist

```markdown
## Test Verification

- [ ] Original failing test now passes
- [ ] Edge case tests added
- [ ] Regression tests added
- [ ] Integration tests pass
- [ ] E2E tests pass (if applicable)

## Manual Verification

- [ ] Reproduced original bug
- [ ] Confirmed fix resolves it
- [ ] Tested edge cases manually
- [ ] Tested in different browsers (if frontend)

## Performance Verification

- [ ] No performance regression
- [ ] Memory usage acceptable
- [ ] No new console warnings

## Documentation

- [ ] Bug documented in changelog
- [ ] Root cause documented
- [ ] Fix documented in code comments
```

### Regression Test Pattern

```typescript
// Always add a regression test for fixed bugs
describe('Regression: Bug #123 - Order total calculation', () => {
  it('should correctly calculate total with bulk discount', () => {
    // This test would have failed before the fix
    const order = {
      items: [{ price: 10, quantity: 150 }],
    };
    
    const total = calculateOrderTotal(order);
    
    // Bulk discount: 10% off for 100+ items
    expect(total).toBe(1350); // 150 * 10 * 0.9
  });
});
```

## Common Debugging Scenarios

### Scenario 1: API Returns 500 Error

```typescript
// Debugging steps:
// 1. Check server logs
// 2. Verify request payload
// 3. Check database connection
// 4. Verify authentication

// Server-side debugging
router.post('/api/orders', async (req, res) => {
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('User:', req.user?.id);
  
  try {
    const result = await orderService.create(req.body);
    console.log('Result:', result);
    res.json(result);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: error.message });
  }
});
```

### Scenario 2: React Component Not Re-rendering

```typescript
// Debugging steps:
// 1. Check if state is actually changing
// 2. Verify props are different (reference equality)
// 3. Check for memo blocking updates
// 4. Verify context is updating

// Debug render
useEffect(() => {
  console.log('Component rendered with props:', props);
  console.log('State:', state);
});

// Check if memo is the issue
const MemoizedComponent = memo(Component, (prevProps, nextProps) => {
  console.log('Prev:', prevProps);
  console.log('Next:', nextProps);
  return prevProps.id === nextProps.id; // Custom comparison
});
```

### Scenario 3: Database Query Slow

```typescript
// Debugging steps:
// 1. Check query execution plan
// 2. Verify indexes exist
// 3. Check for N+1 queries
// 4. Analyze query complexity

// Enable query logging
const db = new Database({
  logger: {
    log: (query, time) => {
      if (time > 100) {
        console.warn(`Slow query (${time}ms):`, query);
      }
    },
  },
});

// Check execution plan
const plan = await db.query('EXPLAIN ANALYZE SELECT ...');
console.log(plan);
```

### Scenario 4: Memory Leak

```typescript
// Debugging steps:
// 1. Take heap snapshots
// 2. Compare snapshots over time
// 3. Look for detached DOM nodes
// 4. Check event listeners

// Common memory leak patterns

// Leak: Uncleaned event listeners
useEffect(() => {
  window.addEventListener('resize', handleResize);
  // Missing cleanup!
}, []);

// Fix: Add cleanup
useEffect(() => {
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);

// Leak: Uncleaned intervals
useEffect(() => {
  const interval = setInterval(pollData, 1000);
  // Missing cleanup!
}, []);

// Fix: Add cleanup
useEffect(() => {
  const interval = setInterval(pollData, 1000);
  return () => clearInterval(interval);
}, []);
```

## Debugging Tools Reference

### Node.js Debugging

```bash
# Start with debugger
node --inspect server.js

# Break on start
node --inspect-brk server.js

# Chrome DevTools
# Open chrome://inspect
```

### React DevTools

```typescript
// Profile component renders
// 1. Open React DevTools
// 2. Click Profiler tab
// 3. Click record
// 4. Interact with app
// 5. Stop recording
// 6. Analyze flame graph
```

### Network Debugging

```typescript
// Log all network requests
const originalXHR = window.XMLHttpRequest;
window.XMLHttpRequest = function() {
  const xhr = new originalXHR();
  const originalOpen = xhr.open;
  xhr.open = function(method, url) {
    console.log(`XHR: ${method} ${url}`);
    return originalOpen.apply(this, arguments);
  };
  return xhr;
};
```

## Related Resources

- [Chrome DevTools Documentation](https://developer.chrome.com/docs/devtools/)
- [Node.js Debugging Guide](https://nodejs.org/en/docs/guides/debugging-getting-started/)
- [React Debugging Guide](https://react.dev/learn/debugging)
- [RUN Remix Testing Standards](/docs/development/testing.md)
