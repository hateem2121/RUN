import { ArrowDown, ArrowUp, Folder, PanelLeftClose, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMediaLibraryEnhanced } from "./MediaLibraryContextEnhanced";

// Phase 1: Search and Filtering Interface (90 lines target)
export function MediaFiltersPanel() {
  const { state, updateState } = useMediaLibraryEnhanced();

  // PHASE 3 OPTIMIZATION: Local state for search to prevent global context updates on every keystroke (INP fix)
  const [localSearch, setLocalSearch] = useState(state.searchTerm);

  // Sync local state when global state changes (e.g. valid clearSearch from elsewhere)
  useEffect(() => {
    setLocalSearch(state.searchTerm);
  }, [state.searchTerm]);

  // Debounced update to global state
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== state.searchTerm) {
        updateState("searchTerm", localSearch);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [localSearch, state.searchTerm, updateState]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 p-4">
        <h2 className="font-semibold text-white">Filters</h2>
        <button
          type="button"
          className="z-popover inline-flex h-8 w-8 items-center justify-center rounded-md p-0 font-medium text-sm text-admin-muted transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-blue-500/50 disabled:pointer-events-none disabled:opacity-50"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            updateState("showFiltersPanel", false);
          }}
          title="Hide filters panel"
          data-testid="button-collapse-filters"
          style={{ pointerEvents: "auto" }}
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      {/* Search */}
      <div className="space-y-4 p-4">
        <div className="space-y-2">
          <Label
            htmlFor="filters-search"
            className="text-xxs font-bold text-admin-muted uppercase tracking-widest"
          >
            Search
          </Label>
          <div className="relative">
            <Search className="absolute top-3 left-3 h-4 w-4 text-admin-muted" />
            <Input
              id="filters-search"
              placeholder="Search media..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-10 bg-white/[0.03] border-white/10 text-white placeholder:text-admin-muted/50 focus:border-white/20 focus:ring-1 focus:ring-white/20"
            />
          </div>
        </div>

        {/* Media type filter */}
        <div className="space-y-2">
          <Label
            htmlFor="filters-type"
            className="text-xxs font-bold text-admin-muted uppercase tracking-widest"
          >
            Type
          </Label>
          <Select
            value={state.selectedType}
            onValueChange={(value) => updateState("selectedType", value)}
          >
            <SelectTrigger id="filters-type">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="image">Images</SelectItem>
              <SelectItem value="video">Videos</SelectItem>
              <SelectItem value="model">3D Models</SelectItem>
              <SelectItem value="document">Documents</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort options */}
        <div className="space-y-2">
          <Label
            htmlFor="filters-sort-by"
            className="text-xxs font-bold text-admin-muted uppercase tracking-widest"
          >
            Sort by
          </Label>
          <Select
            value={state.sortBy}
            onValueChange={(value) =>
              updateState("sortBy", value as "uploadedAt" | "name" | "size" | "type")
            }
          >
            <SelectTrigger id="filters-sort-by">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="uploadedAt">Upload Date</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="size">Size</SelectItem>
              <SelectItem value="type">Type</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort order */}
        <div className="space-y-2">
          <Label
            id="filters-sort-order"
            className="text-xxs font-bold text-admin-muted uppercase tracking-widest"
          >
            Sort order
          </Label>
          <fieldset className="flex gap-2" aria-labelledby="filters-sort-order">
            <Button
              variant={state.sortOrder === "asc" ? "default" : "outline"}
              size="sm"
              onClick={() => updateState("sortOrder", "asc")}
              className={`flex-1 ${state.sortOrder === "asc" ? "bg-primary text-white" : "border-white/10 bg-white/5 text-admin-foreground hover:bg-white/10 hover:text-white"}`}
            >
              <ArrowUp className="mr-2 h-4 w-4" />
              Ascending
            </Button>
            <Button
              variant={state.sortOrder === "desc" ? "default" : "outline"}
              size="sm"
              onClick={() => updateState("sortOrder", "desc")}
              className={`flex-1 ${state.sortOrder === "desc" ? "bg-primary text-white" : "border-white/10 bg-white/5 text-admin-foreground hover:bg-white/10 hover:text-white"}`}
            >
              <ArrowDown className="mr-2 h-4 w-4" />
              Descending
            </Button>
          </fieldset>
        </div>
      </div>

      {/* Folder tree navigation - simplified */}
      <div className="flex-1 border-t border-white/5 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-medium text-sm text-admin-foreground">Folders</h3>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-admin-muted hover:text-white hover:bg-white/5"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        <div className="space-y-1">
          {/* Root folder */}
          <div className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-sm text-admin-foreground hover:bg-white/5">
            <Folder className="h-4 w-4 text-blue-400" />
            <span>All Media</span>
          </div>
          {/* Sample folders - replace with dynamic data */}
          <div className="ml-4">
            <div className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-sm text-admin-muted hover:bg-white/5 hover:text-admin-foreground">
              <Folder className="h-4 w-4" />
              <span>Products</span>
            </div>
            <div className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-sm text-admin-muted hover:bg-white/5 hover:text-admin-foreground">
              <Folder className="h-4 w-4" />
              <span>Banners</span>
            </div>
            <div className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-sm text-admin-muted hover:bg-white/5 hover:text-admin-foreground">
              <Folder className="h-4 w-4" />
              <span>3D Models</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
