import type { Accessory, Certificate, Fabric, SizeChart } from "@shared/schema";
import { Filter, X } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";

interface ProductFiltersProps {
  fabrics: Fabric[];
  certificates: Certificate[];
  sizeCharts: SizeChart[];
  accessories: Accessory[];
  selectedFilters: {
    fabrics: number[];
    certificates: number[];
    sizeCharts: number[];
    accessories: number[];
    tags: string[];
    moqRange: [number, number];
  };
  onFiltersChange: (filters: any) => void;
  availableTags: string[];
}

export function ProductFilters({
  fabrics,
  certificates,
  sizeCharts,
  accessories,
  selectedFilters,
  onFiltersChange,
  availableTags,
}: ProductFiltersProps) {
  const [open, setOpen] = useState(false);

  const activeFilterCount =
    selectedFilters.fabrics.length +
    selectedFilters.certificates.length +
    selectedFilters.sizeCharts.length +
    selectedFilters.accessories.length +
    selectedFilters.tags.length +
    (selectedFilters.moqRange[0] > 0 || selectedFilters.moqRange[1] < 10000 ? 1 : 0);

  const handleFabricToggle = (fabricId: number) => {
    const newFabrics = selectedFilters.fabrics.includes(fabricId)
      ? selectedFilters.fabrics.filter((id) => id !== fabricId)
      : [...selectedFilters.fabrics, fabricId];
    onFiltersChange({ ...selectedFilters, fabrics: newFabrics });
  };

  const handleCertificateToggle = (certId: number) => {
    const newCerts = selectedFilters.certificates.includes(certId)
      ? selectedFilters.certificates.filter((id) => id !== certId)
      : [...selectedFilters.certificates, certId];
    onFiltersChange({ ...selectedFilters, certificates: newCerts });
  };

  const handleSizeChartToggle = (sizeId: number) => {
    const newSizes = selectedFilters.sizeCharts.includes(sizeId)
      ? selectedFilters.sizeCharts.filter((id) => id !== sizeId)
      : [...selectedFilters.sizeCharts, sizeId];
    onFiltersChange({ ...selectedFilters, sizeCharts: newSizes });
  };

  const handleAccessoryToggle = (accId: number) => {
    const newAccs = selectedFilters.accessories.includes(accId)
      ? selectedFilters.accessories.filter((id) => id !== accId)
      : [...selectedFilters.accessories, accId];
    onFiltersChange({ ...selectedFilters, accessories: newAccs });
  };

  const handleTagToggle = (tag: string) => {
    const newTags = selectedFilters.tags.includes(tag)
      ? selectedFilters.tags.filter((t) => t !== tag)
      : [...selectedFilters.tags, tag];
    onFiltersChange({ ...selectedFilters, tags: newTags });
  };

  const handleMoqChange = (value: number[]) => {
    onFiltersChange({
      ...selectedFilters,
      moqRange: [value[0], value[1]] as [number, number],
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      fabrics: [],
      certificates: [],
      sizeCharts: [],
      accessories: [],
      tags: [],
      moqRange: [0, 10000],
    });
  };

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="relative">
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full sm:w-[400px] md:w-[540px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between">
              Product Filters
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                  <X className="w-4 h-4 mr-1" />
                  Clear All
                </Button>
              )}
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Fabrics */}
            {fabrics.length > 0 && (
              <div className="space-y-3">
                <Label className="text-base font-semibold">Fabrics</Label>
                <div className="space-y-2">
                  {fabrics.map((fabric) => (
                    <div key={fabric.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`fabric-${fabric.id}`}
                        checked={selectedFilters.fabrics.includes(fabric.id)}
                        onCheckedChange={() => handleFabricToggle(fabric.id)}
                      />
                      <Label
                        htmlFor={`fabric-${fabric.id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {fabric?.name || "Unknown Fabric"}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certificates */}
            {certificates.length > 0 && (
              <div className="space-y-3">
                <Label className="text-base font-semibold">Certifications</Label>
                <div className="space-y-2">
                  {certificates.map((cert) => (
                    <div key={cert.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`cert-${cert.id}`}
                        checked={selectedFilters.certificates.includes(cert.id)}
                        onCheckedChange={() => handleCertificateToggle(cert.id)}
                      />
                      <Label
                        htmlFor={`cert-${cert.id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {cert?.name || "Unknown Certificate"}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Size Charts */}
            {sizeCharts.length > 0 && (
              <div className="space-y-3">
                <Label className="text-base font-semibold">Size Standards</Label>
                <div className="space-y-2">
                  {sizeCharts.map((size) => (
                    <div key={size.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`size-${size.id}`}
                        checked={selectedFilters.sizeCharts.includes(size.id)}
                        onCheckedChange={() => handleSizeChartToggle(size.id)}
                      />
                      <Label
                        htmlFor={`size-${size.id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {size?.name || "Unknown Size"}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Accessories */}
            {accessories.length > 0 && (
              <div className="space-y-3">
                <Label className="text-base font-semibold">Available Accessories</Label>
                <div className="space-y-2">
                  {accessories.map((acc) => (
                    <div key={acc.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`acc-${acc.id}`}
                        checked={selectedFilters.accessories.includes(acc.id)}
                        onCheckedChange={() => handleAccessoryToggle(acc.id)}
                      />
                      <Label
                        htmlFor={`acc-${acc.id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {acc?.name || "Unknown Accessory"}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {availableTags.length > 0 && (
              <div className="space-y-3">
                <Label className="text-base font-semibold">Product Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={selectedFilters.tags.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleTagToggle(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* MOQ Range */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Minimum Order Quantity</Label>
              <div className="px-2">
                <Slider
                  value={selectedFilters.moqRange}
                  onValueChange={handleMoqChange}
                  min={0}
                  max={10000}
                  step={100}
                  className="mb-2"
                />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{selectedFilters.moqRange[0]} units</span>
                  <span>{selectedFilters.moqRange[1]} units</span>
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Active Filter Pills */}
      {activeFilterCount > 0 && (
        <div className="overflow-x-auto pb-2 -mx-1 px-1">
          <div className="flex flex-nowrap sm:flex-wrap gap-2 min-w-max sm:min-w-0">
            {selectedFilters.fabrics.map((fabricId) => {
              const fabric = fabrics.find((f) => f.id === fabricId);
              return fabric ? (
                <Badge
                  key={`fabric-${fabricId}`}
                  variant="secondary"
                  className="shrink-0 pl-3 pr-1 py-1"
                >
                  {fabric.name}
                  <button
                    onClick={() => handleFabricToggle(fabricId)}
                    className="ml-2 hover:text-red-500 min-w-[44px] min-h-[44px] flex items-center justify-center -my-1 -mr-1"
                    aria-label={`Remove ${fabric.name} filter`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </Badge>
              ) : null;
            })}

            {selectedFilters.certificates.map((certId) => {
              const cert = certificates.find((c) => c.id === certId);
              return cert ? (
                <Badge
                  key={`cert-${certId}`}
                  variant="secondary"
                  className="shrink-0 pl-3 pr-1 py-1"
                >
                  {cert.name}
                  <button
                    onClick={() => handleCertificateToggle(certId)}
                    className="ml-2 hover:text-red-500 min-w-[44px] min-h-[44px] flex items-center justify-center -my-1 -mr-1"
                    aria-label={`Remove ${cert.name} filter`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </Badge>
              ) : null;
            })}

            {selectedFilters.tags.map((tag) => (
              <Badge key={`tag-${tag}`} variant="secondary" className="shrink-0 pl-3 pr-1 py-1">
                {tag}
                <button
                  onClick={() => handleTagToggle(tag)}
                  className="ml-2 hover:text-red-500 min-w-[44px] min-h-[44px] flex items-center justify-center -my-1 -mr-1"
                  aria-label={`Remove ${tag} filter`}
                >
                  <X className="w-4 h-4" />
                </button>
              </Badge>
            ))}

            {(selectedFilters.moqRange[0] > 0 || selectedFilters.moqRange[1] < 10000) && (
              <Badge variant="secondary" className="shrink-0 pl-3 pr-1 py-1">
                MOQ: {selectedFilters.moqRange[0]}-{selectedFilters.moqRange[1]}
                <button
                  onClick={() => handleMoqChange([0, 10000])}
                  className="ml-2 hover:text-red-500 min-w-[44px] min-h-[44px] flex items-center justify-center -my-1 -mr-1"
                  aria-label="Remove MOQ filter"
                >
                  <X className="w-4 h-4" />
                </button>
              </Badge>
            )}
          </div>
        </div>
      )}
    </>
  );
}
