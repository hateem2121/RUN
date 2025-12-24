import { ChevronDown, ChevronRight, Package } from "lucide-react";
import { memo } from "react";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ProductFormFieldValue } from "../shared/types";

interface BasicInfoSectionProps {
	formData: {
		name: string;
		sku: string;
		description: string;
		shortDescription: string;
		slug: string;
		sortOrder: number;
		isActive: boolean;
		isFeatured: boolean;
	};
	formErrors: Record<string, string>;
	isOpen: boolean;
	onToggle: () => void;
	onInputChange: (field: string, value: ProductFormFieldValue) => void;
	generateSlug: () => void;
}

const BasicInfoSection = memo(function BasicInfoSection({
	formData,
	formErrors,
	isOpen,
	onToggle,
	onInputChange,
	generateSlug,
}: BasicInfoSectionProps) {
	return (
		<Collapsible open={isOpen} onOpenChange={onToggle}>
			<CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors">
				<div className="flex items-center gap-3">
					<Package className="h-5 w-5 text-blue-600" />
					<div className="text-left">
						<h3 className="font-semibold text-gray-900">Basic Information</h3>
						<p className="text-sm text-gray-600">
							Product name, description, and details
						</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					{isOpen ? (
						<ChevronDown className="h-4 w-4 text-gray-500" />
					) : (
						<ChevronRight className="h-4 w-4 text-gray-500" />
					)}
				</div>
			</CollapsibleTrigger>

			<CollapsibleContent className="mt-4 space-y-4 px-4 pb-4">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{/* Product Name */}
					<div>
						<Label htmlFor="name" className="text-sm font-medium text-gray-700">
							Product Name *
						</Label>
						<Input
							id="name"
							value={formData.name}
							onChange={(e) => onInputChange("name", e.target.value)}
							className={`mt-1 ${formErrors.name ? "border-red-500" : ""}`}
							placeholder="Enter product name"
						/>
						{formErrors.name && (
							<p className="text-red-600 text-sm mt-1">{formErrors.name}</p>
						)}
					</div>

					{/* SKU */}
					<div>
						<Label htmlFor="sku" className="text-sm font-medium text-gray-700">
							SKU *
						</Label>
						<Input
							id="sku"
							value={formData.sku}
							onChange={(e) => onInputChange("sku", e.target.value)}
							className={`mt-1 ${formErrors.sku ? "border-red-500" : ""}`}
							placeholder="Enter SKU"
						/>
						{formErrors.sku && (
							<p className="text-red-600 text-sm mt-1">{formErrors.sku}</p>
						)}
					</div>
				</div>

				{/* Description */}
				<div>
					<Label
						htmlFor="description"
						className="text-sm font-medium text-gray-700"
					>
						Description *
					</Label>
					<Textarea
						id="description"
						value={formData.description}
						onChange={(e) => onInputChange("description", e.target.value)}
						className={`mt-1 ${formErrors.description ? "border-red-500" : ""}`}
						placeholder="Enter detailed product description"
						rows={4}
					/>
					{formErrors.description && (
						<p className="text-red-600 text-sm mt-1">
							{formErrors.description}
						</p>
					)}
					<p className="text-sm text-gray-500 mt-1">
						{formData.description.length}/1000 characters
					</p>
				</div>

				{/* Short Description */}
				<div>
					<Label
						htmlFor="shortDescription"
						className="text-sm font-medium text-gray-700"
					>
						Short Description
					</Label>
					<Textarea
						id="shortDescription"
						value={formData.shortDescription}
						onChange={(e) => onInputChange("shortDescription", e.target.value)}
						className="mt-1"
						placeholder="Brief product summary for listings"
						rows={2}
					/>
					<p className="text-sm text-gray-500 mt-1">
						{formData.shortDescription.length}/200 characters
					</p>
				</div>

				{/* Slug and Sort Order */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<Label htmlFor="slug" className="text-sm font-medium text-gray-700">
							URL Slug
						</Label>
						<div className="flex gap-2 mt-1">
							<Input
								id="slug"
								value={formData.slug}
								onChange={(e) => onInputChange("slug", e.target.value)}
								placeholder="product-url-slug"
							/>
							<button
								type="button"
								onClick={generateSlug}
								className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
							>
								Generate
							</button>
						</div>
					</div>

					<div>
						<Label
							htmlFor="sortOrder"
							className="text-sm font-medium text-gray-700"
						>
							Sort Order
						</Label>
						<Input
							id="sortOrder"
							type="number"
							value={formData.sortOrder}
							onChange={(e) =>
								onInputChange("sortOrder", parseInt(e.target.value) || 0)
							}
							className="mt-1"
							placeholder="0"
						/>
					</div>
				</div>

				{/* Status Toggles */}
				<div className="flex items-center gap-6 pt-2">
					<label className="flex items-center gap-2">
						<input
							type="checkbox"
							checked={formData.isActive}
							onChange={(e) => onInputChange("isActive", e.target.checked)}
							className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
						/>
						<span className="text-sm font-medium text-gray-700">Active</span>
					</label>

					<label className="flex items-center gap-2">
						<input
							type="checkbox"
							checked={formData.isFeatured}
							onChange={(e) => onInputChange("isFeatured", e.target.checked)}
							className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
						/>
						<span className="text-sm font-medium text-gray-700">Featured</span>
					</label>
				</div>
			</CollapsibleContent>
		</Collapsible>
	);
});

// Default export for lazy loading compatibility
export default BasicInfoSection;
