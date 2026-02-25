---
name: project-standards
description: |
  Project coding standards for RUN Remix. Triggers:
  - "coding standards", "project patterns", "component structure"
  - "how do I style", "Tailwind v4", "@utility"
  - "Express route pattern", "API structure"
  - "3D model", "GLB", "GLTF", "@google/model-viewer"
  - "TypeScript strict", "no any", "return types"
  Stack: React 19, Vite 7, Express 5, Tailwind V4, TypeScript strict.
---

# Project Standards & Patterns (v2.0)

## The System Pilot Protocol (B.L.A.S.T.)

All work MUST follow the B.L.A.S.T. protocol as defined in `gemini.md`:

1. **Blueprint**: Vision first. SOPs in `architecture/`.
2. **Link**: Handsake. Scripts in `scripts/`.
3. **Architect**: L1 Architecture, L2 Navigation, L3 Tools in `tools/`.
4. **Stylize**: The WOW. 5 Dimensions of Design.
5. **Trigger**: Deployment & Maintenance.

## 1. Project Structure (A.N.T. Layers)

- **Root**: Configuration files (`biome.json`, `tsconfig.base.json`).
- **Client** (`/client`): React 19 + Vite app.
    - `app/components/ui`: Reusable, generic UI components (Shadcn-like, using CVA).
    - `app/components/[domain]`: Domain-specific components (e.g., `admin`, `product`).
    - `app/hooks`: Custom React hooks.
    - `app/lib`: Utilities (e.g., `utils.ts` for `cn`).
    - `app/index.css`: Tailwind V4 entry point.
- **Server** (`/server`): Express 5 backend.
    - `routes/`: API route definitions.
    - `services/`: Business logic layer.
    - `lib/`: Shared utilities.

## 2. Technology Stack & Versions

- **Frontend**: React 19, Vite 7, Tailwind CSS 4.
- **Backend**: Express 5, Node.js (>=24).
- **Language**: TypeScript (Strict Mode).
- **Linter/Formatter**: Biome.

## 3. Coding Standards

### TypeScript
- **Strict Mode**: Enabled in `tsconfig.base.json`.
- **Imports**: Use `import type` for type-only imports associated with `verbatimModuleSyntax`.
- **Config**: 
    - `noUncheckedIndexedAccess`: true (Handle undefined array/object access).
    - `noImplicitOverride`: true.
- **No `any`**: Strictly forbidden. Use `unknown` or specific types.
- **Return Types**: Always specify explicit return types for functions.
- **Async/Await**: Always use `async/await` for asynchronous operations.

### React (Client)
- **Named Exports**: Use named exports for all components.
- **Functional Components**: Functional components only. No class components.
- **Radix UI**: Use Radix primitives for accessible interactive components.
- **Icons**: Use `lucide-react`.
- **Props**: Define interfaces for props. Use `React.ComponentProps<"element">` for extending native elements.
- **Raw Ref Prop**: Use the raw `ref` prop (React 19 pattern). No `forwardRef`.
- **Hooks**: Follow proper hooks usage with cancellation logic in `useEffect`.

#### Component Template (UI)
```tsx
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const componentVariants = cva(
  "base-classes-here",
  {
    variants: {
      variant: {
        default: "variant-classes",
        outline: "outline-classes",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-9 px-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ComponentProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof componentVariants> {
  asChild?: boolean;
  ref?: React.Ref<HTMLButtonElement>;
}

// React 19: ref is a standard prop, no forwardRef needed
const Component = ({
  className,
  variant,
  size,
  asChild = false,
  ref,
  ...props
}: ComponentProps) => {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(componentVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
};

export { Component, componentVariants };
```


### 5 Dimensions of Design (The WOW Factor)

Every UI component MUST be evaluated against these dimensions:

1. **Skeleton (Layout)**: Use Bento Grids or Industry-Standard layouts.
2. **Skin (Aesthetic)**: Glassmorphism (`glass-premium`), Aurora/Mesh Gradients.
3. **Palette (Theme)**: Trust-based colors, Slate #0a0a0a dark mode.
4. **Voice (Typography)**: Inter/JetBrains Mono pairing.
5. **Soul (Motion)**: 60fps micro-animations, Border Beams, Scroll Reveal.

### Tailwind CSS V4
- **Directives**: Use `@utility` for custom utility classes in CSS files.
- **Variables**: Use native CSS variables (e.g., `var(--color-bg)`) for theming.
- **Imports**: standard `@import "tailwindcss";`.

