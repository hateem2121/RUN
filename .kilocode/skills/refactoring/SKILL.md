---
name: refactoring
description: Use this skill when improving code structure without changing behavior, reducing technical debt, or applying design patterns. Use this for safe code refactoring following RUN Remix standards.
---

# Refactoring

## Goal

Improve code structure, readability, and maintainability without changing external behavior, following systematic refactoring techniques and RUN Remix coding standards.

## Instructions

### Phase 1: Assess Refactoring Scope

1. **Identify Refactoring Targets**
   ```markdown
   ## Code Smell Detection Checklist
   
   ### Structure Issues
   - [ ] Long functions (>50 lines)
   - [ ] Deep nesting (>3 levels)
   - [ ] Large files (>300 lines)
   - [ ] Duplicate code blocks
   - [ ] Dead code (unused imports, variables, functions)
   
   ### Naming Issues
   - [ ] Unclear variable names (x, data, temp)
   - [ ] Misleading function names
   - [ ] Inconsistent naming conventions
   - [ ] Magic numbers without constants
   
   ### Design Issues
   - [ ] Functions with multiple responsibilities
   - [ ] Tight coupling between components
   - [ ] Missing abstractions
   - [ ] Violations of DRY principle
   
   ### TypeScript Issues
   - [ ] Any types used
   - [ ] Missing type definitions
   - [ ] Type assertions without validation
   - [ ] Implicit any parameters
   ```

2. **Determine Refactoring Priority**
   ```markdown
   ## Priority Matrix
   
   | Impact | Effort | Priority |
   |--------|--------|----------|
   | High   | Low    | Do First |
   | High   | High   | Plan     |
   | Low    | Low    | Do Later |
   | Low    | High   | Skip     |
   
   ### High Impact Indicators:
   - Affects multiple files
   - Improves testability
   - Reduces bug surface area
   - Improves performance
   
   ### Low Effort Indicators:
   - Single file change
   - No API changes
   - Existing tests cover code
   - No dependencies to update
   ```

### Phase 2: Prepare for Refactoring

1. **Ensure Test Coverage**
   ```typescript
   // Before refactoring, verify tests exist and pass
   
   // 1. Run existing tests
   // npm run test -- --coverage
   
   // 2. If no tests exist, write characterization tests
   describe('ProductService (characterization)', () => {
     it('should return product by id', async () => {
       // Capture current behavior
       const result = await productService.getById('prod-123');
       expect(result).toMatchSnapshot();
     });
     
     it('should throw error for invalid id', async () => {
       // Document current error behavior
       await expect(
         productService.getById('invalid')
       ).rejects.toThrow('Product not found');
     });
   });
   
   // 3. Verify coverage meets threshold (80%+)
   ```

2. **Create Safety Net**
   ```bash
   # Before starting refactoring:
   
   # 1. Create a feature branch
   git checkout -b refactor/service-layer
   
   # 2. Run type checking
   npm run typecheck
   
   # 3. Run linting
   npm run check:apply
   
   # 4. Run all tests
   npm run test
   
   # 5. Build the project
   npm run build
   ```

### Phase 3: Apply Refactoring Techniques

