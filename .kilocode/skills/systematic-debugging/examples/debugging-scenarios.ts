/**
 * Systematic Debugging Examples
 * 
 * This file demonstrates the Observe-Hypothesize-Isolate-Fix-Verify methodology
 * with real-world debugging scenarios.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// ============================================================================
// SCENARIO 1: Null Reference Error
// ============================================================================

/**
 * PROBLEM: TypeError: Cannot read properties of undefined
 * 
 * OBSERVE:
 * - Error: "Cannot read properties of undefined (reading 'name')"
 * - Stack trace points to line 42 in userService.ts
 * - Occurs when fetching user profile
 * 
 * HYPOTHESIZE:
 * - The user object is undefined when we try to access .name
 * - This could happen if:
 *   1. API returns null for non-existent user
 *   2. API request failed silently
 *   3. Response parsing failed
 * 
 * ISOLATE:
 * - Add logging before the error line
 * - Check what getUser() actually returns
 */

// ❌ BUGGY CODE
function getUserNameBuggy(userId: string): string {
  const user = getUser(userId); // Returns undefined for non-existent user
  return user.name; // TypeError here!
}

// ✅ FIXED CODE
function getUserName(userId: string): string {
  const user = getUser(userId);
  
  // Defensive check
  if (!user) {
    throw new UserNotFoundError(userId);
  }
  
  return user.name;
}

// Or with optional chaining for graceful handling
function getUserNameSafe(userId: string): string {
  const user = getUser(userId);
  return user?.name ?? 'Unknown User';
}

// Test to verify fix
describe('getUserName', () => {
  it('should throw UserNotFoundError for non-existent user', () => {
    expect(() => getUserName('nonexistent')).toThrow(UserNotFoundError);
  });

  it('should return user name for existing user', () => {
    const name = getUserName('user-123');
    expect(name).toBe('John Doe');
  });
});

// ============================================================================
// SCENARIO 2: Async Race Condition
// ============================================================================

/**
 * PROBLEM: Data is sometimes null when component renders
 * 
 * OBSERVE:
 * - Component renders with empty data
 * - Data appears after manual refresh
 * - Console shows "data is null" intermittently
 * 
 * HYPOTHESIZE:
 * - Race condition between component mount and data fetch
 * - Component tries to use data before fetch completes
 * 
 * ISOLATE:
 * - Add timing logs
 * - Check if state is being set after unmount
 */

// ❌ BUGGY CODE
function useUserDataBuggy(userId: string) {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetchUser(userId).then(user => {
      setData(user); // May set state after unmount!
    });
  }, [userId]);
  
  return data; // Returns null initially
}

// ✅ FIXED CODE
function useUserData(userId: string) {
  const [data, setData] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    let cancelled = false;
    
    async function loadUser() {
      try {
        setIsLoading(true);
        const user = await fetchUser(userId);
        
        // Check if effect was cancelled
        if (!cancelled) {
          setData(user);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }
    
    loadUser();
    
    // Cleanup function
    return () => {
      cancelled = true;
    };
  }, [userId]);
  
  return { data, isLoading, error };
}

// ============================================================================
// SCENARIO 3: State Mutation Bug
// ============================================================================

/**
 * PROBLEM: UI shows stale data after update
 * 
 * OBSERVE:
 * - Clicking "Update" button doesn't reflect changes
 * - Console.log shows old data
 * - Re-rendering component shows correct data
 * 
 * HYPOTHESIZE:
 * - State is being mutated directly
 * - React doesn't detect the change
 * 
 * ISOLATE:
 * - Check all places where state is modified
 * - Look for direct array/object mutations
 */

// ❌ BUGGY CODE
function useCartBuggy() {
  const [cart, setCart] = useState({ items: [], total: 0 });
  
  const addItem = (item: CartItem) => {
    // Direct mutation - React won't detect this!
    cart.items.push(item);
    cart.total += item.price;
    setCart(cart); // Same reference!
  };
  
  return { cart, addItem };
}

// ✅ FIXED CODE
function useCart() {
  const [cart, setCart] = useState<CartState>({ items: [], total: 0 });
  
  const addItem = (item: CartItem) => {
    setCart(prevCart => ({
      items: [...prevCart.items, item], // New array
      total: prevCart.total + item.price,
    }));
  };
  
  const removeItem = (itemId: string) => {
    setCart(prevCart => ({
      items: prevCart.items.filter(item => item.id !== itemId),
      total: prevCart.total - prevCart.items.find(i => i.id === itemId)!.price,
    }));
  };
  
  return { cart, addItem, removeItem };
}

