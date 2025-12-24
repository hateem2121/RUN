// Barrel export for shared manufacturing components
// Reduces import statements and improves maintainability

export { CertificateSelectionDialog } from "./CertificateSelectionDialog";
export { DeleteConfirmationDialog } from "./DeleteConfirmationDialog";
export { ManufacturingFormWrapper } from "./ManufacturingFormWrapper";
export { PerformanceMonitor } from "./PerformanceMonitor";
export { StandardMediaSelectionDialog } from "./StandardMediaSelectionDialog";
export { StatusBadge } from "./StatusBadge";
// PHASE 4.5 CLEANUP: Removed MediaSelectionWrapper exports to enforce StandardMediaSelectionDialog usage
// Components should use StandardMediaSelectionDialog exclusively for unified media selection patterns
export { useVirtualizationConfig, VirtualizedList } from "./VirtualizedList";
