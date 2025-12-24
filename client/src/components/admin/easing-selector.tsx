// import React from 'react';

import { Info } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EasingSelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

const easingOptions = [
  { value: 'ease-in', label: 'Ease In', description: 'Slow start, fast finish' },
  { value: 'ease-out', label: 'Ease Out', description: 'Fast start, slow finish' },
  { value: 'ease-in-out', label: 'Ease In-Out', description: 'Slow start and finish' },
  { value: 'ease', label: 'Ease (Default)', description: 'Smooth transition' },
  { value: 'linear', label: 'Linear', description: 'Constant speed' },
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
  className = ""
}: EasingSelectorProps) {
  const selectedOption = easingOptions.find(option => option.value === value);

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor="easing-selector" className="text-sm font-medium flex items-center gap-2">
        {label}
        <div className="group relative">
          <Info className="h-4 w-4 text-gray-400 cursor-help" />
          <div className="absolute left-6 top-0 invisible group-hover:visible bg-black text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
            Controls animation speed curve
          </div>
        </div>
      </Label>

      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger
          id="easing-selector"
          className="w-full h-10 px-3 py-2 text-sm border rounded-md focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <SelectValue placeholder="Select easing type" />
        </SelectTrigger>

        <SelectContent className="bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {easingOptions.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer"
            >
              <div className="flex flex-col">
                <span className="font-medium">{option.label}</span>
                <span className="text-xs text-gray-500">{option.description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedOption && (
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span>Current: {selectedOption.label}</span>
          <span className="text-gray-400">•</span>
          <span>{selectedOption.description}</span>
        </div>
      )}

      {/* Visual easing curve preview */}
      <div className="mt-2 p-2 bg-gray-50 rounded border">
        <div className="text-xs text-gray-600 mb-1">Animation Preview:</div>
        <div className="h-6 bg-white rounded border relative overflow-hidden">
          <div
            className="h-full w-2 bg-blue-500 transition-all duration-1000"
            style={{
              transform: selectedOption ? 'translateX(0)' : 'translateX(100px)',
              transitionTimingFunction: value || 'ease-out'
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
  return easingOptions.some(option => option.value === easing);
}

/**
 * Get default easing if current value is invalid
 * @param currentEasing - Current easing value
 * @returns Valid easing string
 */
export function getValidEasing(currentEasing: string): string {
  return isValidEasing(currentEasing) ? currentEasing : 'ease-out';
}