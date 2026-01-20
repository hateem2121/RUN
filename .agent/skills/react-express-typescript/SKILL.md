---
name: react-express-typescript
description: Enforce a strict B2B tech stack: React 19 (Vite), Express 5, Tailwind V4, and TypeScript.
---

# React Express TypeScript Skill

## Goal
Enforce a strict B2B tech stack: React 19 (Vite), Express 5, Tailwind V4, and TypeScript.

## Rules

### General
1. **Strict Types**: All code must be written in TypeScript. `any` is strictly forbidden. use `unknown` if necessary but prefer specific types.
2. **Testing**: All new features require unit tests using Vitest (for both frontend and backend).

### Frontend (React 19 + Vite + Tailwind V4)
1. **Components**: All components must be functional components.
2. **Interfaces**: Props must be defined using TypeScript interfaces.
3. **Styling**: Must use Tailwind V4 utility classes. No inline styles or CSS modules allowed unless absolutely necessary for dynamic values that Tailwind cannot handle.
4. **3D Features**: Use `react-three/drei` helpers. Use `useGLTF` for loading GLB/GLTF models.

### Backend (Express 5)
1. **Async/Await**: API routes must use `async/wait`.
2. **Error Handling**: Implement proper error handling blocks (try/catch) and middleware.

## Instructions & Examples

### React Component Example
```tsx
import React from 'react';

interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({ label, onClick, variant = 'primary' }) => {
  const baseStyles = 'px-4 py-2 rounded-md font-semibold transition-colors duration-200';
  const variantStyles = variant === 'primary' 
    ? 'bg-blue-600 text-white hover:bg-blue-700' 
    : 'bg-gray-200 text-gray-800 hover:bg-gray-300';

  return (
    <button 
      className={`${baseStyles} ${variantStyles}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
};
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
import React, { useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { Group } from 'three';

interface ModelProps {
  url: string;
  position?: [number, number, number];
  scale?: [number, number, number];
}

export const ModelLoader: React.FC<ModelProps> = ({ url, position = [0, 0, 0], scale = [1, 1, 1] }) => {
  const { scene } = useGLTF(url);
  const groupRef = useRef<Group>(null);

  return (
    <group ref={groupRef} position={position} scale={scale} dispose={null}>
      <primitive object={scene} />
    </group>
  );
};

// Preload the model to avoid layout shifts
useGLTF.preload('/path/to/model.glb');
```
