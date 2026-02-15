---
name: error-handling
description: Use this skill when implementing error handling, creating error boundaries, or handling failures in the application. Use this for comprehensive error handling patterns following RUN Remix standards.
---

# Error Handling

## Goal

Implement comprehensive, user-friendly error handling that gracefully manages failures, provides meaningful feedback, and maintains application stability while following RUN Remix standards.

## Instructions

### Phase 1: Error Classification

1. **Identify Error Types**
   ```typescript
   // Error Categories
   type ErrorCategory = 
     | 'validation'    // Input validation failures
     | 'authentication' // Auth/authz failures
     | 'not_found'     // Resource not found
     | 'conflict'      // Duplicate/conflict
     | 'rate_limit'    // Too many requests
     | 'external'      // Third-party service failures
     | 'database'      // Database errors
     | 'internal';     // Unexpected server errors
   ```

2. **Create Custom Error Classes**
   ```typescript
   // server/errors/index.ts
   
   // Base application error
   export class AppError extends Error {
     constructor(
       message: string,
       public statusCode: number = 500,
       public code: string = 'INTERNAL_ERROR',
       public isOperational: boolean = true
     ) {
       super(message);
       this.name = this.constructor.name;
       Error.captureStackTrace(this, this.constructor);
     }
   }
   
   // Validation errors (400)
   export class ValidationError extends AppError {
     constructor(message: string, public issues?: z.ZodIssue[]) {
       super(message, 400, 'VALIDATION_ERROR');
     }
   }
   
   // Authentication errors (401)
   export class AuthenticationError extends AppError {
     constructor(message: string = 'Authentication required') {
       super(message, 401, 'AUTHENTICATION_ERROR');
     }
   }
   
   // Authorization errors (403)
   export class AuthorizationError extends AppError {
     constructor(message: string = 'Insufficient permissions') {
       super(message, 403, 'AUTHORIZATION_ERROR');
     }
   }
   
   // Not found errors (404)
   export class NotFoundError extends AppError {
     constructor(resource: string, identifier?: string) {
       super(
         `${resource}${identifier ? ` with id ${identifier}` : ''} not found`,
         404,
         'NOT_FOUND'
       );
     }
   }
   
   // Conflict errors (409)
   export class ConflictError extends AppError {
     constructor(message: string) {
       super(message, 409, 'CONFLICT');
     }
   }
   
   // Rate limit errors (429)
   export class RateLimitError extends AppError {
     constructor(retryAfter: number = 60) {
       super('Too many requests, please try again later', 429, 'RATE_LIMIT');
       this.retryAfter = retryAfter;
     }
     public retryAfter: number;
   }
   
   // External service errors (502/503)
   export class ExternalServiceError extends AppError {
     constructor(service: string, originalError?: Error) {
       super(
         `${service} service is temporarily unavailable`,
         503,
         'EXTERNAL_SERVICE_ERROR'
       );
       this.originalError = originalError;
     }
     public originalError?: Error;
   }
   ```

### Phase 2: Backend Error Handling

1. **Service Layer Error Handling**
   ```typescript
   // server/services/productService.ts
   import { ValidationError, NotFoundError, ConflictError } from '../errors';
   
   export async function createProduct(input: CreateProductInput): Promise<Product> {
     // 1. Validate input
     const validated = createProductSchema.safeParse(input);
     if (!validated.success) {
       throw new ValidationError('Invalid product data', validated.error.issues);
     }
     
     // 2. Check for conflicts
     const existing = await db.products.findBySku(validated.data.sku);
     if (existing) {
       throw new ConflictError(`Product with SKU ${validated.data.sku} already exists`);
     }
     
     // 3. Create product
     try {
       const product = await db.products.create({
         ...validated.data,
         createdAt: new Date(),
       });
       return product;
     } catch (error) {
       // Handle database errors
       if (error instanceof DatabaseError) {
         throw new AppError('Failed to create product', 500, 'DATABASE_ERROR');
       }
       throw error; // Re-throw unknown errors
     }
   }
   
   export async function getProduct(id: string): Promise<Product> {
     const product = await db.products.findById(id);
     if (!product) {
       throw new NotFoundError('Product', id);
     }
     return product;
   }
   ```

