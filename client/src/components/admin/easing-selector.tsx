// import React from 'react';

import { Info } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EasingSelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

const easingOptions = [
  {
    value: "ease-in",
    label: "Ease In",
    description: "Slow start, fast finish",
  },
  {
    value: "ease-out",
    label: "Ease Out",
    description: "Fast start, slow finish",
  },
  {
    value: "ease-in-out",
    label: "Ease In-Out",
    description: "Slow start and finish",
  },
  { value: "ease", label: "Ease (Default)", description: "Smooth transition" },
  { value: "linear", label: "Linear", description: "Constant speed" },
];

/**
 * Enhanced easing selector with validation and visual preview
 * Prevents invalid easing configurations by restricting to valid options
 */
export function EasingSelector({
  value,
  onChange,
  label = "Animation Easing",
  disabled = false,
  className = "",
}: EasingSelectorProps) {
  const selectedOption = easingOptions.find((option) => option.value === value);

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor="easing-selector" className="flex items-center gap-2 font-medium text-sm">
        {label}
        <div className="group relative">
          <Info className="h-4 w-4 cursor-help text-gray-400" />
          <div className="invisible absolute top-0 left-6 z-10 whitespace-nowrap rounded bg-black px-2 py-1 text-white text-xs group-hover:visible">
            Controls animation speed curve
          </div>
        </div>
      </Label>

      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger
          id="easing-selector"
          className="h-10 w-full rounded-md border px-3 py-2 text-sm focus:border-ring focus:outline-hidden focus:ring-2 focus:ring-ring"
        >
          <SelectValue placeholder="Select easing type" />
        </SelectTrigger>

        <SelectContent className="max-h-60 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
          {easingOptions.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="cursor-pointer px-3 py-2 text-sm hover:bg-gray-50"
            >
              <div className="flex flex-col">
                <span className="font-medium">{option.label}</span>
                <span className="text-gray-500 text-xs">{option.description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedOption && (
        <div className="flex items-center gap-2 text-gray-600 text-xs">
          <span>Current: {selectedOption.label}</span>
          <span className="text-gray-400">•</span>
          <span>{selectedOption.description}</span>
        </div>
      )}

      {/* Visual easing curve preview */}
      <div className="mt-2 rounded border bg-gray-50 p-2">
        <div className="mb-1 text-gray-600 text-xs">Animation Preview:</div>
        <div className="relative h-6 overflow-hidden rounded border bg-white">
          <div
            className="h-full w-2 bg-blue-500 transition-all duration-1000"
            style={{
              transform: selectedOption ? "translateX(0)" : "translateX(100px)",
              transitionTimingFunction: value || "ease-out",
            }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Validate easing value against allowed options
 * @param easing - Easing string to validate
 * @returns boolean indicating if easing is valid
 */
export function isValidEasing(easing: string): boolean {
  return easingOptions.some((option) => option.value === easing);
}

/**
 * Get default easing if current value is invalid
 * @param currentEasing - Current easing value
 * @returns Valid easing string
 */
export function getValidEasing(currentEasing: string): string {
  return isValidEasing(currentEasing) ? currentEasing : "ease-out";
}
