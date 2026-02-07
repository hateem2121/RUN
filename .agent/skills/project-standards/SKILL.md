---
name: project-standards
description: |
  Project coding standards for RUN Remix. Triggers:
  - "coding standards", "project patterns", "component structure"
  - "how do I style", "Tailwind v4", "@utility"
  - "Express route pattern", "API structure"
  - "3D model", "GLB", "GLTF", "@google/model-viewer"
  - "TypeScript strict", "no any"
  Stack: React 19, Vite 7, Express 5, Tailwind V4, TypeScript strict.
---

# Project Standards & Patterns

## When to Use

Use this skill when:
- Creating new React components (UI or domain-specific)
- Setting up Express API routes
- Styling with Tailwind V4 `@utility` directives
- Loading 3D models (GLB/GLTF files)
- Configuring TypeScript strict mode compliance

## 1. Project Structure (Monorepo-style)

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

### React (Client)
- **Components**: Functional components with named exports.
- **Styling**: 
    - Use `class-variance-authority` (cva) for component variants.
    - Use `cn` utility for class merging.
    - **Radix UI**: Use Radix primitives for accessible interactive components.
    - **Icons**: Use `lucide-react`.
- **Props**: Define interfaces for props. Use `React.ComponentProps<"element">` for extending native elements.

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
- **Async/Await**: Use `async` handlers. Express 5 supports proper error handling for promises (no need for wrapper).
- **Linting**: Use `// biome-ignore ...` for necessary suppressions.
- **Services**: Logic goes in `services/`, not controllers/routes.

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

> **Important**: This project uses `@google/model-viewer` as the primary 3D rendering solution, NOT `@react-three/drei` for GLTF loading.
>
> **Note**: `@react-three/drei` IS installed (v10.7.7) but **only** for non-GLTF utilities like `PerspectiveCamera`. Do NOT import `useGLTF` from drei.

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
