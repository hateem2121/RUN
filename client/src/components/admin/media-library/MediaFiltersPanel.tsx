import { ArrowDown, ArrowUp, Folder, PanelLeftClose, Plus, Search } from "lucide-react";
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
export default function MediaFiltersPanel() {
  const { state, updateState } = useMediaLibraryEnhanced();

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="font-semibold">Filters</h2>
        <button
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0 z-popover"
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
      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="filters-search">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="filters-search"
              placeholder="Search media..."
              value={state.searchTerm}
              onChange={(e) => updateState("searchTerm", e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Media type filter */}
        <div className="space-y-2">
          <Label htmlFor="filters-type">Type</Label>
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
          <Label htmlFor="filters-sort-by">Sort by</Label>
          <Select
            value={state.sortBy}
            onValueChange={(value) => updateState("sortBy", value as any)}
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
          <Label id="filters-sort-order">Sort order</Label>
          <div className="flex gap-2" role="group" aria-labelledby="filters-sort-order">
            <Button
              variant={state.sortOrder === "asc" ? "default" : "outline"}
              size="sm"
              onClick={() => updateState("sortOrder", "asc")}
              className="flex-1"
            >
              <ArrowUp className="h-4 w-4 mr-2" />
              Ascending
            </Button>
            <Button
              variant={state.sortOrder === "desc" ? "default" : "outline"}
              size="sm"
              onClick={() => updateState("sortOrder", "desc")}
              className="flex-1"
            >
              <ArrowDown className="h-4 w-4 mr-2" />
              Descending
            </Button>
          </div>
        </div>
      </div>

      {/* Folder tree navigation - simplified */}
      <div className="flex-1 p-4 border-t">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium">Folders</h3>
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        <div className="space-y-1">
          {/* Root folder */}
          <div className="flex items-center gap-2 px-2 py-1 text-sm hover:bg-accent rounded cursor-pointer">
            <Folder className="h-4 w-4" />
            <span>All Media</span>
          </div>
          {/* Sample folders - replace with dynamic data */}
          <div className="ml-4">
            <div className="flex items-center gap-2 px-2 py-1 text-sm hover:bg-accent rounded cursor-pointer">
              <Folder className="h-4 w-4" />
              <span>Products</span>
            </div>
            <div className="flex items-center gap-2 px-2 py-1 text-sm hover:bg-accent rounded cursor-pointer">
              <Folder className="h-4 w-4" />
              <span>Banners</span>
            </div>
            <div className="flex items-center gap-2 px-2 py-1 text-sm hover:bg-accent rounded cursor-pointer">
              <Folder className="h-4 w-4" />
              <span>3D Models</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
