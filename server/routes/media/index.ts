// Media Routes Module - Refactored Entry Point
// Phase 4: Consolidated media API with modular architecture

import router from "./routes.js";

// Export the router as default
export default router;

// Re-export types for external use
export type { MediaAsset, MediaMetadata, UploadSession } from "./types.js";

// Re-export utilities if needed externally
export {
  createErrorResponse,
  createPaginatedResponse,
  createSuccessResponse,
} from "./utils.js";
