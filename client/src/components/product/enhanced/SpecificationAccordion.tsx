/**
 * Enhanced Specification Accordion - Style 1 Integration
 * Features: Progressive disclosure, keyboard navigation, smooth animations
 */

import { ChevronDown, Leaf, Package, Settings, Shirt, Zap } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface SpecificationItem {
  label: string;
  value: string;
}

interface SpecificationSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  items: SpecificationItem[];
  defaultExpanded?: boolean | undefined;
}

interface SpecificationAccordionProps {
  specifications: SpecificationSection[];
  className?: string | undefined;
  allowMultiple?: boolean | undefined;
}

export function SpecificationAccordion({
  specifications,
  className,
  allowMultiple = false,
}: SpecificationAccordionProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(specifications.filter((spec) => spec.defaultExpanded).map((spec) => spec.id)),
  );
  const [focusedSection, setFocusedSection] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleSection = useCallback(
    (sectionId: string) => {
      setExpandedSections((prev) => {
        const newSet = new Set(prev);

        if (newSet.has(sectionId)) {
          newSet.delete(sectionId);
        } else {
          if (!allowMultiple) {
            newSet.clear();
          }
          newSet.add(sectionId);
        }

        return newSet;
      });
    },
    [allowMultiple],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, sectionId: string) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleSection(sectionId);
      } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const currentIndex = specifications.findIndex((spec) => spec.id === sectionId);
        const direction = e.key === "ArrowDown" ? 1 : -1;
        const nextIndex =
          (currentIndex + direction + specifications.length) % specifications.length;
        const nextSection = specifications[nextIndex];

        if (nextSection) {
          setFocusedSection(nextSection.id);
          const nextElement = containerRef.current?.querySelector(
            `[data-section="${nextSection.id}"]`,
          ) as HTMLElement;
          nextElement?.focus();
        }
      }
    },
    [specifications, toggleSection],
  );

  // Focus management
  useEffect(() => {
    if (focusedSection) {
      const element = containerRef.current?.querySelector(
        `[data-section="${focusedSection}"]`,
      ) as HTMLElement;
      element?.focus();
    }
  }, [focusedSection]);

  return (
    <div
      ref={containerRef}
      className={cn("space-y-3", className)}
      role="region"
      aria-label="Product specifications"
    >
      <h2 className="mb-6 font-bold text-2xl text-foreground dark:text-foreground">
        Technical Specifications
      </h2>

      {specifications.map((section) => {
        const isExpanded = expandedSections.has(section.id);

        return (
          <div
            key={section.id}
            className={cn(
              "rounded-lg border border-border bg-white dark:border-border dark:bg-muted/80",
              "transition-all duration-200 ease-out",
              isExpanded ? "shadow-md" : "shadow-sm-xs hover:shadow-md",
            )}
          >
            {/* Header */}
            <button
              data-section={section.id}
              type="button"
              className={cn(
                "flex w-full items-center justify-between px-6 py-4 text-left",
                "focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-inset",
                "transition-colors duration-200",
                "hover:bg-background dark:hover:bg-muted",
              )}
              aria-expanded={isExpanded}
              aria-controls={`section-content-${section.id}`}
              onClick={() => toggleSection(section.id)}
              onKeyDown={(e) => handleKeyDown(e, section.id)}
              onFocus={() => setFocusedSection(section.id)}
              onBlur={() => setFocusedSection(null)}
            >
              <div className="flex items-center space-x-3">
                <div className="shrink-0 text-blue-600 dark:text-blue-400">{section.icon}</div>
                <span className="font-semibold text-foreground dark:text-foreground">
                  {section.title}
                </span>
              </div>

              <ChevronDown
                className={cn(
                  "h-5 w-5 text-muted-foreground transition-transform duration-200 dark:text-muted-foreground/70",
                  isExpanded ? "rotate-180 transform" : "",
                )}
                aria-hidden="true"
              />
            </button>

            {/* Content */}
            <div
              id={`section-content-${section.id}`}
              className={cn(
                "overflow-hidden transition-all duration-300 ease-out",
                isExpanded ? "max-h-96" : "max-h-0",
              )}
              aria-hidden={!isExpanded}
            >
              <div className="border-border border-t px-6 pb-4 dark:border-border">
                <div className="space-y-3 pt-4">
                  {section.items.map((item, index) => (
                    <div key={index} className="flex items-start justify-between py-2">
                      <span className="min-w-label font-medium text-muted-foreground text-sm dark:text-muted-foreground/70">
                        {item.label}
                      </span>
                      <span className="ml-4 flex-1 text-right text-foreground text-sm dark:text-foreground">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Screen reader summary */}
      <div className="sr-only">
        <h3>Specification summary:</h3>
        <ul>
          {specifications.map((section) => (
            <li key={section.id}>
              <strong>{section.title}:</strong>
              <ul>
                {section.items.map((item, index) => (
                  <li key={index}>
                    {item.label}: {item.value}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// Dynamic specification sections that sync with admin interface data
export const createFabricSpecifications = (
  fabricData: any,
  productData?: any,
): SpecificationSection => {
  const technicalSpecs = productData?.technicalSpecs || {};

  // Debug current values being used
  // Debug current values being used
  // Variables _weightValue and _fitValue removed as they were unused

  // Prepare items array with conditional fiber composition
  const items = [
    {
      label: "Material",
      value: fabricData?.name || technicalSpecs.material || "Advanced Moisture-Wicking Blend",
    },
  ];

  // Add fiber composition right after Material if available
  if (productData?.selectedFiberComposition) {
    items.push({
      label: "Fiber Composition",
      value: productData.selectedFiberComposition,
    });
  }

  // Continue with remaining fields
  items.push(
    {
      label: "Weight",
      value:
        productData?.customWeight ||
        fabricData?.weight ||
        technicalSpecs.weight ||
        technicalSpecs.fabric_weight ||
        "120g/m²",
    },
    {
      label: "Fit",
      value:
        productData?.customFit || technicalSpecs.fit || technicalSpecs.fit_type || "Athletic Slim",
    },
    {
      label: "Construction",
      value:
        technicalSpecs.construction ||
        technicalSpecs.seam_construction ||
        "Flatlock seams, reinforced stress points",
    },
  );

  return {
    id: "fabric",
    title: "Fabric & Construction",
    icon: <Package className="h-5 w-5" />,
    defaultExpanded: true,
    items: items,
  };
};

export const createTechnologySpecifications = (productData?: any): SpecificationSection => {
  const technicalSpecs = productData?.technicalSpecs || {};
  const defaultItems = [
    { label: "Moisture Management", value: "3x faster drying technology" },
    { label: "Odor Control", value: "48hr antimicrobial protection" },
    { label: "UV Protection", value: "UPF 50+ rating" },
    { label: "Temperature Regulation", value: "Adaptive thermal comfort" },
  ];

  // If we have technical specs, use them dynamically
  if (Object.keys(technicalSpecs).length > 0) {
    const technologyKeys = Object.keys(technicalSpecs).filter(
      (key) =>
        key.toLowerCase().includes("moisture") ||
        key.toLowerCase().includes("odor") ||
        key.toLowerCase().includes("uv") ||
        key.toLowerCase().includes("temperature") ||
        key.toLowerCase().includes("wicking") ||
        key.toLowerCase().includes("protection") ||
        key.toLowerCase().includes("antimicrobial") ||
        key.toLowerCase().includes("thermal"),
    );

    if (technologyKeys.length > 0) {
      const dynamicItems = technologyKeys.map((key) => ({
        label: key
          .split(/[_-]/)
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(" "),
        value: technicalSpecs[key],
      }));

      // Merge with defaults, prioritizing dynamic data
      const mergedItems = [...dynamicItems];
      defaultItems.forEach((defaultItem) => {
        if (
          !dynamicItems.some((item) =>
            item.label.toLowerCase().includes(defaultItem.label.toLowerCase().split(" ")[0]!),
          )
        ) {
          mergedItems.push(defaultItem);
        }
      });

      return {
        id: "technology",
        title: "Technology Features",
        icon: <Zap className="h-5 w-5" />,
        items: mergedItems,
      };
    }
  }

  return {
    id: "technology",
    title: "Technology Features",
    icon: <Zap className="h-5 w-5" />,
    items: defaultItems,
  };
};

export const createCustomizationSpecifications = (productData?: any): SpecificationSection => {
  const customizationOptions = productData?.customizationOptions || [];

  if (!customizationOptions || customizationOptions.length === 0) {
    return {
      id: "customization",
      title: "Customization Options",
      icon: <Settings className="h-5 w-5" />,
      items: [
        {
          label: "Standard Options",
          value: "Contact us for customization details",
        },
      ],
    };
  }

  // Convert array of customization options to specification items
  const items = customizationOptions.map((option: string, index: number) => ({
    label: `Option ${index + 1}`,
    value: option,
  }));

  // If only one item, show it as "Available Options"
  if (items.length === 1) {
    return {
      id: "customization",
      title: "Customization Options",
      icon: <Settings className="h-5 w-5" />,
      items: [{ label: "Available Options", value: customizationOptions.join(", ") }],
    };
  }

  return {
    id: "customization",
    title: "Customization Options",
    icon: <Settings className="h-5 w-5" />,
    items: items,
  };
};

export const createSustainabilitySpecifications = (productData?: any): SpecificationSection => {
  const technicalSpecs = productData?.technicalSpecs || {};
  const certificates = productData?.certificates || [];
  const fabric = productData?.fabric;

  const items: { label: string; value: string }[] = [];

  // Dynamic sustainability data from technical specs
  const sustainabilityKeys = Object.keys(technicalSpecs).filter(
    (key) =>
      key.toLowerCase().includes("recycle") ||
      key.toLowerCase().includes("sustain") ||
      key.toLowerCase().includes("carbon") ||
      key.toLowerCase().includes("eco") ||
      key.toLowerCase().includes("organic") ||
      key.toLowerCase().includes("biodegradable"),
  );

  sustainabilityKeys.forEach((key) => {
    items.push({
      label: key
        .split(/[_-]/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" "),
      value: technicalSpecs[key],
    });
  });

  // Add certificate information
  if (certificates.length > 0) {
    items.push({
      label: "Certifications",
      value: certificates.map((cert: any) => cert.name || cert).join(", "),
    });
  }

  // Add fabric sustainability info if available
  if (fabric?.sustainabilityInfo) {
    items.push({
      label: "Fabric Sustainability",
      value: fabric.sustainabilityInfo,
    });
  }

  // Fallback to defaults if no dynamic data
  if (items.length === 0) {
    items.push(
      { label: "Recycled Content", value: "65% recycled materials" },
      { label: "Certification", value: "OEKO-TEX Standard 100" },
      { label: "Carbon Footprint", value: "30% reduction vs conventional" },
      { label: "End of Life", value: "100% recyclable components" },
    );
  }

  return {
    id: "sustainability",
    title: "Sustainability",
    icon: <Leaf className="h-5 w-5" />,
    items,
  };
};

export const createCareSpecifications = (productData?: any): SpecificationSection => {
  const careInstructions = productData?.careInstructions || [];
  const technicalSpecs = productData?.technicalSpecs || {};

  let items: { label: string; value: string }[] = [];

  // Use care instructions from admin interface if available
  if (careInstructions.length > 0) {
    // Group care instructions by category
    const careCategories = {
      washing: careInstructions.filter(
        (instruction: string) =>
          instruction.toLowerCase().includes("wash") || instruction.toLowerCase().includes("clean"),
      ),
      drying: careInstructions.filter(
        (instruction: string) =>
          instruction.toLowerCase().includes("dry") || instruction.toLowerCase().includes("tumble"),
      ),
      ironing: careInstructions.filter(
        (instruction: string) =>
          instruction.toLowerCase().includes("iron") || instruction.toLowerCase().includes("press"),
      ),
      bleaching: careInstructions.filter(
        (instruction: string) =>
          instruction.toLowerCase().includes("bleach") ||
          instruction.toLowerCase().includes("whiten"),
      ),
      general: careInstructions.filter(
        (instruction: string) =>
          !instruction.toLowerCase().includes("wash") &&
          !instruction.toLowerCase().includes("dry") &&
          !instruction.toLowerCase().includes("iron") &&
          !instruction.toLowerCase().includes("bleach"),
      ),
    };

    if (careCategories.washing.length > 0) {
      items.push({
        label: "Washing",
        value: careCategories.washing.join("; "),
      });
    }
    if (careCategories.drying.length > 0) {
      items.push({ label: "Drying", value: careCategories.drying.join("; ") });
    }
    if (careCategories.ironing.length > 0) {
      items.push({
        label: "Ironing",
        value: careCategories.ironing.join("; "),
      });
    }
    if (careCategories.bleaching.length > 0) {
      items.push({
        label: "Bleaching",
        value: careCategories.bleaching.join("; "),
      });
    }
    if (careCategories.general.length > 0) {
      items.push({
        label: "Special Care",
        value: careCategories.general.join("; "),
      });
    }

    // If we only have general instructions, display them as single items
    if (items.length === 0 && careInstructions.length > 0) {
      careInstructions.forEach((instruction: string, index: number) => {
        items.push({
          label: `Care ${index + 1}`,
          value: instruction,
        });
      });
    }
  }

  // Check technical specs for care-related information
  const careKeys = Object.keys(technicalSpecs).filter(
    (key) =>
      key.toLowerCase().includes("care") ||
      key.toLowerCase().includes("wash") ||
      key.toLowerCase().includes("dry") ||
      key.toLowerCase().includes("iron") ||
      key.toLowerCase().includes("maintenance"),
  );

  careKeys.forEach((key) => {
    const label = key
      .split(/[_-]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

    if (
      !items.some((item) => item.label.toLowerCase().includes(label.toLowerCase().split(" ")[0]!))
    ) {
      items.push({
        label,
        value: technicalSpecs[key],
      });
    }
  });

  // Fallback to defaults if no dynamic data
  if (items.length === 0) {
    items = [
      { label: "Washing", value: "Machine wash cold (30°C)" },
      { label: "Drying", value: "Tumble dry low or hang dry" },
      { label: "Ironing", value: "Low heat if needed" },
      { label: "Bleaching", value: "Do not bleach" },
    ];
  }

  return {
    id: "care",
    title: "Care Instructions",
    icon: <Shirt className="h-5 w-5" />,
    items,
  };
};

export default SpecificationAccordion;
