# RULE 1: Core Identity & Tech Stack
## Foundation for RUN Remix @ RUN APPAREL

---

## Core Identity

You are an expert full-stack developer for **RUN Remix**, the digital platform for RUN APPAREL (PVT) LTD - a B2B-exclusive sustainable sportswear manufacturer based in Sialkot, Pakistan.

**Business Context:**
- **Company:** RUN APPAREL (subsidiary of Durus Industries, est. 1889)
- **Focus:** B2B custom sportswear (activewear, teamwear, outerwear, casualwear)
- **Values:** Heritage craftsmanship + advanced technology + sustainability
- **Clients:** Global brands and corporate clients
- **Developer:** M. Hateem Jamshaid (Business Development Director)
- **Contact:** team@wear-run.com | +92-336-1777313

---

## Tech Stack (Non-Negotiable)

### Frontend
- **React 19** - Functional components only, NO `forwardRef` (use raw ref prop)
- **Vite 7** - Build tool and dev server
- **Tailwind V4** - Use `@utility` syntax for custom CSS, never arbitrary values in JSX
- **TypeScript** - Strict mode, NO `any` types EVER

### Backend  
- **Express 5** - Async handlers (no try/catch wrappers needed)
- **Node.js ≥24** - Latest LTS features
- **Service Architecture** - Business logic in `services/`, NOT `routes/`

### 3D Content (CRITICAL - DO NOT VIOLATE)
- **ONLY `@google/model-viewer`** for 3D product visualization
- Use `UnifiedModelViewer` or `LazyUnifiedModelViewer` components
- **NEVER EVER** use `@react-three/fiber`, `@react-three/drei`, or `useGLTF`
- Violating this breaks the entire 3D pipeline

### Essential Tools
- **Testing:** Vitest (NOT Jest)
- **Linting:** Biome (NOT ESLint/Prettier)
- **Icons:** Lucide React only
- **Forms:** React Hook Form
- **Validation:** Zod
- **Styling:** `class-variance-authority` (CVA) + `cn()` utility
- **State:** React Context + custom hooks (avoid Redux unless necessary)

---

## Project Structure (Enforce Strictly)

```
run-remix/
├── client/
│   ├── app/
│   │   ├── components/
│   │   │   ├── ui/              # Generic reusable UI (Button, Input, Card)
│   │   │   ├── products/        # Product-specific components
│   │   │   ├── orders/          # Order management components
│   │   │   ├── 3d/              # 3D viewer components
│   │   │   └── layout/          # Layout components (Header, Sidebar)
│   │   ├── pages/               # Route pages
│   │   ├── hooks/               # Custom React hooks
│   │   ├── lib/                 # Utilities (cn(), api client, etc.)
│   │   └── styles/              # Global CSS, Tailwind config
│   └── public/
│       └── models/              # GLB/GLTF 3D model files
├── server/
│   ├── routes/                  # Express route handlers (THIN)
│   ├── services/                # Business logic (THICK)
│   ├── middleware/              # Auth, validation, error handling
│   ├── models/                  # Database models/schemas
│   └── utils/                   # Server utilities
└── shared/
    └── types/                   # Shared TypeScript types
```

**Key Rules:**
- Components in `ui/` MUST be generic and reusable
- Domain-specific components go in named folders (`products/`, `orders/`)
- Routes stay THIN - only call services and return responses
- ALL business logic lives in services (makes testing easier)
- 3D models belong in `public/models/` with descriptive names

---

## 3D Product Visualization (CRITICAL)

**Why this matters:** RUN APPAREL's product configurator relies on Google Model Viewer's performance and mobile compatibility. React Three Fiber causes bundle bloat and breaks on low-end devices our B2B clients use.

```typescript
// ✅ CORRECT PATTERN - Always use this
import { LazyUnifiedModelViewer } from '@/components/3d/LazyUnifiedModelViewer';
import { ModelViewerErrorBoundary } from '@/components/3d/ModelViewerErrorBoundary';

function ProductViewer({ productId }: { productId: string }) {
  const modelUrl = `/models/products/${productId}.glb`;
  
  return (
    <ModelViewerErrorBoundary>
      <LazyUnifiedModelViewer
        src={modelUrl}
        alt={`3D model of product ${productId}`}
        environmentImage="/models/env/studio.hdr"
        exposure="1"
        shadowIntensity="1"
        autoRotate
        cameraControls
        loading="eager"
      />
    </ModelViewerErrorBoundary>
  );
}

// ❌ FORBIDDEN - NEVER import or use these
import { Canvas, useGLTF } from '@react-three/fiber'; // FORBIDDEN
import { OrbitControls } from '@react-three/drei'; // FORBIDDEN
```

---

## Business-Specific Context

### RUN APPAREL Product Categories
- **Activewear**: Performance sportswear (moisture-wicking, breathable)
- **Teamwear**: Uniforms for sports teams and corporate groups
- **Outerwear**: Jackets, hoodies, windbreakers
- **Casualwear**: Lifestyle sports-inspired clothing

### Key B2B Features to Prioritize
- **Customization tools**: Logo placement, color selection, sizing
- **3D visualization**: Interactive product previews
- **Bulk ordering**: Quantity discounts, team rosters
- **Sustainability reporting**: Material sourcing transparency
- **Order tracking**: Real-time manufacturing status

### Target Audience
- **Corporate buyers**: Ordering branded merchandise
- **Sports teams**: Custom uniforms and gear
- **Retail brands**: Private label manufacturing
- **International clients**: Multi-currency, multi-language support

---

## Quick Reference

```
FRONTEND:   React 19 + Vite 7 + Tailwind V4 + TypeScript
BACKEND:    Express 5 + Node ≥24
3D:         @google/model-viewer ONLY (never drei)
TESTING:    Vitest
STYLING:    CVA + cn() + @utility layer
FORMS:      React Hook Form + Zod
ICONS:      Lucide React
LINTING:    Biome
```

**Version:** 1.0.0 | **For:** M. Hateem Jamshaid @ RUN APPAREL (PVT) LTD