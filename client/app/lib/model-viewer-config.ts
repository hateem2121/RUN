/**
 * PHASE 2.2: Single Authoritative Model-Viewer Configuration System
 *
 * This is the ONLY place where model-viewer configurations are defined.
 * All components must inherit from this central configuration to ensure consistency.
 */

export interface ModelViewerConfig {
  // Core display settings
  autoRotate?: boolean;
  cameraControls?: boolean;
  backgroundColorHex?: string;
  exposure?: number;
  shadowIntensity?: number;

  // Interaction settings
  interactionPolicy?: "always-allow" | "allow-when-focused" | "when-focused";
  loading?: "auto" | "lazy" | "eager";

  // Performance settings
  environmentImage?: string;
  skyboxImage?: string;

  // Animation settings
  autoPlay?: boolean;
  animationName?: string;
  animationCrossfadeDuration?: number;
}

interface ModelViewerErrorConfig {
  maxRetries: number;
  retryDelayBase: number; // milliseconds
  enableDiagnostics: boolean;
  enableFetchInterception: boolean;
}

interface ModelViewerPerformanceConfig {
  enableLazyLoading: boolean;
  intersectionThreshold: number;
  intersectionRootMargin: string;
  enablePerformanceMonitoring: boolean;
  memoryUsageTracking: boolean;
}

/**
 * PHASE 2.2: Default Production Configuration
 *
 * These are the production-optimized defaults that provide the best
 * compatibility with @google/model-viewer while ensuring embedded texture support.
 */
const DEFAULT_MODEL_VIEWER_CONFIG: ModelViewerConfig = {
  // Core settings optimized for embedded textures
  autoRotate: true,
  cameraControls: true,
  backgroundColorHex: "#000000",
  exposure: 1,
  shadowIntensity: 1,

  // Performance-first interaction policy for embedded texture compatibility
  interactionPolicy: "always-allow",
  loading: "lazy", // PHASE 1: Lazy loading with IntersectionObserver - only loads when visible in viewport

  // Enhanced compatibility for ImageBitmapLoader embedded texture support
  // Avoid external dependencies that could interfere with data URIs
  // Avoid external dependencies that could interfere with data URIs
  autoPlay: false, // Reduce initial load complexity to help embedded textures load first

  // Additional settings for blob URL and data URI compatibility
  // Note: withCredentials is not a valid model-viewer attribute - removed for type safety
};

/**
 * PHASE 2.2: Default Error Configuration
 *
 * Production-safe error handling with development diagnostics.
 */
const DEFAULT_ERROR_CONFIG: ModelViewerErrorConfig = {
  maxRetries: 3,
  retryDelayBase: 1000, // 1 second
  enableDiagnostics: import.meta.env.DEV,
  enableFetchInterception: import.meta.env.DEV,
};

/**
 * PHASE 2.2: Default Performance Configuration
 *
 * Optimized for production performance while maintaining quality.
 */
const DEFAULT_PERFORMANCE_CONFIG: ModelViewerPerformanceConfig = {
  enableLazyLoading: true,
  intersectionThreshold: 0.1,
  intersectionRootMargin: "50px",
  enablePerformanceMonitoring: import.meta.env.DEV,
  memoryUsageTracking: import.meta.env.DEV,
};

/**
 * PHASE 2.2: Configuration Inheritance System
 *
 * All model-viewer instances should use this function to get their configuration.
 * This ensures consistent behavior across the entire application.
 */
export function getModelViewerConfig(overrides?: Partial<ModelViewerConfig>): ModelViewerConfig {
  return {
    ...DEFAULT_MODEL_VIEWER_CONFIG,
    ...overrides,
  };
}

/**
 * PHASE 2.2: Error Configuration Inheritance
 */
export function getErrorConfig(
  overrides?: Partial<ModelViewerErrorConfig>,
): ModelViewerErrorConfig {
  return {
    ...DEFAULT_ERROR_CONFIG,
    ...overrides,
  };
}

/**
 * PHASE 2.2: Performance Configuration Inheritance
 */
export function getPerformanceConfig(
  overrides?: Partial<ModelViewerPerformanceConfig>,
): ModelViewerPerformanceConfig {
  return {
    ...DEFAULT_PERFORMANCE_CONFIG,
    ...overrides,
  };
}

