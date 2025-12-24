import type { Fiber } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
	Beaker,
	ChevronDown,
	ChevronUp,
	Leaf,
	Search,
	Sparkles,
	Star,
} from "lucide-react";
import { useMemo, useState } from "react";
import { SEOMeta } from "@/components/seo-meta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getPropertiesArray } from "@/lib/fiber-utils";

export default function Fibers() {
	const [searchTerm, setSearchTerm] = useState("");
	const [expandedFibers, setExpandedFibers] = useState<Set<number>>(new Set());

	const { data: fibersResponse, isLoading } = useQuery<Fiber[]>({
		queryKey: ["/api/fibers"],
	});

	const fibers = Array.isArray(fibersResponse) ? fibersResponse : [];

	// Filter fibers based on search
	const filteredFibers = useMemo(() => {
		if (!searchTerm) return fibers;

		const term = searchTerm.toLowerCase();
		return fibers.filter(
			(fiber) =>
				fiber.name.toLowerCase().includes(term) ||
				fiber.type.toLowerCase().includes(term) ||
				fiber.description?.toLowerCase().includes(term) ||
				fiber.properties?.toLowerCase().includes(term),
		);
	}, [fibers, searchTerm]);

	// Group fibers by type
	const groupedFibers = filteredFibers.reduce(
		(acc, fiber) => {
			const type = fiber.type || "Other";
			if (!acc[type]) acc[type] = [];
			acc[type].push(fiber);
			return acc;
		},
		{} as Record<string, Fiber[]>,
	);

	const toggleExpanded = (id: number) => {
		setExpandedFibers((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(id)) {
				newSet.delete(id);
			} else {
				newSet.add(id);
			}
			return newSet;
		});
	};

	const getTypeIcon = (type: string) => {
		switch (type.toLowerCase()) {
			case "natural":
				return Leaf;
			case "synthetic":
				return Beaker;
			default:
				return Sparkles;
		}
	};

	const getSustainabilityBadge = (score: number | null | undefined) => {
		if (!score) return null;

		if (score >= 4) {
			return (
				<Badge className="bg-green-600 text-white">
					<Leaf className="w-3 h-3 mr-1" />
					Eco-Friendly
				</Badge>
			);
		} else if (score >= 3) {
			return (
				<Badge className="bg-yellow-600 text-white">Moderate Impact</Badge>
			);
		} else {
			return <Badge className="bg-orange-600 text-white">High Impact</Badge>;
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
			<SEOMeta
				title="Fibers - Raw Materials & Properties | RUN APPAREL"
				description="Discover our comprehensive range of natural and synthetic fibers used in sportswear manufacturing."
			/>

			{/* Hero Section */}
			<section className="pt-24 pb-12 px-4">
				<div className="max-w-7xl mx-auto">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						className="text-center mb-8"
					>
						<h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
							Fiber Materials Library
						</h1>
						<p className="text-lg text-gray-600 max-w-3xl mx-auto">
							Understanding the building blocks of high-performance sportswear
							fabrics
						</p>

						<div className="flex justify-center gap-6 mt-8">
							<div className="text-center">
								<div className="text-3xl font-bold text-purple-600">
									{fibers.length}
								</div>
								<div className="text-sm text-gray-600">Total Fibers</div>
							</div>
							<div className="text-center">
								<div className="text-3xl font-bold text-green-600">
									{
										fibers.filter(
											(f) =>
												f.sustainabilityScore && f.sustainabilityScore >= 4,
										).length
									}
								</div>
								<div className="text-sm text-gray-600">Eco-Friendly</div>
							</div>
						</div>
					</motion.div>

					{/* Search Bar */}
					<div className="max-w-2xl mx-auto">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
							<Input
								placeholder="Search fibers..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-10 py-6 text-base"
							/>
						</div>
					</div>
				</div>
			</section>

			{/* Fibers Grid */}
			<section className="pb-20 px-4">
				<div className="max-w-7xl mx-auto">
					{isLoading ? (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{[1, 2, 3, 4, 5, 6].map((i) => (
								<Card key={i} className="h-64 animate-pulse">
									<CardHeader>
										<div className="h-6 bg-gray-200 rounded w-3/4"></div>
									</CardHeader>
									<CardContent>
										<div className="space-y-3">
											<div className="h-4 bg-gray-200 rounded"></div>
											<div className="h-4 bg-gray-200 rounded w-5/6"></div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					) : (
						<AnimatePresence mode="wait">
							{Object.entries(groupedFibers).length > 0 ? (
								<div className="space-y-8">
									{Object.entries(groupedFibers).map(([type, typeFibers]) => (
										<motion.div
											key={type}
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											exit={{ opacity: 0, y: -20 }}
										>
											<h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
												{(() => {
													const Icon = getTypeIcon(type);
													return <Icon className="w-5 h-5" />;
												})()}
												{type} Fibers
											</h2>
											<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
												{typeFibers.map((fiber) => {
													const isExpanded = expandedFibers.has(fiber.id);

													return (
														<motion.div
															key={fiber.id}
															layout
															initial={{ opacity: 0, scale: 0.95 }}
															animate={{ opacity: 1, scale: 1 }}
															whileHover={{ y: -4 }}
															transition={{ duration: 0.2 }}
														>
															<Card
																className="h-full hover:shadow-lg transition-shadow-sm cursor-pointer"
																onClick={() => toggleExpanded(fiber.id)}
															>
																<CardHeader className="pb-3">
																	<div className="flex items-start justify-between">
																		<div className="flex-1">
																			<CardTitle className="text-base font-semibold">
																				{fiber.name}
																			</CardTitle>
																			<div className="flex items-center gap-2 mt-2">
																				<Badge
																					variant="outline"
																					className="text-xs"
																				>
																					{fiber.type}
																				</Badge>
																				{fiber.sustainabilityScore && (
																					<div className="flex items-center">
																						{[...Array(5)].map((_, i) => (
																							<Star
																								key={i}
																								className={`w-3 h-3 ${i < (fiber.sustainabilityScore || 0) ? "text-green-500 fill-current" : "text-gray-300"}`}
																							/>
																						))}
																					</div>
																				)}
																			</div>
																		</div>
																		<Button
																			variant="ghost"
																			size="sm"
																			className="ml-2"
																		>
																			{isExpanded ? (
																				<ChevronUp className="w-4 h-4" />
																			) : (
																				<ChevronDown className="w-4 h-4" />
																			)}
																		</Button>
																	</div>
																</CardHeader>
																<CardContent>
																	{fiber.properties &&
																		getPropertiesArray(fiber.properties)
																			.length > 0 && (
																			<div className="flex flex-wrap gap-1 mb-3">
																				{getPropertiesArray(fiber.properties)
																					.slice(0, 3)
																					.map((prop, idx) => (
																						<Badge
																							key={idx}
																							variant="secondary"
																							className="text-xs"
																						>
																							{prop}
																						</Badge>
																					))}
																				{getPropertiesArray(fiber.properties)
																					.length > 3 &&
																					!isExpanded && (
																						<Badge
																							variant="outline"
																							className="text-xs"
																						>
																							+
																							{getPropertiesArray(
																								fiber.properties,
																							).length - 3}{" "}
																							more
																						</Badge>
																					)}
																			</div>
																		)}

																	<AnimatePresence>
																		{isExpanded && (
																			<motion.div
																				initial={{ height: 0, opacity: 0 }}
																				animate={{ height: "auto", opacity: 1 }}
																				exit={{ height: 0, opacity: 0 }}
																				transition={{ duration: 0.3 }}
																				className="overflow-hidden"
																			>
																				<div className="pt-3 space-y-3 border-t">
																					{fiber.description && (
																						<p className="text-sm text-gray-700">
																							{fiber.description}
																						</p>
																					)}

																					{fiber.properties &&
																						getPropertiesArray(fiber.properties)
																							.length > 3 && (
																							<div className="space-y-1">
																								<p className="text-xs font-semibold text-gray-700">
																									All Properties:
																								</p>
																								<div className="flex flex-wrap gap-1">
																									{getPropertiesArray(
																										fiber.properties,
																									).map((prop, idx) => (
																										<Badge
																											key={idx}
																											variant="secondary"
																											className="text-xs"
																										>
																											{prop}
																										</Badge>
																									))}
																								</div>
																							</div>
																						)}

																					{fiber.sustainabilityScore && (
																						<div className="space-y-2">
																							<p className="text-xs font-semibold text-gray-700">
																								Sustainability Assessment:
																							</p>
																							{getSustainabilityBadge(
																								fiber.sustainabilityScore,
																							)}
																							{fiber.environmentalImpact && (
																								<p className="text-xs text-gray-600 mt-1">
																									{fiber.environmentalImpact}
																								</p>
																							)}
																						</div>
																					)}
																				</div>
																			</motion.div>
																		)}
																	</AnimatePresence>
																</CardContent>
															</Card>
														</motion.div>
													);
												})}
											</div>
										</motion.div>
									))}
								</div>
							) : (
								<motion.div
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									className="text-center py-16"
								>
									<Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
									<h3 className="text-xl font-semibold text-gray-900 mb-2">
										No fibers found
									</h3>
									<p className="text-gray-600">
										{searchTerm
											? "Try adjusting your search terms"
											: "No fibers have been added yet"}
									</p>
								</motion.div>
							)}
						</AnimatePresence>
					)}
				</div>
			</section>
		</div>
	);
}
