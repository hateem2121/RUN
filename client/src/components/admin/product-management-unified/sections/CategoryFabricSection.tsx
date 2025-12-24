import type { Category, Fabric, Fiber, SizeChart } from "@shared/schema";
import {
	AlertCircle,
	CheckCircle,
	ChevronDown,
	ChevronRight,
	Tag,
} from "lucide-react";
import { memo } from "react";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type {
	FabricComposition,
	FabricWithCompositions,
	FiberCompositionItem,
	ProductFormFieldValue,
} from "../shared/types";

interface CategoryFabricSectionProps {
	formData: {
		categoryId: number | null;
		fabricId: number | null;
		sizeChartId: number | null;
		selectedFiberComposition: string | null;
	};
	formErrors: Record<string, string>;
	isOpen: boolean;
	onToggle: () => void;
	onInputChange: (field: string, value: ProductFormFieldValue) => void;
	categories: Category[];
	fabrics: Fabric[];
	sizeCharts: SizeChart[];
	fibers?: Fiber[];
}

const CategoryFabricSection = memo(function CategoryFabricSection({
	formData,
	formErrors,
	isOpen,
	onToggle,
	onInputChange,
	categories,
	fabrics,
	sizeCharts,
	fibers = [],
}: CategoryFabricSectionProps) {
	// Calculate completion status
	const recommendedFields = ["categoryId", "fabricId"];
	const completedFields = recommendedFields.filter((field) => {
		const value = formData[field as keyof typeof formData];
		return value !== null && value !== undefined;
	});
	const completionRate =
		(completedFields.length / recommendedFields.length) * 100;

	// Get selected fabric for fiber composition display
	const selectedFabric = formData.fabricId
		? (fabrics.find((f) => f.id === formData.fabricId) as
				| FabricWithCompositions
				| undefined)
		: null;

	return (
		<Collapsible open={isOpen} onOpenChange={onToggle}>
			<CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors">
				<div className="flex items-center gap-3">
					<Tag className="h-5 w-5 text-purple-600" />
					<div className="text-left">
						<h3 className="font-semibold text-gray-900">Category & Fabric</h3>
						<p className="text-sm text-gray-600">
							{completedFields.length} of {recommendedFields.length} recommended
							fields completed
						</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					{completionRate === 100 ? (
						<CheckCircle className="h-5 w-5 text-green-600" />
					) : completionRate > 0 ? (
						<AlertCircle className="h-5 w-5 text-amber-600" />
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

			<CollapsibleContent className="mt-4 space-y-4 px-4 pb-4">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{/* Category Selection */}
					<div>
						<Label
							htmlFor="categoryId"
							className="text-sm font-medium text-gray-700"
						>
							Category
						</Label>
						<Select
							value={formData.categoryId?.toString() || ""}
							onValueChange={(value) =>
								onInputChange("categoryId", value ? parseInt(value) : null)
							}
						>
							<SelectTrigger
								className={`mt-1 ${formErrors.categoryId ? "border-red-500" : ""}`}
							>
								<SelectValue placeholder="Select category" />
							</SelectTrigger>
							<SelectContent className="z-modal-nested pointer-events-auto">
								{categories.map((category) => (
									<SelectItem key={category.id} value={category.id.toString()}>
										{category.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{formErrors.categoryId && (
							<p className="text-red-600 text-sm mt-1">
								{formErrors.categoryId}
							</p>
						)}
					</div>

					{/* Fabric Selection */}
					<div>
						<Label
							htmlFor="fabricId"
							className="text-sm font-medium text-gray-700"
						>
							Fabric
						</Label>
						<Select
							value={formData.fabricId?.toString() || ""}
							onValueChange={(value) =>
								onInputChange("fabricId", value ? parseInt(value) : null)
							}
						>
							<SelectTrigger
								className={`mt-1 ${formErrors.fabricId ? "border-red-500" : ""}`}
							>
								<SelectValue placeholder="Select fabric" />
							</SelectTrigger>
							<SelectContent className="z-modal-nested pointer-events-auto">
								{fabrics.map((fabric) => (
									<SelectItem key={fabric.id} value={fabric.id.toString()}>
										{fabric.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{formErrors.fabricId && (
							<p className="text-red-600 text-sm mt-1">{formErrors.fabricId}</p>
						)}
					</div>
				</div>

				{/* Size Chart Selection */}
				<div>
					<Label
						htmlFor="sizeChartId"
						className="text-sm font-medium text-gray-700"
					>
						Size Chart
					</Label>
					<Select
						value={formData.sizeChartId?.toString() || ""}
						onValueChange={(value) =>
							onInputChange("sizeChartId", value ? parseInt(value) : null)
						}
					>
						<SelectTrigger className="mt-1">
							<SelectValue placeholder="Select size chart (optional)" />
						</SelectTrigger>
						<SelectContent className="z-modal-critical">
							{sizeCharts.length === 0 ? (
								<SelectItem value="no-charts" disabled>
									No size charts available
								</SelectItem>
							) : (
								sizeCharts.map((sizeChart) => (
									<SelectItem
										key={sizeChart.id}
										value={sizeChart.id.toString()}
									>
										{sizeChart.name}
									</SelectItem>
								))
							)}
						</SelectContent>
					</Select>
					{sizeCharts.length === 0 && (
						<p className="text-xs text-gray-500 mt-1">
							Add size charts via the Size Charts module to assign them to
							products
						</p>
					)}
				</div>

				{/* Fiber Composition Display */}
				{selectedFabric &&
					selectedFabric.compositions &&
					selectedFabric.compositions.length > 0 && (
						<div className="bg-gray-50 p-4 rounded-lg">
							<h4 className="font-medium text-gray-900 mb-3">
								Available Fiber Compositions
							</h4>
							<div className="space-y-2">
								{selectedFabric.compositions.map(
									(composition: FabricComposition, index: number) => (
										<label
											key={index}
											className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-white transition-colors cursor-pointer"
										>
											<input
												type="radio"
												name="fiberComposition"
												value={composition.name}
												checked={
													formData.selectedFiberComposition === composition.name
												}
												onChange={() =>
													onInputChange(
														"selectedFiberComposition",
														composition.name,
													)
												}
												className="text-purple-600 focus:ring-purple-500"
											/>
											<div className="flex-1">
												<div className="font-medium text-gray-900">
													{composition.name}
												</div>
												<div className="text-sm text-gray-600">
													{composition.fibers
														?.map((fiber: FiberCompositionItem) => {
															const fiberData = fibers.find(
																(f) => f.id === fiber.fiberId,
															);
															const fiberName =
																fiberData?.name || `Fiber ${fiber.fiberId}`;
															return `${fiber.percentage}% ${fiberName}`;
														})
														.join(", ")}
												</div>
											</div>
										</label>
									),
								)}
							</div>

							{/* Selected Composition Details */}
							{formData.selectedFiberComposition &&
								(() => {
									const selectedComp = selectedFabric.compositions?.find(
										(c: FabricComposition) =>
											c.name === formData.selectedFiberComposition,
									);
									return selectedComp ? (
										<div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
											<div className="text-sm font-medium text-purple-900 mb-1">
												Selected: {formData.selectedFiberComposition}
											</div>
											<div className="text-sm text-purple-700">
												Properties: Standard performance characteristics
											</div>
										</div>
									) : null;
								})()}

							{!formData.selectedFiberComposition &&
								(() => {
									const hasCompositions =
										selectedFabric.compositions &&
										selectedFabric.compositions.length > 0;
									return hasCompositions ? (
										<div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
											<div className="text-sm text-amber-800">
												💡 Select a fiber composition to optimize product
												specifications and performance characteristics.
											</div>
										</div>
									) : null;
								})()}
						</div>
					)}
			</CollapsibleContent>
		</Collapsible>
	);
});

// Default export for lazy loading compatibility
export default CategoryFabricSection;
