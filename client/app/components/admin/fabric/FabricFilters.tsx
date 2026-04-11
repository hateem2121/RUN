import { Grid3X3, List, Search, Table } from "lucide-react";
import type React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getInputTestId } from "./types";

interface FabricFiltersProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  filterStatus: string;
  setFilterStatus: (val: string) => void;
  viewMode: "grid" | "list" | "detailed";
  setViewMode: (val: "grid" | "list" | "detailed") => void;
}

export const FabricFilters: React.FC<FabricFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  viewMode,
  setViewMode,
}) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="text-[#68869A] absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
              <Input
                data-testid={getInputTestId("search")}
                placeholder="Search fabrics by name, type, or properties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
                aria-label="Grid View"
                title="Grid View"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
                aria-label="List View"
                title="List View"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "detailed" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("detailed")}
                aria-label="Detailed View"
                title="Detailed View"
              >
                <Table className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
