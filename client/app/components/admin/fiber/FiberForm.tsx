import { Plus, Star, X } from "lucide-react";
import type React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { FiberFormData } from "./types";

interface FiberFormProps {
  formData: FiberFormData;
  setFormData: React.Dispatch<React.SetStateAction<FiberFormData>>;
  nameError: string;
  isCustomType: boolean;
  setIsCustomType: React.Dispatch<React.SetStateAction<boolean>>;
  customType: string;
  setCustomType: React.Dispatch<React.SetStateAction<string>>;
  propertyList: string[];
  newProperty: string;
  setNewProperty: React.Dispatch<React.SetStateAction<string>>;
  addProperty: () => void;
  removeProperty: (index: number) => void;
}

const SustainabilityRatingInput = ({
  value,
  onChange,
}: {
  value?: number | undefined;
  onChange: (val?: number) => void;
}) => (
  <div>
    <Label className="text-sm font-medium text-emerald-400">Sustainability Score (1-5)</Label>
    <div className="mt-2 flex items-center gap-3">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            type="button"
            title={`Rate ${score} stars`}
            onClick={() => onChange(score)}
            className={`rounded p-1 transition-colors ${
              (value || 0) >= score
                ? "text-amber-400 hover:text-amber-300"
                : "text-admin-muted/50 hover:text-admin-muted/70"
            }`}
          >
            <Star className="h-6 w-6 fill-current" />
          </button>
        ))}
      </div>
      <span className="text-sm text-emerald-400">{value ? `${value}/5` : "Not rated"}</span>
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChange(undefined)}
          className="text-admin-muted/70 hover:text-admin-muted h-6 w-6 p-0"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
    <p className="mt-1 text-xs text-emerald-400">1 = Low impact, 5 = High sustainability</p>
  </div>
);

export const FiberForm: React.FC<FiberFormProps> = ({
  formData,
  setFormData,
  nameError,
  isCustomType,
  setIsCustomType,
  customType,
  setCustomType,
  propertyList,
  newProperty,
  setNewProperty,
  addProperty,
  removeProperty,
}) => {
  return (
    <div className="grid gap-6 py-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Fiber Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="e.g. Organic Cotton, Recycled Polyester"
          className={nameError ? "border-rose-500" : ""}
        />
        {nameError && <p className="text-xs text-rose-500">{nameError}</p>}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="type">Fiber Type</Label>
        {!isCustomType ? (
          <Select
            value={formData.type}
            onValueChange={(value) => {
              if (value === "custom") {
                setIsCustomType(true);
                setFormData((prev) => ({ ...prev, type: "" }));
              } else {
                setFormData((prev) => ({ ...prev, type: value }));
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="natural">Natural</SelectItem>
              <SelectItem value="synthetic">Synthetic</SelectItem>
              <SelectItem value="blended">Blended</SelectItem>
              <SelectItem value="cellulosic">Cellulosic</SelectItem>
              <SelectItem value="custom">Other / Custom...</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <div className="flex gap-2">
            <Input
              value={customType}
              onChange={(e) => {
                setCustomType(e.target.value);
                setFormData((prev) => ({ ...prev, type: e.target.value }));
              }}
              placeholder="Enter custom type"
              className="flex-1"
            />
            <Button variant="outline" size="sm" onClick={() => setIsCustomType(false)}>
              Back to list
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Detailed information about the fiber..."
          rows={3}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="properties">Properties</Label>
        <div className="flex gap-2">
          <Input
            value={newProperty}
            onChange={(e) => setNewProperty(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addProperty();
              }
            }}
            placeholder="Add property (e.g. Soft, Durable, Quick-dry)"
            className="flex-1"
          />
          <Button type="button" onClick={addProperty} variant="secondary" size="sm">
            <Plus className="h-4 w-4 mr-2" /> Add
          </Button>
        </div>
        {propertyList.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {propertyList.map((prop, index) => (
              <Badge
                key={`${prop}-${index}`}
                variant="secondary"
                className="flex items-center gap-1 pr-1 py-1 text-xs"
              >
                {prop}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeProperty(index)}
                  className="h-4 w-4 p-0 hover:bg-transparent"
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove {prop}</span>
                </Button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-6">
        <SustainabilityRatingInput
          value={formData.sustainabilityScore}
          onChange={(val) => setFormData((prev) => ({ ...prev, sustainabilityScore: val }))}
        />

        <div className="grid gap-2">
          <Label htmlFor="environmentalImpact">Environmental Impact Notes</Label>
          <Textarea
            id="environmentalImpact"
            value={formData.environmentalImpact}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, environmentalImpact: e.target.value }))
            }
            placeholder="Notes on sourcing, processing, and disposal..."
            rows={2}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) =>
            setFormData((prev) => ({ ...prev, isActive: checked === true }))
          }
        />
        <Label htmlFor="isActive" className="text-sm font-medium leading-none cursor-pointer">
          Active - Fiber is available for use in compositions
        </Label>
      </div>
    </div>
  );
};
