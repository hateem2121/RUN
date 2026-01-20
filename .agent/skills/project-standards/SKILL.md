---
name: project-standards
description: Detailed coding standards and patterns for the RUN Remix project, covering React 19, Express 5, Tailwind V4, and TypeScript.
---

# Project Standards & Patterns

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
}

const Component = React.forwardRef<HTMLButtonElement, ComponentProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(componentVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Component.displayName = "Component";

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
- **Library**: `react-three/drei` and `@google/model-viewer` (specialized usage).
- **Loading**:
    - Use `UnifiedModelViewer` pattern for heavy assets.
    - Implement `LoadingState` interfaces for fine-grained progress tracking.
    - Lazy load with `IntersectionObserver`.
    - Cache GLTF content using Blob URLs where possible.
- **Error Handling**: Wrap 3D components in `ModelViewerErrorBoundary` or similar custom boundaries.
- **Performance**: Use `useGLTF` from drei.

## 5. Testing
- **Runner**: Vitest.
- **Location**: `tests/` directories or `*.test.tsx` colocated.
- **Mocking**: extensively for heavy hooks/libraries.
