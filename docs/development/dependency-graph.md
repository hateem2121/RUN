# Dependency Graph Documentation

## Overview

This document provides a comprehensive view of the RUN Remix module dependencies, helping developers understand the relationships between components, services, and shared code.

**Status:** Current State Documented  
**Last Updated:** February 2026  
**Architecture Pattern:** Monorepo with NPM Workspaces

---

## High-Level Architecture

```mermaid
graph TB
    subgraph Client
        C_PAGES[Pages]
        C_COMP[Components]
        C_HOOKS[Hooks]
        C_LIB[Lib/Utilities]
        C_STYLES[Styles]
    end
    
    subgraph Server
        S_ROUTES[Routes]
        S_SERVICES[Services]
        S_MODELS[Models]
        S_MIDDLEWARE[Middleware]
        S_LIB[Lib/Utilities]
    end
    
    subgraph Shared
        SH_TYPES[Types]
        SH_SCHEMA[Zod Schemas]
        SH_CONST[Constants]
    end
    
    subgraph External
        E_DB[(Neon DB)]
        E_REDIS[(Upstash Redis)]
        E_STORAGE[Google Cloud Storage]
    end
    
    C_PAGES --> C_COMP
    C_COMP --> C_HOOKS
    C_HOOKS --> C_LIB
    C_COMP --> C_STYLES
    
    S_ROUTES --> S_SERVICES
    S_SERVICES --> S_MODELS
    S_ROUTES --> S_MIDDLEWARE
    S_SERVICES --> S_LIB
    
    C_LIB --> SH_TYPES
    C_LIB --> SH_SCHEMA
    S_SERVICES --> SH_TYPES
    S_SERVICES --> SH_SCHEMA
    S_MODELS --> SH_TYPES
    
    S_MODELS --> E_DB
    S_SERVICES --> E_REDIS
    S_SERVICES --> E_STORAGE
```

---

## Workspace Dependencies

### Package Dependency Graph

```mermaid
graph LR
    ROOT[run-remix-monorepo]
    CLIENT[client]
    SERVER[server]
    SHARED[shared]
    
    ROOT --> CLIENT
    ROOT --> SERVER
    ROOT --> SHARED
    
    CLIENT -->|@run-remix/shared| SHARED
    SERVER -->|@run-remix/shared| SHARED
```

### Import Rules

| From | To | Allowed | Example |
|------|-----|---------|---------|
| `client/` | `shared/` | ✅ Yes | `import { Product } from '@run-remix/shared'` |
| `client/` | `server/` | ❌ No | Use API calls instead |
| `server/` | `shared/` | ✅ Yes | `import { ProductSchema } from '@run-remix/shared'` |
| `server/` | `client/` | ❌ No | Never import from client |
| `shared/` | `client/` | ❌ No | Shared has no dependencies |
| `shared/` | `server/` | ❌ No | Shared has no dependencies |

---

## Client-Side Dependencies

### Component Hierarchy

```mermaid
graph TB
    subgraph Pages
        P_HOME[HomePage]
        P_PRODUCTS[ProductsPage]
        P_ADMIN[AdminPage]
        P_ABOUT[AboutPage]
    end
    
    subgraph Layout
        L_HEADER[Header]
        L_FOOTER[Footer]
        L_NAV[Navigation]
        L_SIDEBAR[Sidebar]
    end
    
    subgraph Domain Components
        D_PROD[ProductCard]
        D_CAT[CategoryDisplay]
        D_FAB[FabricCard]
        D_CERT[CertificateCard]
    end
    
    subgraph UI Components
        UI_BTN[Button]
        UI_INP[Input]
        UI_CARD[Card]
        UI_MODAL[Modal]
        UI_TBL[Table]
    end
    
    subgraph 3D Components
        TD_VIEWER[UnifiedModelViewer]
        TD_LAZY[LazyUnifiedModelViewer]
        TD_ERROR[ModelViewerErrorBoundary]
    end
    
    P_HOME --> L_HEADER
    P_HOME --> L_FOOTER
    P_HOME --> D_PROD
    P_HOME --> D_CAT
    
    P_PRODUCTS --> D_PROD
    P_PRODUCTS --> D_FAB
    
    P_ADMIN --> L_SIDEBAR
    P_ADMIN --> D_PROD
    P_ADMIN --> D_FAB
    P_ADMIN --> D_CERT
    
    D_PROD --> UI_BTN
    D_PROD --> UI_CARD
    D_PROD --> TD_LAZY
    
    D_FAB --> UI_BTN
    D_FAB --> UI_CARD
    
    D_CERT --> UI_BTN
    D_CERT --> UI_CARD
    
    TD_LAZY --> TD_ERROR
    TD_LAZY --> TD_VIEWER
```

### Hook Dependencies