// Test to verify immutability
describe('useCart', () => {
  it('should not mutate previous state', () => {
    const { result } = renderHook(() => useCart());
    const firstState = result.current.cart;
    
    act(() => {
      result.current.addItem({ id: '1', name: 'Item', price: 10 });
    });
    
    // Previous state should be unchanged
    expect(firstState.items).toHaveLength(0);
    expect(result.current.cart.items).toHaveLength(1);
  });
});

// ============================================================================
// SCENARIO 4: Memory Leak
// ============================================================================

/**
 * PROBLEM: Browser tab becomes slow over time
 * 
 * OBSERVE:
 * - Performance degrades after extended use
 * - Heap snapshot shows growing memory
 * - Component unmount doesn't clean up
 * 
 * HYPOTHESIZE:
 * - Event listeners not cleaned up
 * - Intervals not cleared
 * - Subscriptions not unsubscribed
 * 
 * ISOLATE:
 * - Profile memory in DevTools
 * - Check useEffect cleanup functions
 */

// ❌ BUGGY CODE
function useWebSocketBuggy(url: string) {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    const ws = new WebSocket(url);
    
    ws.onmessage = (event) => {
      setData(JSON.parse(event.data));
    };
    
    // Missing cleanup!
  }, [url]);
  
  return data;
}

// ✅ FIXED CODE
function useWebSocket(url: string) {
  const [data, setData] = useState<WebSocketData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    const ws = new WebSocket(url);
    
    ws.onopen = () => {
      setIsConnected(true);
    };
    
    ws.onmessage = (event) => {
      setData(JSON.parse(event.data));
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    ws.onclose = () => {
      setIsConnected(false);
    };
    
    // Cleanup function
    return () => {
      ws.close();
    };
  }, [url]);
  
  return { data, isConnected };
}

// ============================================================================
// SCENARIO 5: API Error Handling
// ============================================================================

/**
 * PROBLEM: API errors crash the application
 * 
 * OBSERVE:
 * - Unhandled promise rejection
 * - App shows white screen on API failure
 * - No error message to user
 * 
 * HYPOTHESIZE:
 * - Missing try/catch in async function
 * - Error boundary not catching async errors
 * - No error state in component
 * 
 * ISOLATE:
 * - Simulate API failure
 * - Check error handling chain
 */

// ❌ BUGGY CODE
async function fetchProductsBuggy(): Promise<Product[]> {
  const response = await fetch('/api/products');
  const data = await response.json();
  return data.products; // No error handling!
}

// ✅ FIXED CODE
class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchProducts(): Promise<Product[]> {
  const response = await fetch('/api/products');
  
  if (!response.ok) {
    throw new ApiError(
      `Failed to fetch products: ${response.statusText}`,
      response.status,
      response.statusText
    );
  }
  
  const data = await response.json();
  
  // Validate response structure
  if (!Array.isArray(data.products)) {
    throw new Error('Invalid API response: expected products array');
  }
  
  return data.products;
}

// Component with proper error handling
function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    let cancelled = false;
    
    async function loadProducts() {
      try {
        setIsLoading(true);
        const data = await fetchProducts();
        
        if (!cancelled) {
          setProducts(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
          // Log to error tracking service
          console.error('Failed to load products:', err);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }
    
    loadProducts();
    
    return () => {
      cancelled = true;
    };
  }, []);
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (products.length === 0) return <EmptyState />;
  
  return (
    <ul>
      {products.map(product => (
        <li key={product.id}>{product.name}</li>
      ))}
    </ul>
  );
}

// ============================================================================
// SCENARIO 6: Performance Issue (N+1 Query)
// ============================================================================

/**
 * PROBLEM: Page loads very slowly
 * 
 * OBSERVE:
 * - Page takes 30+ seconds to load
 * - Network tab shows hundreds of requests
 * - Each request is fast individually
 * 
 * HYPOTHESIZE:
 * - N+1 query problem
 * - Fetching related data in loop
 * 
 * ISOLATE:
 * - Check data fetching patterns
 * - Look for loops with await inside
 */

// ❌ BUGGY CODE
async function getOrdersWithUsersBuggy(): Promise<OrderWithUser[]> {
  const orders = await db.orders.findAll();
  
  const ordersWithUsers = [];
  for (const order of orders) {
    // N+1 problem: one query per order!
    const user = await db.users.findById(order.userId);
    ordersWithUsers.push({ ...order, user });
  }
  
  return ordersWithUsers;
}

