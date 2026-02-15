# Test-Driven Development Reference Guide

## TDD Principles

### The Three Laws of TDD
1. **Write no production code** except to pass a failing test
2. **Write only enough of a test** to demonstrate a failure
3. **Write only enough production code** to pass the test

### Red-Green-Refactor Cycle

```
┌─────────────────────────────────────────────────────────────┐
│                     TDD CYCLE                                │
│                                                              │
│    ┌─────────┐      ┌─────────┐      ┌───────────┐         │
│    │   RED   │ ───► │  GREEN  │ ───► │ REFACTOR  │ ─┐      │
│    │  FAIL   │      │  PASS   │      │  IMPROVE  │  │      │
│    └─────────┘      └─────────┘      └───────────┘  │      │
│         ▲                                            │      │
│         └────────────────────────────────────────────┘      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Test Patterns by Category

### 1. Service Layer Tests

#### Basic CRUD Operations
```typescript
// Pattern: Arrange-Act-Assert
describe('userService', () => {
  describe('createUser', () => {
    it('should create user with valid data', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
      };

      // Act
      const result = await userService.create(userData);

      // Assert
      expect(result).toMatchObject(userData);
      expect(result.id).toBeDefined();
    });

    it('should throw ValidationError for invalid email', async () => {
      // Arrange
      const invalidData = { email: 'invalid-email', name: 'Test' };

      // Act & Assert
      await expect(userService.create(invalidData))
        .rejects.toThrow(ValidationError);
    });
  });
});
```

#### Business Logic Tests
```typescript
describe('orderService.calculateTotal', () => {
  it('should apply bulk discount for orders over 100 units', async () => {
    // Arrange
    const order = {
      items: [{ productId: 'p1', quantity: 150, unitPrice: 10 }],
    };

    // Act
    const total = orderService.calculateTotal(order);

    // Assert
    expect(total).toBe(1350); // 150 * 10 * 0.9 (10% discount)
  });

  it('should not apply discount for orders under 100 units', async () => {
    const order = {
      items: [{ productId: 'p1', quantity: 50, unitPrice: 10 }],
    };

    const total = orderService.calculateTotal(order);

    expect(total).toBe(500); // No discount
  });
});
```

### 2. React Component Tests

#### Component Rendering
```typescript
describe('ProductCard', () => {
  it('should render product information', () => {
    const product = {
      id: '1',
      name: 'Test Product',
      price: 29.99,
    };

    render(<ProductCard product={product} />);

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$29.99')).toBeInTheDocument();
  });

  it('should show sale badge when on sale', () => {
    const saleProduct = {
      id: '1',
      name: 'Sale Product',
      price: 19.99,
      onSale: true,
      discount: 20,
    };

    render(<ProductCard product={saleProduct} />);

    expect(screen.getByText('20% OFF')).toBeInTheDocument();
  });
});
```

#### User Interactions
```typescript
describe('ProductCard interactions', () => {
  it('should call onAddToCart when button clicked', async () => {
    const onAddToCart = vi.fn();
    const product = { id: '1', name: 'Test', price: 10 };

    render(<ProductCard product={product} onAddToCart={onAddToCart} />);

    await userEvent.click(screen.getByRole('button', { name: /add to cart/i }));

    expect(onAddToCart).toHaveBeenCalledWith('1');
    expect(onAddToCart).toHaveBeenCalledTimes(1);
  });

  it('should be keyboard accessible', async () => {
    const onSelect = vi.fn();
    const product = { id: '1', name: 'Test', price: 10 };

    render(<ProductCard product={product} onSelect={onSelect} />);

    const card = screen.getByRole('button');
    card.focus();
    await userEvent.keyboard('{Enter}');

    expect(onSelect).toHaveBeenCalledWith('1');
  });
});
```

### 3. API Endpoint Tests

#### RESTful Endpoints
```typescript
describe('GET /api/products', () => {
  it('should return paginated products', async () => {
    const response = await request(app)
      .get('/api/products')
      .query({ page: 1, pageSize: 10 });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('pagination');
    expect(response.body.data).toBeInstanceOf(Array);
  });

  it('should filter by category', async () => {
    const response = await request(app)
      .get('/api/products')
      .query({ category: 'activewear' });

    expect(response.status).toBe(200);
    response.body.data.forEach((product: Product) => {
      expect(product.category).toBe('activewear');
    });
  });
});

