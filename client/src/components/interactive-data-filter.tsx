import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, X, ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";

interface FilterConfig {
  categories?: string[];
  scoreRange?: { min: number; max: number };
  status?: string[];
  searchTerm?: string;
}

interface InteractiveDataFilterProps {
  onFilterChange: (filters: FilterConfig) => void;
  categories?: string[];
  showScoreFilter?: boolean;
  showStatusFilter?: boolean;
}

export function InteractiveDataFilter({
  onFilterChange,
  categories = [],
  showScoreFilter = false,
  showStatusFilter = false,
}: InteractiveDataFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterConfig>({});
  const [localSearch, setLocalSearch] = useState("");
  const [scoreRange, setScoreRange] = useState([1, 5]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  const applyFilters = () => {
    const newFilters: FilterConfig = {
      searchTerm: localSearch,
      categories: selectedCategories.length > 0 ? selectedCategories : undefined,
      scoreRange: showScoreFilter ? { min: scoreRange[0]!, max: scoreRange[1]! } : undefined,
      status: selectedStatuses.length > 0 ? selectedStatuses : undefined,
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

  const activeFilterCount = Object.values(filters).filter((v) => v !== undefined).length;

  return (
    <div className="relative">
      <div className="flex gap-2 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
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
          <Filter className="w-4 h-4 mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 ml-2 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </Button>

        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear all
            <X className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 z-dock"
          >
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Categories Filter */}
                  {categories.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Categories</Label>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
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
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
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
                      <Label className="text-sm font-medium mb-3 block">
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
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
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
                      <Label className="text-sm font-medium mb-3 block">Status</Label>
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
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {status}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Reset
                  </Button>
                  <Button size="sm" onClick={applyFilters}>
                    Apply Filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
