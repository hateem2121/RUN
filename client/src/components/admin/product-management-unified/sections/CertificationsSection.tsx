import { memo } from 'react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Award, CheckCircle, X } from 'lucide-react';
import { Certificate, Accessory, Product } from '@shared/schema';
import { ProductFormFieldValue } from '../shared/types';

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
  products
}: CertificationsSectionProps) {
  // Calculate completion status
  const recommendedFields = ['certificateIds'];
  const completedFields = recommendedFields.filter(field => {
    const value = formData[field as keyof typeof formData];
    return Array.isArray(value) && value.length > 0;
  });
  const completionRate = (completedFields.length / recommendedFields.length) * 100;

  const toggleCertificate = (certificateId: number) => {
    const current = formData.certificateIds || [];
    const updated = current.includes(certificateId)
      ? current.filter(id => id !== certificateId)
      : [...current, certificateId];
    onInputChange('certificateIds', updated);
  };

  const toggleAccessory = (accessoryId: number) => {
    const current = formData.accessoryIds || [];
    const updated = current.includes(accessoryId)
      ? current.filter(id => id !== accessoryId)
      : [...current, accessoryId];
    onInputChange('accessoryIds', updated);
  };

  const toggleRelatedProduct = (productId: number) => {
    const current = formData.relatedProductIds || [];
    const updated = current.includes(productId)
      ? current.filter(id => id !== productId)
      : [...current, productId];
    onInputChange('relatedProductIds', updated);
  };

  const getCertificatesByType = (type: string) => {
    return certificates.filter(cert => cert.type === type);
  };

  // Get unique types from actual certificates (filter out null/undefined)
  const certificationTypes = Array.from(new Set(certificates.map(cert => cert.type).filter((type): type is string => type !== null && type !== undefined))).sort();

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-3">
          <Award className="h-5 w-5 text-amber-600" />
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">Certifications & Relationships</h3>
            <p className="text-sm text-gray-600">
              {(formData.certificateIds || []).length} certificates, {(formData.accessoryIds || []).length} accessories
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {completionRate > 0 ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
          )}
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-500" />
          )}
        </div>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="mt-4 space-y-6 px-4 pb-4">
        {/* Certifications */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-4 block">Product Certifications</Label>
          
          {certificates.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <p>No certifications available</p>
              <p className="text-sm mt-2">Add certifications via the Certificates module</p>
            </div>
          ) : certificationTypes.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <p>Loading certifications...</p>
            </div>
          ) : (
            certificationTypes.map(type => {
              const typeCerts = getCertificatesByType(type);
              if (typeCerts.length === 0) return null;

              return (
                <div key={type} className="mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    {type ? (type.charAt(0).toUpperCase() + type.slice(1)) : 'Other'} Certifications
                  </h4>
                <div className="space-y-2">
                  {typeCerts.map((certificate) => {
                    const isSelected = (formData.certificateIds || []).includes(certificate.id);
                    return (
                      <label
                        key={certificate.id}
                        className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                          isSelected ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleCertificate(certificate.id)}
                          className="mt-1 text-amber-600 focus:ring-amber-500"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{certificate.name}</div>
                          {certificate.description && (
                            <div className="text-sm text-gray-600 mt-1">{certificate.description}</div>
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
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-medium text-amber-900 mb-3">Selected Certifications</h4>
            <div className="flex flex-wrap gap-2">
              {(formData.certificateIds || []).map(certId => {
                const cert = certificates.find(c => c.id === certId);
                return cert ? (
                  <Badge key={certId} variant="secondary" className="bg-amber-100 text-amber-800 flex items-center gap-1">
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
          <Label className="text-sm font-medium text-gray-700 mb-3 block">Compatible Accessories</Label>
          {accessories.length > 0 ? (
            <div className="space-y-2">
              {accessories.map((accessory) => {
                const isSelected = (formData.accessoryIds || []).includes(accessory.id);
                return (
                  <label
                    key={accessory.id}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleAccessory(accessory.id)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{accessory.name}</div>
                      {accessory.description && (
                        <div className="text-sm text-gray-600">{accessory.description}</div>
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
            <div className="text-center py-6 text-gray-500">
              <p>No accessories available</p>
              <p className="text-sm mt-2">Add accessories via the Accessories module to assign them to products</p>
            </div>
          )}
        </div>

        {/* Related Products */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-3 block">Related Products</Label>
          {products.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {products.map((relatedProduct) => {
                const isSelected = (formData.relatedProductIds || []).includes(relatedProduct.id);
                return (
                  <label
                    key={relatedProduct.id}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      isSelected ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleRelatedProduct(relatedProduct.id)}
                      className="text-green-600 focus:ring-green-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{relatedProduct.name}</div>
                      <div className="text-sm text-gray-600">SKU: {relatedProduct.sku}</div>
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
            <div className="text-center py-6 text-gray-500">
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