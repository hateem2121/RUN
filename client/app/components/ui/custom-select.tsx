import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface CustomSelectProps<T> {
  id?: string;
  value: T | null;
  options: T[];
  onChange: (value: T) => void;
  getLabel: (option: T) => string;
  getKey: (option: T) => string;
  renderOption?: (option: T) => React.ReactNode;
  placeholder?: string;
  searchable?: boolean;
  className?: string;
  "data-testid"?: string;
  "aria-describedby"?: string | undefined;
  "aria-label"?: string | undefined;
  "aria-labelledby"?: string | undefined;
}

export function CustomSelect<T>({
  id,
  value,
  options,
  onChange,
  getLabel,
  getKey,
  renderOption,
  placeholder = "Select...",
  searchable = false,
  className,
  "data-testid": testId,
  "aria-describedby": ariaDescribedBy,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
}: CustomSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = searchable
    ? options.filter((o) => getLabel(o).toLowerCase().includes(search.toLowerCase()))
    : options;

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open) {
        if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
          e.preventDefault();
          setOpen(true);
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex((i) => Math.min(i + 1, filtered.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((i) => Math.max(i - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (filtered[highlightedIndex]) {
            onChange(filtered[highlightedIndex]);
            setOpen(false);
            setSearch("");
          }
          break;
        case "Escape":
          setOpen(false);
          setSearch("");
          break;
      }
    },
    [open, filtered, highlightedIndex, onChange],
  );

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Scroll highlighted into view
  useEffect(() => {
    if (open && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex, open]);

  return (
    <div ref={containerRef} role="none" className="relative" onKeyDown={handleKeyDown}>
      <button
        id={id}
        type="button"
        data-testid={testId}
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open ? "true" : "false"}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        className={cn(
          "relative w-full cursor-default rounded-lg border border-border bg-background p-3 text-left shadow-sm transition-colors",
          "hover:border-border/80 focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary sm:text-sm",
          className,
        )}
      >
        <span className="block truncate">{value ? getLabel(value) : placeholder}</span>
      </button>

      {open && (
        <div className="absolute z-popover mt-1 max-h-60 w-full overflow-hidden rounded-lg border border-border bg-card shadow-xl isolate">
          {searchable && (
            <div className="p-2 border-b border-border">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full rounded-md border border-border bg-background p-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-hidden"
              />
            </div>
          )}
          <div
            ref={listRef}
            role="listbox"
            aria-labelledby={ariaLabelledBy || id}
            className="max-h-40 overflow-y-auto py-1"
          >
            {filtered.map((option, index) => (
              <div
                key={getKey(option)}
                role="option"
                tabIndex={0}
                aria-selected={value === option ? "true" : "false"}
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                  setSearch("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onChange(option);
                    setOpen(false);
                    setSearch("");
                  }
                }}
                className={cn(
                  "cursor-pointer select-none px-3 py-2 text-foreground outline-hidden focus:bg-primary focus:text-primary-foreground",
                  index === highlightedIndex && "bg-primary text-primary-foreground",
                  value === option && index !== highlightedIndex && "bg-muted",
                )}
              >
                {renderOption ? renderOption(option) : getLabel(option)}
              </div>
            ))}
            {filtered.length === 0 && (
              <div
                role="option"
                tabIndex={-1}
                aria-disabled="true"
                className="px-3 py-2 text-muted-foreground text-sm"
              >
                No results
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
