import { Grid3X3, List } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMediaLibraryEnhanced } from "../MediaLibraryContextEnhanced";
import { MediaBulkOperations } from "./MediaBulkOperations";

export const MediaGridToolbar = React.memo(() => {
  const { state, updateState } = useMediaLibraryEnhanced();

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant={state.viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => updateState("viewMode", "grid")}
            className={`action-button-icon ${
              state.viewMode === "grid"
                ? "bg-primary text-white"
                : "border-white/10 bg-white/5 text-[#E3DFD6] hover:bg-white/10 hover:text-white"
            }`}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={state.viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => updateState("viewMode", "list")}
            className={`action-button-icon ${
              state.viewMode === "list"
                ? "bg-primary text-white"
                : "border-white/10 bg-white/5 text-[#E3DFD6] hover:bg-white/10 hover:text-white"
            }`}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>

        <Select
          value={state.sortBy}
          onValueChange={(value) => updateState("sortBy", value as typeof state.sortBy)}
        >
          <SelectTrigger className="w-36 sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="size">Size</SelectItem>
            <SelectItem value="uploadedAt">Upload Date</SelectItem>
            <SelectItem value="type">Type</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={() => updateState("sortOrder", state.sortOrder === "asc" ? "desc" : "asc")}
          className="action-button-icon border-white/10 bg-white/5 text-[#E3DFD6] hover:bg-white/10 hover:text-white transition-colors"
        >
          {state.sortOrder === "asc" ? "↑" : "↓"}
        </Button>
      </div>

      <MediaBulkOperations />
    </div>
  );
});

MediaGridToolbar.displayName = "MediaGridToolbar";
