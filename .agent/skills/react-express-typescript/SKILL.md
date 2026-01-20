---
name: react-express-typescript
description: |
  Tech stack enforcement for RUN Remix project. Triggers:
  - "create component", "add route", "new feature"
  - "React 19", "Express 5", "TypeScript strict"
  - "3D model", "GLB", "GLTF", "model-viewer"
  Stack: React 19 (Vite 7), Express 5, Tailwind V4, TypeScript strict, @google/model-viewer.
---

# React Express TypeScript Skill

## Goal
Enforce a strict B2B tech stack: React 19 (Vite), Express 5, Tailwind V4, and TypeScript.

## When to Use

Use this skill when:
- Creating new React components
- Adding Express API routes
- Loading 3D models (GLB/GLTF files)
- Enforcing TypeScript strict mode compliance

## Rules

### General
1. **Strict Types**: All code must be written in TypeScript. `any` is strictly forbidden. use `unknown` if necessary but prefer specific types.
2. **Testing**: All new features require unit tests using Vitest (for both frontend and backend).

### Frontend (React 19 + Vite + Tailwind V4)
1. **Components**: All components must be functional components.
2. **Interfaces**: Props must be defined using TypeScript interfaces.
3. **Styling**: Must use Tailwind V4 utility classes. No inline styles or CSS modules allowed unless absolutely necessary for dynamic values that Tailwind cannot handle.
4. **3D Features**: Use `@google/model-viewer` via `UnifiedModelViewer` component. Do NOT use `useGLTF` from drei.

### Backend (Express 5)
1. **Async/Await**: API routes must use `async/await`.
2. **Error Handling**: Implement proper error handling blocks (try/catch) and middleware.

## Instructions & Examples

### React Component Example
```tsx
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "px-4 py-2 rounded-md font-semibold transition-colors duration-200",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  }
);

interface ButtonProps extends VariantProps<typeof buttonVariants> {
  label: string;
  onClick: () => void;
}

export function Button({ label, onClick, variant = "primary" }: Readonly<ButtonProps>) {
  return (
    <button
      className={cn(buttonVariants({ variant }))}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
```

### Express Route Example
```typescript
import { Router, type Request, type Response } from 'express';

const router = Router();

interface UserData {
  id: string;
  name: string;
}

/**
 * Express 5 handles async errors automatically.
 * No need for try/catch blocks unless handling specific error types.
 */
router.get('/users/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  // Simulate DB call
  const user: UserData = await getUserById(id);
  
  if (!user) {
    // Return to ensure function exits
    return res.status(404).json({ error: 'User not found' });
  }

  return res.json({ data: user });
});

async function getUserById(id: string): Promise<UserData> {
  // Mock implementation
  return { id, name: 'John Doe' };
}

export default router;
```

### 3D Model Loader Example
```tsx
import { LazyUnifiedModelViewer } from "@/components/ui/LazyUnifiedModelViewer";
import { ModelViewerErrorBoundary } from "@/components/ui/ModelViewerErrorBoundary";

interface ModelProps {
  src: string;
  alt: string;
}

export function ModelLoader({ src, alt }: Readonly<ModelProps>) {
  return (
    <ModelViewerErrorBoundary>
      <LazyUnifiedModelViewer
        src={src}
        alt={alt}
        autoRotate
        cameraControls
        className="w-full h-[400px]"
      />
    </ModelViewerErrorBoundary>
  );
}
```

## Constraints (Do Not)

1. **Do NOT** use `any` type - strictly forbidden, use `unknown` or specific types.
2. **Do NOT** use class components - only functional components allowed.
3. **Do NOT** use inline styles - use Tailwind V4 utilities.
4. **Do NOT** use `useGLTF` from `@react-three/drei` - use `UnifiedModelViewer` with `@google/model-viewer`.
5. **Do NOT** skip error boundaries around 3D components.
6. **Do NOT** put business logic in route handlers - extract to services.
