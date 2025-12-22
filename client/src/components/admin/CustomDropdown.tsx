import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Label } from "@/components/ui/label";

interface DropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface CustomDropdownProps {
  value?: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export function CustomDropdown({
  value,
  onChange,
  options,
  label,
  placeholder = "Select an option",
  disabled = false,
  required = false,
  className = ""
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentOption = options.find(opt => opt.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleOptionClick = (optionValue: string) => {
    console.log(`CustomDropdown: Option selected:`, optionValue);
    onChange(optionValue);
    setIsOpen(false);
  };

  const handleTriggerClick = () => {
    if (!disabled) {
      console.log(`CustomDropdown: ${label || 'Dropdown'} clicked, toggling open state`);
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className={`space-y-2 ${className}`} ref={dropdownRef}>
      {label && (
        <Label>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      
      <div className="relative">
        {/* Dropdown Trigger */}
        <button
          type="button"
          onClick={handleTriggerClick}
          disabled={disabled}
          className={`
            flex h-10 w-full items-center justify-between rounded-md border border-input 
            bg-background px-3 py-2 text-sm ring-offset-background 
            hover:bg-accent hover:text-accent-foreground 
            focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 
            disabled:cursor-not-allowed disabled:opacity-50
            ${isOpen ? 'ring-2 ring-ring ring-offset-2' : ''}
          `}
        >
          <span className={currentOption ? 'text-foreground' : 'text-muted-foreground'}>
            {currentOption ? currentOption.label : placeholder}
          </span>
          <ChevronDown 
            className={`h-4 w-4 opacity-50 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          />
        </button>

        {/* Dropdown Content */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 z-modal-nested mt-1 max-h-[300px] overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => !option.disabled && handleOptionClick(option.value)}
                disabled={option.disabled}
                className={`
                  relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-hidden 
                  hover:bg-accent hover:text-accent-foreground 
                  focus:bg-accent focus:text-accent-foreground
                  disabled:pointer-events-none disabled:opacity-50
                  ${value === option.value ? 'bg-accent text-accent-foreground' : ''}
                `}
              >
                <span className="flex-1 text-left">{option.label}</span>
                {value === option.value && (
                  <Check className="h-4 w-4 ml-2" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}