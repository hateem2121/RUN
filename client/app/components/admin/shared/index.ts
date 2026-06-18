// Barrel export for shared manufacturing components
// Reduces import statements and improves maintainability

export { DeleteConfirmationDialog } from "./DeleteConfirmationDialog";

export { StandardMediaSelectionDialog } from "./StandardMediaSelectionDialog";
// StatusBadge deprecated - use Badge component with status-* variants from @/components/ui/badge
// PHASE 4.5 CLEANUP: Removed MediaSelectionWrapper exports to enforce StandardMediaSelectionDialog usage
// Components should use StandardMediaSelectionDialog exclusively for unified media selection patterns
