# WORKFLOW 3: 3D Integration & Testing
## 3D Model Viewer and Test Suite Creation

---

## 3D Model Integration Workflow

**Trigger Phrases:**
- "Add 3D model"
- "Integrate 3D viewer"
- "Show [product] in 3D"
- "Create 3D product preview"

### Critical Rule

**ALWAYS use `@google/model-viewer`**
**NEVER use `@react-three/fiber` or `@react-three/drei`**

This is non-negotiable for RUN APPAREL's product configurator.

---

### Step 1: Verify Model File

**Requirements:**
- Format: GLB or GLTF
- Location: `public/models/`
- Size: <2MB (compressed)
- Naming: Descriptive (e.g., `t-shirt-basic.glb`)

**Check model quality:**
```bash
# Model should be optimized
ls -lh public/models/  # Check file size
```

---

### Step 2: Use LazyUnifiedModelViewer

```typescript
import { LazyUnifiedModelViewer } from '@/components/3d/LazyUnifiedModelViewer';
import { ModelViewerErrorBoundary } from '@/components/3d/ModelViewerErrorBoundary';

export function ProductViewer({ productId }: { productId: string }) {
  const modelUrl = `/models/products/${productId}.glb`;
  
  return (
    <ModelViewerErrorBoundary>
      <LazyUnifiedModelViewer
        src={modelUrl}
        alt={`3D model of product ${productId}`}
        poster={`/images/products/${productId}-poster.jpg`}
        environmentImage="/models/env/studio.hdr"
        exposure="1"
        shadowIntensity="1"
        autoRotate
        autoRotateDelay={3000}
        rotationPerSecond="30deg"
        cameraControls
        cameraOrbit="45deg 75deg 2m"
        minCameraOrbit="auto auto 1m"
        maxCameraOrbit="auto auto 5m"
        loading="eager"
        className="w-full h-[500px]"
      />
    </ModelViewerErrorBoundary>
  );
}
```

---

### Step 3: Advanced - Dynamic Customization

For product customization (colors, textures):

```typescript
import { LazyUnifiedModelViewer } from '@/components/3d/LazyUnifiedModelViewer';
import { ModelViewerErrorBoundary } from '@/components/3d/ModelViewerErrorBoundary';
import { useEffect, useRef } from 'react';

interface CustomizableProductViewerProps {
  productId: string;
  color?: string;
  logoUrl?: string;
}

export function CustomizableProductViewer({
  productId,
  color = '#ffffff',
  logoUrl,
}: CustomizableProductViewerProps) {
  const viewerRef = useRef<any>(null);
  
  useEffect(() => {
    if (!viewerRef.current) return;
    
    const modelViewer = viewerRef.current;
    
    // Wait for model to load
    modelViewer.addEventListener('load', () => {
      // Apply color to material
      const material = modelViewer.model.materials[0];
      if (material) {
        material.pbrMetallicRoughness.setBaseColorFactor(hexToRgb(color));
      }
      
      // Apply logo texture if provided
      if (logoUrl) {
        // Custom texture application logic
      }
    });
  }, [color, logoUrl]);
  
  return (
    <ModelViewerErrorBoundary>
      <LazyUnifiedModelViewer
        ref={viewerRef}
        src={`/models/products/${productId}.glb`}
        alt="Customizable product preview"
        autoRotate
        cameraControls
        className="w-full h-[500px]"
      />
    </ModelViewerErrorBoundary>
  );
}

// Utility function
function hexToRgb(hex: string): [number, number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255,
        1,
      ]
    : [1, 1, 1, 1];
}
```

---

### Step 4: Test Loading States

```typescript
export function ProductViewerWithStates({ productId }: Props) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const handleLoad = () => setIsLoading(false);
  const handleError = (err: Error) => {
    setError(err);
    setIsLoading(false);
  };
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-gray-100">
        <p className="text-red-600">Failed to load 3D model</p>
      </div>
    );
  }
  
  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <LoadingSpinner />
        </div>
      )}
      
      <ModelViewerErrorBoundary>
        <LazyUnifiedModelViewer
          src={`/models/products/${productId}.glb`}
          alt="Product 3D model"
          onLoad={handleLoad}
          onError={handleError}
          autoRotate
          cameraControls
          className="w-full h-[500px]"
        />
      </ModelViewerErrorBoundary>
    </div>
  );
}
```

---

### Step 5: Mobile Optimization

```typescript
// Responsive 3D viewer
export function ResponsiveProductViewer({ productId }: Props) {
  return (
    <ModelViewerErrorBoundary>
      <LazyUnifiedModelViewer
        src={`/models/products/${productId}.glb`}
        alt="Product 3D model"
        autoRotate
        cameraControls
        touchAction="pan-y" // Better mobile scrolling
        className="w-full h-[400px] md:h-[600px]"
        // Disable auto-rotate on mobile for better performance
        autoRotateDelay={window.innerWidth < 768 ? 0 : 3000}
      />
    </ModelViewerErrorBoundary>
  );
}
```

---

## Testing Suite Creation Workflow

**Trigger Phrases:**
- "Add tests for [component/service]"
- "Write tests"
- "Create test suite"
- "Test [feature]"

### Step 1: Identify Test Targets

**Priority 1 (ALWAYS test):**
- Service functions (business logic)
- Data transformation utilities
- Complex calculations
- API integrations

