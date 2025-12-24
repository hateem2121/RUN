import { useCallback, useState } from "react";

// Accordion state interface
interface AccordionState {
  [key: string]: boolean;
}

// Default accordion states
const defaultStates: AccordionState = {
  basicInfo: true,
  categoryFabric: false,
  mediaAssets: false,
  specifications: false,
  certifications: false,
  customization: false,
};

/**
 * Custom hook for accordion state management
 *
 * PERFORMANCE OPTIMIZATION: Removed localStorage persistence to eliminate
 * unnecessary I/O operations on every accordion toggle. Simple UI state like
 * accordion expansion doesn't need persistence across sessions.
 */
export function useAccordionPersistence(_storageKey?: string) {
  const [accordionStates, setAccordionStates] = useState<AccordionState>(defaultStates);

  // Toggle specific accordion section
  const toggleSection = useCallback((sectionKey: string) => {
    setAccordionStates((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  }, []);

  // Set specific section state
  const setSectionState = useCallback((sectionKey: string, isOpen: boolean) => {
    setAccordionStates((prev) => ({
      ...prev,
      [sectionKey]: isOpen,
    }));
  }, []);

  // Reset all states to default
  const resetStates = useCallback(() => {
    setAccordionStates(defaultStates);
  }, []);

  // Expand all sections
  const expandAll = useCallback(() => {
    const allExpanded = Object.keys(defaultStates).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as AccordionState);

    setAccordionStates(allExpanded);
  }, []);

  // Collapse all sections
  const collapseAll = useCallback(() => {
    const allCollapsed = Object.keys(defaultStates).reduce((acc, key) => {
      acc[key] = false;
      return acc;
    }, {} as AccordionState);

    setAccordionStates(allCollapsed);
  }, []);

  return {
    accordionStates,
    toggleSection,
    setSectionState,
    resetStates,
    expandAll,
    collapseAll,
  };
}
