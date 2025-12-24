/**
 * Expandable Product Sections with Visual Swatches
 * Replaces traditional tabs with progressive disclosure sections
 * Includes visual swatches for materials, colors, and variations
 */

import { AnimatePresence, motion } from "framer-motion";
import {
	CheckCircle,
	ChevronRight,
	Info,
	Layers,
	Package2,
	Palette,
	Shield,
} from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProductSectionProps {
	product: any;
	context: any;
	categoryColor?: string;
}

interface ExpandableSectionProps {
	title: string;
	icon: React.ReactNode;
	children: React.ReactNode;
	defaultOpen?: boolean;
	accent?: string;
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
					"p-4 cursor-pointer transition-all duration-200 border-l-4",
					`border-l-${accent}-500 hover:bg-${accent}-50/50`,
				)}
				onClick={() => setIsOpen(!isOpen)}
			>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div
							className={cn(
								"p-2 rounded-lg",
								`bg-${accent}-100 text-${accent}-700`,
							)}
						>
							{icon}
						</div>
						<h3 className="font-semibold text-lg text-gray-900">{title}</h3>
					</div>
					<motion.div
						animate={{ rotate: isOpen ? 90 : 0 }}
						transition={{ duration: 0.2 }}
					>
						<ChevronRight className="h-5 w-5 text-gray-500" />
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
						<CardContent className="p-4 pt-0 bg-gray-50/30">
							{children}
						</CardContent>
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
	color?: string;
	pattern?: string;
	isSelected?: boolean;
	onClick?: () => void;
}) {
	return (
		<div
			className={cn(
				"relative cursor-pointer transition-all duration-200 rounded-lg p-3 border-2",
				isSelected
					? "border-blue-500 bg-blue-50"
					: "border-gray-200 hover:border-gray-300",
				"group",
			)}
			onClick={onClick}
		>
			<div className="flex items-center gap-3">
				<div
					className="w-8 h-8 rounded-full border shadow-sm-xs shrink-0"
					style={{
						backgroundColor: color || "#f3f4f6",
						backgroundImage: pattern ? `url(${pattern})` : undefined,
						backgroundSize: "cover",
						backgroundPosition: "center",
					}}
				/>
				<div>
					<p className="font-medium text-sm text-gray-900">{name}</p>
					{isSelected && (
						<CheckCircle className="h-4 w-4 text-blue-500 absolute top-1 right-1" />
					)}
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
	isSelected?: boolean;
	onClick?: () => void;
}) {
	return (
		<div
			className={cn(
				"relative cursor-pointer transition-all duration-200 group",
				"p-1 rounded-lg border-2",
				isSelected
					? "border-blue-500"
					: "border-transparent hover:border-gray-300",
			)}
			onClick={onClick}
		>
			<div
				className="w-12 h-12 rounded-md shadow-sm-xs border border-gray-200"
				style={{ backgroundColor: color }}
			/>
			<p className="text-xs text-center mt-1 font-medium text-gray-700">
				{name}
			</p>
			{isSelected && (
				<CheckCircle className="h-4 w-4 text-blue-500 absolute -top-1 -right-1 bg-white rounded-full" />
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
						<p className="text-gray-700 leading-relaxed font-medium">
							{product.shortDescription}
						</p>
					)}
					{product.description && (
						<div className="prose max-w-none">
							<p className="text-gray-600 leading-relaxed">
								{product.description}
							</p>
						</div>
					)}

					{/* Key Features */}
					{product.specifications && product.specifications.length > 0 && (
						<div className="bg-white rounded-lg p-4 border">
							<h4 className="font-semibold mb-3 flex items-center gap-2">
								<Package2 className="h-5 w-5 text-gray-600" />
								Key Features
							</h4>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
								{product.specifications
									.slice(0, 6)
									.map((spec: string, index: number) => (
										<div key={index} className="flex items-start gap-2">
											<CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
											<span className="text-sm text-gray-700">{spec}</span>
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
						<h4 className="font-semibold mb-3 flex items-center gap-2">
							<Layers className="h-5 w-5 text-gray-600" />
							Available Materials
						</h4>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
							<div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
								<p className="font-medium text-blue-900">
									Selected Material: {selectedMaterial}
								</p>
								<p className="text-sm text-blue-700 mt-1">
									{
										availableMaterials.find((m) => m.name === selectedMaterial)
											?.composition
									}
								</p>
							</div>
						)}
					</div>

					{/* Color Swatches */}
					<div>
						<h4 className="font-semibold mb-3">Available Colors</h4>
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
							<div className="mt-4 p-3 bg-gray-100 rounded-lg">
								<p className="font-medium text-gray-900">
									Selected Color: {selectedColor}
								</p>
							</div>
						)}
					</div>

					{/* Fabric Details */}
					{context.fabric && (
						<div className="bg-white rounded-lg p-4 border">
							<h4 className="font-semibold mb-2">Primary Fabric Details</h4>
							<p className="text-gray-700">{context.fabric.description}</p>
							{product.selectedFiberComposition && (
								<p className="mt-2 text-sm text-gray-600">
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
					{product.technicalSpecs &&
						Object.keys(product.technicalSpecs).length > 0 && (
							<div className="bg-white rounded-lg p-4 border">
								<h4 className="font-semibold mb-3">Technical Details</h4>
								<dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
									{Object.entries(product.technicalSpecs).map(
										([key, value]) => (
											<div
												key={key}
												className="flex justify-between items-center py-1"
											>
												<dt className="text-gray-600 text-sm">{key}:</dt>
												<dd className="font-medium text-sm">{String(value)}</dd>
											</div>
										),
									)}
								</dl>
							</div>
						)}

					{/* Additional specifications */}
					{product.specifications && product.specifications.length > 6 && (
						<div className="bg-white rounded-lg p-4 border">
							<h4 className="font-semibold mb-3">Complete Specifications</h4>
							<div className="grid grid-cols-1 gap-2">
								{product.specifications.map((spec: string, index: number) => (
									<div key={index} className="flex items-start gap-2 py-1">
										<CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
										<span className="text-sm text-gray-700">{spec}</span>
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
					<div className="bg-white rounded-lg p-4 border">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{context.certificates.map((cert: any) => (
								<div
									key={cert.id}
									className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200"
								>
									<CheckCircle className="h-5 w-5 text-green-600" />
									<div>
										<p className="font-medium text-green-900">{cert.name}</p>
										{cert.description && (
											<p className="text-sm text-green-700">
												{cert.description}
											</p>
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
					<div className="bg-white rounded-lg p-4 border">
						<div className="space-y-2">
							{product.careInstructions.map(
								(instruction: string, index: number) => (
									<div key={index} className="flex items-start gap-2">
										<Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
										<span className="text-sm text-gray-700">{instruction}</span>
									</div>
								),
							)}
						</div>
					</div>
				</ExpandableSection>
			)}
		</div>
	);
}
