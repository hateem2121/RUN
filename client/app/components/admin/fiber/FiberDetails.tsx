import type { Fiber } from "@shared/index";
import { Star } from "lucide-react";
import type React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getPropertiesArray } from "@/lib/fiber-utils";
import { getFiberTypeColor, getSustainabilityBadgeColor, getSustainabilityLabel } from "./types";

interface FiberDetailsProps {
  fiber: Fiber | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FiberDetails: React.FC<FiberDetailsProps> = ({ fiber, open, onOpenChange }) => {
  if (!fiber) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">{fiber.name}</DialogTitle>
            <Badge className={getFiberTypeColor(fiber.type)}>
              {fiber.type.charAt(0).toUpperCase() + fiber.type.slice(1)}
            </Badge>
          </div>
          <DialogDescription>Fiber ID: {fiber.id}</DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-6">
          {fiber.description && (
            <div>
              <h4 className="mb-1 text-sm font-semibold uppercase tracking-wider text-neutral-500">
                Description
              </h4>
              <p className="text-neutral-700">{fiber.description}</p>
            </div>
          )}

          <div>
            <h4 className="mb-2 text-sm font-semibold uppercase tracking-wider text-neutral-500">
              Sustainability Profile
            </h4>
            <div
              className={`rounded-lg border p-4 ${getSustainabilityBadgeColor(fiber.sustainabilityScore || 0)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Sustainability Impact</span>
                <span className="flex items-center gap-1 font-bold">
                  <Star className="h-4 w-4 fill-current text-yellow-500" />
                  {fiber.sustainabilityScore || 0}/5
                </span>
              </div>
              <div className="text-sm font-medium">
                Rating: {getSustainabilityLabel(fiber.sustainabilityScore || 0)}
              </div>
            </div>
            {fiber.environmentalImpact && (
              <div className="mt-3 text-sm text-neutral-600 italic">
                "{fiber.environmentalImpact}"
              </div>
            )}
          </div>

          {fiber.properties && getPropertiesArray(fiber.properties).length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-semibold uppercase tracking-wider text-neutral-500">
                Performance Properties
              </h4>
              <div className="flex flex-wrap gap-2">
                {getPropertiesArray(fiber.properties).map((prop: string) => (
                  <Badge key={prop} variant="secondary">
                    {prop}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 rounded-lg bg-neutral-50 p-3 text-sm">
            <div>
              <span className="text-neutral-500">Status</span>
              <div className="font-medium">
                {fiber.isActive ? (
                  <span className="text-green-600">Active</span>
                ) : (
                  <span className="text-neutral-500">Inactive</span>
                )}
              </div>
            </div>
            <div>
              <span className="text-neutral-500">Created At</span>
              <div className="font-medium">
                {fiber.createdAt ? new Date(fiber.createdAt).toLocaleDateString() : "N/A"}
              </div>
            </div>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
};
