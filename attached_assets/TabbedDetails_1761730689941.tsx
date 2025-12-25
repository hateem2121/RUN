import type React from "react";
import { useState } from "react";
import type { Product } from "../../types";
import ClippedElement from "../ClippedElement";
import { InfoIcon, ShieldCheckIcon, SpecsIcon } from "../Icons";
import SectionHeader from "./SectionHeader";

type Tab = "specs" | "info" | "certs";

const TabbedDetails: React.FC<{ product: Product }> = ({ product }) => {
  const [activeTab, setActiveTab] = useState<Tab>("specs");

  const renderTabContent = () => {
    switch (activeTab) {
      case "specs":
        return (
          <div className="animate-fade-in">
            <SectionHeader
              icon={<SpecsIcon className="h-5 w-5 text-gray-500" />}
              title="Product Specs"
            />
            <ul className="space-y-2 pl-1 text-gray-600">
              {product.productSpecs.map((spec, i) => (
                <li key={i} className="flex items-start">
                  <span className="mt-1 mr-2">-</span>
                  {spec}
                </li>
              ))}
            </ul>
          </div>
        );
      case "info":
        return (
          <div className="animate-fade-in">
            <SectionHeader icon={<InfoIcon className="h-5 w-5 text-gray-500" />} title="Key Info" />
            <ul className="space-y-2 pl-1 text-gray-600">
              <li className="flex items-start">
                <span className="mt-1 mr-2">-</span>MOQ:{" "}
                {product.minOrderQty > 0 ? `${product.minOrderQty} units` : "N/A"}
              </li>
              <li className="flex items-start">
                <span className="mt-1 mr-2">-</span>Lead Time: {product.leadTime}
              </li>
              <li className="flex items-start">
                <span className="mt-1 mr-2">-</span>Fit: {product.customFit}
              </li>
              <li className="flex items-start">
                <span className="mt-1 mr-2">-</span>Weight: {product.customWeight}
              </li>
            </ul>
          </div>
        );
      case "certs":
        return (
          <div className="animate-fade-in">
            <SectionHeader
              icon={<ShieldCheckIcon className="h-5 w-5 text-gray-500" />}
              title="Certifications"
            />
            <div className="flex flex-col space-y-3">
              {product.certifications.map((cert, i) => (
                <div key={i} className="flex items-center bg-gray-50 p-3">
                  <ShieldCheckIcon className="mr-3 h-5 w-5 flex-shrink-0 text-green-600" />
                  <span className="font-medium text-gray-700">{cert}</span>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const tabConfig = [
    { id: "specs", label: "Product Specs" },
    { id: "info", label: "Key Info" },
    { id: "certs", label: "Certifications" },
  ];

  return (
    <div>
      <div className="mb-8 flex items-center border-gray-200 border-b">
        {tabConfig.map((tab) => (
          <ClippedElement
            as="button"
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`relative -mb-px px-6 py-3 font-bold text-sm uppercase tracking-widest transition-colors duration-300 ${
              activeTab === tab.id ? "text-black" : "text-gray-400 hover:text-black"
            }`}
            clipAmount={10}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute right-0 bottom-0 left-0 h-0.5 bg-black" />
            )}
          </ClippedElement>
        ))}
      </div>
      <div className="min-h-[200px]">{renderTabContent()}</div>
      <div className="mt-12">
        <h3 className="mb-4 font-bold uppercase tracking-wider">Tags</h3>
        <div className="flex flex-wrap gap-2">
          {product.productTags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-800 text-xs"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TabbedDetails;
