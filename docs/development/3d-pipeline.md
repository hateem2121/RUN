# 3D Asset Pipeline & Visualization

**Status:** Stable (Phase 2.2)  
**Stack:** `@google/model-viewer` (Web Component) + React 19 Wrapper  
**Primary Component:** `UnifiedModelViewer`

This document outlines the workflow for ingesting, optimizing, and displaying 3D assets in the RUN-Remix platform.

---

## 1. Supported Formats

We strictly support **GLB (Binary glTF)** and **glTF (JSON)**.

| Format | Extension | Status | Usage |
| :--- | :--- | :--- | :--- |
| **GLB** | `.glb` | ✅ **Recommended** | Production assets. Single file, binary, efficient. |
| **glTF** | `.gltf` + `.bin` | ⚠️ Dev Only | Debugging structure. Avoid in production due to multiple requests. |

### Technical constraints
- **Textures**: Embedded in GLB or relative paths in glTF.
- **Draco Compression**: Supported and recommended for high-poly models.
- **Max File Size**: Target **< 5MB** for mobile performance. Warns > 20MB.

---

## 2. The `UnifiedModelViewer` Component

We do **not** use the raw `<model-viewer>` element directly. Always use the `UnifiedModelViewer` wrapper to ensure consistency, error handling, and performance standards.

### Usage

```tsx
import UnifiedModelViewer from "@/components/ui/UnifiedModelViewer";
import type { MediaAsset } from "@shared/schema";

export function ProductShowcase({ asset }: { asset: MediaAsset }) {
  return (
    <div className="h-[500px] w-full">
      <UnifiedModelViewer 
        asset={asset}
        showControls={true}
        className="rounded-xl border"
      />
    </div>
  );
}
```

### Key Features
- **Lazy Loading**: Uses `IntersectionObserver` to load models only when visible in the viewport.
- **Error Boundaries**: Automates recovery from WebGL context loss or network failures.
- **Smart Retries**: Exponential backoff for failed loads (Configurable via `ModelViewerErrorConfig`).
- **Mobile Optimization**: Auto-detects mobile devices to adjust shadow intensity and exposure.

---

## 3. Configuration & Defaults

Configuration is centralized in `client/app/lib/model-viewer-config.ts`. Do not hardcode attributes like `shadow-intensity` in components.

### Preset Configurations

The system provides presets for common scenarios:

```typescript
import { MODEL_VIEWER_PRESETS } from "@/lib/model-viewer-config";

// Usage in component
<UnifiedModelViewer 
  config={MODEL_VIEWER_PRESETS.mobile} // or .highPerformance, .showcase
  asset={asset}
/>
```

| Preset | Optimized For | Settings |
| :--- | :--- | :--- |
| `highPerformance` | Large catalogs | Lazy load, no auto-rotate, reduced shadows. |
| `showcase` | Hero sections | Auto-rotate, camera controls, high exposure. |
| `mobile` | Mobile devices | Reduced quality settings to save battery/thermal. |

---

## 4. Optimization Pipeline

All assets should pass through optimization before upload.

### Recommended Tools
1.  **gltf-transform** (CLI): Best for scripting.
    ```bash
    # Resize textures to 1024px and use KTX2 compression
    gltf-transform resize input.glb output.glb --width 1024 --height 1024
    ```
2.  **glTF Pipeline**:
    ```bash
    # Apply Draco compression
    gltf-pipeline -i input.glb -o output.glb --draco.compressionLevel 7
    ```

### Performance Budgets
- **Geometry**: < 100k triangles.
- **Textures**: Max 2048x2048 for Hero, 1024x1024 for listings.
- **Draw Calls**: < 50 per model (merge meshes where possible).

---

## 5. Troubleshooting

### Common Issues

1.  **"WebGL Context Lost"**
    *   **Cause**: Too many active contexts (browser limit usually ~16) or tab backgrounding.
    *   **Fix**: `UnifiedModelViewer` handles this automatically via `handleWebGLRecovery`.

2.  **Texture Artifacts**
    *   **Cause**: Incompatible compression (e.g., standard JPEG/PNG vs KTX2).
    *   **Fix**: Ensure client supports the extensions used in the GLB.

3.  **Loading Stalls**
    *   **Cause**: Large file size or valid CORS headers missing.
    *   **Fix**: Check `verify-assets.ts` (future) or verify CDN CORS headers.