1. **Extract Function**
   ```typescript
   // BEFORE: Long function with multiple responsibilities
   export async function processOrder(orderId: string) {
     const order = await db.orders.findById(orderId);
     if (!order) throw new Error('Order not found');
     
     // Validate order items
     for (const item of order.items) {
       const product = await db.products.findById(item.productId);
       if (!product) throw new Error(`Product ${item.productId} not found`);
       if (product.stock < item.quantity) {
         throw new Error(`Insufficient stock for ${product.name}`);
       }
     }
     
     // Calculate totals
     let subtotal = 0;
     for (const item of order.items) {
       const product = await db.products.findById(item.productId);
       subtotal += product.price * item.quantity;
     }
     const tax = subtotal * 0.1;
     const total = subtotal + tax;
     
     // Update inventory
     for (const item of order.items) {
       await db.products.updateStock(item.productId, -item.quantity);
     }
     
     // Create payment
     const payment = await paymentService.create({
       orderId: order.id,
       amount: total,
     });
     
     return { order, payment, total };
   }
   
   // AFTER: Extracted functions with single responsibilities
   export async function processOrder(orderId: string): Promise<ProcessedOrder> {
     const order = await getOrderOrThrow(orderId);
     await validateOrderItems(order);
     const totals = calculateOrderTotals(order);
     await updateInventory(order);
     const payment = await createPayment(order, totals.total);
     
     return { order, payment, ...totals };
   }
   
   async function getOrderOrThrow(id: string): Promise<Order> {
     const order = await db.orders.findById(id);
     if (!order) {
       throw new NotFoundError('Order', id);
     }
     return order;
   }
   
   async function validateOrderItems(order: Order): Promise<void> {
     for (const item of order.items) {
       const product = await getProductOrThrow(item.productId);
       validateStock(product, item.quantity);
     }
   }
   
   async function getProductOrThrow(id: string): Promise<Product> {
     const product = await db.products.findById(id);
     if (!product) {
       throw new NotFoundError('Product', id);
     }
     return product;
   }
   
   function validateStock(product: Product, quantity: number): void {
     if (product.stock < quantity) {
       throw new ValidationError(`Insufficient stock for ${product.name}`);
     }
   }
   
   function calculateOrderTotals(order: Order): OrderTotals {
     const subtotal = order.items.reduce((sum, item) => {
       return sum + item.price * item.quantity;
     }, 0);
     
     const tax = subtotal * TAX_RATE;
     const total = subtotal + tax;
     
     return { subtotal, tax, total };
   }
   
   async function updateInventory(order: Order): Promise<void> {
     for (const item of order.items) {
       await db.products.updateStock(item.productId, -item.quantity);
     }
   }
   
   async function createPayment(order: Order, amount: number): Promise<Payment> {
     return paymentService.create({
       orderId: order.id,
       amount,
     });
   }
   
   // Types
   interface ProcessedOrder {
     order: Order;
     payment: Payment;
     subtotal: number;
     tax: number;
     total: number;
   }
   
   interface OrderTotals {
     subtotal: number;
     tax: number;
     total: number;
   }
   
   const TAX_RATE = 0.1;
   ```

