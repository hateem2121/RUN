/**
 * Advanced Options Tab - Specifications, Certifications, and SEO
 * Organized advanced features for power users and detailed product configuration
 */

// Import schema types
import type { Accessory, Certificate } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Info, Plus, Search, X } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ProductFormData {
  name: string;
  sku: string;
  description?: string;
  categoryId?: number | null;
  fabricId?: number | null;
  sizeChartId?: number | null;
  imageIds?: number[];
  videos?: number[];
  modelFileId?: number | null;
  accessoryIds?: number[];
  certificateIds?: number[];
  isActive?: boolean;
  isFeatured?: boolean;
  slug?: string;
  shortDescription?: string;
  technicalSpecs?: Record<string, string>;
  careInstructions?: string[];
  tags?: string[];
  specifications?: string[];
  minimumOrderQuantity?: string;
  leadTime?: string;
  customizationOptions?: string[];
  relatedProductIds?: number[];
  primaryImageId?: number | null;
  primaryVideoId?: number | null;
  metaTitle?: string;
  metaDescription?: string;
}

interface AdvancedOptionsTabProps {
  formData: ProductFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProductFormData>>;
}

export const AdvancedOptionsTab: React.FC<AdvancedOptionsTabProps> = ({
  formData,
  setFormData,
}) => {
  const [newSpecification, setNewSpecification] = useState("");
  const [newTechSpecKey, setNewTechSpecKey] = useState("");
  const [newTechSpecValue, setNewTechSpecValue] = useState("");
  const [newCareInstruction, setNewCareInstruction] = useState("");
  const [newTag, setNewTag] = useState("");
  const [newCustomizationOption, setNewCustomizationOption] = useState("");
  const [certificateSearch, setCertificateSearch] = useState("");
  const [accessorySearch, setAccessorySearch] = useState("");

  // Data Queries
  const { data: certificates = [] } = useQuery<Certificate[]>({
    queryKey: ["/api/certificates"],
  });

  const { data: accessories = [] } = useQuery<Accessory[]>({
    queryKey: ["/api/accessories"],
  });

  // Specification Handlers
  const addSpecification = () => {
    if (newSpecification.trim()) {
      setFormData((prev) => ({
        ...prev,
        specifications: [...(prev.specifications || []), newSpecification.trim()],
      }));
      setNewSpecification("");
    }
  };

  const removeSpecification = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      specifications: (prev.specifications || []).filter((_, i) => i !== index),
    }));
  };

  // Technical Specs Handlers
  const addTechnicalSpec = () => {
    if (newTechSpecKey.trim() && newTechSpecValue.trim()) {
      setFormData((prev) => ({
        ...prev,
        technicalSpecs: {
          ...prev.technicalSpecs,
          [newTechSpecKey.trim()]: newTechSpecValue.trim(),
        },
      }));
      setNewTechSpecKey("");
      setNewTechSpecValue("");
    }
  };

  const removeTechnicalSpec = (key: string) => {
    setFormData((prev) => {
      const newSpecs = { ...prev.technicalSpecs };
      delete newSpecs[key];
      return { ...prev, technicalSpecs: newSpecs };
    });
  };

  // Care Instructions Handlers
  const addCareInstruction = () => {
    if (newCareInstruction.trim()) {
      setFormData((prev) => ({
        ...prev,
        careInstructions: [...(prev.careInstructions || []), newCareInstruction.trim()],
      }));
      setNewCareInstruction("");
    }
  };

  const removeCareInstruction = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      careInstructions: (prev.careInstructions || []).filter((_, i) => i !== index),
    }));
  };

  // Tags Handlers
  const addTag = () => {
    if (newTag.trim() && !(formData.tags || []).includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()],
      }));
      setNewTag("");
    }
  };

  const removeTag = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      tags: (prev.tags || []).filter((_, i) => i !== index),
    }));
  };

  // Customization Options Handlers
  const addCustomizationOption = () => {
    if (newCustomizationOption.trim()) {
      setFormData((prev) => ({
        ...prev,
        customizationOptions: [...(prev.customizationOptions || []), newCustomizationOption.trim()],
      }));
      setNewCustomizationOption("");
    }
  };

  const removeCustomizationOption = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      customizationOptions: (prev.customizationOptions || []).filter((_, i) => i !== index),
    }));
  };

  // Certificate/Accessory Handlers
  const handleCertificateChange = (id: number, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      certificateIds: checked
        ? [...(prev.certificateIds || []), id]
        : (prev.certificateIds || []).filter((certId) => certId !== id),
    }));
  };

  const handleAccessoryChange = (id: number, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      accessoryIds: checked
        ? [...(prev.accessoryIds || []), id]
        : (prev.accessoryIds || []).filter((accId) => accId !== id),
    }));
  };

  // Filter functions
  const filteredCertificates = certificates.filter((cert) =>
    cert.name.toLowerCase().includes(certificateSearch.toLowerCase()),
  );

  const filteredAccessories = accessories.filter((acc) =>
    acc.name.toLowerCase().includes(accessorySearch.toLowerCase()),
  );

  return (
    <div className="space-y-8 p-6">
      {/* Specifications */}
      <Card>
        <CardHeader>
          <CardTitle>Product Specifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label>Key Features & Specifications</Label>
            <div className="mt-2 flex gap-2">
              <Input
                placeholder="Add specification (e.g., Machine washable, UV protection)"
                value={newSpecification}
                onChange={(e) => setNewSpecification(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSpecification();
                  }
                }}
              />
              <Button type="button" onClick={addSpecification} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.specifications && formData.specifications.length > 0 && (
              <div className="mt-3 space-y-2">
                {formData.specifications.map((spec, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                  >
                    <span className="text-sm">{spec}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSpecification(index)}
                      className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label>Technical Specifications</Label>
            <div className="mt-2 grid grid-cols-5 gap-2">
              <Input
                placeholder="Property"
                value={newTechSpecKey}
                onChange={(e) => setNewTechSpecKey(e.target.value)}
                className="col-span-2"
              />
              <Input
                placeholder="Value"
                value={newTechSpecValue}
                onChange={(e) => setNewTechSpecValue(e.target.value)}
                className="col-span-2"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTechnicalSpec();
                  }
                }}
              />
              <Button type="button" onClick={addTechnicalSpec} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.technicalSpecs && Object.keys(formData.technicalSpecs).length > 0 && (
              <div className="mt-3 space-y-2">
                {Object.entries(formData.technicalSpecs).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                  >
                    <div className="text-sm">
                      <span className="font-medium">{key}:</span> {value}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTechnicalSpec(key)}
                      className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Care Instructions & Tags */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Care Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Care Guidelines</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add care instruction"
                  value={newCareInstruction}
                  onChange={(e) => setNewCareInstruction(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCareInstruction();
                    }
                  }}
                />
                <Button type="button" onClick={addCareInstruction} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.careInstructions && formData.careInstructions.length > 0 && (
                <div className="mt-3 space-y-1">
                  {formData.careInstructions.map((instruction, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded bg-gray-50 p-2 text-sm"
                    >
                      <span>{instruction}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCareInstruction(index)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Product Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Search Tags</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <Button type="button" onClick={addTag} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.tags && formData.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      <span>{tag}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTag(index)}
                        className="h-4 w-4 p-0 hover:bg-red-100"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customization Options */}
      <Card>
        <CardHeader>
          <CardTitle>Customization Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Available Customizations</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add customization option"
                value={newCustomizationOption}
                onChange={(e) => setNewCustomizationOption(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomizationOption();
                  }
                }}
              />
              <Button type="button" onClick={addCustomizationOption} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.customizationOptions && formData.customizationOptions.length > 0 && (
              <div className="mt-3 space-y-2">
                {formData.customizationOptions.map((option, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                  >
                    <span className="text-sm">{option}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCustomizationOption(index)}
                      className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Certifications & Accessories */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Certifications
              <Badge variant="secondary">{(formData.certificateIds || []).length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                <Input
                  placeholder="Search certifications..."
                  value={certificateSearch}
                  onChange={(e) => setCertificateSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="max-h-48 space-y-2 overflow-y-auto rounded border p-3">
                {filteredCertificates.map((cert) => (
                  <div key={cert.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`cert-${cert.id}`}
                      checked={(formData.certificateIds || []).includes(cert.id)}
                      onCheckedChange={(checked) =>
                        handleCertificateChange(cert.id, Boolean(checked))
                      }
                    />
                    <Label htmlFor={`cert-${cert.id}`} className="flex-1 text-sm">
                      {cert.name}
                    </Label>
                  </div>
                ))}
                {filteredCertificates.length === 0 && (
                  <p className="py-4 text-center text-gray-500 text-sm">No certifications found</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Available Accessories
              <Badge variant="secondary">{(formData.accessoryIds || []).length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                <Input
                  placeholder="Search accessories..."
                  value={accessorySearch}
                  onChange={(e) => setAccessorySearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="max-h-48 space-y-2 overflow-y-auto rounded border p-3">
                {filteredAccessories.map((acc) => (
                  <div key={acc.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`acc-${acc.id}`}
                      checked={(formData.accessoryIds || []).includes(acc.id)}
                      onCheckedChange={(checked) => handleAccessoryChange(acc.id, Boolean(checked))}
                    />
                    <Label htmlFor={`acc-${acc.id}`} className="flex-1 text-sm">
                      {acc.name}
                    </Label>
                  </div>
                ))}
                {filteredAccessories.length === 0 && (
                  <p className="py-4 text-center text-gray-500 text-sm">No accessories found</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SEO & Meta Information */}
      <Card>
        <CardHeader>
          <CardTitle>SEO & Meta Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="metaTitle">Meta Title</Label>
            <Input
              id="metaTitle"
              value={formData.metaTitle}
              onChange={(e) => setFormData((prev) => ({ ...prev, metaTitle: e.target.value }))}
              placeholder="SEO title for search engines"
              maxLength={60}
            />
            <div className="mt-1 flex items-center justify-between">
              <div className="flex items-center gap-1 text-gray-500 text-xs">
                <Info className="h-3 w-3" />
                <span>Recommended: 50-60 characters</span>
              </div>
              <span className="text-gray-500 text-xs">{(formData.metaTitle || "").length}/60</span>
            </div>
          </div>

          <div>
            <Label htmlFor="metaDescription">Meta Description</Label>
            <Textarea
              id="metaDescription"
              value={formData.metaDescription}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  metaDescription: e.target.value,
                }))
              }
              placeholder="SEO description for search engines"
              maxLength={160}
              rows={3}
              className="resize-none"
            />
            <div className="mt-1 flex items-center justify-between">
              <div className="flex items-center gap-1 text-gray-500 text-xs">
                <Info className="h-3 w-3" />
                <span>Recommended: 150-160 characters</span>
              </div>
              <span className="text-gray-500 text-xs">
                {(formData.metaDescription || "").length}/160
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
