import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface RobustSelectProps {
  value?: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
}

import React from "react";

export const RobustSelect = React.memo(function RobustSelect({
  value,
  onChange,
  options,
  label,
  placeholder = "Select an option",
  disabled = false,
  required = false,
  className = "",
  triggerClassName = "",
  contentClassName = ""
}: RobustSelectProps) {
  
  const handleValueChange = (newValue: string) => {
    console.log(`RobustSelect: ${label || 'Dropdown'} changed to:`, newValue);
    onChange(newValue);
  };

  const currentOption = options.find(opt => opt.value === value);

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <Select 
        value={value || ""} 
        onValueChange={handleValueChange}
        disabled={disabled}
      >
        <SelectTrigger 
          className={`w-full ${triggerClassName}`}
          onClick={() => console.log(`RobustSelect: ${label || 'Dropdown'} clicked`)}
        >
          <SelectValue placeholder={placeholder}>
            {currentOption ? currentOption.label : (value || placeholder)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className={`max-h-[300px] overflow-y-auto ${contentClassName}`}>
          {options.map((option) => (
            <SelectItem 
              key={option.value} 
              value={option.value}
              disabled={option.disabled}
              onClick={() => console.log(`RobustSelect: Option clicked:`, option.value)}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
});