2. **Extract Component**
   ```typescript
   // BEFORE: Large component with multiple responsibilities
   export function ProductPage({ productId }: ProductPageProps) {
     const [product, setProduct] = useState<Product | null>(null);
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState<Error | null>(null);
     const [selectedSize, setSelectedSize] = useState<string>();
     const [selectedColor, setSelectedColor] = useState<string>();
     const [quantity, setQuantity] = useState(1);
     const [inCart, setInCart] = useState(false);
     
     useEffect(() => {
       async function fetchProduct() {
         try {
           const data = await productService.getById(productId);
           setProduct(data);
           setSelectedColor(data.colors[0]);
           setSelectedSize(data.sizes[0]);
         } catch (err) {
           setError(err as Error);
         } finally {
           setLoading(false);
         }
       }
       fetchProduct();
     }, [productId]);
     
     const handleAddToCart = async () => {
       await cartService.add({
         productId,
         size: selectedSize!,
         color: selectedColor!,
         quantity,
       });
       setInCart(true);
     };
     
     if (loading) return <LoadingSpinner />;
     if (error) return <ErrorMessage error={error} />;
     if (!product) return null;
     
     return (
       <div className="product-page">
         <div className="product-images">
           {product.images.map(img => (
             <img key={img} src={img} alt={product.name} />
           ))}
         </div>
         
         <div className="product-details">
           <h1>{product.name}</h1>
           <p className="price">${product.price}</p>
           <p className="description">{product.description}</p>
           
           <div className="options">
             <div className="size-selector">
               <label>Size:</label>
               <select 
                 value={selectedSize} 
                 onChange={e => setSelectedSize(e.target.value)}
               >
                 {product.sizes.map(size => (
                   <option key={size} value={size}>{size}</option>
                 ))}
               </select>
             </div>
             
             <div className="color-selector">
               <label>Color:</label>
               <select 
                 value={selectedColor}
                 onChange={e => setSelectedColor(e.target.value)}
               >
                 {product.colors.map(color => (
                   <option key={color} value={color}>{color}</option>
                 ))}
               </select>
             </div>
             
             <div className="quantity-selector">
               <label>Quantity:</label>
               <input 
                 type="number" 
                 value={quantity}
                 onChange={e => setQuantity(Number(e.target.value))}
                 min={1}
                 max={10}
               />
             </div>
           </div>
           
           <button 
             onClick={handleAddToCart}
             disabled={inCart}
           >
             {inCart ? 'Added to Cart' : 'Add to Cart'}
           </button>
         </div>
       </div>
     );
   }
   
   // AFTER: Extracted components with single responsibilities
   export function ProductPage({ productId }: ProductPageProps) {
     const { product, loading, error } = useProduct(productId);
     
     if (loading) return <LoadingSpinner />;
     if (error) return <ErrorMessage error={error} />;
     if (!product) return null;
     
     return (
       <div className="product-page">
         <ProductGallery images={product.images} alt={product.name} />
         <ProductDetails product={product} />
       </div>
     );
   }
   
   // Custom hook for data fetching
   function useProduct(productId: string) {
     const [product, setProduct] = useState<Product | null>(null);
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState<Error | null>(null);
     
     useEffect(() => {
       let cancelled = false;
       
       async function fetchProduct() {
         try {
           const data = await productService.getById(productId);
           if (!cancelled) setProduct(data);
         } catch (err) {
           if (!cancelled) setError(err as Error);
         } finally {
           if (!cancelled) setLoading(false);
         }
       }
       
       fetchProduct();
       return () => { cancelled = true; };
     }, [productId]);
     
     return { product, loading, error };
   }
   
   // Extracted gallery component
   interface ProductGalleryProps {
     images: string[];
     alt: string;
   }
   
   function ProductGallery({ images, alt }: ProductGalleryProps) {
     return (
       <div className="product-images">
         {images.map((img, index) => (
           <img 
             key={img} 
             src={img} 
             alt={`${alt} - Image ${index + 1}`}
             loading="lazy"
           />
         ))}
       </div>
     );
   }
   
   // Extracted details component
   interface ProductDetailsProps {
     product: Product;
   }
   
   function ProductDetails({ product }: ProductDetailsProps) {
     const { selectedSize, selectedColor, quantity, selectors } = useProductOptions(product);
     const { inCart, handleAddToCart } = useAddToCart(product.id, selectors);
     
     return (
       <div className="product-details">
         <h1>{product.name}</h1>
         <p className="price">${product.price}</p>
         <p className="description">{product.description}</p>
         
         <ProductOptionsSelector
           product={product}
           selectedSize={selectedSize}
           selectedColor={selectedColor}
           quantity={quantity}
           onSizeChange={selectors.setSize}
           onColorChange={selectors.setColor}
           onQuantityChange={selectors.setQuantity}
         />
         
         <AddToCartButton 
           onClick={handleAddToCart}
           disabled={inCart}
         >
           {inCart ? 'Added to Cart' : 'Add to Cart'}
         </AddToCartButton>
       </div>
     );
   }
   ```

