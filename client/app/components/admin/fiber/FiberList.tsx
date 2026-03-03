import type { Fiber } from "@shared/index";
import { CheckSquare, Copy, Edit, Eye, MoreHorizontal, Square, Star, Trash2 } from "lucide-react";
import type React from "react";
import { DeleteConfirmationDialog } from "@/components/admin/shared/DeleteConfirmationDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getPropertiesArray } from "@/lib/fiber-utils";
import { getFiberTypeColor, getSustainabilityColor } from "./types";

interface FiberListProps {
  isLoading: boolean;
  fibers: Fiber[];
  viewMode: "list" | "grid" | "detailed";
  selectedFibers: Set<number>;
  onSelectFiber: (id: number) => void;
  onViewDetail: (fiber: Fiber) => void;
  onEdit: (fiber: Fiber) => void;
  onDuplicate: (fiber: Fiber) => void;
  onDelete: (id: number) => void;
  searchTerm: string;
  filterType: string;
  filterStatus: string;
}

export const FiberList: React.FC<FiberListProps> = ({
  isLoading,
  fibers,
  viewMode,
  selectedFibers,
  onSelectFiber,
  onViewDetail,
  onEdit,
  onDuplicate,
  onDelete,
  searchTerm,
  filterType,
  filterStatus,
}) => {
  if (isLoading) {
    return (
      <div
        className={
          viewMode === "grid" ? "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3" : "space-y-3"
        }
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={`skeleton-${i}`}
            className={
              viewMode === "grid"
                ? "h-32 animate-pulse rounded bg-neutral-100"
                : "h-20 animate-pulse rounded bg-neutral-100"
            }
          />
        ))}
      </div>
    );
  }

  if (fibers.length === 0) {
    return (
      <div className="py-8 text-center text-neutral-500">
        <div className="mb-2 text-2xl">🧬</div>
        <p>
          {searchTerm || filterType !== "all" || filterStatus !== "all"
            ? "No fibers match your filters"
            : "No fibers created yet"}
        </p>
      </div>
    );
  }

  const renderFiberActions = (fiber: Fiber) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onViewDetail(fiber)}>
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(fiber)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDuplicate(fiber)}>
          <Copy className="mr-2 h-4 w-4" />
          Duplicate
        </DropdownMenuItem>
        <DeleteConfirmationDialog
          title="Delete Fiber"
          description={`Are you sure you want to delete "${fiber.name}"? This action cannot be undone.`}
          confirmText="Delete"
          onConfirm={() => onDelete(fiber.id)}
          asChild
          trigger={
            <DropdownMenuItem
              data-testid={`menuitem-delete-fiber-${fiber.id}`}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          }
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {fibers.map((fiber) => (
          <div
            key={fiber.id}
            className={`rounded-lg border p-4 transition-colors ${
              selectedFibers.has(fiber.id)
                ? "border-blue-300 bg-blue-50"
                : "border-neutral-200 hover:bg-neutral-50"
            }`}
          >
            <div className="mb-3 flex items-start justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSelectFiber(fiber.id)}
                className="h-auto p-1"
              >
                {selectedFibers.has(fiber.id) ? (
                  <CheckSquare className="h-4 w-4 text-blue-600" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
              </Button>
              {renderFiberActions(fiber)}
            </div>
            <div className="text-center">
              <h4 className="mb-2 font-medium text-neutral-900">{fiber.name}</h4>
              <div className="mb-3 flex flex-wrap justify-center gap-2">
                <Badge variant="outline" className={`text-xs ${getFiberTypeColor(fiber.type)}`}>
                  {fiber.type.charAt(0).toUpperCase() + fiber.type.slice(1)}
                </Badge>
                {fiber.isActive ? (
                  <Badge className="border border-green-200 bg-green-100 text-xs text-green-700">
                    Active
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-muted text-muted-foreground text-xs">
                    Inactive
                  </Badge>
                )}
                {fiber.sustainabilityScore && (
                  <Badge
                    variant="outline"
                    className={`flex items-center gap-1 text-xs ${getSustainabilityColor(fiber.sustainabilityScore)}`}
                  >
                    <Star className="h-3 w-3 fill-current" />
                    {fiber.sustainabilityScore}/5
                  </Badge>
                )}
              </div>
              {fiber.properties && getPropertiesArray(fiber.properties).length > 0 && (
                <div className="text-xs text-neutral-500">
                  {getPropertiesArray(fiber.properties).length} propert
                  {getPropertiesArray(fiber.properties).length === 1 ? "y" : "ies"}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (viewMode === "detailed") {
    return (
      <div className="space-y-4">
        {fibers.map((fiber) => (
          <div
            key={fiber.id}
            className={`rounded-lg border p-4 transition-colors ${
              selectedFibers.has(fiber.id)
                ? "border-blue-300 bg-blue-50"
                : "border-neutral-200 hover:bg-neutral-50"
            }`}
          >
            <div className="mb-3 flex items-start justify-between">
              <div className="flex flex-1 items-start gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSelectFiber(fiber.id)}
                  className="mt-0.5 h-auto p-1"
                >
                  {selectedFibers.has(fiber.id) ? (
                    <CheckSquare className="h-4 w-4 text-blue-600" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </Button>
                <div className="flex-1">
                  <h4 className="mb-2 text-lg font-medium text-neutral-900">{fiber.name}</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-neutral-500">Type:</span>
                      <Badge
                        variant="outline"
                        className={`ml-2 text-xs ${getFiberTypeColor(fiber.type)}`}
                      >
                        {fiber.type.charAt(0).toUpperCase() + fiber.type.slice(1)}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-neutral-500">Status:</span>
                      {fiber.isActive ? (
                        <Badge className="ml-2 border border-green-200 bg-green-100 text-xs text-green-700">
                          Active
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="bg-muted text-muted-foreground ml-2 text-xs"
                        >
                          Inactive
                        </Badge>
                      )}
                    </div>
                    {fiber.createdAt && (
                      <div>
                        <span className="text-neutral-500">Created:</span>
                        <span className="ml-2">
                          {new Date(fiber.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="text-neutral-500">Properties:</span>
                      <span className="ml-2">{getPropertiesArray(fiber.properties).length}</span>
                    </div>
                    {fiber.sustainabilityScore && (
                      <div>
                        <span className="text-neutral-500">Sustainability:</span>
                        <Badge
                          variant="outline"
                          className={`ml-2 flex w-fit items-center gap-1 text-xs ${getSustainabilityColor(fiber.sustainabilityScore)}`}
                        >
                          <Star className="h-3 w-3 fill-current" />
                          {fiber.sustainabilityScore}/5
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {renderFiberActions(fiber)}
            </div>
            {fiber.description && (
              <div className="mt-3 border-t pt-3">
                <p className="text-sm text-neutral-600">{fiber.description}</p>
              </div>
            )}
            {fiber.properties && getPropertiesArray(fiber.properties).length > 0 && (
              <div className="mt-3 border-t pt-3">
                <p className="mb-2 text-xs text-neutral-500">Properties:</p>
                <div className="flex flex-wrap gap-1">
                  {getPropertiesArray(fiber.properties).map((prop: string) => (
                    <Badge key={prop} variant="secondary" className="text-xs">
                      {prop}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {fibers.map((fiber) => (
        <div
          key={fiber.id}
          className={`rounded-lg border p-3 transition-colors ${
            selectedFibers.has(fiber.id)
              ? "border-blue-300 bg-blue-50"
              : "border-neutral-200 hover:bg-neutral-50"
          }`}
        >
          <div className="mb-2 flex items-start justify-between">
            <div className="flex flex-1 items-start gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSelectFiber(fiber.id)}
                className="mt-0.5 h-auto p-1"
              >
                {selectedFibers.has(fiber.id) ? (
                  <CheckSquare className="h-4 w-4 text-blue-600" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
              </Button>
              <div className="flex-1">
                <h4 className="font-medium text-neutral-900">{fiber.name}</h4>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="outline" className={`text-xs ${getFiberTypeColor(fiber.type)}`}>
                    {fiber.type.charAt(0).toUpperCase() + fiber.type.slice(1)}
                  </Badge>
                  {fiber.isActive ? (
                    <Badge className="border border-green-200 bg-green-100 text-xs text-green-700">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-muted text-muted-foreground text-xs">
                      Inactive
                    </Badge>
                  )}
                  {fiber.sustainabilityScore && (
                    <Badge
                      variant="outline"
                      className={`flex items-center gap-1 text-xs ${getSustainabilityColor(fiber.sustainabilityScore)}`}
                    >
                      <Star className="h-3 w-3 fill-current" />
                      {fiber.sustainabilityScore}/5
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            {renderFiberActions(fiber)}
          </div>
          {fiber.description && (
            <p className="mb-2 text-sm text-neutral-600">{fiber.description}</p>
          )}
          {fiber.properties && getPropertiesArray(fiber.properties).length > 0 && (
            <div className="mb-2">
              <p className="mb-1 text-xs text-neutral-500">Properties:</p>
              <div className="flex flex-wrap gap-1">
                {getPropertiesArray(fiber.properties)
                  .slice(0, 3)
                  .map((prop: string) => (
                    <Badge key={prop} variant="secondary" className="text-xs">
                      {prop}
                    </Badge>
                  ))}
                {getPropertiesArray(fiber.properties).length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{getPropertiesArray(fiber.properties).length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