```mermaid
graph TB
    subgraph Data Hooks
        H_PROD[useProduct]
        H_FAB[useFabric]
        H_CAT[useCategory]
        H_CERT[useCertificate]
    end
    
    subgraph Form Hooks
        H_FORM[useProductForm]
        H_FABFORM[useFabricForm]
        H_VAL[useSmartValidation]
    end
    
    subgraph UI Hooks
        H_ACC[useAccordionPersistence]
        H_SEARCH[useDebouncedSearch]
        H_MEDIA[useMediaOperations]
    end
    
    subgraph Utilities
        U_API[apiClient]
        U_QUERY[TanStack Query]
    end
    
    H_PROD --> U_API
    H_FAB --> U_API
    H_CAT --> U_API
    H_CERT --> U_API
    
    H_FORM --> H_VAL
    H_FABFORM --> H_VAL
    
    H_FORM --> H_MEDIA
    H_SEARCH --> U_QUERY
```

---

## Server-Side Dependencies

### Service Layer Dependencies

```mermaid
graph TB
    subgraph Routes
        R_PROD[productRoutes]
        R_FAB[fabricRoutes]
        R_CAT[categoryRoutes]
        R_CERT[certificateRoutes]
        R_AUTH[authRoutes]
        R_MEDIA[mediaRoutes]
    end
    
    subgraph Services
        S_PROD[productService]
        S_FAB[fabricService]
        S_CAT[categoryService]
        S_CERT[certificateService]
        S_AUTH[authService]
        S_MEDIA[mediaService]
        S_CACHE[cacheService]
        S_STORAGE[storageService]
    end
    
    subgraph Models
        M_DB[db.ts]
        M_SCHEMA[drizzle schema]
    end
    
    subgraph Middleware
        MW_AUTH[authMiddleware]
        MW_VAL[validationMiddleware]
        MW_ERR[errorMiddleware]
        MW_RATE[rateLimitMiddleware]
    end
    
    R_PROD --> S_PROD
    R_FAB --> S_FAB
    R_CAT --> S_CAT
    R_CERT --> S_CERT
    R_AUTH --> S_AUTH
    R_MEDIA --> S_MEDIA
    
    R_PROD --> MW_AUTH
    R_FAB --> MW_AUTH
    R_CAT --> MW_AUTH
    R_CERT --> MW_AUTH
    R_MEDIA --> MW_AUTH
    
    R_AUTH --> MW_RATE
    R_AUTH --> MW_VAL
    
    S_PROD --> M_DB
    S_FAB --> M_DB
    S_CAT --> M_DB
    S_CERT --> M_DB
    S_AUTH --> M_DB
    S_MEDIA --> M_DB
    
    S_PROD --> S_CACHE
    S_FAB --> S_CACHE
    S_CAT --> S_CACHE
    S_CERT --> S_CACHE
    
    S_MEDIA --> S_STORAGE
    
    M_DB --> M_SCHEMA
```

### Service Dependency Matrix

| Service | Depends On | Database | Cache | External |
|---------|------------|----------|-------|----------|
| `productService` | `cacheService`, `storageService` | ✅ | ✅ | GCS |
| `fabricService` | `cacheService` | ✅ | ✅ | - |
| `categoryService` | `cacheService` | ✅ | ✅ | - |
| `certificateService` | `cacheService` | ✅ | ✅ | - |
| `authService` | - | ✅ | ✅ | - |
| `mediaService` | `storageService` | ✅ | - | GCS |
| `cacheService` | - | - | ✅ | Upstash Redis |
| `storageService` | - | - | - | GCS |

---

## Shared Code Dependencies

### Type Dependencies

```mermaid
graph TB
    subgraph Core Types
        T_BASE[BaseEntity]
        T_USER[User]
        T_SESSION[Session]
    end
    
    subgraph Product Types
        T_PROD[Product]
        T_CAT[Category]
        T_FAB[Fabric]
        T_FIBER[Fiber]
        T_CERT[Certificate]
        T_SIZE[SizeChart]
    end
    
    subgraph Order Types
        T_ORDER[Order]
        T_ITEM[OrderItem]
        T_CUSTOM[Customization]
    end
    
    subgraph Media Types
        T_MEDIA[Media]
        T_FOLDER[Folder]
    end
    
    T_PROD --> T_BASE
    T_CAT --> T_BASE
    T_FAB --> T_BASE
    T_FIBER --> T_BASE
    T_CERT --> T_BASE
    T_SIZE --> T_BASE
    T_ORDER --> T_BASE
    T_MEDIA --> T_BASE
    
    T_PROD --> T_CAT
    T_PROD --> T_FAB
    T_PROD --> T_CERT
    T_PROD --> T_SIZE
    
    T_ORDER --> T_PROD
    T_ORDER --> T_ITEM
    T_ITEM --> T_CUSTOM
```

