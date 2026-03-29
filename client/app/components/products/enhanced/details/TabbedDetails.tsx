import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { FileText, Heart, Info, Package, Shield } from "lucide-react";
import { useRef, useState } from "react";
import { ClippedElement } from "@/components/ui/ClippedElement";
import type { TabbedDetailsProps } from "../types";

type Tab = "specs" | "tech" | "care" | "info" | "certs";

export const TabbedDetails: React.FC<TabbedDetailsProps> = ({ product, certificates }) => {
  const [activeTab, setActiveTab] = useState<Tab>("specs");
  const contentRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (contentRef.current) {
      gsap.from(contentRef.current, { opacity: 0, y: 10, duration: 0.25 });
    }
  }, [activeTab]);

  const renderTabContent = () => {
    switch (activeTab) {
      case "specs":
        return (
          <div className="animate-fade-in">
            <div className="mb-4 flex items-center space-x-3">
              <Package className="text-muted-foreground h-5 w-5" />
              <h3 className="font-bold tracking-wider uppercase">Product Specs</h3>
            </div>
            <ul className="text-muted-foreground space-y-2 pl-1 text-sm">
              {product.specifications && product.specifications.length > 0 ? (
                product.specifications.map((spec, i) => (
                  <li key={i} className="flex items-start" data-testid={`spec-item-${i}`}>
                    <span className="mt-1 mr-2">-</span>
                    <span className="flex-1">{spec}</span>
                  </li>
                ))
              ) : (
                <li className="py-6 text-center">
                  <p className="text-muted-foreground/70 text-sm italic">
                    Product specifications are not currently available for this item.
                  </p>
                </li>
              )}
            </ul>
          </div>
        );
      case "tech":
        return (
          <div className="animate-fade-in">
            <div className="mb-4 flex items-center space-x-3">
              <FileText className="text-muted-foreground h-5 w-5" />
              <h3 className="font-bold tracking-wider uppercase">Technical Specifications</h3>
            </div>
            {product.technicalSpecs && Object.keys(product.technicalSpecs).length > 0 ? (
              <div className="space-y-3" data-testid="tech-specs-list">
                {Object.entries(product.technicalSpecs).map(([key, value], i) => (
                  <div key={i} className="flex items-start" data-testid={`tech-spec-${i}`}>
                    <div className="flex-1">
                      <div className="text-muted-foreground mb-1 text-xs tracking-wider uppercase">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </div>
                      <div className="text-foreground/80 text-sm font-medium">
                        {typeof value === "object" ? JSON.stringify(value) : String(value)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center">
                <p className="text-muted-foreground/70 text-sm italic">
                  Technical specifications are not currently available for this item.
                </p>
              </div>
            )}
          </div>
        );
      case "care":
        return (
          <div className="animate-fade-in">
            <div className="mb-4 flex items-center space-x-3">
              <Heart className="text-muted-foreground h-5 w-5" />
              <h3 className="font-bold tracking-wider uppercase">Care Instructions</h3>
            </div>
            <ul
              className="text-muted-foreground space-y-2 pl-1 text-sm"
              data-testid="care-instructions-list"
            >
              {product.careInstructions && product.careInstructions.length > 0 ? (
                product.careInstructions.map((instruction, i) => (
                  <li key={i} className="flex items-start" data-testid={`care-instruction-${i}`}>
                    <span className="mt-1 mr-2">•</span>
                    <span className="flex-1">{instruction}</span>
                  </li>
                ))
              ) : (
                <li className="list-none py-6 text-center">
                  <p className="text-muted-foreground/70 text-sm italic">
                    Care instructions are not currently available for this item.
                  </p>
                </li>
              )}
            </ul>
          </div>
        );
      case "info":
        return (
          <div className="animate-fade-in">
            <div className="mb-4 flex items-center space-x-3">
              <span className="flex items-center space-x-3">
                <Info className="text-muted-foreground h-5 w-5" />
                <h3 className="font-bold tracking-wider uppercase">Key Info</h3>
              </span>
            </div>
            <ul className="text-muted-foreground space-y-2 pl-1 text-sm">
              <li className="flex items-start">
                <span className="mt-1 mr-2">-</span>
                <span className="flex-1">
                  <strong>MOQ:</strong>{" "}
                  {product.minimumOrderQuantity && product.minimumOrderQuantity > 0
                    ? `${product.minimumOrderQuantity} units`
                    : "Contact us for details"}
                </span>
              </li>
              <li className="flex items-start">
                <span className="mt-1 mr-2">-</span>
                <span className="flex-1">
                  <strong>Lead Time:</strong> {product.leadTime || "Contact us for details"}
                </span>
              </li>
              {product.customFit && (
                <li className="flex items-start">
                  <span className="mt-1 mr-2">-</span>
                  <span className="flex-1">
                    <strong>Fit:</strong> {product.customFit}
                  </span>
                </li>
              )}
              {product.customWeight && (
                <li className="flex items-start">
                  <span className="mt-1 mr-2">-</span>
                  <span className="flex-1">
                    <strong>Weight:</strong> {product.customWeight}
                  </span>
                </li>
              )}
            </ul>
          </div>
        );
      case "certs":
        return (
          <div className="animate-fade-in">
            <div className="mb-4 flex items-center space-x-3">
              <Shield className="text-muted-foreground h-5 w-5" />
              <h3 className="font-bold tracking-wider uppercase">Certifications</h3>
            </div>
            <div className="flex flex-col space-y-3">
              {certificates && certificates.length > 0 ? (
                certificates.map((cert, i) => (
                  <div key={i} className="bg-background flex items-center rounded p-3">
                    <Shield className="mr-3 h-5 w-5 shrink-0 text-green-600" />
                    <span className="text-foreground/80 text-sm font-medium">{cert.name}</span>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center">
                  <p className="text-muted-foreground/70 text-sm italic">
                    Certifications information is not currently available for this item.
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const tabConfig = [
    { id: "specs", label: "Product Specs" },
    { id: "tech", label: "Technical Specs" },
    { id: "care", label: "Care Instructions" },
    { id: "info", label: "Key Info" },
    { id: "certs", label: "Certifications" },
  ];

  return (
    <div>
      <div className="spacing-subsection border-border relative border-b">
        <div className="scrollbar-hide tabs-scroll-mask flex snap-x snap-mandatory items-center space-x-2 overflow-x-auto pb-px sm:space-x-3 md:space-x-4">
          {tabConfig.map((tab) => (
            <ClippedElement
              key={tab.id}
              as="button"
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`min-h-tab tracking-premium md:tracking-premium-lg relative -mb-px px-4 py-3 text-sm font-bold whitespace-nowrap uppercase transition-all duration-300 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:outline-hidden sm:px-6 ${
                activeTab === tab.id
                  ? "text-black"
                  : "text-muted-foreground/70 hover:scale-105 hover:text-black"
              }`}
              clipAmount={10}
              data-testid={`button-tab-${tab.id}`}
            >
              <span className="max-w-32 truncate sm:max-w-none">{tab.label}</span>
              {activeTab === tab.id && (
                <span className="absolute right-0 bottom-0 left-0 h-0.5 rounded-full bg-black sm:h-0.75 md:h-1" />
              )}
            </ClippedElement>
          ))}
        </div>
      </div>
      <div className="min-h-[200px]">
        <div ref={contentRef}>{renderTabContent()}</div>
      </div>
      {product.tags && product.tags.length > 0 && (
        <div className="mt-12">
          <h3 className="mb-4 font-bold tracking-wider uppercase">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {product.tags.map((tag: string) => (
              <span
                key={tag}
                className="bg-muted text-foreground rounded-full px-2.5 py-1 text-xs font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