2. **Global Error Handler Middleware**
   ```typescript
   // server/middleware/errorHandler.ts
   import { NextFunction, Request, Response } from 'express';
   import { AppError, ValidationError, RateLimitError } from '../errors';
   import { ZodError } from 'zod';
   
   export function errorHandler(
     error: Error,
     req: Request,
     res: Response,
     _next: NextFunction
   ) {
     // Log error for debugging
     console.error(`[${new Date().toISOString()}] Error:`, {
       message: error.message,
       stack: error.stack,
       path: req.path,
       method: req.method,
     });
     
     // Handle known errors
     if (error instanceof AppError) {
       const response: ErrorResponse = {
         success: false,
         error: {
           code: error.code,
           message: error.message,
         },
       };
       
       // Add validation issues if present
       if (error instanceof ValidationError && error.issues) {
         response.error.issues = error.issues;
       }
       
       // Add retry-after header for rate limits
       if (error instanceof RateLimitError) {
         res.set('Retry-After', String(error.retryAfter));
       }
       
       return res.status(error.statusCode).json(response);
     }
     
     // Handle Zod validation errors
     if (error instanceof ZodError) {
       return res.status(400).json({
         success: false,
         error: {
           code: 'VALIDATION_ERROR',
           message: 'Validation failed',
           issues: error.issues,
         },
       });
     }
     
     // Handle unexpected errors
     return res.status(500).json({
       success: false,
       error: {
         code: 'INTERNAL_ERROR',
         message: process.env.NODE_ENV === 'production'
           ? 'An unexpected error occurred'
           : error.message,
       },
     });
   }
   
   interface ErrorResponse {
     success: false;
     error: {
       code: string;
       message: string;
       issues?: z.ZodIssue[];
     };
   }
   ```

3. **Async Handler Wrapper (Optional for Express 4)**
   ```typescript
   // Note: Express 5 handles async errors natively
   // This is only needed for Express 4 or custom error handling
   
   import { NextFunction, Request, Response } from 'express';
   
   export function asyncHandler(
     fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
   ) {
     return (req: Request, res: Response, next: NextFunction) => {
       Promise.resolve(fn(req, res, next)).catch(next);
     };
   }
   ```

### Phase 3: Frontend Error Handling

1. **Error Boundary Components**
   ```typescript
   // client/app/components/error-boundaries/GlobalErrorBoundary.tsx
   import { Component, ErrorInfo, ReactNode } from 'react';
   import { AlertTriangle, RefreshCw } from 'lucide-react';
   
   interface Props {
     children: ReactNode;
     fallback?: ReactNode;
     onError?: (error: Error, errorInfo: ErrorInfo) => void;
   }
   
   interface State {
     hasError: boolean;
     error: Error | null;
   }
   
   export class GlobalErrorBoundary extends Component<Props, State> {
     constructor(props: Props) {
       super(props);
       this.state = { hasError: false, error: null };
     }
     
     static getDerivedStateFromError(error: Error): State {
       return { hasError: true, error };
     }
     
     componentDidCatch(error: Error, errorInfo: ErrorInfo) {
       // Log to error tracking service
       console.error('Error caught by boundary:', error, errorInfo);
       this.props.onError?.(error, errorInfo);
     }
     
     handleRetry = () => {
       this.setState({ hasError: false, error: null });
     };
     
     render() {
       if (this.state.hasError) {
         if (this.props.fallback) {
           return this.props.fallback;
         }
         
         return (
           <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
             <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
             <h2 className="text-2xl font-semibold mb-2">Something went wrong</h2>
             <p className="text-muted-foreground mb-6 max-w-md">
               {this.state.error?.message || 'An unexpected error occurred'}
             </p>
             <button
               onClick={this.handleRetry}
               className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
             >
               <RefreshCw className="h-4 w-4" />
               Try Again
             </button>
           </div>
         );
       }
       
       return this.props.children;
     }
   }
   ```

