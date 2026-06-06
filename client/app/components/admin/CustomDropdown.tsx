import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Label } from "@/components/ui/label";

interface DropdownOption {
  value: string;
  label: string;
  disabled?: boolean | undefined;
}

interface CustomDropdownProps {
  value?: string | undefined;
  onChange: (value: string) => void;
  options: DropdownOption[];
  label?: string | undefined;
  placeholder?: string | undefined;
  disabled?: boolean | undefined;
  required?: boolean | undefined;
  className?: string | undefined;
}

export function CustomDropdown({
  value,
  onChange,
  options,
  label,
  placeholder = "Select an option",
  disabled = false,
  required = false,
  className = "",
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxId = useRef(`dropdown-listbox-${Math.random().toString(36).slice(2)}`).current;
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const currentOption = options.find((opt) => opt.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Trim stale refs when options list shrinks; clamp focusedIndex to valid range
  useEffect(() => {
    optionRefs.current = optionRefs.current.slice(0, options.length);
    setFocusedIndex((prev) => (prev >= options.length ? options.length - 1 : prev));
  }, [options.length]);

  // Move DOM focus to the focused option
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && optionRefs.current[focusedIndex]) {
      optionRefs.current[focusedIndex]?.focus();
    }
  }, [isOpen, focusedIndex]);

  // Attach native keydown listeners to bypass React event delegation and Radix capture phase focus trap
  useEffect(() => {
    if (!isOpen) return;

    const handleNativeKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Tab") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        triggerRef.current?.focus();
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    const optionsElements = [...optionRefs.current];
    const triggerEl = triggerRef.current;

    for (const el of optionsElements) {
      el?.addEventListener("keydown", handleNativeKeyDown, { capture: true });
    }
    if (triggerEl) {
      triggerEl.addEventListener("keydown", handleNativeKeyDown, { capture: true });
    }

    return () => {
      for (const el of optionsElements) {
        el?.removeEventListener("keydown", handleNativeKeyDown, { capture: true });
      }
      if (triggerEl) {
        triggerEl.removeEventListener("keydown", handleNativeKeyDown, { capture: true });
      }
    };
  }, [isOpen]);

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setFocusedIndex(-1);
  };

  const handleTriggerClick = () => {
    if (!disabled) {
      const opening = !isOpen;
      setIsOpen(opening);
      if (opening) {
        // Focus selected option or first option when opening
        const selectedIdx = options.findIndex((o) => o.value === value);
        setFocusedIndex(selectedIdx >= 0 ? selectedIdx : 0);
      }
    }
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
      e.preventDefault();
      setIsOpen(true);
      const selectedIdx = options.findIndex((o) => o.value === value);
      setFocusedIndex(selectedIdx >= 0 ? selectedIdx : 0);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIsOpen(true);
      setFocusedIndex(options.length - 1);
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      triggerRef.current?.focus();
      setIsOpen(false);
      setFocusedIndex(-1);
    }
  };

  const handleOptionKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) => Math.min(prev + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      triggerRef.current?.focus();
      setIsOpen(false);
      setFocusedIndex(-1);
    } else if (e.key === "Tab") {
      e.preventDefault();
      e.stopPropagation();
      triggerRef.current?.focus();
      setIsOpen(false);
      setFocusedIndex(-1);
    } else if ((e.key === "Enter" || e.key === " ") && !options[index]?.disabled) {
      e.preventDefault();
      const val = options[index]?.value;
      if (val !== undefined) handleOptionClick(val);
    }
  };

  return (
    <div className={`space-y-2 ${className}`} ref={dropdownRef}>
      {label && (
        <Label>
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </Label>
      )}

      <div className="relative">
        {/* Dropdown Trigger */}
        <button
          aria-label="Action button"
          ref={triggerRef}
          type="button"
          onClick={handleTriggerClick}
          onKeyDown={handleTriggerKeyDown}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={isOpen ? listboxId : undefined}
          className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background hover:bg-accent hover:text-accent-foreground focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${isOpen ? "ring-2 ring-ring ring-offset-2" : ""}
          `}
        >
          <span className={currentOption ? "text-foreground" : "text-muted-foreground"}>
            {currentOption ? currentOption.label : placeholder}
          </span>
          <ChevronDown
            className={`h-4 w-4 opacity-50 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>

        {/* Dropdown Content */}
        {isOpen && (
          <div
            id={listboxId}
            role="listbox"
            aria-label={label || placeholder}
            className="fade-in-0 zoom-in-95 absolute top-full right-0 left-0 z-modal-nested mt-1 max-h-dropdown animate-in overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
          >
            {options.map((option, index) => (
              <button
                aria-label="Action button"
                key={option.value}
                ref={(el) => {
                  optionRefs.current[index] = el;
                }}
                type="button"
                role="option"
                aria-selected={value === option.value}
                aria-disabled={option.disabled}
                onClick={() => !option.disabled && handleOptionClick(option.value)}
                onKeyDown={(e) => handleOptionKeyDown(e, index)}
                disabled={option.disabled}
                tabIndex={-1}
                className={`relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-hidden hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 ${value === option.value ? "bg-accent text-accent-foreground" : ""}
                `}
              >
                <span className="flex-1 text-left">{option.label}</span>
                {value === option.value && <Check className="ml-2 h-4 w-4" aria-hidden="true" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