3. **Replace Conditional with Polymorphism**
   ```typescript
   // BEFORE: Conditional logic based on type
   function calculateShipping(order: Order): number {
     if (order.type === 'standard') {
       if (order.total > 100) return 0;
       return 5.99;
     } else if (order.type === 'express') {
       if (order.total > 200) return 9.99;
       return 14.99;
     } else if (order.type === 'overnight') {
       return 29.99;
     }
     throw new Error(`Unknown order type: ${order.type}`);
   }
   
   function getDeliveryDate(order: Order): Date {
     const base = new Date();
     if (order.type === 'standard') {
       base.setDate(base.getDate() + 5);
     } else if (order.type === 'express') {
       base.setDate(base.getDate() + 2);
     } else if (order.type === 'overnight') {
       base.setDate(base.getDate() + 1);
     }
     return base;
   }
   
   // AFTER: Polymorphic shipping strategies
   interface ShippingStrategy {
     calculateCost(order: Order): number;
     getDeliveryDate(): Date;
   }
   
   class StandardShipping implements ShippingStrategy {
     calculateCost(order: Order): number {
       return order.total > 100 ? 0 : 5.99;
     }
     
     getDeliveryDate(): Date {
       const date = new Date();
       date.setDate(date.getDate() + 5);
       return date;
     }
   }
   
   class ExpressShipping implements ShippingStrategy {
     calculateCost(order: Order): number {
       return order.total > 200 ? 9.99 : 14.99;
     }
     
     getDeliveryDate(): Date {
       const date = new Date();
       date.setDate(date.getDate() + 2);
       return date;
     }
   }
   
   class OvernightShipping implements ShippingStrategy {
     calculateCost(_order: Order): number {
       return 29.99;
     }
     
     getDeliveryDate(): Date {
       const date = new Date();
       date.setDate(date.getDate() + 1);
       return date;
     }
   }
   
   const shippingStrategies: Record<OrderType, ShippingStrategy> = {
     standard: new StandardShipping(),
     express: new ExpressShipping(),
     overnight: new OvernightShipping(),
   };
   
   function getShippingStrategy(order: Order): ShippingStrategy {
     const strategy = shippingStrategies[order.type];
     if (!strategy) {
       throw new ValidationError(`Unknown order type: ${order.type}`);
     }
     return strategy;
   }
   
   // Usage
   function calculateShipping(order: Order): number {
     return getShippingStrategy(order).calculateCost(order);
   }
   
   function getDeliveryDate(order: Order): Date {
     return getShippingStrategy(order).getDeliveryDate();
   }
   ```

4. **Introduce Parameter Object**
   ```typescript
   // BEFORE: Long parameter list
   async function createOrder(
     userId: string,
     productId: string,
     quantity: number,
     size: string,
     color: string,
     shippingAddress: Address,
     billingAddress: Address,
     paymentMethod: string,
     couponCode?: string,
     giftMessage?: string,
   ): Promise<Order> {
     // ... implementation
   }
   
   // AFTER: Parameter object
   interface CreateOrderParams {
     userId: string;
     item: {
       productId: string;
       quantity: number;
       size: string;
       color: string;
     };
     shipping: {
       address: Address;
       billingAddress: Address;
     };
     payment: {
       method: string;
     };
     options?: {
       couponCode?: string;
       giftMessage?: string;
     };
   }
   
   async function createOrder(params: CreateOrderParams): Promise<Order> {
     const { userId, item, shipping, payment, options } = params;
     // ... implementation
   }
   
   // Usage
   const order = await createOrder({
     userId: 'user-123',
     item: {
       productId: 'prod-456',
       quantity: 2,
       size: 'L',
       color: 'navy',
     },
     shipping: {
       address: shippingAddress,
       billingAddress: billingAddress,
     },
     payment: {
       method: 'credit_card',
     },
     options: {
       couponCode: 'SAVE10',
     },
   });
   ```