2. **Feature-Specific Error Boundaries**
   ```typescript
   // client/app/components/error-boundaries/FeatureErrorBoundary.tsx
   import { Component, ErrorInfo, ReactNode } from 'react';
   
   interface Props {
     featureName: string;
     children: ReactNode;
     showDetails?: boolean;
   }
   
   interface State {
     hasError: boolean;
     error: Error | null;
   }
   
   export class FeatureErrorBoundary extends Component<Props, State> {
     constructor(props: Props) {
       super(props);
       this.state = { hasError: false, error: null };
     }
     
     static getDerivedStateFromError(error: Error): State {
       return { hasError: true, error };
     }
     
     componentDidCatch(error: Error, errorInfo: ErrorInfo) {
       console.error(`${this.props.featureName} error:`, error, errorInfo);
     }
     
     render() {
       if (this.state.hasError) {
         return (
           <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/10">
             <h3 className="font-semibold text-destructive mb-2">
               {this.props.featureName} Error
             </h3>
             <p className="text-sm text-muted-foreground mb-2">
               This section couldn't be loaded. The rest of the page should work normally.
             </p>
             {this.props.showDetails && this.state.error && (
               <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                 {this.state.error.message}
               </pre>
             )}
             <button
               onClick={() => this.setState({ hasError: false, error: null })}
               className="mt-3 text-sm text-primary hover:underline"
             >
               Retry
             </button>
           </div>
         );
       }
       
       return this.props.children;
     }
   }
   ```

3. **3D Content Error Boundary**
   ```typescript
   // client/app/components/error-boundaries/GLTF3DErrorBoundary.tsx
   import { Component, ErrorInfo, ReactNode } from 'react';
   import { AlertTriangle } from 'lucide-react';
   
   interface Props {
     children: ReactNode;
     modelUrl?: string;
   }
   
   interface State {
     hasError: boolean;
     error: Error | null;
   }
   
   export class GLTF3DErrorBoundary extends Component<Props, State> {
     constructor(props: Props) {
       super(props);
       this.state = { hasError: false, error: null };
     }
     
     static getDerivedStateFromError(error: Error): State {
       // Check if it's a 3D/WebGL related error
       const is3DError = 
         error.message.includes('WebGL') ||
         error.message.includes('GLTF') ||
         error.message.includes('model') ||
         error.message.includes('texture');
       
       return { hasError: true, error };
     }
     
     componentDidCatch(error: Error, errorInfo: ErrorInfo) {
       console.error('3D rendering error:', {
         error,
         modelUrl: this.props.modelUrl,
         componentStack: errorInfo.componentStack,
       });
     }
     
     render() {
       if (this.state.hasError) {
         return (
           <div className="flex flex-col items-center justify-center min-h-[300px] bg-muted/50 rounded-lg p-8">
             <AlertTriangle className="h-12 w-12 text-warning mb-4" />
             <h3 className="text-lg font-semibold mb-2">3D Model Unavailable</h3>
             <p className="text-sm text-muted-foreground text-center max-w-sm">
               The 3D model couldn't be loaded. This might be due to browser compatibility 
               or the model file being unavailable.
             </p>
             {this.props.modelUrl && (
               <a
                 href={this.props.modelUrl}
                 className="mt-4 text-sm text-primary hover:underline"
                 target="_blank"
                 rel="noopener noreferrer"
               >
                 View model file
               </a>
             )}
           </div>
         );
       }
       
       return this.props.children;
     }
   }
   ```

### Phase 4: API Error Handling

