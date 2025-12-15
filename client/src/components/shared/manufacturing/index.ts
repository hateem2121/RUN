// Manufacturing Shared Component Library
// Provides consistent components for both public and admin manufacturing interfaces

export * from "./ManufacturingCard";
export * from "./ManufacturingAnimations";
export * from "./ManufacturingMediaDisplay";
export * from "./ManufacturingLoadingState";
export * from "./ManufacturingStatusIndicator";
export * from "./performance-summary";
export * from "./CardDecorator";
export * from "./ProcessCard";
export * from "./CapabilityCard";
export * from "./QualityCard";

// Re-export optimized query hook
export { useOptimizedQuery } from "@/hooks/useOptimizedQuery";
