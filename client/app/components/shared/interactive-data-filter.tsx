import gsap from "gsap";
import { ChevronDown, Filter, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface FilterConfig {
  categories?: string[];
  scoreRange?: { min: number; max: number };
  status?: string[];
  searchTerm?: string | undefined;
}

interface InteractiveDataFilterProps {
  onFilterChange: (filters: FilterConfig) => void;
  categories?: string[];
  showScoreFilter?: boolean | undefined;
  showStatusFilter?: boolean | undefined;
}

export function InteractiveDataFilter({
  onFilterChange,
  categories = [],
  showScoreFilter = false,
  showStatusFilter = false,
}: InteractiveDataFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [filters, setFilters] = useState<FilterConfig>({});
  const [localSearch, setLocalSearch] = useState("");
  const [scoreRange, setScoreRange] = useState([1, 5]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  const applyFilters = () => {
    const newFilters: FilterConfig = {
      searchTerm: localSearch,
      ...(selectedCategories.length > 0 ? { categories: selectedCategories } : {}),
      ...(showScoreFilter ? { scoreRange: { min: scoreRange[0]!, max: scoreRange[1]! } } : {}),
      ...(selectedStatuses.length > 0 ? { status: selectedStatuses } : {}),
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    setLocalSearch("");
    setScoreRange([1, 5]);
    setSelectedCategories([]);
    setSelectedStatuses([]);
    setFilters({});
    onFilterChange({});
  };

  // Manage render + animate
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!panelRef.current || !shouldRender) return;
    if (isOpen) {
      gsap.fromTo(
        panelRef.current,
        { opacity: 0, height: 0 },
        { opacity: 1, height: "auto", duration: 0.2, ease: "power2.out" },
      );
    } else {
      gsap.to(panelRef.current, {
        opacity: 0,
        height: 0,
        duration: 0.2,
        ease: "power2.in",
        onComplete: () => setShouldRender(false),
      });
    }
  }, [isOpen, shouldRender]);

  const activeFilterCount = Object.values(filters).filter((v) => v !== undefined).length;

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <div className="relative max-w-md flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground/70" />
          <Input
            placeholder="Search..."
            value={localSearch}
            onChange={(e) => {
              setLocalSearch(e.target.value);
              applyFilters();
            }}
            className="pl-10"
          />
        </div>

        <Button variant="outline" onClick={() => setIsOpen(!isOpen)} className="relative">
          <Filter className="mr-2 h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-xs">
              {activeFilterCount}
            </span>
          )}
          <ChevronDown
            className={`ml-2 h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </Button>

        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear all
            <X className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>

      {shouldRender && (
        <div
          ref={panelRef}
          className="absolute top-full right-0 left-0 z-dock mt-2 overflow-hidden"
        >
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Categories Filter */}
                {categories.length > 0 && (
                  <div>
                    <Label className="mb-3 block font-medium text-sm">Categories</Label>
                    <div className="max-h-48 space-y-2 overflow-y-auto">
                      {categories.map((category) => (
                        <div key={category} className="flex items-center space-x-2">
                          <Checkbox
                            id={category}
                            checked={selectedCategories.includes(category)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedCategories([...selectedCategories, category]);
                              } else {
                                setSelectedCategories(
                                  selectedCategories.filter((c) => c !== category),
                                );
                              }
                            }}
                          />
                          <label
                            htmlFor={category}
                            className="font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {category}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Score Range Filter */}
                {showScoreFilter && (
                  <div>
                    <Label className="mb-3 block font-medium text-sm">
                      Sustainability Score: {scoreRange[0]} - {scoreRange[1]}
                    </Label>
                    <Slider
                      value={scoreRange}
                      onValueChange={setScoreRange}
                      min={1}
                      max={5}
                      step={1}
                      className="mt-2"
                    />
                    <div className="mt-2 flex justify-between text-muted-foreground text-xs">
                      <span>1</span>
                      <span>2</span>
                      <span>3</span>
                      <span>4</span>
                      <span>5</span>
                    </div>
                  </div>
                )}

                {/* Status Filter */}
                {showStatusFilter && (
                  <div>
                    <Label className="mb-3 block font-medium text-sm">Status</Label>
                    <div className="space-y-2">
                      {["Active", "Development", "Planning", "Completed"].map((status) => (
                        <div key={status} className="flex items-center space-x-2">
                          <Checkbox
                            id={status}
                            checked={selectedStatuses.includes(status)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedStatuses([...selectedStatuses, status]);
                              } else {
                                setSelectedStatuses(selectedStatuses.filter((s) => s !== status));
                              }
                            }}
                          />
                          <label
                            htmlFor={status}
                            className="font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {status}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-2 border-t pt-4">
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Reset
                </Button>
                <Button size="sm" onClick={applyFilters}>
                  Apply Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