1. **API Client Error Handling**
   ```typescript
   // client/app/lib/api-client.ts
   import { ValidationError, AuthenticationError, NotFoundError } from './errors';
   
   export class ApiClient {
     private baseUrl: string;
     
     constructor(baseUrl: string = '/api') {
       this.baseUrl = baseUrl;
     }
     
     private async handleResponse<T>(response: Response): Promise<T> {
       const data = await response.json();
       
       if (!response.ok) {
         const errorCode = data.error?.code;
         const errorMessage = data.error?.message || 'An error occurred';
         
         switch (response.status) {
           case 400:
             throw new ValidationError(errorMessage, data.error?.issues);
           case 401:
             throw new AuthenticationError(errorMessage);
           case 403:
             throw new AuthorizationError(errorMessage);
           case 404:
             throw new NotFoundError(errorMessage);
           case 409:
             throw new ConflictError(errorMessage);
           case 429:
             throw new RateLimitError(data.error?.retryAfter);
           default:
             throw new ApiError(errorMessage, response.status, errorCode);
         }
       }
       
       return data;
     }
     
     async get<T>(path: string, options?: RequestInit): Promise<T> {
       const response = await fetch(`${this.baseUrl}${path}`, {
         method: 'GET',
         ...options,
       });
       return this.handleResponse<T>(response);
     }
     
     async post<T>(path: string, body: unknown, options?: RequestInit): Promise<T> {
       const response = await fetch(`${this.baseUrl}${path}`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(body),
         ...options,
       });
       return this.handleResponse<T>(response);
     }
   }
   
   // Client-side error classes
   export class ApiError extends Error {
     constructor(
       message: string,
       public statusCode: number,
       public code: string
     ) {
       super(message);
       this.name = 'ApiError';
     }
   }
   ```

2. **React Query Error Handling**
   ```typescript
   // client/app/hooks/useApiQuery.ts
   import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
   import { ApiClient, ApiError } from '@/lib/api-client';
   
   const apiClient = new ApiClient();
   
   export function useApiQuery<T>(
     key: string[],
     path: string,
     options?: { enabled?: boolean }
   ) {
     return useQuery({
       queryKey: key,
       queryFn: () => apiClient.get<T>(path),
       retry: (failureCount, error) => {
         // Don't retry on 4xx errors
         if (error instanceof ApiError && error.statusCode < 500) {
           return false;
         }
         return failureCount < 3;
       },
       ...options,
     });
   }
   
   export function useApiMutation<T, TInput>(
     path: string,
     options?: {
       onSuccess?: (data: T) => void;
       onError?: (error: Error) => void;
     }
   ) {
     const queryClient = useQueryClient();
     
     return useMutation({
       mutationFn: (input: TInput) => apiClient.post<T>(path, input),
       onSuccess: (data) => {
         options?.onSuccess?.(data);
         // Invalidate relevant queries
         queryClient.invalidateQueries();
       },
       onError: (error) => {
         options?.onError?.(error as Error);
       },
     });
   }
   ```

### Phase 5: User-Facing Error States

