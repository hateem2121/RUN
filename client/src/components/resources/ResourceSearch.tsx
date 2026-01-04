import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ResourceSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string | undefined;
  className?: string | undefined;
}

export function ResourceSearch({
  value,
  onChange,
  placeholder = "Search resources...",
  className = "",
}: ResourceSearchProps) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-muted-foreground/70" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="py-6 pr-10 pl-10 text-base"
      />
      {value && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange("")}
          className="absolute top-1/2 right-2 h-auto -translate-y-1/2 transform p-1"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