5. **Remove Dead Code**
   ```typescript
   // BEFORE: Unused imports and dead code
   import { useState, useEffect, useCallback, useMemo } from 'react';
   import { debounce, throttle, cloneDeep } from 'lodash-es';
   import { v4 as uuidv4 } from 'uuid';
   import { format, parse, differenceInDays } from 'date-fns';
   
   export function ProductCard({ product }: ProductCardProps) {
     const [isHovered, setIsHovered] = useState(false);
     
     // Unused function
     const formatDate = (date: Date) => format(date, 'yyyy-MM-dd');
     
     // Unused variable
     const DEBOUNCE_MS = 300;
     
     // Commented out code
     // const handleQuickView = () => {
     //   openModal(product.id);
     // };
     
     // Unused effect
     useEffect(() => {
       // TODO: Add analytics
     }, []);
     
     return (
       <div 
         className="product-card"
         onMouseEnter={() => setIsHovered(true)}
         onMouseLeave={() => setIsHovered(false)}
       >
         <img src={product.image} alt={product.name} />
         <h3>{product.name}</h3>
         <p>${product.price}</p>
       </div>
     );
   }
   
   // AFTER: Clean code with only what's needed
   import { useState } from 'react';
   
   export function ProductCard({ product }: ProductCardProps) {
     const [isHovered, setIsHovered] = useState(false);
     
     return (
       <div 
         className="product-card"
         onMouseEnter={() => setIsHovered(true)}
         onMouseLeave={() => setIsHovered(false)}
       >
         <img src={product.image} alt={product.name} />
         <h3>{product.name}</h3>
         <p>${product.price}</p>
       </div>
     );
   }
   ```

### Phase 4: Verify Refactoring

1. **Run Verification Suite**
   ```bash
   # 1. Type checking
   npm run typecheck
   
   # 2. Linting
   npm run check:apply
   
   # 3. Tests
   npm run test
   
   # 4. Build
   npm run build
   
   # 5. Technical integrity
   npm run verify:tech-integrity
   ```

2. **Behavior Verification**
   ```markdown
   ## Behavior Verification Checklist
   
   - [ ] All existing tests pass
   - [ ] No TypeScript errors
   - [ ] No linting errors
   - [ ] Build succeeds
   - [ ] Manual testing completed
   - [ ] No console errors in browser
   - [ ] API responses unchanged
   - [ ] UI rendering unchanged
   ```

3. **Performance Verification**
   ```typescript
   // Before and after performance comparison
   describe('Refactoring Performance', () => {
     it('should not degrade performance', async () => {
       const startBefore = performance.now();
       await oldImplementation();
       const timeBefore = performance.now() - startBefore;
       
       const startAfter = performance.now();
       await newImplementation();
       const timeAfter = performance.now() - startAfter;
       
       // Allow 10% variance
       expect(timeAfter).toBeLessThanOrEqual(timeBefore * 1.1);
     });
   });
   ```

## Examples

### Example 1: Service Layer Refactoring

```typescript
// BEFORE: Business logic in route handler
router.post('/orders', async (req, res) => {
  const { productId, quantity, size, color } = req.body;
  
  if (!productId || !quantity || !size || !color) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const product = await db.products.findById(productId);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  
  if (product.stock < quantity) {
    return res.status(400).json({ error: 'Insufficient stock' });
  }
  
  const total = product.price * quantity;
  const tax = total * 0.1;
  
  const order = await db.orders.create({
    userId: req.user.id,
    productId,
    quantity,
    size,
    color,
    total: total + tax,
    status: 'pending',
  });
  
  await db.products.updateStock(productId, -quantity);
  
  res.status(201).json(order);
});

// AFTER: Thin route, thick service
// routes/orders.ts
router.post('/orders', async (req, res) => {
  const order = await orderService.create(req.user.id, req.body);
  res.status(201).json(order);
});

// services/orderService.ts
export async function create(userId: string, input: CreateOrderInput): Promise<Order> {
  const validated = createOrderSchema.parse(input);
  const product = await getProductOrThrow(validated.productId);
  
  validateStock(product, validated.quantity);
  
  const order = await db.orders.create({
    userId,
    productId: validated.productId,
    quantity: validated.quantity,
    size: validated.size,
    color: validated.color,
    total: calculateTotal(product.price, validated.quantity),
    status: 'pending',
  });
  
  await updateInventory(validated.productId, -validated.quantity);
  
  return order;
}
```

