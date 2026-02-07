# Migration Guide: React Three Fiber to Google Model Viewer

> [!IMPORTANT]
> **Status:** Active Technical Debt
> **Goal:** Standardize all 3D product visualization on `@google/model-viewer`.

## Context

RUN APPAREL is transitioning away from `@react-three/fiber` (R3F) and `@react-three/drei` for standard product visualization. While R3F is powerful, it introduces significant complexity, bundle size overhead, and performance costs that are often unnecessary for our B2B e-commerce needs.

Our new standard is `@google/model-viewer`, a web component that provides:
- **Better Performance:** Native browser optimizations.
- **Smaller Bundle:** Lazy-loaded 3D engine.
- **Standard features:** Built-in AR support, camera controls, and environment lighting.
- **Declarative API:** Simpler to maintain and debug.

## Migration Strategy

### 1. Assessment
Identify all components currently using `<Canvas>`:
- `client/app/components/homepage/Hero.tsx`
- `client/app/components/homepage/Values.tsx`
- `client/app/components/ui/UnifiedModelViewer.tsx` (ensure it defaults to model-viewer)

### 2. Replacement Pattern

#### Legacy (R3F)
```tsx
import { Canvas } from "@react-three/fiber";
import { useGLTF, Stage, OrbitControls } from "@react-three/drei";

export default function ProductView() {
  const { scene } = useGLTF("/models/shoe.glb");
  return (
    <Canvas>
      <Stage>
        <primitive object={scene} />
      </Stage>
      <OrbitControls />
    </Canvas>
  );
}
```

#### New Standard (Model Viewer)
```tsx
import "@google/model-viewer";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": any;
    }
  }
}

export default function ProductView() {
  return (
    <model-viewer
      src="/models/shoe.glb"
      alt="A 3D model of a shoe"
      ar
      auto-rotate
      camera-controls
      style={{ width: "100%", height: "500px" }}
    />
  );
}
```

### 3. Handling Complex Interactions
If a component relies on complex custom shaders or physics that `model-viewer` cannot support:
1. **Challenge the Requirement:** Does the user *need* this complexity for a B2B platform?
2. **Isolate:** Keep R3F usage isolated to that specific component.
3. **Lazy Load:** Ensure the R3F bundle is only loaded when that specific component is mounted.

## Checklist for Migration
- [ ] Verify `UnifiedModelViewer` component is the single source of truth for 3D.
- [ ] Refactor `Hero.tsx` to use `model-viewer` or `UnifiedModelViewer`.
- [ ] Refactor `Values.tsx` to use `UnifiedModelViewer`.
- [ ] Uninstall `@react-three/fiber`, `@react-three/drei`, `three`, and `@types/three`.

## Best Practices
- **Assets:** Ensure all `.glb` files are optimized (Draco compression).
- **Loading:** Use `poster` attributes for instant visual feedback.
- **Accessibility:** always provide valid `alt` text.
