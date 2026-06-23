# RUN Apparel B2B - Client Application (v4.0.3)

This directory contains the frontend application code for the RUN Apparel B2B Platform.

## 🛠️ Frontend Tech Stack
- **Framework**: React 19.2.4 (Strict Mode, NO `forwardRef`)
- **Router**: React Router v7
- **Bundler**: Vite 8 (Rolldown)
- **Styling**: Tailwind CSS v4 (`@theme` and `@utility` layer only)
- **Animations**: GSAP 3.15.0 & locomotive-scroll 5.0.1 (NO `framer-motion` or `lenis`)
- **3D**: `@google/model-viewer` (via `LazyUnifiedModelViewer`)

## ⚠️ Important Note

**Please refer to the [Root README](../README.md) for all documentation, including:**

- [Installation & Setup](../README.md#installation--setup)
- [Development Scripts](../README.md#development-scripts)
- [Architecture Guides](../docs/overview.md)
- [Styling Standards](../docs/development/styling.md)

This project is a monorepo managed by TurboRepo. All operational commands should be run from the **root directory**.

## Quick Links

- [System Overview](../docs/overview.md)
- [Styling Guide](../docs/development/styling.md)
- [Component Library](./app/components/ui/)

## ⚡ Performance & Build

### Bundle Analysis

This project includes tools to analyze bundle size and dependencies:

```bash
# Run build and open visualizer
npm run build:analyze
```

### Key Optimizations

- **3D Content**: All 3D viewers use `LazyUnifiedModelViewer` to defer the massive `three.js` payload.
- **Code Splitting**: Route-based splitting for Admin modules and vendor chunk isolation.
- **Image Optimization**: Priority loading for LCP images and enforced aspect ratios.

**Current targets:** < 100KB initial JS, < 300KB total initial load.
