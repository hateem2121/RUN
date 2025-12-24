import type { Product } from "@shared/schema";
import { Info, Package, Ruler, Shield, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MobileProductInfoProps {
  product: Product;
  onRequestQuote: () => void;
  onRequestSample: () => void;
}

export function MobileProductInfo({ product, onRequestQuote, onRequestSample }: MobileProductInfoProps) {
  return (
    <div className="space-y-6 mt-6">
      {/* Key Features */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Key Features</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <span className="text-sm">Advanced moisture-wicking technology</span>
            </li>
            <li className="flex items-start gap-2">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <span className="text-sm">UV protection and antimicrobial treatment</span>
            </li>
            <li className="flex items-start gap-2">
              <Package className="w-5 h-5 text-blue-600 mt-0.5" />
              <span className="text-sm">Minimum order: {product.minimumOrderQuantity} units</span>
            </li>
            <li className="flex items-start gap-2">
              <Ruler className="w-5 h-5 text-blue-600 mt-0.5" />
              <span className="text-sm">Available in sizes XS-3XL</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Product Details Tabs */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="customization">Custom</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2 text-sm">Technical Specifications</h3>
              <ul className="space-y-1 text-xs text-gray-600">
                <li>• Weight: 180g (size M)</li>
                <li>• Fabric: 90% Polyester, 10% Elastane</li>
                <li>• Care: Machine wash cold, tumble dry low</li>
                <li>• Origin: Made in sustainable facilities</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materials" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2 text-sm">Premium Materials</h3>
              <p className="text-xs text-gray-600 mb-4">
                Our performance fabric is engineered with recycled polyester and features:
              </p>
              <ul className="space-y-1 text-xs text-gray-600">
                <li>• 4-way stretch for unrestricted movement</li>
                <li>• Quick-dry technology</li>
                <li>• Breathable mesh panels</li>
                <li>• Reflective elements for visibility</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customization" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2 text-sm">Customization Options</h3>
              <div className="space-y-3">
                {product.customizationOptions?.map((option: string, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full" />
                    <span className="text-xs text-gray-600">{option}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* CTA Buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
        <div className="flex gap-4">
          <Button size="lg" className="flex-1" onClick={onRequestQuote}>
            <ShoppingBag className="w-5 h-5 mr-2" />
            Request Quote
          </Button>
          {(product as any).sampleAvailable && (
            <Button size="lg" variant="outline" className="flex-1" onClick={onRequestSample}>
              Request Sample
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}