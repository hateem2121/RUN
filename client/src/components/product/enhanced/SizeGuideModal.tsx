/**
 * Enhanced Size Guide Modal - Style 1 Integration
 * Features: Comprehensive size charts, accessibility, responsive design
 */

import React, { useState, useEffect, useCallback } from "react";
import { X, Ruler, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SizeData {
  size: string;
  chest?: string;
  length?: string;
  shoulder?: string;
  waist?: string;
  hip?: string;
  inseam?: string;
}

interface SizeChart {
  id: string;
  name: string;
  unit: "inches" | "cm";
  sizes: SizeData[];
  description?: string;
}

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  sizeCharts: SizeChart[];
  recommendations?: string[];
  className?: string;
}

export function SizeGuideModal({
  isOpen,
  onClose,
  productName,
  sizeCharts,
  recommendations = [],
  className,
}: SizeGuideModalProps) {
  const [activeChartIndex, setActiveChartIndex] = useState(0);
  // const [focusedElement, setFocusedElement] = useState<string | null>(null);

  const activeChart = sizeCharts[activeChartIndex];

  // Focus management for accessibility
  useEffect(() => {
    if (isOpen) {
      // Focus the close button when modal opens
      const closeButton = document.querySelector("[data-modal-close]") as HTMLElement;
      if (closeButton) {
        setTimeout(() => closeButton.focus(), 100);
      }

      // Prevent body scroll
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "Tab") {
        // Handle focus trapping within modal
        const focusableElements = document.querySelectorAll(
          '[data-modal-close], [data-chart-nav], button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    },
    [onClose],
  );

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );

  const nextChart = useCallback(() => {
    setActiveChartIndex((prev) => (prev + 1) % sizeCharts.length);
  }, [sizeCharts.length]);

  const prevChart = useCallback(() => {
    setActiveChartIndex((prev) => (prev - 1 + sizeCharts.length) % sizeCharts.length);
  }, [sizeCharts.length]);

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-modal flex items-center justify-center p-4 bg-white/95 dark:bg-black/80",
        className,
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="size-guide-title"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] border flex flex-col overflow-hidden"
        style={{
          backgroundColor: "var(--product-background)",
          borderColor: "var(--product-border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5 border-b"
          style={{ borderColor: "var(--product-border)" }}
        >
          <div className="flex items-center space-x-4">
            <Ruler className="w-5 h-5" style={{ color: "var(--product-muted)" }} />
            <div>
              <h2
                id="size-guide-title"
                className="text-2xl font-bold"
                style={{ color: "var(--product-text)" }}
              >
                Size Guide
              </h2>
              <p className="text-sm mt-1" style={{ color: "var(--product-text-secondary)" }}>
                {productName}
              </p>
            </div>
          </div>

          <button
            data-modal-close
            type="button"
            onClick={onClose}
            className="p-2 border transition-colors"
            style={{
              borderColor: "var(--product-border)",
              color: "var(--product-text)",
            }}
            aria-label="Close size guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chart Navigation */}
        {sizeCharts.length > 1 && (
          <div
            className="flex items-center justify-between px-6 py-4 border-b"
            style={{
              borderColor: "var(--product-border)",
              backgroundColor: "var(--product-surface)",
            }}
          >
            <button
              data-chart-nav
              type="button"
              onClick={prevChart}
              disabled={activeChartIndex === 0}
              className={cn(
                "flex items-center space-x-2 px-3 py-2 text-sm font-medium transition-colors",
                activeChartIndex === 0 && "opacity-40 cursor-not-allowed",
              )}
              style={{ color: "var(--product-text)" }}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <div className="text-center">
              <h3 className="font-semibold" style={{ color: "var(--product-text)" }}>
                {activeChart?.name}
              </h3>
              <p className="text-xs mt-1" style={{ color: "var(--product-muted)" }}>
                {activeChartIndex + 1} of {sizeCharts.length}
              </p>
            </div>

            <button
              data-chart-nav
              type="button"
              onClick={nextChart}
              disabled={activeChartIndex === sizeCharts.length - 1}
              className={cn(
                "flex items-center space-x-2 px-3 py-2 text-sm font-medium transition-colors",
                activeChartIndex === sizeCharts.length - 1 && "opacity-40 cursor-not-allowed",
              )}
              style={{ color: "var(--product-text)" }}
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Chart Description */}
          {activeChart?.description && (
            <div
              className="flex items-start space-x-3 p-4 border"
              style={{
                borderColor: "var(--product-border)",
                backgroundColor: "var(--product-surface)",
              }}
            >
              <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--product-muted)" }} />
              <p className="text-sm" style={{ color: "var(--product-text-secondary)" }}>
                {activeChart.description}
              </p>
            </div>
          )}

          {/* Size Chart Table */}
          <div className="overflow-x-auto border" style={{ borderColor: "var(--product-border)" }}>
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ backgroundColor: "var(--product-surface)" }}>
                  <th
                    className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide border-b"
                    style={{ color: "var(--product-text)", borderColor: "var(--product-border)" }}
                  >
                    Size
                  </th>
                  {activeChart &&
                    activeChart.sizes.length > 0 &&
                    Object.keys(activeChart.sizes[0]!)
                      .filter((key) => key !== "size")
                      .map((key) => (
                        <th
                          key={key}
                          className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wide capitalize border-b"
                          style={{
                            color: "var(--product-text)",
                            borderColor: "var(--product-border)",
                          }}
                        >
                          {key} ({activeChart.unit})
                        </th>
                      ))}
                </tr>
              </thead>
              <tbody>
                {activeChart?.sizes.map((sizeData) => (
                  <tr
                    key={sizeData.size}
                    className="border-b"
                    style={{ borderColor: "var(--product-border)" }}
                  >
                    <td
                      className="px-6 py-4 font-semibold"
                      style={{ color: "var(--product-text)" }}
                    >
                      {sizeData.size}
                    </td>
                    {Object.entries(sizeData)
                      .filter(([key]) => key !== "size")
                      .map(([key, value]) => (
                        <td
                          key={key}
                          className="px-6 py-4 text-center"
                          style={{ color: "var(--product-text-secondary)" }}
                        >
                          {value || "-"}
                        </td>
                      ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="space-y-4">
              <h4
                className="text-sm font-semibold uppercase tracking-wide"
                style={{ color: "var(--product-text)" }}
              >
                Sizing Recommendations
              </h4>
              <ul className="space-y-3">
                {recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <div
                      className="w-1 h-1 shrink-0 mt-2"
                      style={{ backgroundColor: "var(--product-text)" }}
                    />
                    <span className="text-sm" style={{ color: "var(--product-text-secondary)" }}>
                      {rec}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-8 py-5 border-t"
          style={{
            borderColor: "var(--product-border)",
            backgroundColor: "var(--product-surface)",
          }}
        >
          <div className="flex justify-between items-center">
            <p className="text-xs" style={{ color: "var(--product-muted)" }}>
              Need help with sizing? Contact our B2B team for assistance.
            </p>
            <Button
              onClick={onClose}
              variant="outline"
              className="text-sm border rounded-sm px-4 py-2"
              style={{ borderColor: "var(--product-border)", color: "var(--product-text)" }}
            >
              Close Guide
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Utility function to create default size charts
export const createDefaultSizeChart = (_productType: string = "apparel"): SizeChart => ({
  id: "standard",
  name: "Standard Sizing",
  unit: "inches",
  sizes: [
    { size: "XS", chest: "32-34", length: "26", shoulder: "16" },
    { size: "S", chest: "34-36", length: "27", shoulder: "17" },
    { size: "M", chest: "36-38", length: "28", shoulder: "18" },
    { size: "L", chest: "38-40", length: "29", shoulder: "19" },
    { size: "XL", chest: "40-42", length: "30", shoulder: "20" },
    { size: "XXL", chest: "42-44", length: "31", shoulder: "21" },
  ],
  description:
    "All measurements are in inches. For best fit, measure around the fullest part of your chest.",
});

export default SizeGuideModal;