describe('POST /api/products', () => {
  it('should create product with valid data', async () => {
    const productData = {
      name: 'New Product',
      price: 49.99,
      category: 'activewear',
    };

    const response = await request(app)
      .post('/api/products')
      .send(productData);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject(productData);
  });

  it('should return 400 for invalid data', async () => {
    const invalidData = { name: '', price: -10 };

    const response = await request(app)
      .post('/api/products')
      .send(invalidData);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('errors');
  });
});
```

### 4. Custom Hook Tests

```typescript
describe('useProduct', () => {
  it('should fetch product on mount', async () => {
    const mockProduct = { id: '1', name: 'Test' };
    vi.mocked(productService.getById).mockResolvedValue(mockProduct);

    const { result } = renderHook(() => useProduct('1'));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toEqual(mockProduct);
    });
  });

  it('should handle errors', async () => {
    vi.mocked(productService.getById).mockRejectedValue(new Error('Not found'));

    const { result } = renderHook(() => useProduct('invalid'));

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(result.current.data).toBeNull();
    });
  });
});
```

## Test Doubles

### Mocks vs Stubs vs Fakes

```typescript
// Mock - Verifies behavior
const mockRepository = {
  save: vi.fn().mockResolvedValue({ id: '1' }),
};

// Stub - Provides canned answers
const stubRepository = {
  findById: vi.fn().mockResolvedValue({ id: '1', name: 'Test' }),
};

// Fake - Working implementation
class FakeRepository implements IRepository {
  private items: Map<string, Product> = new Map();

  async save(product: Product) {
    this.items.set(product.id, product);
    return product;
  }

  async findById(id: string) {
    return this.items.get(id) ?? null;
  }
}
```

## Coverage Guidelines

### Priority Coverage Targets
| Layer | Target | Rationale |
|-------|--------|-----------|
| Services | 90%+ | Business logic, critical path |
| API Routes | 85%+ | Integration points |
| Complex Components | 80%+ | User interactions |
| Utilities | 80%+ | Pure functions, edge cases |
| Simple Components | 70%+ | Presentational only |

### What to Test
- ✅ Happy paths
- ✅ Edge cases (empty, null, undefined)
- ✅ Error conditions
- ✅ Boundary values
- ✅ State transitions

### What NOT to Test
- ❌ Third-party libraries
- ❌ Framework internals
- ❌ Simple getters/setters
- ❌ Type definitions

## Best Practices

### Test Naming Convention
```typescript
// Pattern: should_[expected behavior]_when_[condition]
it('should throw ValidationError when email is invalid', async () => {});

// Pattern: given_[preconditions]_when_[action]_then_[expected result]
it('given existing user when update email then email is changed', async () => {});
```

### Test Isolation
```typescript
describe('userService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset any state
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Tests here
});
```

### Descriptive Assertions
```typescript
// ❌ Vague
expect(result).toBeTruthy();

// ✅ Specific
expect(result).toEqual({
  id: expect.any(String),
  name: 'Test Product',
  price: 29.99,
});
```

## Common Anti-Patterns

### 1. Testing Implementation Details
```typescript
// ❌ Bad - tests internal state
expect(component.state.counter).toBe(5);

// ✅ Good - tests observable behavior
expect(screen.getByText('Count: 5')).toBeInTheDocument();
```

### 2. Overspecified Tests
```typescript
// ❌ Bad - too many assertions
expect(user.name).toBe('John');
expect(user.email).toBe('john@example.com');
expect(user.age).toBe(30);
expect(user.role).toBe('admin');

// ✅ Good - focused assertion
expect(user).toMatchObject({
  name: 'John',
  email: 'john@example.com',
});
```

### 3. Flaky Tests
```typescript
// ❌ Bad - depends on timing
await new Promise(resolve => setTimeout(resolve, 100));
expect(element).toBeInTheDocument();

// ✅ Good - uses proper async utilities
await waitFor(() => {
  expect(element).toBeInTheDocument();
});
```

## Vitest Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.config.ts',
        '**/*.d.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
});
```

## Related Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [RUN Remix Testing Standards](/docs/development/testing.md)