// ✅ FIXED CODE
async function getOrdersWithUsers(): Promise<OrderWithUser[]> {
  const orders = await db.orders.findAll();
  
  // Batch fetch all users at once
  const userIds = [...new Set(orders.map(o => o.userId))];
  const users = await db.users.findByIds(userIds);
  
  // Create lookup map
  const userMap = new Map(users.map(u => [u.id, u]));
  
  // Combine data
  return orders.map(order => ({
    ...order,
    user: userMap.get(order.userId)!,
  }));
}

// Even better: use a single query with JOIN
async function getOrdersWithUsersOptimized(): Promise<OrderWithUser[]> {
  const result = await db.query(`
    SELECT 
      o.*,
      u.id as user_id,
      u.name as user_name,
      u.email as user_email
    FROM orders o
    JOIN users u ON o.user_id = u.id
  `);
  
  return result.rows.map(row => ({
    id: row.id,
    total: row.total,
    user: {
      id: row.user_id,
      name: row.user_name,
      email: row.user_email,
    },
  }));
}

// ============================================================================
// SCENARIO 7: Type Error at Runtime
// ============================================================================

/**
 * PROBLEM: TypeError at runtime despite TypeScript compilation
 * 
 * OBSERVE:
 * - Code compiles without errors
 * - Runtime error: "x is not a function"
 * - TypeScript type says it's a function
 * 
 * HYPOTHESIZE:
 * - Type mismatch between API and TypeScript types
 * - Missing runtime validation
 * - API contract changed
 * 
 * ISOLATE:
 * - Log actual runtime values
 * - Compare with TypeScript types
 */

// ❌ BUGGY CODE
interface ApiResponse {
  data: {
    items: Product[];
    total: number;
  };
}

async function getProductsBuggy(): Promise<Product[]> {
  const response = await fetch('/api/products');
  const json: ApiResponse = await response.json(); // Assumed type!
  
  // Runtime error if API returns different structure
  return json.data.items.map(item => ({
    ...item,
    formattedPrice: formatPrice(item.price), // Error if price is string!
  }));
}

// ✅ FIXED CODE with Zod validation
import { z } from 'zod';

const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number().positive(),
  category: z.enum(['activewear', 'teamwear', 'outerwear', 'casualwear']),
});

const ApiResponseSchema = z.object({
  data: z.object({
    items: z.array(ProductSchema),
    total: z.number(),
  }),
});

type ApiProduct = z.infer<typeof ProductSchema>;
type ApiResponseType = z.infer<typeof ApiResponseSchema>;

async function getProducts(): Promise<ApiProduct[]> {
  const response = await fetch('/api/products');
  const json = await response.json();
  
  // Validate at runtime
  const validated = ApiResponseSchema.parse(json);
  
  return validated.data.items.map(item => ({
    ...item,
    formattedPrice: formatPrice(item.price),
  }));
}

// ============================================================================
// DEBUGGING UTILITIES
// ============================================================================

/**
 * Debug logger with timing
 */
function createDebugLogger(namespace: string) {
  return {
    log(message: string, data?: unknown) {
      console.log(`[${namespace}] ${message}`, data ?? '');
    },
    time(label: string) {
      console.time(`[${namespace}] ${label}`);
    },
    timeEnd(label: string) {
      console.timeEnd(`[${namespace}] ${label}`);
    },
    error(message: string, error?: unknown) {
      console.error(`[${namespace}] ERROR: ${message}`, error ?? '');
    },
  };
}

// Usage
const logger = createDebugLogger('ProductService');

async function debugFetchProducts() {
  logger.time('fetch-products');
  
  try {
    logger.log('Fetching products...');
    const products = await fetchProducts();
    logger.log('Products fetched', { count: products.length });
    return products;
  } catch (error) {
    logger.error('Failed to fetch products', error);
    throw error;
  } finally {
    logger.timeEnd('fetch-products');
  }
}

/**
 * Network request interceptor for debugging
 */
function interceptFetch() {
  const originalFetch = window.fetch;
  
  window.fetch = async (...args) => {
    const [url, options] = args;
    const startTime = performance.now();
    
    console.group(`Fetch: ${url}`);
    console.log('Options:', options);
    
    try {
      const response = await originalFetch(...args);
      const duration = performance.now() - startTime;
      
      console.log(`Status: ${response.status} (${duration.toFixed(2)}ms)`);
      console.groupEnd();
      
      return response;
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`Failed after ${duration.toFixed(2)}ms:`, error);
      console.groupEnd();
      throw error;
    }
  };
}

// Enable in development
if (process.env.NODE_ENV === 'development') {
  interceptFetch();
}