**Priority 2 (Often test):**
- Custom hooks
- Form validation logic
- Critical user flows

**Priority 3 (Optional):**
- Simple presentational components
- UI components with no logic

---

### Step 2: Create Test File

**Location:** Same directory as source, `.test.ts` or `.test.tsx` suffix

```
server/services/productService.ts
server/services/productService.test.ts  ← Test file here
```

---

### Step 3: Write Service Tests

```typescript
// server/services/orderService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  createOrder, 
  calculateOrderTotal, 
  getOrdersByCustomer 
} from './orderService';
import { OrderNotFoundError } from './errors';

describe('orderService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('createOrder', () => {
    it('should create order with valid data', async () => {
      const orderData = {
        customerId: 'customer-123',
        items: [
          { productId: 'product-1', quantity: 5, price: 29.99 },
          { productId: 'product-2', quantity: 10, price: 19.99 },
        ],
        shippingAddress: {
          street: '123 Main St',
          city: 'Sialkot',
          country: 'PK',
          zipCode: '51310',
        },
      };
      
      const order = await createOrder(orderData);
      
      expect(order).toMatchObject(orderData);
      expect(order.id).toBeDefined();
      expect(order.status).toBe('pending');
      expect(order.total).toBeGreaterThan(0);
    });
    
    it('should throw for invalid quantity', async () => {
      const orderData = {
        customerId: 'customer-123',
        items: [
          { productId: 'product-1', quantity: -5, price: 29.99 },
        ],
        shippingAddress: {
          street: '123 Main St',
          city: 'Sialkot',
          country: 'PK',
          zipCode: '51310',
        },
      };
      
      await expect(createOrder(orderData)).rejects.toThrow(
        'Quantity must be positive'
      );
    });
    
    it('should apply bulk discount for large orders', async () => {
      const orderData = {
        customerId: 'customer-123',
        items: [
          { productId: 'product-1', quantity: 100, price: 29.99 },
        ],
        shippingAddress: {
          street: '123 Main St',
          city: 'Sialkot',
          country: 'PK',
          zipCode: '51310',
        },
      };
      
      const order = await createOrder(orderData);
      
      // Bulk orders get 10% discount
      const expectedTotal = 100 * 29.99 * 0.9;
      expect(order.total).toBeCloseTo(expectedTotal, 2);
    });
  });
  
  describe('calculateOrderTotal', () => {
    it('should calculate total correctly', () => {
      const items = [
        { productId: 'p1', quantity: 5, price: 10 },
        { productId: 'p2', quantity: 3, price: 20 },
      ];
      
      const total = calculateOrderTotal(items);
      
      expect(total).toBe(110); // (5 * 10) + (3 * 20)
    });
    
    it('should handle empty items array', () => {
      const total = calculateOrderTotal([]);
      expect(total).toBe(0);
    });
  });
  
  describe('getOrdersByCustomer', () => {
    it('should return customer orders', async () => {
      const orders = await getOrdersByCustomer('customer-123');
      
      expect(Array.isArray(orders)).toBe(true);
      orders.forEach(order => {
        expect(order.customerId).toBe('customer-123');
      });
    });
    
    it('should return empty array for customer with no orders', async () => {
      const orders = await getOrdersByCustomer('new-customer');
      expect(orders).toEqual([]);
    });
  });
});
```

---

### Step 4: Write Hook Tests

```typescript
// client/app/hooks/useProduct.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useProduct } from './useProduct';
import * as productService from '@/services/productService';

vi.mock('@/services/productService');

describe('useProduct', () => {
  it('should fetch product on mount', async () => {
    const mockProduct = {
      id: '123',
      name: 'Test Product',
      price: 29.99,
    };
    
    vi.mocked(productService.getProduct).mockResolvedValue(mockProduct);
    
    const { result } = renderHook(() => useProduct('123'));
    
    expect(result.current.isLoading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toEqual(mockProduct);
      expect(result.current.error).toBeNull();
    });
  });
  
  it('should handle errors', async () => {
    const mockError = new Error('Failed to fetch');
    vi.mocked(productService.getProduct).mockRejectedValue(mockError);
    
    const { result } = renderHook(() => useProduct('123'));
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toEqual(mockError);
    });
  });
  
  it('should refetch when id changes', async () => {
    const { result, rerender } = renderHook(
      ({ id }) => useProduct(id),
      { initialProps: { id: '123' } }
    );
    
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    
    // Change id
    rerender({ id: '456' });
    
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });
});
```

---

### Step 5: Run Tests

```bash
# Run all tests
npm run test

# Run specific file
npm run test productService.test.ts

# Watch mode (auto-rerun on changes)
npm run test:watch

# Coverage report
npm run test:coverage
```

---

### Step 6: Coverage Goals

- **Services:** >80% coverage
- **Utilities:** >80% coverage
- **Hooks:** >70% coverage
- **Components:** >60% coverage (critical ones only)

---

## Test Checklist

Before completing test suite:

- [ ] All service functions tested
- [ ] Happy path covered
- [ ] Error cases covered
- [ ] Edge cases covered
- [ ] Mocks properly configured
- [ ] Tests run successfully
- [ ] Coverage meets goals

**Version:** 1.0.0 | **For:** M. Hateem Jamshaid @ RUN APPAREL (PVT) LTD