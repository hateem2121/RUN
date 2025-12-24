import type {
	Category,
	Certificate,
	Fabric,
	ProductSummary,
} from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { AlertCircle, ChevronRight, ExternalLink, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useParams } from "wouter";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { useInquiryCart } from "@/contexts/InquiryCartContext";
import {
	type TransformContext,
	type TransformedProduct,
	transformProducts,
} from "@/lib/product-transformers";
import { batchFetchMediaContent } from "@/lib/queryClient";

interface ProductCardProps {
	product: TransformedProduct;
}

const ProductCard = ({ product }: ProductCardProps) => {
	const [isHovered, setIsHovered] = useState(false);
	const { addItem, isInCart } = useInquiryCart();
	const alreadyInCart = isInCart(product.id);

	const handleRequestQuote = (e: React.MouseEvent) => {
		e.stopPropagation();
		addItem(product);
	};

	return (
		<Card
			className="group overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 rounded-lg"
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			aria-label={product.name}
			data-testid={`product-card-${product.id}`}
		>
			<CardContent className="p-0">
				<div className="aspect-[4/3] bg-gray-100 overflow-hidden relative flex items-center justify-center">
					{product.imageId ? (
						<OptimizedImage
							mediaId={
								isHovered && product.hoverImageId
									? product.hoverImageId
									: product.imageId
							}
							alt={product.name}
							className="w-full h-full object-contain group-hover:scale-105 transition-all duration-300"
							aspectRatio={4 / 3}
							objectFit="contain"
							quality={85}
						/>
					) : (
						<img
							src={
								isHovered && product.hoverImageUrl
									? product.hoverImageUrl
									: product.imageUrl
							}
							alt={product.name}
							className="w-full h-full object-contain group-hover:scale-105 transition-all duration-300"
							loading="lazy"
						/>
					)}
				</div>
			</CardContent>
			<CardFooter className="flex-col items-start p-4 text-center">
				<h3 className="text-lg font-semibold uppercase tracking-wide w-full mb-2">
					{product.name}
				</h3>
				<div className="text-sm text-gray-600 mt-1 uppercase tracking-wide space-x-2 w-full">
					<span>{product.fabric}</span>
					<span>|</span>
					<span>{product.weight.value} GSM</span>
				</div>
				<div className="text-sm text-gray-600 mt-1 uppercase tracking-wide space-x-2 w-full">
					<span>MOQ: {product.moq}</span>
					<span>|</span>
					<span>LEAD: {product.leadTime}</span>
				</div>
				<div className="mt-4 flex flex-col sm:flex-row justify-center items-center gap-2 w-full">
					<Link
						href={product.detailUrl}
						className="bg-white text-black border-2 border-black px-4 py-3 min-h-[44px] text-xs uppercase tracking-widest hover:bg-gray-100 transition-colors w-full focus:ring-2 focus:ring-black focus:ring-offset-2 flex items-center justify-center gap-2"
						data-testid={`view-details-${product.id}`}
					>
						<span>View Details</span>
						<ExternalLink className="w-4 h-4" />
					</Link>
					<button
						onClick={handleRequestQuote}
						disabled={alreadyInCart}
						className="bg-black text-white px-4 py-3 min-h-[44px] text-xs uppercase tracking-widest transition-colors w-full focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
						data-testid={`request-quote-${product.id}`}
					>
						{alreadyInCart ? "Added" : "Request Quote"}
					</button>
				</div>
			</CardFooter>
		</Card>
	);
};

