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
							icon={<SpecsIcon className="w-5 h-5 text-gray-500" />}
							title="Product Specs"
						/>
						<ul className="space-y-2 text-gray-600 pl-1">
							{product.productSpecs.map((spec, i) => (
								<li key={i} className="flex items-start">
									<span className="mr-2 mt-1">-</span>
									{spec}
								</li>
							))}
						</ul>
					</div>
				);
			case "info":
				return (
					<div className="animate-fade-in">
						<SectionHeader
							icon={<InfoIcon className="w-5 h-5 text-gray-500" />}
							title="Key Info"
						/>
						<ul className="space-y-2 text-gray-600 pl-1">
							<li className="flex items-start">
								<span className="mr-2 mt-1">-</span>MOQ:{" "}
								{product.minOrderQty > 0
									? `${product.minOrderQty} units`
									: "N/A"}
							</li>
							<li className="flex items-start">
								<span className="mr-2 mt-1">-</span>Lead Time:{" "}
								{product.leadTime}
							</li>
							<li className="flex items-start">
								<span className="mr-2 mt-1">-</span>Fit: {product.customFit}
							</li>
							<li className="flex items-start">
								<span className="mr-2 mt-1">-</span>Weight:{" "}
								{product.customWeight}
							</li>
						</ul>
					</div>
				);
			case "certs":
				return (
					<div className="animate-fade-in">
						<SectionHeader
							icon={<ShieldCheckIcon className="w-5 h-5 text-gray-500" />}
							title="Certifications"
						/>
						<div className="flex flex-col space-y-3">
							{product.certifications.map((cert, i) => (
								<div key={i} className="flex items-center bg-gray-50 p-3">
									<ShieldCheckIcon className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
									<span className="text-gray-700 font-medium">{cert}</span>
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
			<div className="flex items-center border-b border-gray-200 mb-8">
				{tabConfig.map((tab) => (
					<ClippedElement
						as="button"
						key={tab.id}
						onClick={() => setActiveTab(tab.id as Tab)}
						className={`px-6 py-3 text-sm font-bold uppercase tracking-widest transition-colors duration-300 relative -mb-px ${
							activeTab === tab.id
								? "text-black"
								: "text-gray-400 hover:text-black"
						}`}
						clipAmount={10}
					>
						{tab.label}
						{activeTab === tab.id && (
							<span className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />
						)}
					</ClippedElement>
				))}
			</div>
			<div className="min-h-[200px]">{renderTabContent()}</div>
			<div className="mt-12">
				<h3 className="font-bold mb-4 uppercase tracking-wider">Tags</h3>
				<div className="flex flex-wrap gap-2">
					{product.productTags.map((tag) => (
						<span
							key={tag}
							className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-1 rounded-full"
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