#### CSS Example
```css
@import "tailwindcss";

@utility z-dock {
  z-index: var(--z-index-dock, 300);
}

@utility text-subtle {
  color: var(--color-text-subtle);
}
```

### Express (Server)
- **Routing**: Use `Router()` modules.
- **Async/Await**: Use `async` handlers. Express 5 handles promise rejections automatically.
- **Validation**: Always use Zod for request body and parameter validation.
- **Services**: Business logic and DB operations MUST go in `services/`, not handlers/routes.
- **Thin Routes**: Routes should be thin, focusing on handshake and response.
- **Error Handling**: Use custom error classes (e.g., `ProductNotFoundError`).
- **Middleware**: Use middleware for cross-cutting concerns (Auth, Logging).

#### Route Template
```typescript
import { Router, type Request, type Response } from "express";
import { someService } from "../services/some-service.js";

const router = Router();

router.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = await someService.getById(id);
  
  if (!data) {
    return res.status(404).json({ error: "Not found" });
  }
  
  return res.json(data);
});

export default router;
```

## 4. 3D & Visualization Patterns

> **Important**: This project uses `@google/model-viewer` as the primary 3D rendering solution.
>
> **Warning**: Do NOT import or use `@react-three/fiber` or `@react-three/drei`. These are NOT installed and NOT supported.

- **Primary Library**: `@google/model-viewer` (web component)
- **React Wrapper**: `UnifiedModelViewer` component (`@/components/ui/UnifiedModelViewer.tsx`)
- **Lazy Loading**: Use `LazyUnifiedModelViewer` for code-splitting
- **Loading Patterns**:
    - Initialize via `ensureModelViewerLoaded()` from `@/lib/model-viewer-loader`
    - Implement `LoadingState` interfaces for progress tracking
    - Lazy load with `IntersectionObserver`
- **Error Handling**: Wrap in `ModelViewerErrorBoundary` (`@/components/ui/ModelViewerErrorBoundary.tsx`)
- **Configuration**: Centralized in `@/lib/model-viewer-config.ts`

#### 3D Component Usage Example
```tsx
import { LazyUnifiedModelViewer } from "@/components/ui/LazyUnifiedModelViewer";
import { ModelViewerErrorBoundary } from "@/components/ui/ModelViewerErrorBoundary";

<ModelViewerErrorBoundary>
  <LazyUnifiedModelViewer
    src="/models/product.glb"
    alt="Product 3D Model"
    autoRotate
    cameraControls
  />
</ModelViewerErrorBoundary>
```

## 5. Testing
- **Runner**: Vitest.
- **Location**: `tests/` directories or `*.test.tsx` colocated.
- **Mocking**: extensively for heavy hooks/libraries.

## 6. Constraints (Do Not)

1. **Do NOT** use `any` type - use `unknown` or specific types instead.
2. **Do NOT** use inline styles - always use Tailwind utilities.
3. **Do NOT** use class components - only functional components.
4. **Do NOT** use `@react-three/drei` `useGLTF` for GLTF loading - use `UnifiedModelViewer`.
5. **Do NOT** skip TypeScript strict mode checks.
6. **Do NOT** put business logic in route handlers - extract to `services/`.
7. **Do NOT** use raw color values - use semantic tokens from theme.
8. **Do NOT** create components without proper error boundaries for 3D content.
9. **Do NOT** run multiple `npm run dev` instances - use `/dev-server` workflow.

## 7. Development Environment

### Dev Server Management
- **Single Instance Only**: Never run `npm run dev` in multiple terminals simultaneously.
- **Starting**: `npm run dev -- --force` (the `predev` script auto-kills orphans).
- **Stopping**: Press `Ctrl+C` in the terminal.
- **Access URL**: Use `http://127.0.0.1:5002` (NOT `localhost` - avoids IPv6 caching issues).

### Troubleshooting
- **504 Vite Errors**: Clear browser cache for `localhost`, use `127.0.0.1`, or incognito mode.
- **Port in use**: `npx kill-port 5002`
- **Port in use**: `npx kill-port 5002`
- **Stuck processes**: `npm run kill:all` (or `pkill -f 'RUN-Remix'`)
- **High CPU**: Ensure `ENABLE_PERFORMANCE_MONITORING=false` and `ENABLE_REACT_SCAN=false` in `.env`.

    *   Use `VITE_ANALYZE=true npm run dev` to generate bundle stats.
    *   Use `VITE_INSPECT=true npm run dev` to debug Vite plugins.

See `/dev-server` workflow for complete instructions.