/**
 * PHASE 2.2: Global Model-Viewer Environment Settings
 *
 * These settings apply to all model-viewer instances and should only be set once.
 */
export const MODEL_VIEWER_ENVIRONMENT = {
  // Development vs Production behavior (using Vite environment detection)
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,

  // Feature flags for controlled rollout
  features: {
    enableAdvancedErrorRecovery: true,
    enablePerformanceOptimizations: true,
    enableMemoryManagement: true,
    enableWebGLContextRecovery: true,
  },

  // Storage Configuration
  storage: {
    // Asset serving configuration
    assetBaseUrl: import.meta.env.VITE_ASSET_BASE_URL || "",

    // CDN Configuration
    cdnEnabled: import.meta.env.VITE_MODEL_VIEWER_CDN_ENABLED !== "false",
    cdnDomain: import.meta.env.VITE_OBJECT_STORAGE_CDN_DOMAIN || "",

    // Performance Configuration
    preloadEnabled: import.meta.env.VITE_MODEL_VIEWER_PRELOAD_ENABLED !== "false",
    cacheDuration: parseInt(import.meta.env.VITE_GLTF_CACHE_DURATION || "31536000", 10),
  },

  // Logging configuration
  logging: {
    enableVerboseLogging: import.meta.env.DEV,
    enablePerformanceLogging: import.meta.env.DEV,
    enableErrorReporting: true,
    logLevel: import.meta.env.DEV ? "debug" : "error",
  },
} as const;

/**
 * PHASE 2.2: Validation Function
 *
 * Ensures configuration values are valid and compatible with @google/model-viewer.
 */
export function validateModelViewerConfig(config: ModelViewerConfig): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate exposure range (typical range: 0.5 - 2.0)
  if (config.exposure !== undefined && (config.exposure < 0.1 || config.exposure > 5.0)) {
    warnings.push(`Exposure value ${config.exposure} is outside recommended range 0.1-5.0`);
  }

  // Validate shadow-sm intensity range (0.0 - 2.0)
  if (
    config.shadowIntensity !== undefined &&
    (config.shadowIntensity < 0 || config.shadowIntensity > 2.0)
  ) {
    warnings.push(`Shadow intensity ${config.shadowIntensity} is outside valid range 0.0-2.0`);
  }

  // Validate background color format - allow hex colors, 'transparent', and other valid CSS values
  if (
    config.backgroundColorHex &&
    config.backgroundColorHex !== "transparent" &&
    !/^#[0-9A-Fa-f]{6}$/.test(config.backgroundColorHex)
  ) {
    errors.push(
      `Invalid background color format: ${config.backgroundColorHex}. Expected hex format like #ffffff or 'transparent'`,
    );
  }

  // Validate interaction policy
  const validPolicies = ["always-allow", "allow-when-focused", "when-focused"];
  if (config.interactionPolicy && !validPolicies.includes(config.interactionPolicy)) {
    errors.push(
      `Invalid interaction policy: ${
        config.interactionPolicy
      }. Must be one of: ${validPolicies.join(", ")}`,
    );
  }

  // Validate loading strategy
  const validLoading = ["auto", "lazy", "eager"];
  if (config.loading && !validLoading.includes(config.loading)) {
    errors.push(
      `Invalid loading strategy: ${config.loading}. Must be one of: ${validLoading.join(", ")}`,
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * PHASE 2.2: Preset Configurations for Common Use Cases
 */
export const MODEL_VIEWER_PRESETS = {
  // High-performance preset for large models
  highPerformance: getModelViewerConfig({
    loading: "lazy",
    autoRotate: false, // Reduce initial processing
    shadowIntensity: 0.5, // Reduce shadow-sm complexity
  }),

  // Interactive showcase preset
  showcase: getModelViewerConfig({
    autoRotate: true,
    cameraControls: true,
    exposure: 1.2,
    shadowIntensity: 1.0,
  }),

  // Mobile-optimized preset
  mobile: getModelViewerConfig({
    loading: "lazy",
    autoRotate: false,
    shadowIntensity: 0.3, // Reduce mobile performance impact
    exposure: 0.9,
  }),

  // Admin preview preset
  adminPreview: getModelViewerConfig({
    loading: "auto",
    autoRotate: false, // Admin can control rotation manually
    cameraControls: true,
    backgroundColorHex: "#000000",
  }),
} as const;
