import type { Certificate, Fiber, MediaAsset } from "@shared/index";
import {
  Activity,
  ChevronDown,
  ChevronUp,
  Droplets,
  FileText,
  Globe,
  Grid3X3,
  Layers,
  Plus,
  Shirt,
  Star,
  X,
} from "lucide-react";
import type React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
import { type EnhancedFormData, getInputTestId, getRepeatedTestId } from "./types";

interface FabricFormProps {
  formData: EnhancedFormData;
  setFormData: React.Dispatch<React.SetStateAction<EnhancedFormData>>;
  fibers: Fiber[];
  certificates: Certificate[];
  selectedSwatchAsset: MediaAsset | null;
  setSelectedSwatchAsset: (asset: MediaAsset | null) => void;
  sectionsOpen: Record<string, boolean>;
  toggleSectionOpen: (section: string) => void;
  setIsMediaPickerOpen: (open: boolean) => void;
}

export const FabricForm: React.FC<FabricFormProps> = ({
  formData,
  setFormData,
  fibers,
  certificates,
  selectedSwatchAsset,
  setSelectedSwatchAsset,
  sectionsOpen,
  toggleSectionOpen,
  setIsMediaPickerOpen,
}) => {
  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Fabric Name *</Label>
              <Input
                id="name"
                data-testid={getInputTestId("name")}
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="Enter fabric name"
              />
            </div>
            <div>
              <Label htmlFor="weight">Weight (GSM)</Label>
              <div className="space-y-2">
                <Input
                  id="weight"
                  data-testid={getInputTestId("weight")}
                  type="text"
                  value={formData.weight || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      weight: e.target.value,
                    }))
                  }
                  placeholder="e.g., 200 or 180-220"
                />
                <div className="text-muted-foreground text-xs">
                  Enter single value (e.g., 200) or range (e.g., 180-220)
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="sport">Sport / Activity</Label>
              <Input
                id="sport"
                data-testid={getInputTestId("sport")}
                value={formData.sport}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    sport: e.target.value,
                  }))
                }
                placeholder="e.g., Running, Cycling"
              />
            </div>
            <div>
              <Label htmlFor="marketSegment">Market Segment</Label>
              <Input
                id="marketSegment"
                data-testid={getInputTestId("market-segment")}
                value={formData.marketSegment}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    marketSegment: e.target.value,
                  }))
                }
                placeholder="e.g., Premium, Performance"
              />
            </div>
            <div>
              <Label htmlFor="seasonality">Seasonality</Label>
              <Input
                id="seasonality"
                data-testid={getInputTestId("seasonality")}
                value={formData.seasonality}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    seasonality: e.target.value,
                  }))
                }
                placeholder="e.g., All-Season, Summer"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              data-testid={getInputTestId("description")}
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Enter fabric description"
              rows={3}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              data-testid="checkbox-fabric-active"
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  isActive: checked as boolean,
                }))
              }
            />
            <Label htmlFor="isActive">Active</Label>
          </div>
        </CardContent>
      </Card>

      {/* Fiber Composition Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Fiber Composition
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.compositions.map((composition, compositionIndex) => (
            <div
              key={compositionIndex}
              className={`rounded-lg border p-4 ${
                composition.isDefault ? "border-blue-200 bg-blue-50" : "bg-background"
              }`}
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Input
                    data-testid={getRepeatedTestId("input", "composition-name", compositionIndex)}
                    value={composition.name}
                    onChange={(e) => {
                      const newCompositions = [...formData.compositions];
                      if (newCompositions[compositionIndex]) {
                        newCompositions[compositionIndex].name = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          compositions: newCompositions,
                        }));
                      }
                    }}
                    placeholder="Composition name"
                    className="w-40"
                  />
                  {composition.isDefault && (
                    <Star className="h-4 w-4 fill-current text-yellow-500" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    data-testid={getRepeatedTestId(
                      "checkbox",
                      "composition-default",
                      compositionIndex,
                    )}
                    checked={composition.isDefault}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        const newCompositions = formData.compositions.map((comp, idx) => ({
                          ...comp,
                          isDefault: idx === compositionIndex,
                        }));
                        setFormData((prev) => ({
                          ...prev,
                          compositions: newCompositions,
                        }));
                      }
                    }}
                  />
                  <Label className="text-sm">Default</Label>
                  {formData.compositions.length > 1 && (
                    <Button
                      data-testid={getRepeatedTestId(
                        "button",
                        "remove-composition",
                        compositionIndex,
                      )}
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newCompositions = formData.compositions.filter(
                          (_, idx) => idx !== compositionIndex,
                        );
                        if (
                          composition.isDefault &&
                          newCompositions.length > 0 &&
                          newCompositions[0]
                        ) {
                          newCompositions[0].isDefault = true;
                        }
                        setFormData((prev) => ({
                          ...prev,
                          compositions: newCompositions,
                        }));
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                {composition.fibers.map((fiber, fiberIndex) => (
                  <div key={fiberIndex} className="flex items-center gap-2">
                    <Select
                      value={fiber.fiberId ? fiber.fiberId.toString() : ""}
                      onValueChange={(value) => {
                        const newCompositions = [...formData.compositions];
                        if (newCompositions[compositionIndex]?.fibers[fiberIndex]) {
                          newCompositions[compositionIndex].fibers[fiberIndex].fiberId = value
                            ? parseInt(value, 10)
                            : null;
                          setFormData((prev) => ({
                            ...prev,
                            compositions: newCompositions,
                          }));
                        }
                      }}
                    >
                      <SelectTrigger
                        data-testid={getRepeatedTestId(
                          "select",
                          `fiber-${compositionIndex}`,
                          fiberIndex,
                        )}
                        className="h-12 flex-1 px-4 text-sm"
                      >
                        <SelectValue placeholder="Select fiber" />
                      </SelectTrigger>
                      <SelectContent className="z-modal-nested max-h-72 w-full max-w-xs min-w-0 overflow-y-auto">
                        {fibers && fibers.length > 0 ? (
                          fibers.map((f) => (
                            <SelectItem
                              key={f.id}
                              value={f.id.toString()}
                              className="hover:bg-background h-12 cursor-pointer px-4 text-sm"
                            >
                              {f.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem
                            value="no-fibers"
                            disabled
                            className="text-muted-foreground/70 h-12 px-4 text-sm"
                          >
                            No fibers available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <Input
                      data-testid={getRepeatedTestId(
                        "input",
                        `fiber-percentage-${compositionIndex}`,
                        fiberIndex,
                      )}
                      type="text"
                      value={fiber.percentage}
                      onChange={(e) => {
                        const newCompositions = [...formData.compositions];
                        if (newCompositions[compositionIndex]?.fibers[fiberIndex]) {
                          newCompositions[compositionIndex].fibers[fiberIndex].percentage =
                            e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            compositions: newCompositions,
                          }));
                        }
                      }}
                      placeholder="e.g., 60 %"
                      className="w-32"
                    />
                    <span className="text-muted-foreground text-sm">%</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newCompositions = [...formData.compositions];
                        if (newCompositions[compositionIndex]?.fibers) {
                          newCompositions[compositionIndex].fibers = newCompositions[
                            compositionIndex
                          ].fibers.filter((_, idx) => idx !== fiberIndex);
                          setFormData((prev) => ({
                            ...prev,
                            compositions: newCompositions,
                          }));
                        }
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newCompositions = [...formData.compositions];
                    if (newCompositions[compositionIndex]?.fibers) {
                      newCompositions[compositionIndex].fibers.push({
                        fiberId: null,
                        percentage: "",
                      });
                      setFormData((prev) => ({
                        ...prev,
                        compositions: newCompositions,
                      }));
                    }
                  }}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Fiber
                </Button>
              </div>
            </div>
          ))}

          <Button
            variant="outline"
            onClick={() => {
              const newComposition = {
                name: `Composition ${formData.compositions.length + 1}`,
                isDefault: false,
                fibers: [],
              };
              setFormData((prev) => ({
                ...prev,
                compositions: [...prev.compositions, newComposition],
              }));
            }}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Alternative Composition
          </Button>
        </CardContent>
      </Card>

      {/* Classification Section */}
      <Collapsible
        open={sectionsOpen.classification ?? false}
        onOpenChange={() => toggleSectionOpen("classification")}
      >
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="hover:bg-muted/50 cursor-pointer">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shirt className="h-5 w-5 text-blue-500" />
                  Fabric Classification
                </div>
                {sectionsOpen.classification ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="fabricType">Fabric Type</Label>
                <div className="space-y-2">
                  <Select
                    value={formData.fabricType}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        fabricType: value,
                      }))
                    }
                  >
                    <SelectTrigger className="h-12 px-4 text-sm">
                      <SelectValue placeholder="Select fabric type" />
                    </SelectTrigger>
                    <SelectContent className="z-modal-nested max-h-72 w-full max-w-xs min-w-0 overflow-y-auto">
                      <SelectItem value="Knit" className="h-12 px-4 text-sm">
                        Knit
                      </SelectItem>
                      <SelectItem value="Woven" className="h-12 px-4 text-sm">
                        Woven
                      </SelectItem>
                      <SelectItem value="Non-woven" className="h-12 px-4 text-sm">
                        Non-woven
                      </SelectItem>
                      <SelectItem value="Composite" className="h-12 px-4 text-sm">
                        Composite
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Or enter custom fabric type"
                    value={formData.fabricType}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        fabricType: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div>
                <Label>Key Applications</Label>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {formData.keyApplications.map((app, index) => (
                      <Badge key={index} variant="secondary">
                        {app}
                        <X
                          className="ml-1 h-3 w-3 cursor-pointer"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              keyApplications: prev.keyApplications.filter((_, i) => i !== index),
                            }));
                          }}
                        />
                      </Badge>
                    ))}
                  </div>
                  <Select
                    onValueChange={(value) => {
                      if (!formData.keyApplications.includes(value)) {
                        setFormData((prev) => ({
                          ...prev,
                          keyApplications: [...prev.keyApplications, value],
                        }));
                      }
                    }}
                  >
                    <SelectTrigger className="h-12 px-4 text-sm">
                      <SelectValue placeholder="Add key applications" />
                    </SelectTrigger>
                    <SelectContent className="z-modal-nested max-h-72 w-full max-w-xs min-w-0 overflow-y-auto">
                      {[
                        "Activewear",
                        "Outerwear",
                        "Base Layer",
                        "Swimwear",
                        "Athleisure",
                        "Performance",
                        "Casual",
                      ].map((opt) => (
                        <SelectItem key={opt} value={opt} className="h-12 px-4 text-sm">
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Performance Metrics Section */}
      <Collapsible
        open={sectionsOpen.performance ?? false}
        onOpenChange={() => toggleSectionOpen("performance")}
      >
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="hover:bg-muted/50 cursor-pointer">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-500" />
                  Performance Metrics
                </div>
                {sectionsOpen.performance ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stretchPercentage">Stretch Percentage (%)</Label>
                  <Input
                    id="stretchPercentage"
                    value={formData.stretchPercentage}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        stretchPercentage: e.target.value,
                      }))
                    }
                    placeholder="e.g., 150"
                  />
                </div>
                <div>
                  <Label htmlFor="airPermeability">Air Permeability (mm/s)</Label>
                  <Input
                    id="airPermeability"
                    value={formData.airPermeability}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        airPermeability: e.target.value,
                      }))
                    }
                    placeholder="e.g., 50"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="waterColumn">Water Column (mm)</Label>
                <Input
                  id="waterColumn"
                  value={formData.waterColumn}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      waterColumn: e.target.value,
                    }))
                  }
                  placeholder="e.g., 10000"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Moisture Management</Label>
                  <Select
                    value={formData.enhancedMoistureManagement}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        enhancedMoistureManagement: value,
                      }))
                    }
                  >
                    <SelectTrigger className="h-12 px-4 text-sm">
                      <SelectValue placeholder="Select rating" />
                    </SelectTrigger>
                    <SelectContent>
                      {["Poor", "Fair", "Good", "Excellent", "Outstanding"].map((r) => (
                        <SelectItem key={r} value={r} className="h-12 px-4 text-sm">
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="wickingRate">Wicking Rate (mm/hr)</Label>
                  <Input
                    id="wickingRate"
                    value={formData.wickingRate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        wickingRate: e.target.value,
                      }))
                    }
                    placeholder="e.g., 25"
                  />
                </div>
              </div>
              <div>
                <Label>Performance Features</Label>
                <div className="flex flex-wrap gap-2">
                  {formData.performanceFeatures.map((f, i) => (
                    <Badge key={i} variant="secondary">
                      {f}
                      <X
                        className="ml-1 h-3 w-3 cursor-pointer"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            performanceFeatures: prev.performanceFeatures.filter(
                              (_, idx) => idx !== i,
                            ),
                          }));
                        }}
                      />
                    </Badge>
                  ))}
                </div>
                <Input
                  placeholder="Type and press Enter to add feature"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const val = e.currentTarget.value.trim();
                      if (val && !formData.performanceFeatures.includes(val)) {
                        setFormData((prev) => ({
                          ...prev,
                          performanceFeatures: [...prev.performanceFeatures, val],
                        }));
                        e.currentTarget.value = "";
                      }
                      e.preventDefault();
                    }
                  }}
                />
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Durability & Quality Section */}
      <Collapsible
        open={sectionsOpen.durability ?? false}
        onOpenChange={() => toggleSectionOpen("durability")}
      >
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="hover:bg-muted/50 cursor-pointer">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Droplets className="h-5 w-5 text-purple-500" />
                  Durability & Quality
                </div>
                {sectionsOpen.durability ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="yarnCount">Yarn Count / Construction</Label>
                  <Input
                    id="yarnCount"
                    value={formData.yarnCountConstruction}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, yarnCountConstruction: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="colorfastness">Colorfastness</Label>
                  <Input
                    id="colorfastness"
                    value={formData.colorfastness}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, colorfastness: e.target.value }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Sustainability Section */}
      <Collapsible
        open={sectionsOpen.sustainability ?? false}
        onOpenChange={() => toggleSectionOpen("sustainability")}
      >
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="hover:bg-muted/50 cursor-pointer">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-emerald-500" />
                  Sustainability
                </div>
                {sectionsOpen.sustainability ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="sustainabilityScore">Sustainability Score (1-5)</Label>
                <Input
                  id="sustainabilityScore"
                  type="number"
                  min="0"
                  max="5"
                  value={formData.sustainabilityScore}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, sustainabilityScore: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Certifications</Label>
                <div className="grid grid-cols-2 gap-2">
                  {certificates.map((cert) => (
                    <div key={cert.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`cert-${cert.id}`}
                        checked={formData.certificationIds.includes(cert.id)}
                        onCheckedChange={(checked) => {
                          setFormData((prev) => ({
                            ...prev,
                            certificationIds: checked
                              ? [...prev.certificationIds, cert.id]
                              : prev.certificationIds.filter((id) => id !== cert.id),
                          }));
                        }}
                      />
                      <Label htmlFor={`cert-${cert.id}`}>{cert.name}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Visual Swatch Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid3X3 className="h-5 w-5" />
            Visual Swatch
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center gap-4">
            {selectedSwatchAsset ? (
              <div className="relative h-40 w-40 overflow-hidden rounded-lg border">
                <img
                  src={selectedSwatchAsset.url}
                  alt="Swatch"
                  className="h-full w-full object-cover"
                />
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute top-1 right-1 h-6 w-6 p-0"
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      visualSwatchId: null,
                    }));
                    setSelectedSwatchAsset(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex h-40 w-40 items-center justify-center rounded-lg border border-dashed text-slate-400">
                <Grid3X3 className="h-10 w-10" />
              </div>
            )}
            <Button type="button" variant="outline" onClick={() => setIsMediaPickerOpen(true)}>
              {selectedSwatchAsset ? "Change Swatch" : "Select Swatch"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
