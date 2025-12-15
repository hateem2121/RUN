// Barrel export for shared manufacturing components
// Reduces import statements and improves maintainability

export { DeleteConfirmationDialog } from './DeleteConfirmationDialog';
export { StatusBadge } from './StatusBadge';
export { ManufacturingFormWrapper } from './ManufacturingFormWrapper';
export { StandardMediaSelectionDialog } from './StandardMediaSelectionDialog';
export { CertificateSelectionDialog } from './CertificateSelectionDialog';
// PHASE 4.5 CLEANUP: Removed MediaSelectionWrapper exports to enforce StandardMediaSelectionDialog usage
// Components should use StandardMediaSelectionDialog exclusively for unified media selection patterns
export { VirtualizedList, useVirtualizationConfig } from './VirtualizedList';
export { PerformanceMonitor } from './PerformanceMonitor';