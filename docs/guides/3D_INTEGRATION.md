# 3D Integration Guide: Google Model Viewer Pipeline

## Overview

This guide defines the canonical pipeline for integrating 3D product models into the RUN apparel platform using `@google/model-viewer`.

## 1. Technical Standard

- **Renderer**: `@google/model-viewer` ONLY.
- **Forbidden**: `@react-three/fiber`, `@react-three/drei`, `three.js` (direct usage in components).
- **Format**: `.glb` (Binary GLTF).

## 2. Component Implementation

Use the `LazyUnifiedModelViewer` for optimal performance.

```typescript
import { LazyUnifiedModelViewer } from '@/components/3d/LazyUnifiedModelViewer';

export function Product3D({ src, alt }: { src: string; alt: string }) {
  return (
    <LazyUnifiedModelViewer
      src={src}
      alt={alt}
      autoRotate
      cameraControls
      shadowIntensity="1"
      environmentImage="neutral"
    />
  );
}
```

## 3. Asset Optimization (GLB)

Before uploading to `public/models/`, all assets must be:

1. **Compressed**: Use `gltf-transform draco` or `gltf-pipeline`.
2. **Size Constraint**: Maximum **2MB** per model for B2B mobile compatibility.
3. **Materials**: PBR materials only; avoid custom shaders.

## 4. Troubleshooting

- **Memory Leaks**: Ensure `model-viewer` elements are properly unmounted in React.
- **WebGL Context Loss**: The `UnifiedModelViewer` handles context restoration automatically.