1. **Error State Components**
   ```typescript
   // client/app/components/ui/error-states.tsx
   import { AlertTriangle, RefreshCw, Home, Mail } from 'lucide-react';
   
   interface ErrorStateProps {
     title?: string;
     message: string;
     action?: {
       label: string;
       onClick: () => void;
     };
     secondaryAction?: {
       label: string;
       href: string;
     };
   }
   
   export function ErrorState({
     title = 'Something went wrong',
     message,
     action,
     secondaryAction,
   }: ErrorStateProps) {
     return (
       <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
         <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
         <h2 className="text-2xl font-semibold mb-2">{title}</h2>
         <p className="text-muted-foreground mb-6 max-w-md">{message}</p>
         
         <div className="flex gap-4">
           {action && (
             <button
               onClick={action.onClick}
               className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
             >
               <RefreshCw className="h-4 w-4" />
               {action.label}
             </button>
           )}
           
           {secondaryAction && (
             <a
               href={secondaryAction.href}
               className="inline-flex items-center gap-2 px-4 py-2 border border-input rounded-md hover:bg-accent"
             >
               <Home className="h-4 w-4" />
               {secondaryAction.label}
             </a>
           )}
         </div>
       </div>
     );
   }
   
   export function NotFoundState() {
     return (
       <ErrorState
         title="Page not found"
         message="The page you're looking for doesn't exist or has been moved."
         secondaryAction={{ label: 'Go Home', href: '/' }}
       />
     );
   }
   
   export function UnauthorizedState() {
     return (
       <ErrorState
         title="Access denied"
         message="You don't have permission to view this page. Please sign in or contact support."
         secondaryAction={{ label: 'Contact Support', href: 'mailto:team@wear-run.com' }}
       />
     );
   }
   
   export function NetworkErrorState({ onRetry }: { onRetry: () => void }) {
     return (
       <ErrorState
         title="Connection error"
         message="Unable to connect to the server. Please check your internet connection and try again."
         action={{ label: 'Retry', onClick: onRetry }}
       />
     );
   }
   ```

2. **Form Error Handling**
   ```typescript
   // client/app/components/forms/FormError.tsx
   import { AlertCircle } from 'lucide-react';
   
   interface FormErrorProps {
     message: string;
     issues?: Array<{ path: string; message: string }>;
   }
   
   export function FormError({ message, issues }: FormErrorProps) {
     return (
       <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/10">
         <div className="flex items-start gap-3">
           <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
           <div>
             <p className="font-medium text-destructive">{message}</p>
             {issues && issues.length > 0 && (
               <ul className="mt-2 text-sm text-muted-foreground">
                 {issues.map((issue, index) => (
                   <li key={index}>
                     <span className="font-medium">{issue.path}:</span> {issue.message}
                   </li>
                 ))}
               </ul>
             )}
           </div>
         </div>
       </div>
     );
   }
   ```

### Phase 6: Error Logging and Monitoring

1. **Error Logging Service**
   ```typescript
   // server/services/errorLoggingService.ts
   interface ErrorLog {
     timestamp: Date;
     error: {
       name: string;
       message: string;
       stack?: string;
     };
     context: {
       path: string;
       method: string;
       userId?: string;
       requestId: string;
       userAgent?: string;
       ip?: string;
     };
   }
   
   export class ErrorLoggingService {
     private logs: ErrorLog[] = [];
     
     log(error: Error, context: ErrorLog['context']) {
       const logEntry: ErrorLog = {
         timestamp: new Date(),
         error: {
           name: error.name,
           message: error.message,
           stack: error.stack,
         },
         context,
       };
       
       this.logs.push(logEntry);
       
       // In production, send to error tracking service
       if (process.env.NODE_ENV === 'production') {
         this.sendToErrorTracking(logEntry);
       }
       
       // Log to console in development
       if (process.env.NODE_ENV === 'development') {
         console.error('Error logged:', logEntry);
       }
     }
     
     private async sendToErrorTracking(log: ErrorLog) {
       // Send to Sentry, LogRocket, or similar service
       // Example: Sentry.captureException(log.error, { extra: log.context });
     }
   }
   
   export const errorLoggingService = new ErrorLoggingService();
   ```

## Examples

### Example 1: Complete Error Flow

**Backend Service:**
```typescript
// server/services/orderService.ts
export async function createOrder(userId: string, input: CreateOrderInput) {
  // Validate
  const validated = createOrderSchema.safeParse(input);
  if (!validated.success) {
    throw new ValidationError('Invalid order data', validated.error.issues);
  }
  
  // Check product exists
  const product = await db.products.findById(validated.data.productId);
  if (!product) {
    throw new NotFoundError('Product', validated.data.productId);
  }
  
  // Check inventory
  if (product.stock < validated.data.quantity) {
    throw new ValidationError(`Only ${product.stock} items available`);
  }
  
  // Create order
  const order = await db.orders.create({
    userId,
    ...validated.data,
    status: 'pending',
    total: product.price * validated.data.quantity,
  });
  
  return order;
}
```

