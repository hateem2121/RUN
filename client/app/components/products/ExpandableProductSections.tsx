/**
 * Expandable Product Sections with Visual Swatches
 * Replaces traditional tabs with progressive disclosure sections
 * Includes visual swatches for materials, colors, and variations
 */

import type { Certificate } from "@shared/schemas/catalog";
import type { Fabric } from "@shared/schemas/materials";
import type { ProductDetail } from "@shared/schemas/products";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, ChevronRight, Info, Layers, Package2, Palette, Shield } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProductSectionProps {
  product: ProductDetail & { selectedFiberComposition?: string };
  context: {
    fabric?: Pick<Fabric, "description"> | null;
    certificates?: Pick<Certificate, "id" | "name" | "description">[] | null;
  };
  categoryColor?: string | undefined;
}

interface ExpandableSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean | undefined;
  accent?: string | undefined;
}

function ExpandableSection({
  title,
  icon,
  children,
  defaultOpen = false,
  accent = "blue",
}: ExpandableSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-md">
      <div
        className={cn(
          "cursor-pointer border-l-4 p-4 transition-all duration-200",
          `border-l-${accent}-500 hover:bg-${accent}-50/50`,
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("rounded-lg p-2", `bg-${accent}-100 text-${accent}-700`)}>
              {icon}
            </div>
            <h3 className="font-semibold text-foreground text-lg">{title}</h3>
          </div>
          <motion.div animate={{ rotate: isOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <CardContent className="bg-background/30 p-4 pt-0">{children}</CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

function MaterialSwatch({
  name,
  color,
  pattern,
  isSelected = false,
  onClick,
}: {
  name: string;
  color?: string | undefined;
  pattern?: string | undefined;
  isSelected?: boolean | undefined;
  onClick?: () => void;
}) {
  return (
    <div
      className={cn(
        "relative cursor-pointer rounded-lg border-2 p-3 transition-all duration-200",
        isSelected ? "border-blue-500 bg-blue-50" : "border-border hover:border-border/50",
        "group",
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div
          className="h-8 w-8 shrink-0 rounded-full border shadow-sm-xs"
          style={{
            backgroundColor: color || "#f3f4f6",
            backgroundImage: pattern ? `url(${pattern})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div>
          <p className="font-medium text-foreground text-sm">{name}</p>
          {isSelected && <CheckCircle className="absolute top-1 right-1 h-4 w-4 text-blue-500" />}
        </div>
      </div>
    </div>
  );
}

function ColorSwatch({
  color,
  name,
  isSelected = false,
  onClick,
}: {
  color: string;
  name: string;
  isSelected?: boolean | undefined;
  onClick?: () => void;
}) {
  return (
    <div
      className={cn(
        "group relative cursor-pointer transition-all duration-200",
        "rounded-lg border-2 p-1",
        isSelected ? "border-blue-500" : "border-transparent hover:border-border/50",
      )}
      onClick={onClick}
    >
      <div
        className="h-12 w-12 rounded-md border border-border shadow-sm-xs"
        style={{ backgroundColor: color }}
      />
      <p className="mt-1 text-center font-medium text-foreground/80 text-xs">{name}</p>
      {isSelected && (
        <CheckCircle className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-white text-blue-500" />
      )}
    </div>
  );
}

export function ExpandableProductSections({
  product,
  context,
  categoryColor = "blue",
}: ProductSectionProps) {
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  // Mock material and color data - in real app, this would come from product data
  const availableMaterials = [
    {
      name: "Cotton Blend",
      color: "#f8f9fa",
      composition: "80% Cotton, 20% Polyester",
    },
    {
      name: "Performance Mesh",
      color: "#e9ecef",
      composition: "100% Polyester with moisture-wicking",
    },
    {
      name: "Organic Cotton",
      color: "#f5f5dc",
      composition: "100% Organic Cotton",
    },
    {
      name: "Bamboo Fiber",
      color: "#f0f8ea",
      composition: "70% Bamboo, 30% Cotton",
    },
  ];

  const availableColors = [
    { name: "Navy", color: "#1a365d" },
    { name: "Charcoal", color: "#4a5568" },
    { name: "White", color: "#ffffff" },
    { name: "Forest", color: "#276749" },
    { name: "Burgundy", color: "#742a2a" },
    { name: "Steel", color: "#718096" },
  ];

  return (
    <div className="space-y-4">
      {/* Product Description */}
      <ExpandableSection
        title="Product Overview"
        icon={<Info className="h-5 w-5" />}
        defaultOpen={true}
        accent={categoryColor}
      >
        <div className="space-y-4">
          {product.shortDescription && (
            <p className="font-medium text-foreground/80 leading-relaxed">
              {product.shortDescription}
            </p>
          )}
          {product.description && (
            <div className="prose max-w-none">
              <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Key Features */}
          {product.specifications && product.specifications.length > 0 && (
            <div className="rounded-lg border bg-white p-4">
              <h4 className="mb-3 flex items-center gap-2 font-semibold">
                <Package2 className="h-5 w-5 text-muted-foreground" />
                Key Features
              </h4>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {product.specifications.slice(0, 6).map((spec: string, index: number) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                    <span className="text-foreground/80 text-sm">{spec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ExpandableSection>

      {/* Materials & Colors Section */}
      <ExpandableSection
        title="Materials & Colors"
        icon={<Palette className="h-5 w-5" />}
        accent={categoryColor}
      >
        <div className="space-y-6">
          {/* Material Swatches */}
          <div>
            <h4 className="mb-3 flex items-center gap-2 font-semibold">
              <Layers className="h-5 w-5 text-muted-foreground" />
              Available Materials
            </h4>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {availableMaterials.map((material, index) => (
                <MaterialSwatch
                  key={index}
                  name={material.name}
                  color={material.color}
                  isSelected={selectedMaterial === material.name}
                  onClick={() => setSelectedMaterial(material.name)}
                />
              ))}
            </div>

            {selectedMaterial && (
              <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p className="font-medium text-blue-900">Selected Material: {selectedMaterial}</p>
                <p className="mt-1 text-blue-700 text-sm">
                  {availableMaterials.find((m) => m.name === selectedMaterial)?.composition}
                </p>
              </div>
            )}
          </div>

          {/* Color Swatches */}
          <div>
            <h4 className="mb-3 font-semibold">Available Colors</h4>
            <div className="flex flex-wrap gap-3">
              {availableColors.map((colorOption, index) => (
                <ColorSwatch
                  key={index}
                  color={colorOption.color}
                  name={colorOption.name}
                  isSelected={selectedColor === colorOption.name}
                  onClick={() => setSelectedColor(colorOption.name)}
                />
              ))}
            </div>

            {selectedColor && (
              <div className="mt-4 rounded-lg bg-muted p-3">
                <p className="font-medium text-foreground">Selected Color: {selectedColor}</p>
              </div>
            )}
          </div>

          {/* Fabric Details */}
          {context.fabric && (
            <div className="rounded-lg border bg-white p-4">
              <h4 className="mb-2 font-semibold">Primary Fabric Details</h4>
              <p className="text-foreground/80">{context.fabric.description}</p>
              {product.selectedFiberComposition && (
                <p className="mt-2 text-muted-foreground text-sm">
                  Composition: {product.selectedFiberComposition}
                </p>
              )}
            </div>
          )}
        </div>
      </ExpandableSection>

      {/* Technical Specifications */}
      <ExpandableSection
        title="Technical Specifications"
        icon={<Package2 className="h-5 w-5" />}
        accent={categoryColor}
      >
        <div className="space-y-4">
          {product.technicalSpecs && Object.keys(product.technicalSpecs).length > 0 && (
            <div className="rounded-lg border bg-white p-4">
              <h4 className="mb-3 font-semibold">Technical Details</h4>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-2 md:grid-cols-2">
                {Object.entries(product.technicalSpecs).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between py-1">
                    <dt className="text-muted-foreground text-sm">{key}:</dt>
                    <dd className="font-medium text-sm">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* Additional specifications */}
          {product.specifications && product.specifications.length > 6 && (
            <div className="rounded-lg border bg-white p-4">
              <h4 className="mb-3 font-semibold">Complete Specifications</h4>
              <div className="grid grid-cols-1 gap-2">
                {product.specifications.map((spec: string, index: number) => (
                  <div key={index} className="flex items-start gap-2 py-1">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                    <span className="text-foreground/80 text-sm">{spec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ExpandableSection>

      {/* Certifications & Quality */}
      {context.certificates && context.certificates.length > 0 && (
        <ExpandableSection
          title="Certifications & Quality"
          icon={<Shield className="h-5 w-5" />}
          accent={categoryColor}
        >
          <div className="rounded-lg border bg-white p-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {context.certificates?.map((cert) => (
                <div
                  key={cert.id}
                  className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-3"
                >
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">{cert.name}</p>
                    {cert.description && (
                      <p className="text-green-700 text-sm">{cert.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ExpandableSection>
      )}

      {/* Care Instructions */}
      {product.careInstructions && product.careInstructions.length > 0 && (
        <ExpandableSection
          title="Care Instructions"
          icon={<Shield className="h-5 w-5" />}
          accent={categoryColor}
        >
          <div className="rounded-lg border bg-white p-4">
            <div className="space-y-2">
              {product.careInstructions.map((instruction: string, index: number) => (
                <div key={index} className="flex items-start gap-2">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                  <span className="text-foreground/80 text-sm">{instruction}</span>
                </div>
              ))}
            </div>
          </div>
        </ExpandableSection>
      )}
    </div>
  );
}