export default function CategoryDetail() {
	const { slug } = useParams();
	const [mediaContentMap, setMediaContentMap] = useState<Map<number, string>>(
		new Map(),
	);

	// Fetch category by slug
	const {
		data: category,
		isLoading: categoryLoading,
		error: categoryError,
	} = useQuery<Category>({
		queryKey: [`/api/categories/by-slug/${slug}`],
		enabled: !!slug,
	});

	// Fetch all categories for breadcrumbs
	const { data: allCategories = [] } = useQuery<Category[]>({
		queryKey: ["/api/categories"],
	});

	// Fetch products for this category
	const { data: productsData, isLoading: productsLoading } = useQuery<{
		data: ProductSummary[];
	}>({
		queryKey: ["/api/products", { category: category?.id }],
		enabled: !!category?.id,
	});

	// Fetch related data
	const { data: fabrics = [] } = useQuery<Fabric[]>({
		queryKey: ["/api/fabrics"],
	});

	const { data: certificates = [] } = useQuery<Certificate[]>({
		queryKey: ["/api/certificates"],
	});

	const products = Array.isArray(productsData?.data) ? productsData.data : [];

	// Batch fetch media assets
	useMemo(() => {
		if (products.length === 0) return;

		const mediaIds = new Set<number>();
		products.forEach((product) => {
			if (product.primaryImageId) mediaIds.add(product.primaryImageId);
			if (Array.isArray(product.imageIds)) {
				product.imageIds.forEach((id) => {
					if (typeof id === "number") mediaIds.add(id);
				});
			}
		});

		const fetchMedia = async () => {
			try {
				const results = await batchFetchMediaContent(Array.from(mediaIds));
				const mediaMap = new Map<number, string>();
				results.forEach((result) => {
					if (result.success) {
						const mediaUrl =
							result.content || result.url || `/api/media/${result.id}/content`;
						mediaMap.set(result.id, mediaUrl);
					}
				});
				setMediaContentMap(mediaMap);
			} catch (error) {}
		};

		fetchMedia();
	}, [products]);

	// Transform products
	const transformedProducts = useMemo(() => {
		if (!products.length || !allCategories.length) return [];

		const context: TransformContext = {
			categories: allCategories,
			fabrics,
			certificates,
			mediaAssets: [],
			mediaContentMap,
		};

		return transformProducts(products, context);
	}, [products, allCategories, fabrics, certificates, mediaContentMap]);

	// Build breadcrumbs
	const breadcrumbs = useMemo(() => {
		if (!category) return [];

		const crumbs = [
			{ name: "Home", url: "/" },
			{ name: "Categories", url: "/categories" },
		];

		// Add parent categories if exists
		if (category.parentId) {
			const parent = allCategories.find((c) => c.id === category.parentId);
			if (parent) {
				crumbs.push({ name: parent.name, url: `/categories/${parent.slug}` });
			}
		}

		crumbs.push({ name: category.name, url: `/categories/${category.slug}` });

		return crumbs;
	}, [category, allCategories]);

	// Loading state
	if (categoryLoading || productsLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-white">
				<div className="text-center">
					<Loader2 className="w-8 h-8 animate-spin text-gray-600 mx-auto mb-3" />
					<p className="text-sm text-gray-600">Loading category...</p>
				</div>
			</div>
		);
	}

	// Error state
	if (categoryError || !category) {
		return (
			<div className="container mx-auto px-4 pt-20 sm:pt-24 lg:pt-28 pb-8 max-w-6xl">
				<div className="text-center py-16">
					<AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
					<h2 className="text-2xl font-bold text-gray-900 mb-4">
						Category Not Found
					</h2>
					<p className="text-gray-600 mb-8">
						The category you're looking for doesn't exist or has been moved.
					</p>
					<Link href="/categories">
						<button className="inline-flex items-center px-6 py-3 bg-black text-white font-semibold hover:bg-gray-800 transition-colors">
							Browse All Categories
						</button>
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-white">
			{/* SEO Meta Tags */}
			<title>{category.metaTitle || `${category.name} | Category`}</title>
			<meta
				name="description"
				content={
					category.metaDescription ||
					category.description ||
					`Browse ${category.name} products`
				}
			/>

			<div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-10 pt-20 sm:pt-24 lg:pt-28 pb-12 lg:pb-16 max-w-7xl">
				{/* Breadcrumbs */}
				<nav
					aria-label="Breadcrumb"
					className="mb-8"
					data-testid="category-breadcrumbs"
				>
					<ol className="flex items-center space-x-2 text-sm text-gray-600">
						{breadcrumbs.map((crumb, index) => (
							<li key={index} className="flex items-center">
								{index > 0 && (
									<ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
								)}
								{index === breadcrumbs.length - 1 ? (
									<span className="font-semibold text-black">{crumb.name}</span>
								) : (
									<Link href={crumb.url}>
										<a className="hover:text-black transition-colors">
											{crumb.name}
										</a>
									</Link>
								)}
							</li>
						))}
					</ol>
				</nav>

				{/* Category Hero */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4 }}
					className="mb-12"
				>
					<h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
						{category.name}
					</h1>
					{category.description && (
						<p className="text-lg text-gray-600 max-w-3xl">
							{category.description}
						</p>
					)}
				</motion.div>

				{/* Products Grid */}
				<div className="mt-8">
					{transformedProducts.length === 0 ? (
						<div className="text-center py-20 px-4">
							<p className="text-gray-600">
								No products found in this category.
							</p>
						</div>
					) : (
						<>
							<div className="mb-6 text-sm text-gray-600">
								Showing {transformedProducts.length} product
								{transformedProducts.length !== 1 ? "s" : ""}
							</div>
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
								{transformedProducts.map((product) => (
									<ProductCard key={product.id} product={product} />
								))}
							</div>
						</>
					)}
				</div>
			</div>
		</div>
	);
}
