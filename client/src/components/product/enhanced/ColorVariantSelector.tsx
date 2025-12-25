/**
 * Enhanced Color Variant Selector - Style 1 Integration
 * Features: Interactive color switching, accessibility, smooth animations
 */

import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ColorVariant {
  id: string;
  name: string;
  color: string;
  available: boolean;
}

interface ColorVariantSelectorProps {
  variants: ColorVariant[];
  selectedVariant: string | null;
  onVariantChange: (variantId: string) => void;
  className?: string;
  disabled?: boolean;
  showLabels?: boolean;
}

export function ColorVariantSelector({
  variants,
  selectedVariant,
  onVariantChange,
  className,
  disabled = false,
  showLabels = true,
}: ColorVariantSelectorProps) {
  const [focusedVariant, setFocusedVariant] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedVariantName =
    variants.find((v) => v.id === selectedVariant)?.name || "Select Color";

  const handleVariantClick = useCallback(
    (variant: ColorVariant) => {
      if (disabled || !variant.available) return;

      onVariantChange(variant.id);

      // Visual feedback animation
      const element = containerRef.current?.querySelector(
        `[data-variant="${variant.id}"]`,
      ) as HTMLElement;
      if (element) {
        element.style.transform = "scale(1.1)";
        setTimeout(() => {
          element.style.transform = "";
        }, 150);
      }
    },
    [disabled, onVariantChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, variant: ColorVariant) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleVariantClick(variant);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        const currentIndex = variants.findIndex((v) => v.id === variant.id);
        const direction = e.key === "ArrowRight" ? 1 : -1;
        const nextIndex = (currentIndex + direction + variants.length) % variants.length;
        const nextVariant = variants[nextIndex];

        if (nextVariant?.available) {
          setFocusedVariant(nextVariant.id);
          const nextElement = containerRef.current?.querySelector(
            `[data-variant="${nextVariant.id}"]`,
          ) as HTMLElement;
          nextElement?.focus();
        }
      }
    },
    [variants, handleVariantClick],
  );

  // Auto-focus management for accessibility
  useEffect(() => {
    if (focusedVariant) {
      const element = containerRef.current?.querySelector(
        `[data-variant="${focusedVariant}"]`,
      ) as HTMLElement;
      element?.focus();
    }
  }, [focusedVariant]);

  return (
    <div className={cn("space-y-4", className)}>
      {showLabels && (
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 text-sm dark:text-gray-100">
            Available Colors
          </h3>
          <span className="text-gray-600 text-sm dark:text-gray-400">{selectedVariantName}</span>
        </div>
      )}

      <div
        ref={containerRef}
        className="flex flex-wrap gap-3"
        role="radiogroup"
        aria-label="Color variants"
      >
        {variants.map((variant) => (
          <button
            key={variant.id}
            data-variant={variant.id}
            type="button"
            role="radio"
            aria-checked={selectedVariant === variant.id}
            aria-label={`${variant.name} color${!variant.available ? " (unavailable)" : ""}`}
            disabled={disabled || !variant.available}
            className={cn(
              // Base styles
              "relative h-12 w-12 rounded-full border-2 transition-all duration-200 ease-out",
              "focus:outline-hidden focus:ring-3 focus:ring-offset-2",

              // Interactive states
              "hover:scale-105 active:scale-95",

              // Selected state
              selectedVariant === variant.id
                ? "border-gray-900 ring-2 ring-gray-900 ring-offset-2 dark:border-gray-100 dark:ring-gray-100"
                : "border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500",

              // Disabled state
              disabled || !variant.available
                ? "cursor-not-allowed opacity-50 hover:scale-100"
                : "cursor-pointer",

              // Focus ring colors
              "focus:ring-ring dark:focus:ring-ring",
            )}
            style={{
              backgroundColor: variant.color,
              borderColor: selectedVariant === variant.id ? "var(--style1-primary)" : undefined,
            }}
            onClick={() => handleVariantClick(variant)}
            onKeyDown={(e) => handleKeyDown(e, variant)}
            onFocus={() => setFocusedVariant(variant.id)}
            onBlur={() => setFocusedVariant(null)}
          >
            {/* Selected indicator */}
            {selectedVariant === variant.id && (
              <div className="center-flex absolute inset-1 rounded-full bg-white/20 dark:bg-black/20">
                <div className="h-2 w-2 rounded-full bg-white shadow-sm-xs dark:bg-gray-900" />
              </div>
            )}

            {/* Unavailable indicator */}
            {!variant.available && (
              <div className="center-flex absolute inset-0 rounded-full bg-gray-200/80 dark:bg-gray-800/80">
                <div className="h-0.5 w-6 rotate-45 bg-gray-500 dark:bg-gray-400" />
              </div>
            )}

            {/* Hover effect overlay */}
            <div className="absolute inset-0 rounded-full bg-black/10 opacity-0 transition-opacity duration-200 hover:opacity-100 dark:bg-white/10" />
          </button>
        ))}
      </div>

      {/* Color variant list for screen readers */}
      <div className="sr-only">
        <h4>Available color options:</h4>
        <ul>
          {variants.map((variant) => (
            <li key={variant.id}>
              {variant.name} {!variant.available ? "(unavailable)" : ""}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default ColorVariantSelector;