### Zod Schema Dependencies

```mermaid
graph TB
    subgraph Base Schemas
        Z_ID[idSchema]
        Z_PAGINATE[paginationSchema]
    end
    
    subgraph Entity Schemas
        Z_PROD[productSchema]
        Z_CAT[categorySchema]
        Z_FAB[fabricSchema]
        Z_CERT[certificateSchema]
    end
    
    subgraph Input Schemas
        Z_CREATE[createProductSchema]
        Z_UPDATE[updateProductSchema]
        Z_FILTER[filterProductSchema]
    end
    
    Z_CREATE --> Z_PROD
    Z_UPDATE --> Z_PROD
    Z_FILTER --> Z_PROD
    
    Z_PROD --> Z_CAT
    Z_PROD --> Z_FAB
    Z_PROD --> Z_CERT
    
    Z_CREATE --> Z_ID
    Z_UPDATE --> Z_ID
    Z_FILTER --> Z_PAGINATE
```

---

## External Dependencies

### Production Dependencies

```mermaid
graph TB
    subgraph Frontend
        F_REACT[React 19]
        F_VITE[Vite 8]
        F_TAILWIND[Tailwind CSS v4]
        F_ROUTER[React Router 7]
        F_QUERY[TanStack Query v5]
        F_ZOD[Zod]
        F_CVA[class-variance-authority]
        F_LUCIDE[Lucide React]
        F_HOOK[React Hook Form]
    end
    
    subgraph Backend
        B_EXPRESS[Express 5]
        B_NODE[Node.js 24]
        B_DRIZZLE[Drizzle ORM]
        B_NEON[Neon Serverless]
        B_REDIS[Upstash Redis]
        B_GOOGLE[@google-cloud/storage]
    end
    
    subgraph Build Tools
        T_TURBO[TurboRepo]
        T_BIOME[Biome]
        T_VITEST[Vitest]
        T_TS[TypeScript 5.x]
    end
    
    F_QUERY --> F_REACT
    F_ROUTER --> F_REACT
    F_HOOK --> F_REACT
    F_CVA --> F_TAILWIND
```

### Critical Version Constraints

| Package | Version | Constraint Reason |
|---------|---------|-------------------|
| React | 19.x | No forwardRef, new ref prop pattern |
| Express | 5.x | Native async error handling |
| Tailwind CSS | 4.x | @utility syntax, @theme tokens |
| Node.js | ≥24.x | Latest LTS features |
| Vite | 7.x | Build performance |
| TypeScript | 5.x | Strict mode support |

---

## Dependency Analysis Commands

### Generate Dependency Graph

```bash
# Generate full dependency graph
npm run deps:graph

# Check for circular dependencies
npm run deps:circular

# Analyze bundle size
npm run analyze

# Check for unused dependencies
npm run deps:check
```

### Manual Analysis

```bash
# List all dependencies
npm list --depth=0

# Check outdated packages
npm outdated

# Audit for vulnerabilities
npm audit

# View dependency tree
npm ls <package-name>
```

---

## Circular Dependency Prevention

### Rules

1. **Never import from child to parent directory** in a way that creates cycles
2. **Shared code must have zero dependencies** on client or server
3. **Services should not import from routes**
4. **Components should not import from pages**

### Detection

```bash
# Using madge for circular dependency detection
npx madge --circular ./client/app
npx madge --circular ./server
```

### Common Circular Dependency Patterns to Avoid

```typescript
// ❌ WRONG: Creates circular dependency
// client/app/components/ui/Button.tsx
import { useProductPage } from '@/pages/ProductPage';

// ✅ CORRECT: Use props or context
// client/app/components/ui/Button.tsx
interface ButtonProps {
  onClick?: () => void;
}

// ❌ WRONG: Service importing from route
// server/services/productService.ts
import { productRouter } from '@/routes/productRoutes';

// ✅ CORRECT: Route imports service, not vice versa
// server/routes/productRoutes.ts
import * as productService from '@/services/productService';
```

---

## Dependency Update Strategy

### Update Frequency

| Type | Frequency | Process |
|------|-----------|---------|
| Security patches | Immediate | `npm audit fix` |
| Minor versions | Monthly | Review changelog, test |
| Major versions | Quarterly | Plan migration, update docs |

### Before Updating

1. Check changelog for breaking changes
2. Run full test suite: `npm run test`
3. Verify build: `npm run build`
4. Check type safety: `npm run typecheck`
5. Run integrity check: `npm run verify:tech-integrity`

---

## References

- [Architecture Documentation](../core/architecture.md) - System architecture
- [Developer Workflow](../guides/developer-workflow.md) - Development standards

---

**Version:** 1.0.0 | **For:** M. Hateem Jamshaid @ RUN APPAREL (PVT) LTD