### Example 2: Component Refactoring

```typescript
// BEFORE: Component with inline styles and logic
export function ProductList({ products }: ProductListProps) {
  return (
     <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
      {products.map(product => (
        <div 
          key={product.id}
          style={{ 
            border: '1px solid #ccc', 
            borderRadius: '8px', 
            padding: '16px',
            backgroundColor: product.inStock ? '#fff' : '#f5f5f5'
          }}
          onClick={() => console.log('clicked', product.id)}
        >
          <img 
            src={product.image} 
            alt={product.name}
            style={{ width: '100%', height: '200px', objectFit: 'cover' }}
          />
          <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>{product.name}</h3>
          <p style={{ color: '#666' }}>${product.price}</p>
          {!product.inStock && <span style={{ color: 'red' }}>Out of Stock</span>}
        </div>
      ))}
    </div>
  );
}

// AFTER: Component with CVA variants and proper patterns
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const productListVariants = cva('grid gap-5', {
  variants: {
    columns: {
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
    },
  },
  defaultVariants: {
    columns: 3,
  },
});

const productCardVariants = cva(
  'border rounded-lg p-4 transition-colors',
  {
    variants: {
      status: {
        available: 'bg-card',
        unavailable: 'bg-muted opacity-75',
      },
    },
    defaultVariants: {
      status: 'available',
    },
  }
);

interface ProductListProps extends VariantProps<typeof productListVariants> {
  products: Product[];
  onProductClick?: (productId: string) => void;
}

export function ProductList({ products, columns, onProductClick }: ProductListProps) {
  return (
    <div className={productListVariants({ columns })}>
      {products.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          onClick={() => onProductClick?.(product.id)}
        />
      ))}
    </div>
  );
}

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
}

function ProductCard({ product, onClick }: ProductCardProps) {
  return (
    <article
      className={productCardVariants({ 
        status: product.inStock ? 'available' : 'unavailable' 
      })}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      <img
        src={product.image}
        alt={product.name}
        className="w-full h-[200px] object-cover rounded-md"
        loading="lazy"
      />
      <h3 className="text-lg font-semibold mt-2">{product.name}</h3>
      <p className="text-muted-foreground">${product.price}</p>
      {!product.inStock && (
        <span className="text-destructive text-sm">Out of Stock</span>
      )}
    </article>
  );
}
```

## Refactoring Checklist

```markdown
## Before Refactoring
- [ ] Tests exist and pass
- [ ] Coverage meets 80% threshold
- [ ] Branch created for refactoring
- [ ] Type checking passes
- [ ] Build succeeds

## During Refactoring
- [ ] Make small, incremental changes
- [ ] Run tests after each change
- [ ] Keep commits atomic
- [ ] Document significant changes
- [ ] Follow RUN Remix coding standards

## After Refactoring
- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] Build succeeds
- [ ] Behavior unchanged
- [ ] Performance not degraded
- [ ] Code coverage maintained or improved
- [ ] Technical integrity verified

## Code Quality
- [ ] No 'any' types
- [ ] Named exports for components
- [ ] CVA for component variants
- [ ] cn() for conditional classes
- [ ] Proper TypeScript interfaces
- [ ] JSDoc comments added
```

## Constraints

- **NEVER** change behavior during refactoring
- **NEVER** skip running tests
- **NEVER** refactor without test coverage
- **ALWAYS** make incremental changes
- **ALWAYS** verify after each change
- **ALWAYS** follow RUN Remix standards

## Related Skills

- `test-driven-development` - Write tests before refactoring
- `verification-before-completion` - Verify refactoring is complete
- `code-review` - Review refactored code
