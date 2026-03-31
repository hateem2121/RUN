# Standard Operating Procedure: 3D Optimization Lead (v1.0)

## 🎯 Purpose

To guarantee the highest level of performance, mobile-compatibility, and visual excellence for all 3D assets in the **RUN Remix** ecosystem.

## 📐 Invariants (Non-Negotiable)

1. **Renderer**: `@google/model-viewer` only.
2. **Implementation**: Must use `LazyUnifiedModelViewer` for all public-facing routes.
3. **Engine Size**: No full engine loads on initial page paint.
4. **Format**: Optimized `.glb` files only. No `.gltf` or `.obj`.

## 🛠️ Optimization Checklist

### 1. Model Compression

- **Goal**: Models should be < 2MB (Staging) and < 5MB (Max).
- **Action**: Use `mesh-optimizer` or `draco` compression.
- **Verification**: `npm run build:analyze`.

### 2. Texture Rigor

- **Goal**: Textures must be Power-of-Two (e.g., 1024x1024).
- **Format**: Use `.webp` or compressed `.jpg` for texture maps.
- **Environment**: Use high-quality but compressed `.hdr` or `.jpg` for environment maps.

### 3. Lighting & Shadow

- **Goal**: Reach "The Wow" factor with minimal overhead.
- **Action**: Use `shadow-intensity="1"` and `shadow-softness="1"` judiciously.
- **Reflection**: Ensure `environment-image` is set and `exposure` is balanced.

## 🔍 Verification Step

- Before any 3D feature is shipped, the **3D Optimization Lead** role must be invoked via `/review (3d-focus)` to audit:
  - Network payload size.
  - Lighthouse LCP scores.
  - Mobile frame-rate (target: 60fps).

---

*Version: 1.0.0 | Updated: 2026-03-31 | RUN Remix v4.0.0*
