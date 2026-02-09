import type { Accessory, Certificate, Product } from "@shared/schema";
import { Award, CheckCircle, ChevronDown, ChevronRight, X } from "lucide-react";
import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import type { ProductFormFieldValue } from "../shared/types";

interface CertificationsSectionProps {
  formData: {
    certificateIds: number[];
    accessoryIds: number[];
    relatedProductIds: number[];
  };
  formErrors: Record<string, string>;
  isOpen: boolean;
  onToggle: () => void;
  onInputChange: (field: string, value: ProductFormFieldValue) => void;
  certificates: Certificate[];
  accessories: Accessory[];
  products: Product[];
}

const CertificationsSection = memo(function CertificationsSection({
  formData,
  isOpen,
  onToggle,
  onInputChange,
  certificates,
  accessories,
  products,
}: CertificationsSectionProps) {
  // Calculate completion status
  const recommendedFields = ["certificateIds"];
  const completedFields = recommendedFields.filter((field) => {
    const value = formData[field as keyof typeof formData];
    return Array.isArray(value) && value.length > 0;
  });
  const completionRate = (completedFields.length / recommendedFields.length) * 100;

  const toggleCertificate = (certificateId: number) => {
    const current = formData.certificateIds || [];
    const updated = current.includes(certificateId)
      ? current.filter((id) => id !== certificateId)
      : [...current, certificateId];
    onInputChange("certificateIds", updated);
  };

  const toggleAccessory = (accessoryId: number) => {
    const current = formData.accessoryIds || [];
    const updated = current.includes(accessoryId)
      ? current.filter((id) => id !== accessoryId)
      : [...current, accessoryId];
    onInputChange("accessoryIds", updated);
  };

  const toggleRelatedProduct = (productId: number) => {
    const current = formData.relatedProductIds || [];
    const updated = current.includes(productId)
      ? current.filter((id) => id !== productId)
      : [...current, productId];
    onInputChange("relatedProductIds", updated);
  };

  const getCertificatesByType = (type: string) => {
    return certificates.filter((cert) => cert.type === type);
  };

  // Get unique types from actual certificates (filter out null/undefined)
  const certificationTypes = Array.from(
    new Set(
      certificates
        .map((cert) => cert.type)
        .filter((type): type is string => type !== null && type !== undefined),
    ),
  ).sort();

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-border bg-white p-4 transition-colors hover:bg-background">
        <div className="flex items-center gap-3">
          <Award className="h-5 w-5 text-amber-600" />
          <div className="text-left">
            <h3 className="font-semibold text-foreground">Certifications & Relationships</h3>
            <p className="text-muted-foreground text-sm">
              {(formData.certificateIds || []).length} certificates,{" "}
              {(formData.accessoryIds || []).length} accessories
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {completionRate > 0 ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <div className="h-5 w-5 rounded-full border-2 border-border/50" />
          )}
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-4 space-y-6 px-4 pb-4">
        {/* Certifications */}
        <div>
          <Label className="mb-4 block font-medium text-foreground/80 text-sm">
            Product Certifications
          </Label>

          {certificates.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground">
              <p>No certifications available</p>
              <p className="mt-2 text-sm">Add certifications via the Certificates module</p>
            </div>
          ) : certificationTypes.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground">
              <p>Loading certifications...</p>
            </div>
          ) : (
            certificationTypes.map((type) => {
              const typeCerts = getCertificatesByType(type);
              if (typeCerts.length === 0) {
                return null;
              }

              return (
                <div key={type} className="mb-6">
                  <h4 className="mb-3 flex items-center gap-2 font-medium text-foreground text-sm">
                    <Award className="h-4 w-4" />
                    {type ? type.charAt(0).toUpperCase() + type.slice(1) : "Other"} Certifications
                  </h4>
                  <div className="space-y-2">
                    {typeCerts.map((certificate) => {
                      const isSelected = (formData.certificateIds || []).includes(certificate.id);
                      return (
                        <label
                          key={certificate.id}
                          className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                            isSelected
                              ? "border-amber-500 bg-amber-50"
                              : "border-border hover:bg-background"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleCertificate(certificate.id)}
                            className="mt-1 text-amber-600 focus:ring-amber-500"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-foreground">{certificate.name}</div>
                            {certificate.description && (
                              <div className="mt-1 text-muted-foreground text-sm">
                                {certificate.description}
                              </div>
                            )}
                          </div>
                          {isSelected && (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                              Selected
                            </Badge>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Certificates Summary */}
        {(formData.certificateIds || []).length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <h4 className="mb-3 font-medium text-amber-900">Selected Certifications</h4>
            <div className="flex flex-wrap gap-2">
              {(formData.certificateIds || []).map((certId) => {
                const cert = certificates.find((c) => c.id === certId);
                return cert ? (
                  <Badge
                    key={certId}
                    variant="secondary"
                    className="flex items-center gap-1 bg-amber-100 text-amber-800"
                  >
                    {cert.name}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-red-600"
                      onClick={() => toggleCertificate(certId)}
                    />
                  </Badge>
                ) : null;
              })}
            </div>
          </div>
        )}

        {/* Accessories */}
        <div>
          <Label className="mb-3 block font-medium text-foreground/80 text-sm">
            Compatible Accessories
          </Label>
          {accessories.length > 0 ? (
            <div className="space-y-2">
              {accessories.map((accessory) => {
                const isSelected = (formData.accessoryIds || []).includes(accessory.id);
                return (
                  <label
                    key={accessory.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                      isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-border hover:bg-background"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleAccessory(accessory.id)}
                      className="text-blue-600 focus:ring-ring"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-foreground">{accessory.name}</div>
                      {accessory.description && (
                        <div className="text-muted-foreground text-sm">{accessory.description}</div>
                      )}
                    </div>
                    {isSelected && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        Selected
                      </Badge>
                    )}
                  </label>
                );
              })}
            </div>
          ) : (
            <div className="py-6 text-center text-muted-foreground">
              <p>No accessories available</p>
              <p className="mt-2 text-sm">
                Add accessories via the Accessories module to assign them to products
              </p>
            </div>
          )}
        </div>

        {/* Related Products */}
        <div>
          <Label className="mb-3 block font-medium text-foreground/80 text-sm">
            Related Products
          </Label>
          {products.length > 0 ? (
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {products.map((relatedProduct) => {
                const isSelected = (formData.relatedProductIds || []).includes(relatedProduct.id);
                return (
                  <label
                    key={relatedProduct.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                      isSelected
                        ? "border-green-500 bg-green-50"
                        : "border-border hover:bg-background"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleRelatedProduct(relatedProduct.id)}
                      className="text-green-600 focus:ring-green-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-foreground">{relatedProduct.name}</div>
                      <div className="text-muted-foreground text-sm">SKU: {relatedProduct.sku}</div>
                    </div>
                    {isSelected && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Related
                      </Badge>
                    )}
                  </label>
                );
              })}
            </div>
          ) : (
            <div className="py-6 text-center text-muted-foreground">
              <p>No other products available</p>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
});

// Default export for lazy loading compatibility
export default CertificationsSection;