**API Route:**
```typescript
// server/routes/orders.ts
router.post('/orders', authMiddleware, async (req, res) => {
  // Express 5 handles async errors automatically
  const order = await orderService.createOrder(req.user.id, req.body);
  res.status(201).json(order);
});
```

**Frontend Component:**
```typescript
// client/app/pages/CreateOrderPage.tsx
import { useApiMutation } from '@/hooks/useApiQuery';
import { FormError } from '@/components/forms/FormError';
import { ErrorState } from '@/components/ui/error-states';

export function CreateOrderPage() {
  const mutation = useApiMutation<Order, CreateOrderInput>('/orders', {
    onError: (error) => {
      if (error instanceof ValidationError) {
        setFormErrors(error.issues);
      }
    },
  });
  
  if (mutation.isError && !(mutation.error instanceof ValidationError)) {
    return (
      <ErrorState
        message="Failed to create order. Please try again."
        action={{ label: 'Retry', onClick: () => mutation.reset() }}
      />
    );
  }
  
  return (
    <form onSubmit={handleSubmit}>
      {mutation.error instanceof ValidationError && (
        <FormError message={mutation.error.message} issues={mutation.error.issues} />
      )}
      {/* Form fields */}
    </form>
  );
}
```

### Example 2: Error Boundary Usage

```typescript
// client/app/pages/ProductDetailPage.tsx
import { GlobalErrorBoundary } from '@/components/error-boundaries/GlobalErrorBoundary';
import { FeatureErrorBoundary } from '@/components/error-boundaries/FeatureErrorBoundary';
import { GLTF3DErrorBoundary } from '@/components/error-boundaries/GLTF3DErrorBoundary';
import { ProductViewer } from '@/components/products/ProductViewer';
import { ProductReviews } from '@/components/products/ProductReviews';

export function ProductDetailPage() {
  return (
    <GlobalErrorBoundary>
      <div className="product-page">
        {/* Critical content - no boundary */}
        <h1>{product.name}</h1>
        <p>{product.description}</p>
        
        {/* 3D viewer - isolated error boundary */}
        <GLTF3DErrorBoundary modelUrl={product.modelUrl}>
          <ProductViewer modelUrl={product.modelUrl} />
        </GLTF3DErrorBoundary>
        
        {/* Reviews - feature error boundary */}
        <FeatureErrorBoundary featureName="Reviews">
          <ProductReviews productId={product.id} />
        </FeatureErrorBoundary>
      </div>
    </GlobalErrorBoundary>
  );
}
```

## Error Handling Checklist

```markdown
## Backend
- [ ] Custom error classes defined
- [ ] Service layer throws appropriate errors
- [ ] Global error handler middleware configured
- [ ] Error logging implemented
- [ ] Input validation with Zod

## Frontend
- [ ] Global error boundary wraps app
- [ ] Feature-specific error boundaries
- [ ] 3D content error boundaries
- [ ] API client handles errors
- [ ] User-friendly error states
- [ ] Form error handling

## User Experience
- [ ] Clear error messages
- [ ] Retry actions available
- [ ] Fallback content shown
- [ ] Loading states handled
- [ ] Network errors handled

## Monitoring
- [ ] Errors logged to service
- [ ] Stack traces captured
- [ ] Context information included
- [ ] Alert thresholds configured
```

## Constraints

- **NEVER** expose internal error details to users in production
- **NEVER** swallow errors silently - always log or handle
- **ALWAYS** provide user-friendly error messages
- **ALWAYS** include retry actions when appropriate
- **ALWAYS** wrap 3D content in error boundaries

## Related Skills

- `systematic-debugging` - Debug errors found
- `verification-before-completion` - Verify error handling works
- `code-review` - Review error handling patterns
