// @ts-nocheck
/**
 * Systematic Debugging Examples
 *
 * This file demonstrates the Observe-Hypothesize-Isolate-Fix-Verify methodology
 * with real-world debugging scenarios.
 *
 * @fileoverview Debugging scenario examples for educational purposes
 *
 * NOTE: This is an educational documentation file, not executable code.
 * Functions prefixed with _ are intentionally unused - they demonstrate
 * buggy patterns for educational purposes.
 */

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

// ❌ BUGGY CODE (intentionally broken for demonstration)
function _getUserNameBuggy(userId: string): string {
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
function _getUserNameSafe(userId: string): string {
  const user = getUser(userId);
  return user?.name ?? "Unknown User";
}

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
function _useUserDataBuggy(userId: string) {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchUser(userId).then((user) => {
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

    // Cleanup function sets cancelled flag
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { data, isLoading, error };
}

// ============================================================================
// SCENARIO 3: State Mutation
// ============================================================================

/**
 * PROBLEM: Previous cart state is being modified unexpectedly
 *
 * OBSERVE:
 * - When adding item to cart, previous items change
 * - Console logs show object references are the same
 * - Bug only appears in production, not development
 *
 * HYPOTHESIZE:
 * - State is being mutated directly instead of creating new object
 * - React doesn't detect change because reference is same
 *
 * ISOLATE:
 * - Add Object.freeze() to state
 * - Log before/after state references
 */

// ❌ BUGGY CODE
function _useCartBuggy() {
  const [cart, setCart] = useState({ items: [], total: 0 });

  const addItem = (item: CartItem) => {
    // MUTATION! Directly modifying state
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
    setCart((prevCart) => ({
      ...prevCart,
      items: [...prevCart.items, item],
      total: prevCart.total + item.price,
    }));
  };

  const removeItem = (itemId: string) => {
    setCart((prevCart) => ({
      ...prevCart,
      items: prevCart.items.filter((item) => item.id !== itemId),
      total: prevCart.total - prevCart.items.find((i) => i.id === itemId)!.price,
    }));
  };

  return { cart, addItem, removeItem };
}

// ============================================================================
// SCENARIO 4: Memory Leak
// ============================================================================

/**
 * PROBLEM: Component causes memory leak after navigating away
 *
 * OBSERVE:
 * - Console warning: "Can't perform state update on unmounted component"
 * - Memory usage grows over time
 * - Warning appears after navigating away from page
 *
 * HYPOTHESIZE:
 * - WebSocket or interval not cleaned up
 * - Async operation completes after unmount
 *
 * ISOLATE:
 * - Check useEffect cleanup functions
 * - Profile memory in DevTools
 */

// ❌ BUGGY CODE
function _useWebSocketDataBuggy(channel: string) {
  const [data, setData] = useState(null);

  useEffect(() => {
    const ws = new WebSocket(`wss://api.example.com/${channel}`);

    ws.onmessage = (event) => {
      setData(JSON.parse(event.data)); // No cleanup!
    };

    // Missing cleanup function!
  }, [channel]);

  return data;
}

// ✅ FIXED CODE
function useWebSocketData(channel: string) {
  const [data, setData] = useState<WebSocketData | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(`wss://api.example.com/${channel}`);

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);
    ws.onmessage = (event) => {
      setData(JSON.parse(event.data));
    };

    // Cleanup: close WebSocket on unmount
    return () => {
      ws.close();
    };
  }, [channel]);

  return { data, isConnected };
}

// ============================================================================
// SCENARIO 5: Error Handling
// ============================================================================

/**
 * PROBLEM: Application crashes with white screen
 *
 * OBSERVE:
 * - Screen goes blank after certain actions
 * - No error message shown to user
 * - Error only visible in console
 *
 * HYPOTHESIZE:
 * - Unhandled promise rejection
 * - Missing error boundary
 * - Error swallowed somewhere
 *
 * ISOLATE:
 * - Add try/catch around suspected areas
 * - Check window.onunhandledrejection
 */

// ❌ BUGGY CODE
async function _fetchProductsBuggy(): Promise<Product[]> {
  const response = await fetch("/api/products");
  const data = await response.json();
  return data.products; // No error handling!
}

// ✅ FIXED CODE
async function fetchProducts(): Promise<Product[]> {
  try {
    const response = await fetch("/api/products");

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!Array.isArray(data.products)) {
      throw new Error("Invalid response format: expected products array");
    }

    return data.products;
  } catch (error) {
    // Log for debugging
    console.error("Failed to fetch products:", error);

    // Re-throw with context
    throw new ProductFetchError("Unable to load products. Please try again.", { cause: error });
  }
}

// ============================================================================
// VERIFICATION PATTERN
// ============================================================================

/**
 * After fixing any bug, verify:
 *
 * 1. Original issue is resolved
 * 2. No new issues introduced
 * 3. Edge cases handled
 * 4. Tests pass
 */

// Example: Component with proper error handling
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

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <ul>
      {products.map((product) => (
        <li key={product.id}>{product.name}</li>
      ))}
    </ul>
  );
}

export { getUserName, useUserData, useCart, useWebSocketData, fetchProducts, ProductList };
