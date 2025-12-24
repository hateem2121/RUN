import type { Category, Fabric, MediaAsset, Product } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import {
	Award,
	Box,
	Edit,
	Image as ImageIcon,
	Layers,
	Link as LinkIcon,
	Package,
	Tag,
	Users,
	Video,
	X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// STEP 3 INTEGRATION: Import UnifiedModelViewer to replace manual model-viewer
import { LazyUnifiedModelViewer } from "@/components/ui/LazyUnifiedModelViewer";
import { Separator } from "@/components/ui/separator";

interface ProductDetailsPanelProps {
	product: Product;
	onClose: () => void;
	onEdit: () => void;
}

export function ProductDetailsPanel({
	product,
	onClose,
	onEdit,
}: ProductDetailsPanelProps) {
	// Fetch related data using same cache keys as admin interface
	const { data: initialData } = useQuery<{
		categories: Category[];
		fabrics: Fabric[];
		mediaAssets: MediaAsset[];
		products: Product[];
	}>({
		queryKey: ["/api/admin/products/initial-data"],
		staleTime: 1000 * 60 * 5, // 5 minutes cache
	});

	// Use data from admin cache for consistency
	const categories: Category[] = initialData?.categories || [];
	const fabrics: Fabric[] = initialData?.fabrics || [];
	const mediaAssets: MediaAsset[] = initialData?.mediaAssets || [];

	// Helper functions
	const getCategory = () => categories.find((c) => c.id === product.categoryId);
	const getFabric = () => fabrics.find((f) => f.id === product.fabricId);
	const getMediaAsset = (id: number) => mediaAssets.find((m) => m.id === id);

	const category = getCategory();
	const fabric = getFabric();

	// Get media assets
	const primaryImage = product.primaryImageId
		? getMediaAsset(product.primaryImageId)
		: product.imageIds &&
				product.imageIds.length > 0 &&
				product.imageIds[0] !== undefined
			? getMediaAsset(product.imageIds[0])
			: null;

	const allImages = Array.isArray(product.imageIds)
		? (product.imageIds as unknown as number[])
				.map((id: number) => getMediaAsset(id))
				.filter(Boolean)
		: [];
	const allVideos = Array.isArray(product.videos)
		? (product.videos as unknown as number[])
				.map((id: number) => getMediaAsset(id))
				.filter(Boolean)
		: [];
	const model3D = product.modelFileId
		? getMediaAsset(product.modelFileId)
		: null;

	return (
		<div className="space-y-4">
			{/* Header */}
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-bold">Product Details</h2>
				<div className="flex gap-2">
					<Button onClick={onEdit} size="sm">
						<Edit className="h-4 w-4 mr-2" />
						Edit
					</Button>
					<Button onClick={onClose} variant="ghost" size="sm">
						<X className="h-4 w-4" />
					</Button>
				</div>
			</div>

			{/* Primary Image */}
			{primaryImage && (
				<Card>
					<CardContent className="p-4">
						<div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
							<img
								src={
									primaryImage.id && primaryImage.id < 1000000000000
										? `/api/media/${primaryImage.id}/content`
										: undefined
								}
								alt={product.name}
								className="w-full h-full object-cover"
							/>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Basic Information */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Package className="h-5 w-5" />
						Basic Information
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<h3 className="font-semibold text-lg">{product.name}</h3>
						<p className="text-gray-600">SKU: {product.sku}</p>
					</div>

					<div className="flex items-center gap-2">
						<Badge
							variant={product.isActive ? "default" : "secondary"}
							className={
								product.isActive
									? "bg-green-100 text-green-800"
									: "bg-gray-100 text-gray-600"
							}
						>
							{product.isActive ? "Active" : "Inactive"}
						</Badge>
						{product.isFeatured && (
							<Badge className="bg-yellow-100 text-yellow-800">Featured</Badge>
						)}
					</div>

					{product.description && (
						<div>
							<h4 className="font-medium mb-2">Description</h4>
							<p className="text-gray-700 text-sm">{product.description}</p>
						</div>
					)}

					{product.shortDescription && (
						<div>
							<h4 className="font-medium mb-2">Short Description</h4>
							<p className="text-gray-700 text-sm">
								{product.shortDescription}
							</p>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Relationships */}
			<Card>
				<CardHeader>
					<CardTitle>Relationships</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					{category && (
						<div className="flex items-center gap-3">
							<Tag className="h-4 w-4 text-green-600" />
							<div>
								<span className="font-medium">Category:</span>
								<span className="ml-2 text-gray-700">{category.name}</span>
							</div>
						</div>
					)}

					{fabric && (
						<div className="flex items-center gap-3">
							<Layers className="h-4 w-4 text-purple-600" />
							<div>
								<span className="font-medium">Fabric:</span>
								<span className="ml-2 text-gray-700">{fabric.name}</span>
							</div>
						</div>
					)}

					<Separator />

					{/* Media Summary */}
					<div className="grid grid-cols-2 gap-4 text-sm">
						<div className="flex items-center gap-2">
							<ImageIcon className="h-4 w-4 text-blue-600" />
							<span>{allImages.length} Images</span>
						</div>
						<div className="flex items-center gap-2">
							<Video className="h-4 w-4 text-purple-600" />
							<span>{allVideos.length} Videos</span>
						</div>
						<div className="flex items-center gap-2">
							<Box className="h-4 w-4 text-indigo-600" />
							<span>{model3D ? "1" : "0"} 3D Model</span>
						</div>
						<div className="flex items-center gap-2">
							<Users className="h-4 w-4 text-yellow-600" />
							<span>{product.accessoryIds?.length || 0} Accessories</span>
						</div>
						<div className="flex items-center gap-2">
							<Award className="h-4 w-4 text-emerald-600" />
							<span>{product.certificateIds?.length || 0} Certificates</span>
						</div>
						<div className="flex items-center gap-2">
							<LinkIcon className="h-4 w-4 text-gray-600" />
							<span>{product.relatedProductIds?.length || 0} Related</span>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* STEP 3 INTEGRATION: Replace manual model-viewer with UnifiedModelViewer */}
			{model3D && (
				<Card>
					<CardHeader>
						<CardTitle>3D Model Preview</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
							<LazyUnifiedModelViewer
								asset={{
									...model3D,
									type: "model",
								}}
								config={{
									cameraControls: true,
									autoRotate: true,
									backgroundColorHex: "#f5f5f5",
									exposure: 1.0,
									shadowIntensity: 1,
									interactionPolicy: "always-allow",
									loading: "auto",
								}}
								className="w-full h-full"
							/>
							<div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs z-10">
								{model3D.filename}
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Specifications */}
			{product.technicalSpecs &&
				Object.keys(product.technicalSpecs).length > 0 && (
					<Card>
						<CardHeader>
							<CardTitle>Technical Specifications</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-2">
								{Object.entries(product.technicalSpecs).map(([key, value]) => (
									<div
										key={key}
										className="flex justify-between items-center text-sm"
									>
										<span className="font-medium capitalize">
											{key.replace(/([A-Z])/g, " $1").trim()}:
										</span>
										<span className="text-gray-700">{value}</span>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				)}

			{/* Tags */}
			{product.tags && product.tags.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Tags</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex flex-wrap gap-2">
							{product.tags.map((tag, index) => (
								<Badge key={index} variant="outline" className="text-xs">
									{tag}
								</Badge>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Business Information */}
			{(product.minimumOrderQuantity ||
				product.leadTime ||
				product.customizationOptions?.length) && (
				<Card>
					<CardHeader>
						<CardTitle>Business Information</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						{product.minimumOrderQuantity && (
							<div className="text-sm">
								<span className="font-medium">Minimum Order Quantity:</span>
								<span className="ml-2 text-gray-700">
									{product.minimumOrderQuantity}
								</span>
							</div>
						)}
						{product.leadTime && (
							<div className="text-sm">
								<span className="font-medium">Lead Time:</span>
								<span className="ml-2 text-gray-700">{product.leadTime}</span>
							</div>
						)}
						{product.customizationOptions &&
							product.customizationOptions.length > 0 && (
								<div className="text-sm">
									<span className="font-medium">Customization Options:</span>
									<div className="mt-1 flex flex-wrap gap-1">
										{product.customizationOptions.map(
											(option: string, index: number) => (
												<Badge
													key={index}
													variant="outline"
													className="text-xs"
												>
													{option}
												</Badge>
											),
										)}
									</div>
								</div>
							)}
					</CardContent>
				</Card>
			)}
		</div>
	);
}

export default ProductDetailsPanel;
