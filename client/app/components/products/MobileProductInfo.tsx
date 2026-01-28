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

export function MobileProductInfo({
  product,
  onRequestQuote,
  onRequestSample,
}: MobileProductInfoProps) {
  return (
    <div className="mt-6 space-y-6">
      {/* Key Features */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Key Features</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <Info className="mt-0.5 h-5 w-5 text-blue-600" />
              <span className="text-sm">Advanced moisture-wicking technology</span>
            </li>
            <li className="flex items-start gap-2">
              <Shield className="mt-0.5 h-5 w-5 text-blue-600" />
              <span className="text-sm">UV protection and antimicrobial treatment</span>
            </li>
            <li className="flex items-start gap-2">
              <Package className="mt-0.5 h-5 w-5 text-blue-600" />
              <span className="text-sm">Minimum order: {product.minimumOrderQuantity} units</span>
            </li>
            <li className="flex items-start gap-2">
              <Ruler className="mt-0.5 h-5 w-5 text-blue-600" />
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
              <h3 className="mb-2 font-semibold text-sm">Technical Specifications</h3>
              <ul className="space-y-1 text-muted-foreground text-xs">
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
              <h3 className="mb-2 font-semibold text-sm">Premium Materials</h3>
              <p className="mb-4 text-muted-foreground text-xs">
                Our performance fabric is engineered with recycled polyester and features:
              </p>
              <ul className="space-y-1 text-muted-foreground text-xs">
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
              <h3 className="mb-2 font-semibold text-sm">Customization Options</h3>
              <div className="space-y-3">
                {product.customizationOptions?.map((option: string, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-600" />
                    <span className="text-muted-foreground text-xs">{option}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* CTA Buttons */}
      <div className="fixed right-0 bottom-0 left-0 border-t bg-white p-4">
        <div className="flex gap-4">
          <Button size="lg" className="flex-1" onClick={onRequestQuote}>
            <ShoppingBag className="mr-2 h-5 w-5" />
            Request Quote
          </Button>
          {/* biome-ignore lint/suspicious/noExplicitAny: Product type definition issue */}
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
