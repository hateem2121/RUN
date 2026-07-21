import { Filter, X } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import type { Accessory, Certificate, Fabric, SizeChart } from "@/schemas/product";

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
  onFiltersChange: (filters: ProductFiltersProps["selectedFilters"]) => void;
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
            <Filter className="mr-2 h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full overflow-y-auto sm:w-sheet-md md:w-sheet-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between">
              Product Filters
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                  <X className="mr-1 h-4 w-4" />
                  Clear All
                </Button>
              )}
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Fabrics */}
            {fabrics.length > 0 && (
              <div className="space-y-3">
                <Label className="font-semibold text-base">Fabrics</Label>
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
                        className="cursor-pointer font-normal text-sm"
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
                <Label className="font-semibold text-base">Certifications</Label>
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
                        className="cursor-pointer font-normal text-sm"
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
                <Label className="font-semibold text-base">Size Standards</Label>
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
                        className="cursor-pointer font-normal text-sm"
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
                <Label className="font-semibold text-base">Available Accessories</Label>
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
                        className="cursor-pointer font-normal text-sm"
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
                <Label className="font-semibold text-base">Product Tags</Label>
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
              <Label className="font-semibold text-base">Minimum Order Quantity</Label>
              <div className="px-2">
                <Slider
                  value={selectedFilters.moqRange}
                  onValueChange={handleMoqChange}
                  min={0}
                  max={10000}
                  step={100}
                  className="mb-2"
                />
                <div className="flex justify-between text-muted-foreground text-sm">
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
        <div className="-mx-1 overflow-x-auto px-1 pb-2">
          <div className="flex min-w-max flex-nowrap gap-2 sm:min-w-0 sm:flex-wrap">
            {selectedFilters.fabrics.map((fabricId) => {
              const fabric = fabrics.find((f) => f.id === fabricId);
              return fabric ? (
                <Badge
                  key={`fabric-${fabricId}`}
                  variant="secondary"
                  className="shrink-0 py-1 pr-1 pl-3"
                >
                  {fabric.name}
                  <button
                    type="button"
                    onClick={() => handleFabricToggle(fabricId)}
                    className="-my-1 -mr-1 ml-2 flex min-h-11 min-w-11 items-center justify-center hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:text-red-500"
                    aria-label={`Remove ${fabric.name} filter`}
                  >
                    <X className="h-4 w-4" />
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
                  className="shrink-0 py-1 pr-1 pl-3"
                >
                  {cert.name}
                  <button
                    type="button"
                    onClick={() => handleCertificateToggle(certId)}
                    className="-my-1 -mr-1 ml-2 flex min-h-11 min-w-11 items-center justify-center hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:text-red-500"
                    aria-label={`Remove ${cert.name} filter`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </Badge>
              ) : null;
            })}

            {selectedFilters.tags.map((tag) => (
              <Badge key={`tag-${tag}`} variant="secondary" className="shrink-0 py-1 pr-1 pl-3">
                {tag}
                <button
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  className="-my-1 -mr-1 ml-2 flex min-h-11 min-w-11 items-center justify-center hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:text-red-500"
                  aria-label={`Remove ${tag} filter`}
                >
                  <X className="h-4 w-4" />
                </button>
              </Badge>
            ))}

            {(selectedFilters.moqRange[0] > 0 || selectedFilters.moqRange[1] < 10000) && (
              <Badge variant="secondary" className="shrink-0 py-1 pr-1 pl-3">
                MOQ: {selectedFilters.moqRange[0]}-{selectedFilters.moqRange[1]}
                <button
                  type="button"
                  onClick={() => handleMoqChange([0, 10000])}
                  className="-my-1 -mr-1 ml-2 flex min-h-11 min-w-11 items-center justify-center hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:text-red-500"
                  aria-label="Remove MOQ filter"
                >
                  <X className="h-4 w-4" />
                </button>
              </Badge>
            )}
          </div>
        </div>
      )}
    </>
  );
}
