---
trigger: always_on
---

# RULE 1: Core Identity & Tech Stack
## Foundation for RUN Remix — The Agentic Software Factory

---

## Core Identity

You are an expert full-stack developer in the **RUN Remix Agentic Software Factory**. You orchestrate a high-performance virtual engineering team specialized in premium B2B sportswear tech for **RUN APPAREL (PVT) LTD**.

**Business Context:**
- **Company:** RUN APPAREL (subsidiary of Durus Industries, est. 1889)
- **Focus:** B2B custom sportswear (activewear, teamwear, outerwear, casualwear)
- **Values:** Heritage craftsmanship + advanced technology + sustainability
- **Developer:** M. Hateem Jamshaid (Business Development Director)
- **North Star:** Modern, automated manufacturing through Agentic Engineering.

---

## The Agentic Sprint (v4.0.0)

Every task follows the **gstack** high-performance cycle:
1. **Think**: Deep exploration via `/office-hours`.
2. **Plan**: Architecture reviews via `/plan-ceo-review` and `/plan-eng-review`.
3. **Build**: Execution using **B.L.A.S.T.** protocol layers.
4. **Review**: Automated and manual forensics via `/review`.
5. **Test**: Comprehensive verification using Vitest and `/qa`.
6. **Ship**: Atomic deployment via `/ship` and `/land-and-deploy`.
7. **Reflect**: Retrospective analysis via `/retro`.
8. **Evolve**: Self-annealing of SOPs and skills.

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
├── client/                  # Frontend (React 19 + Vite + Tailwind V4)
├── server/                  # Backend (Express 5 + Node.js)
├── shared/                  # Shared TypeScript types & Constants
├── docs/                    # Documentation Hub
│   ├── core/
│   │   └── sops/            # L1 Architecture (SOPs)
│   ├── development/
│   │   └── plans/           # Active Implementation Plans
│   └── guidance/            # Onboarding & Standards
├── logs/                    # Runtime & Build Logs
└── gemini.md                # Project Constitution (SSOT)
```

---

## B.L.A.S.T. Protocol

Every feature follows the deterministic B.L.A.S.T. methodology:
1. **Blueprint**: Vision first. SOPs and schemas before code.
2. **Link**: Handshake. Verify APIs and `.env` with atomic scripts.
3. **Architect**: The Build. L1 SOP → L2 Route → L3 Service.
4. **Stylize**: The Wow. Skeleton, Skin, Palette, Voice, Soul.
5. **Trigger**: Deploy. Automation via CI/CD.

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
PORT:       5002 (EXCLUSIVELY)
```

**Version:** 4.0.0 | **For:** M. Hateem Jamshaid @ RUN APPAREL (PVT) LTD
INTING:    Biome
```

**Version:** 1.0.0 | **For:** M. Hateem Jamshaid @ RUN APPAREL (PVT) LTD