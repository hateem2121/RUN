import { LazyUnifiedModelViewer } from "./LazyUnifiedModelViewer";

// Export the lazy-loaded component as the main component
// This enforces lazy loading for all consumers who import UnifiedModelViewer
export { LazyUnifiedModelViewer as UnifiedModelViewer };

// Re-export types and other named exports from the implementation
export type { UnifiedModelViewerProps } from "./UnifiedModelViewerCore";
