# RUN Apparel B2B - Client Application

This directory contains the frontend application code for the RUN Apparel B2B Platform.

## ⚠️ Important Note

**Please refer to the [Root README](../README.md) for all documentation, including:**

-   **Installation & Setup**
-   **Development Scripts** (`npm run dev`)
-   **Architecture Guides**
-   **Styling Standards**
-   **Contribution Guidelines**

This project is a monorepo managed by TurboRepo. All operational commands should be run from the **root directory**.

## Quick Links

-   [System Overview](../docs/overview.md)
-   [Styling Guide](../docs/development/styling.md)
-   [Component Library](../client/app/components/ui/)

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
