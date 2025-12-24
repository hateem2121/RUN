import type { Fiber } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
	ArrowUpDown,
	BarChart3,
	CheckSquare,
	ChevronDown,
	ChevronUp,
	Copy,
	Edit,
	Eye,
	Grid2X2,
	Layers,
	List,
	MoreHorizontal,
	Plus,
	Search,
	Square,
	Star,
	Trash2,
	X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DeleteConfirmationDialog } from "@/components/admin/shared/DeleteConfirmationDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	EnhancedDialog,
	EnhancedDialogBody,
	EnhancedDialogContent,
	EnhancedDialogDescription,
	EnhancedDialogFooter,
	EnhancedDialogHeader,
	EnhancedDialogTitle,
} from "@/components/ui/enhanced-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getPropertiesArray, propertiesToObject } from "@/lib/fiber-utils";
import { apiRequest, getQueryClient } from "@/lib/queryClient";

const getFiberTypeColor = (type: string) => {
	switch (type) {
		case "natural":
			return "bg-green-50 text-green-700 border-green-200";
		case "synthetic":
			return "bg-blue-50 text-blue-700 border-blue-200";
		case "blended":
			return "bg-purple-50 text-purple-700 border-purple-200";
		default:
			return "bg-orange-50 text-orange-700 border-orange-200";
	}
};

const getSustainabilityColor = (score: number) => {
	if (score >= 4) return "bg-emerald-50 text-emerald-700 border-emerald-200";
	if (score >= 3) return "bg-yellow-50 text-yellow-700 border-yellow-200";
	return "bg-orange-50 text-orange-700 border-orange-200";
};

const getSustainabilityLabel = (score: number) => {
	if (score >= 4) return "High Impact";
	if (score >= 3) return "Moderate Impact";
	return "Low Impact";
};

const getSustainabilityBadgeColor = (score: number) => {
	if (score >= 4) return "bg-emerald-100 text-emerald-800 border-emerald-300";
	if (score >= 3) return "bg-yellow-100 text-yellow-800 border-yellow-300";
	return "bg-orange-100 text-orange-800 border-orange-300";
};

const SustainabilityRatingInput = ({
	value,
	onChange,
}: {
	value?: number;
	onChange: (val?: number) => void;
}) => (
	<div>
		<Label className="text-sm font-medium text-green-700 dark:text-green-300">
			Sustainability Score (1-5)
		</Label>
		<div className="flex items-center gap-3 mt-2">
			<div className="flex items-center gap-1">
				{[1, 2, 3, 4, 5].map((score) => (
					<button
						key={score}
						type="button"
						title={`Rate ${score} stars`}
						onClick={() => onChange(score)}
						className={`p-1 rounded transition-colors ${
							(value || 0) >= score
								? "text-yellow-500 hover:text-yellow-600"
								: "text-gray-300 hover:text-gray-400"
						}`}
					>
						<Star className="h-6 w-6 fill-current" />
					</button>
				))}
			</div>
			<span className="text-sm text-green-600 dark:text-green-400">
				{value ? `${value}/5` : "Not rated"}
			</span>
			{value && (
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={() => onChange(undefined)}
					className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
				>
					<X className="h-3 w-3" />
				</Button>
			)}
		</div>
		<p className="text-xs text-green-600 dark:text-green-400 mt-1">
			1 = Low impact, 5 = High sustainability
		</p>
	</div>
);

interface FiberListProps {
	isLoading: boolean;
	fibers: Fiber[];
	viewMode: "list" | "grid" | "detailed";
	selectedFibers: Set<number>;
	onSelectFiber: (id: number) => void;
	onViewDetail: (fiber: Fiber) => void;
	onEdit: (fiber: Fiber) => void;
	onDuplicate: (fiber: Fiber) => void;
	onDelete: (id: number) => void;
	searchTerm: string;
	filterType: string;
	filterStatus: string;
}

const FiberList = ({
	isLoading,
	fibers,
	viewMode,
	selectedFibers,
	onSelectFiber,
	onViewDetail,
	onEdit,
	onDuplicate,
	onDelete,
	searchTerm,
	filterType,
	filterStatus,
}: FiberListProps) => {
	if (isLoading) {
		return (
			<div
				className={
					viewMode === "grid"
						? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
						: "space-y-3"
				}
			>
				{Array.from({ length: 6 }).map((_, i) => (
					<div
						key={`skeleton-${i}`}
						className={
							viewMode === "grid"
								? "h-32 bg-neutral-100 rounded animate-pulse"
								: "h-20 bg-neutral-100 rounded animate-pulse"
						}
					/>
				))}
			</div>
		);
	}

	if (fibers.length === 0) {
		return (
			<div className="text-center py-8 text-neutral-500">
				<div className="text-2xl mb-2">🧬</div>
				<p>
					{searchTerm || filterType !== "all" || filterStatus !== "all"
						? "No fibers match your filters"
						: "No fibers created yet"}
				</p>
			</div>
		);
	}

	if (viewMode === "grid") {
		return (
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{fibers.map((fiber) => (
					<div
						key={fiber.id}
						className={`p-4 border rounded-lg transition-colors ${
							selectedFibers.has(fiber.id)
								? "border-blue-300 bg-blue-50"
								: "border-neutral-200 hover:bg-neutral-50"
						}`}
					>
						<div className="flex justify-between items-start mb-3">
							<Button
								variant="ghost"
								size="sm"
								onClick={() => onSelectFiber(fiber.id)}
								className="p-1 h-auto"
							>
								{selectedFibers.has(fiber.id) ? (
									<CheckSquare className="h-4 w-4 text-blue-600" />
								) : (
									<Square className="h-4 w-4" />
								)}
							</Button>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="ghost" size="sm">
										<MoreHorizontal className="h-4 w-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuItem onClick={() => onViewDetail(fiber)}>
										<Eye className="h-4 w-4 mr-2" />
										View Details
									</DropdownMenuItem>
									<DropdownMenuItem onClick={() => onEdit(fiber)}>
										<Edit className="h-4 w-4 mr-2" />
										Edit
									</DropdownMenuItem>
									<DropdownMenuItem onClick={() => onDuplicate(fiber)}>
										<Copy className="h-4 w-4 mr-2" />
										Duplicate
									</DropdownMenuItem>
									<DeleteConfirmationDialog
										title="Delete Fiber"
										description={`Are you sure you want to delete "${fiber.name}"? This action cannot be undone.`}
										confirmText="Delete"
										onConfirm={() => onDelete(fiber.id)}
										asChild
										trigger={
											<DropdownMenuItem
												data-testid={`menuitem-delete-fiber-${fiber.id}`}
												className="text-red-600 focus:text-red-600"
											>
												<Trash2 className="mr-2 h-4 w-4" /> Delete
											</DropdownMenuItem>
										}
									/>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
						<div className="text-center">
							<h4 className="font-medium text-neutral-900 mb-2">
								{fiber.name}
							</h4>
							<div className="flex flex-wrap justify-center gap-2 mb-3">
								<Badge
									variant="outline"
									className={`text-xs ${getFiberTypeColor(fiber.type)}`}
								>
									{fiber.type.charAt(0).toUpperCase() + fiber.type.slice(1)}
								</Badge>
								{fiber.isActive ? (
									<Badge className="text-xs bg-green-100 text-green-700 border border-green-200">
										Active
									</Badge>
								) : (
									<Badge
										variant="secondary"
										className="text-xs bg-gray-100 text-gray-600"
									>
										Inactive
									</Badge>
								)}
								{fiber.sustainabilityScore && (
									<Badge
										variant="outline"
										className={`text-xs flex items-center gap-1 ${getSustainabilityColor(fiber.sustainabilityScore)}`}
									>
										<Star className="h-3 w-3 fill-current" />
										{fiber.sustainabilityScore}/5
									</Badge>
								)}
							</div>
							{fiber.properties &&
								getPropertiesArray(fiber.properties).length > 0 && (
									<div className="text-xs text-neutral-500">
										{getPropertiesArray(fiber.properties).length} propert
										{getPropertiesArray(fiber.properties).length === 1
											? "y"
											: "ies"}
									</div>
								)}
						</div>
					</div>
				))}
			</div>
		);
	}

	if (viewMode === "detailed") {
		return (
			<div className="space-y-4">
				{fibers.map((fiber) => (
					<div
						key={fiber.id}
						className={`p-4 border rounded-lg transition-colors ${
							selectedFibers.has(fiber.id)
								? "border-blue-300 bg-blue-50"
								: "border-neutral-200 hover:bg-neutral-50"
						}`}
					>
						<div className="flex justify-between items-start mb-3">
							<div className="flex items-start gap-3 flex-1">
								<Button
									variant="ghost"
									size="sm"
									onClick={() => onSelectFiber(fiber.id)}
									className="p-1 h-auto mt-0.5"
								>
									{selectedFibers.has(fiber.id) ? (
										<CheckSquare className="h-4 w-4 text-blue-600" />
									) : (
										<Square className="h-4 w-4" />
									)}
								</Button>
								<div className="flex-1">
									<h4 className="font-medium text-neutral-900 text-lg mb-2">
										{fiber.name}
									</h4>
									<div className="grid grid-cols-2 gap-4 text-sm">
										<div>
											<span className="text-neutral-500">Type:</span>
											<Badge
												variant="outline"
												className={`ml-2 text-xs ${getFiberTypeColor(fiber.type)}`}
											>
												{fiber.type.charAt(0).toUpperCase() +
													fiber.type.slice(1)}
											</Badge>
										</div>
										<div>
											<span className="text-neutral-500">Status:</span>
											{fiber.isActive ? (
												<Badge className="ml-2 text-xs bg-green-100 text-green-700 border border-green-200">
													Active
												</Badge>
											) : (
												<Badge
													variant="secondary"
													className="ml-2 text-xs bg-gray-100 text-gray-600"
												>
													Inactive
												</Badge>
											)}
										</div>
										{fiber.createdAt && (
											<div>
												<span className="text-neutral-500">Created:</span>
												<span className="ml-2">
													{new Date(fiber.createdAt).toLocaleDateString()}
												</span>
											</div>
										)}
										<div>
											<span className="text-neutral-500">Properties:</span>
											<span className="ml-2">
												{getPropertiesArray(fiber.properties).length}
											</span>
										</div>
										{fiber.sustainabilityScore && (
											<div>
												<span className="text-neutral-500">
													Sustainability:
												</span>
												<Badge
													variant="outline"
													className={`ml-2 text-xs flex items-center gap-1 w-fit ${getSustainabilityColor(fiber.sustainabilityScore)}`}
												>
													<Star className="h-3 w-3 fill-current" />
													{fiber.sustainabilityScore}/5
												</Badge>
											</div>
										)}
									</div>
								</div>
							</div>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="ghost" size="sm">
										<MoreHorizontal className="h-4 w-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuItem onClick={() => onViewDetail(fiber)}>
										<Eye className="h-4 w-4 mr-2" />
										View Details
									</DropdownMenuItem>
									<DropdownMenuItem onClick={() => onEdit(fiber)}>
										<Edit className="h-4 w-4 mr-2" />
										Edit
									</DropdownMenuItem>
									<DropdownMenuItem onClick={() => onDuplicate(fiber)}>
										<Copy className="h-4 w-4 mr-2" />
										Duplicate
									</DropdownMenuItem>
									<DeleteConfirmationDialog
										title="Delete Fiber"
										description={`Are you sure you want to delete "${fiber.name}"? This action cannot be undone.`}
										confirmText="Delete"
										onConfirm={() => onDelete(fiber.id)}
										asChild
										trigger={
											<DropdownMenuItem
												data-testid={`menuitem-delete-fiber-${fiber.id}`}
												className="text-red-600 focus:text-red-600"
											>
												<Trash2 className="mr-2 h-4 w-4" /> Delete
											</DropdownMenuItem>
										}
									/>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
						{fiber.description && (
							<div className="mt-3 pt-3 border-t">
								<p className="text-sm text-neutral-600">{fiber.description}</p>
							</div>
						)}
						{fiber.properties &&
							getPropertiesArray(fiber.properties).length > 0 && (
								<div className="mt-3 pt-3 border-t">
									<p className="text-xs text-neutral-500 mb-2">Properties:</p>
									<div className="flex flex-wrap gap-1">
										{getPropertiesArray(fiber.properties).map(
											(prop: string) => (
												<Badge
													key={prop}
													variant="secondary"
													className="text-xs"
												>
													{prop}
												</Badge>
											),
										)}
									</div>
								</div>
							)}
					</div>
				))}
			</div>
		);
	}

	return (
		<div className="space-y-3">
			{fibers.map((fiber) => (
				<div
					key={fiber.id}
					className={`p-3 border rounded-lg transition-colors ${
						selectedFibers.has(fiber.id)
							? "border-blue-300 bg-blue-50"
							: "border-neutral-200 hover:bg-neutral-50"
					}`}
				>
					<div className="flex justify-between items-start mb-2">
						<div className="flex items-start gap-3 flex-1">
							<Button
								variant="ghost"
								size="sm"
								onClick={() => onSelectFiber(fiber.id)}
								className="p-1 h-auto mt-0.5"
							>
								{selectedFibers.has(fiber.id) ? (
									<CheckSquare className="h-4 w-4 text-blue-600" />
								) : (
									<Square className="h-4 w-4" />
								)}
							</Button>
							<div className="flex-1">
								<h4 className="font-medium text-neutral-900">{fiber.name}</h4>
								<div className="flex items-center gap-2 mt-1">
									<Badge
										variant="outline"
										className={`text-xs ${getFiberTypeColor(fiber.type)}`}
									>
										{fiber.type.charAt(0).toUpperCase() + fiber.type.slice(1)}
									</Badge>
									{fiber.isActive ? (
										<Badge className="text-xs bg-green-100 text-green-700 border border-green-200">
											Active
										</Badge>
									) : (
										<Badge
											variant="secondary"
											className="text-xs bg-gray-100 text-gray-600"
										>
											Inactive
										</Badge>
									)}
									{fiber.sustainabilityScore && (
										<Badge
											variant="outline"
											className={`text-xs flex items-center gap-1 ${getSustainabilityColor(fiber.sustainabilityScore)}`}
										>
											<Star className="h-3 w-3 fill-current" />
											{fiber.sustainabilityScore}/5
										</Badge>
									)}
								</div>
							</div>
						</div>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="sm">
									<MoreHorizontal className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem onClick={() => onViewDetail(fiber)}>
									<Eye className="h-4 w-4 mr-2" />
									View Details
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => onEdit(fiber)}>
									<Edit className="h-4 w-4 mr-2" />
									Edit
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => onDuplicate(fiber)}>
									<Copy className="h-4 w-4 mr-2" />
									Duplicate
								</DropdownMenuItem>
								<DeleteConfirmationDialog
									title="Delete Fiber"
									description={`Are you sure you want to delete "${fiber.name}"? This action cannot be undone.`}
									confirmText="Delete"
									onConfirm={() => onDelete(fiber.id)}
									asChild
									trigger={
										<DropdownMenuItem
											data-testid={`menuitem-delete-fiber-${fiber.id}`}
											className="text-red-600 focus:text-red-600"
										>
											<Trash2 className="mr-2 h-4 w-4" /> Delete
										</DropdownMenuItem>
									}
								/>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
					{fiber.description && (
						<p className="text-sm text-neutral-600 mb-2">{fiber.description}</p>
					)}
					{fiber.properties &&
						getPropertiesArray(fiber.properties).length > 0 && (
							<div className="mb-2">
								<p className="text-xs text-neutral-500 mb-1">Properties:</p>
								<div className="flex flex-wrap gap-1">
									{getPropertiesArray(fiber.properties)
										.slice(0, 3)
										.map((prop: string) => (
											<Badge key={prop} variant="secondary" className="text-xs">
												{prop}
											</Badge>
										))}
									{getPropertiesArray(fiber.properties).length > 3 && (
										<Badge variant="secondary" className="text-xs">
											+{getPropertiesArray(fiber.properties).length - 3} more
										</Badge>
									)}
								</div>
							</div>
						)}
				</div>
			))}
		</div>
	);
};

export default function FiberManagement() {
	const [formData, setFormData] = useState({
		name: "",
		type: "",
		description: "",
		properties: "",
		sustainabilityScore: undefined as number | undefined,
		environmentalImpact: "",
		isActive: true,
	});

	const [propertyList, setPropertyList] = useState<string[]>([]);
	const [newProperty, setNewProperty] = useState("");
	const [isCustomType, setIsCustomType] = useState(false);
	const [customType, setCustomType] = useState("");

	const [editingFiber, setEditingFiber] = useState<Fiber | null>(null);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [filterType, setFilterType] = useState("all");
	const [filterStatus, setFilterStatus] = useState("all");
	const [filterSustainability, setFilterSustainability] = useState("all");

	const [nameError, setNameError] = useState("");
	const [selectedFibers, setSelectedFibers] = useState<Set<number>>(new Set());
	const [sortBy, setSortBy] = useState<
		"name" | "type" | "created" | "status" | "sustainability"
	>("name");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
	const [viewMode, setViewMode] = useState<"list" | "grid" | "detailed">(
		"list",
	);
	const [detailFiber, setDetailFiber] = useState<Fiber | null>(null);
	const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

	const { toast } = useToast();

	const { data: fibers, isPending: isLoading } = useQuery<Fiber[]>({
		queryKey: ["/api/fibers"],
	});

	// Check for duplicate names
	const checkDuplicateName = (name: string, excludeId?: number) => {
		if (!fibers) return false;
		return fibers.some(
			(fiber) =>
				fiber.name.toLowerCase() === name.toLowerCase() &&
				fiber.id !== excludeId,
		);
	};

	const resetForm = () => {
		setFormData({
			name: "",
			type: "",
			description: "",
			properties: "",
			sustainabilityScore: undefined,
			environmentalImpact: "",
			isActive: true,
		});
		setPropertyList([]);
		setNewProperty("");
		setNameError("");
		setIsCustomType(false);
		setCustomType("");
	};

	const addProperty = () => {
		if (newProperty?.trim() && !propertyList.includes(newProperty.trim())) {
			const updatedList = [...propertyList, newProperty.trim()];
			setPropertyList(updatedList);
			setFormData((prev) => ({ ...prev, properties: updatedList.join(", ") }));
			setNewProperty("");
		}
	};

	const removeProperty = (index: number) => {
		const updatedList = propertyList.filter((_, i) => i !== index);
		setPropertyList(updatedList);
		setFormData((prev) => ({ ...prev, properties: updatedList.join(", ") }));
	};

	const createFiberMutation = useMutation({
		mutationFn: async (data: any) => {
			// Transform properties string to object format
			const transformedData = {
				...data,
				properties: data.properties
					? propertiesToObject(
							data.properties
								.split(",")
								.map((p: string) => p.trim())
								.filter(Boolean),
						)
					: undefined,
			};

			return await apiRequest("/api/fibers", {
				method: "POST",
				body: JSON.stringify(transformedData),
			});
		},
		onSuccess: () => {
			getQueryClient().invalidateQueries({ queryKey: ["/api/fibers"] });
			toast({
				title: "Success",
				description: "Fiber created successfully",
			});
			resetForm();
			setIsCreateDialogOpen(false);
		},
		onError: (error: any) => {
			toast({
				title: "Error",
				description: error.message || "Failed to create fiber",
				variant: "destructive",
			});
		},
	});

	const updateFiberMutation = useMutation({
		mutationFn: async ({ id, data }: { id: number; data: any }) => {
			// Transform properties string to object format
			const transformedData = {
				...data,
				properties: data.properties
					? propertiesToObject(
							data.properties
								.split(",")
								.map((p: string) => p.trim())
								.filter(Boolean),
						)
					: undefined,
			};

			return await apiRequest(`/api/fibers/${id}`, {
				method: "PATCH",
				body: JSON.stringify(transformedData),
			});
		},
		onSuccess: () => {
			getQueryClient().invalidateQueries({ queryKey: ["/api/fibers"] });
			toast({
				title: "Success",
				description: "Fiber updated successfully",
			});
			setIsEditDialogOpen(false);
			setEditingFiber(null);
		},
		onError: (error: any) => {
			toast({
				title: "Error",
				description: error.message || "Failed to update fiber",
				variant: "destructive",
			});
		},
	});

	const deleteFiberMutation = useMutation({
		mutationFn: async (id: number) => {
			const response = await apiRequest(`/api/fibers/${id}`, {
				method: "DELETE",
			});
			return response;
		},
		onSuccess: (_, deletedId) => {
			getQueryClient().invalidateQueries({ queryKey: ["/api/fibers"] });
			toast({
				title: "Success",
				description: "Fiber deleted successfully",
			});
			setSelectedFibers((prev) => {
				const newSet = new Set(prev);
				newSet.delete(deletedId);
				return newSet;
			});
		},
		onError: (error: any) => {
			toast({
				title: "Error",
				description: error.message || "Failed to delete fiber",
				variant: "destructive",
			});
		},
	});

	const bulkUpdateMutation = useMutation({
		mutationFn: async ({
			ids,
			updates,
		}: {
			ids: number[];
			updates: Partial<{ isActive: boolean }>;
		}) => {
			const promises = ids.map((id) =>
				apiRequest(`/api/fibers/${id}`, {
					method: "PATCH",
					body: JSON.stringify(updates),
				}),
			);
			return Promise.all(promises);
		},
		onSuccess: (_, { ids }) => {
			getQueryClient().invalidateQueries({ queryKey: ["/api/fibers"] });
			toast({
				title: "Success",
				description: `Updated ${ids.length} fiber${ids.length === 1 ? "" : "s"} successfully`,
			});
			setSelectedFibers(new Set());
		},
		onError: (error: any) => {
			toast({
				title: "Error",
				description: error.message || "Failed to update fibers",
				variant: "destructive",
			});
		},
	});

	const bulkDeleteMutation = useMutation({
		mutationFn: async (ids: number[]) => {
			const promises = ids.map((id) =>
				apiRequest(`/api/fibers/${id}`, { method: "DELETE" }),
			);
			return Promise.all(promises);
		},
		onSuccess: (_, ids) => {
			getQueryClient().invalidateQueries({ queryKey: ["/api/fibers"] });
			toast({
				title: "Success",
				description: `Deleted ${ids.length} fiber${ids.length === 1 ? "" : "s"} successfully`,
			});
			setSelectedFibers(new Set());
		},
		onError: (error: any) => {
			toast({
				title: "Error",
				description: error.message || "Failed to delete fibers",
				variant: "destructive",
			});
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		// Validate name for duplicates
		if (checkDuplicateName(formData.name)) {
			setNameError("A fiber with this name already exists");
			return;
		}

		createFiberMutation.mutate(formData);
	};

	const handleEditSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!editingFiber) return;

		// Validate name for duplicates (excluding current fiber)
		if (checkDuplicateName(formData.name, editingFiber.id)) {
			setNameError("A fiber with this name already exists");
			return;
		}

		updateFiberMutation.mutate({ id: editingFiber.id, data: formData });
	};

	const handleEdit = (fiber: Fiber) => {
		setEditingFiber(fiber);
		const properties =
			typeof fiber.properties === "object" && fiber.properties
				? Object.entries(fiber.properties)
						.map(([k, v]) => `${k}: ${v}`)
						.join(", ")
				: (fiber.properties ?? "");
		const propertiesArray = properties
			? properties.split(", ").filter((p) => p.trim())
			: [];

		// Check if this is a predefined type or custom type
		const predefinedTypes = ["natural", "synthetic", "blended", "regenerated"];
		const isPredefined = predefinedTypes.includes(fiber.type);

		setFormData({
			name: fiber.name,
			type: fiber.type,
			description: fiber.description || "",
			properties: properties,
			sustainabilityScore: fiber.sustainabilityScore ?? undefined,
			environmentalImpact: fiber.environmentalImpact || "",
			isActive: Boolean(fiber.isActive),
		});
		setPropertyList(propertiesArray);
		setNewProperty("");
		setNameError("");

		// Set custom type state based on whether it's predefined or not
		if (isPredefined) {
			setIsCustomType(false);
			setCustomType("");
		} else {
			setIsCustomType(true);
			setCustomType(fiber.type);
		}

		setIsEditDialogOpen(true);
	};

	const handleDelete = (fiberId: number) => {
		deleteFiberMutation.mutate(fiberId);
	};

	const handleNameChange = (value: string) => {
		setFormData((prev) => ({ ...prev, name: value }));
		if (nameError) setNameError("");
	};

	// Bulk operations handlers
	const handleSelectAll = () => {
		if (selectedFibers.size === filteredFibers.length) {
			setSelectedFibers(new Set());
		} else {
			setSelectedFibers(new Set(filteredFibers.map((fiber) => fiber.id)));
		}
	};

	const handleSelectFiber = (fiberId: number) => {
		setSelectedFibers((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(fiberId)) {
				newSet.delete(fiberId);
			} else {
				newSet.add(fiberId);
			}
			return newSet;
		});
	};

	const handleBulkActivate = () => {
		const ids = Array.from(selectedFibers);
		bulkUpdateMutation.mutate({ ids, updates: { isActive: true } });
	};

	const handleBulkDeactivate = () => {
		const ids = Array.from(selectedFibers);
		bulkUpdateMutation.mutate({ ids, updates: { isActive: false } });
	};

	const handleBulkDelete = () => {
		const ids = Array.from(selectedFibers);
		bulkDeleteMutation.mutate(ids);
	};

	// Sorting handlers
	const handleSort = (
		field: "name" | "type" | "created" | "status" | "sustainability",
	) => {
		if (sortBy === field) {
			setSortOrder(sortOrder === "asc" ? "desc" : "asc");
		} else {
			setSortBy(field);
			setSortOrder("asc");
		}
	};

	// View mode handlers
	const handleViewDetail = (fiber: Fiber) => {
		setDetailFiber(fiber);
		setIsDetailDialogOpen(true);
	};

	const handleDuplicateFiber = (fiber: Fiber) => {
		const properties =
			typeof fiber.properties === "object" && fiber.properties
				? Object.entries(fiber.properties)
						.map(([k, v]) => `${k}: ${v}`)
						.join(", ")
				: (fiber.properties ?? "");
		const propertiesArray = properties
			? properties.split(", ").filter((p) => p.trim())
			: [];

		// Check if this is a predefined type or custom type
		const predefinedTypes = ["natural", "synthetic", "blended", "regenerated"];
		const isPredefined = predefinedTypes.includes(fiber.type);

		setFormData({
			name: `${fiber.name} (Copy)`,
			type: fiber.type,
			description: fiber.description || "",
			properties: properties,
			sustainabilityScore: fiber.sustainabilityScore ?? undefined,
			environmentalImpact: fiber.environmentalImpact || "",
			isActive: fiber.isActive ?? true,
		});
		setPropertyList(propertiesArray);
		setNameError("");

		// Set custom type state based on whether it's predefined or not
		if (isPredefined) {
			setIsCustomType(false);
			setCustomType("");
		} else {
			setIsCustomType(true);
			setCustomType(fiber.type);
		}

		setIsCreateDialogOpen(true);
	};

	// Keyboard shortcuts handler
	const handleKeyDown = (event: KeyboardEvent) => {
		if (event.ctrlKey || event.metaKey) {
			switch (event.key) {
				case "a":
					event.preventDefault();
					handleSelectAll();
					break;
				case "n":
					event.preventDefault();
					setIsCreateDialogOpen(true);
					break;
			}
		} else {
			switch (event.key) {
				case "Delete":
					if (selectedFibers.size > 0) {
						event.preventDefault();
						handleBulkDelete();
					}
					break;
				case "1":
					setViewMode("list");
					break;
				case "2":
					setViewMode("grid");
					break;
				case "3":
					setViewMode("detailed");
					break;
			}
		}
	};

	// Add keyboard event listener
	useEffect(() => {
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [selectedFibers.size]); // eslint-disable-line react-hooks/exhaustive-deps

	// Filter and sort fibers based on search, filter, and sort criteria
	const filteredAndSortedFibers =
		fibers
			?.filter((fiber) => {
				const matchesSearch =
					!searchTerm ||
					fiber.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
					fiber.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
					fiber.type.toLowerCase().includes(searchTerm.toLowerCase());

				const matchesType = filterType === "all" || fiber.type === filterType;
				const matchesStatus =
					filterStatus === "all" ||
					(filterStatus === "active" && fiber.isActive) ||
					(filterStatus === "inactive" && !fiber.isActive);

				const matchesSustainability =
					filterSustainability === "all" ||
					(filterSustainability === "high" &&
						(fiber.sustainabilityScore || 0) >= 4) ||
					(filterSustainability === "moderate" &&
						(fiber.sustainabilityScore || 0) === 3) ||
					(filterSustainability === "low" &&
						(fiber.sustainabilityScore || 0) >= 1 &&
						(fiber.sustainabilityScore || 0) <= 2) ||
					(filterSustainability === "unrated" && !fiber.sustainabilityScore);

				return (
					matchesSearch && matchesType && matchesStatus && matchesSustainability
				);
			})
			.sort((a, b) => {
				let comparison = 0;

				switch (sortBy) {
					case "name":
						comparison = a.name.localeCompare(b.name);
						break;
					case "type":
						comparison = a.type.localeCompare(b.type);
						break;
					case "created":
						comparison =
							new Date(a.createdAt || 0).getTime() -
							new Date(b.createdAt || 0).getTime();
						break;
					case "status":
						comparison = a.isActive === b.isActive ? 0 : a.isActive ? -1 : 1;
						break;
					case "sustainability":
						comparison =
							(a.sustainabilityScore || 0) - (b.sustainabilityScore || 0);
						break;
				}

				return sortOrder === "asc" ? comparison : -comparison;
			}) || [];

	// For backward compatibility
	const filteredFibers = filteredAndSortedFibers;

	// Sustainability Analytics
	const sustainabilityStats = useMemo(() => {
		if (!fibers) return null;

		const ratedFibers = fibers.filter((f) => f.sustainabilityScore);
		const totalFibers = fibers.length;
		const ratedCount = ratedFibers.length;
		const unratedCount = totalFibers - ratedCount;

		const averageScore =
			ratedCount > 0
				? ratedFibers.reduce(
						(sum, f) => sum + (f.sustainabilityScore || 0),
						0,
					) / ratedCount
				: 0;

		const scoreDistribution = {
			high: ratedFibers.filter((f) => (f.sustainabilityScore || 0) >= 4).length,
			moderate: ratedFibers.filter((f) => (f.sustainabilityScore || 0) === 3)
				.length,
			low: ratedFibers.filter(
				(f) =>
					(f.sustainabilityScore || 0) >= 1 &&
					(f.sustainabilityScore || 0) <= 2,
			).length,
		};

		const topSustainableFibers = ratedFibers
			.filter((f) => (f.sustainabilityScore || 0) >= 4)
			.sort(
				(a, b) => (b.sustainabilityScore || 0) - (a.sustainabilityScore || 0),
			)
			.slice(0, 5);

		const fibersWithNotes = fibers.filter((f) =>
			f.environmentalImpact?.trim(),
		).length;

		return {
			totalFibers,
			ratedCount,
			unratedCount,
			averageScore,
			scoreDistribution,
			topSustainableFibers,
			fibersWithNotes,
			ratingCoverage: totalFibers > 0 ? (ratedCount / totalFibers) * 100 : 0,
		};
	}, [fibers]);

	const fiberTypes = [
		{ value: "natural", label: "Natural" },
		{ value: "synthetic", label: "Synthetic" },
		{ value: "blended", label: "Blended" },
		{ value: "regenerated", label: "Regenerated" },
		{ value: "custom", label: "Custom Type" },
	];

	const renderFiberForm = (onSubmit: (e: React.FormEvent) => void) => (
		<form onSubmit={onSubmit} className="space-y-4">
			<div>
				<Label htmlFor="name">Fiber Name</Label>
				<Input
					id="name"
					value={formData.name}
					onChange={(e) => handleNameChange(e.target.value)}
					placeholder="e.g., Merino Wool, Polyester, Cotton"
					required
					className={nameError ? "border-red-500" : ""}
				/>
				{nameError && <p className="text-sm text-red-600 mt-1">{nameError}</p>}
			</div>

			<div>
				<Label>Fiber Type</Label>
				<Select
					value={isCustomType ? "custom" : formData.type}
					onValueChange={(value) => {
						if (value === "custom") {
							setIsCustomType(true);
							setFormData((prev) => ({ ...prev, type: customType }));
						} else {
							setIsCustomType(false);
							setCustomType("");
							setFormData((prev) => ({ ...prev, type: value }));
						}
					}}
				>
					<SelectTrigger className={formData.type ? "" : "text-gray-400"}>
						<SelectValue placeholder="Select fiber type" />
					</SelectTrigger>
					<SelectContent>
						{fiberTypes.map((type) => (
							<SelectItem key={type.value} value={type.value}>
								{type.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				{isCustomType && (
					<div className="mt-2">
						<Input
							value={customType}
							onChange={(e) => {
								setCustomType(e.target.value);
								setFormData((prev) => ({ ...prev, type: e.target.value }));
							}}
							placeholder="Enter custom fiber type"
							className="w-full"
						/>
					</div>
				)}
			</div>

			<div>
				<Label htmlFor="description">Description</Label>
				<Textarea
					id="description"
					value={formData.description}
					onChange={(e) =>
						setFormData((prev) => ({ ...prev, description: e.target.value }))
					}
					placeholder="Describe the fiber characteristics and origin"
					className="h-20"
				/>
			</div>

			{/* Properties Section */}
			<div>
				<Label>Properties</Label>

				{/* Add New Property */}
				<div className="flex gap-2 mb-3">
					<Input
						value={newProperty}
						onChange={(e) => setNewProperty(e.target.value)}
						placeholder="e.g., Moisture Wicking, UV Protection"
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								addProperty();
							}
						}}
					/>
					<Button
						type="button"
						onClick={addProperty}
						disabled={
							!newProperty.trim() || propertyList.includes(newProperty.trim())
						}
						size="sm"
					>
						<Plus className="h-4 w-4" />
					</Button>
				</div>

				{/* Property List */}
				{propertyList.length > 0 && (
					<div className="space-y-2 mb-3">
						{propertyList.map((property, index) => (
							<div
								key={property}
								className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-md"
							>
								<span className="text-sm">{property}</span>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() => removeProperty(index)}
									className="h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-900"
								>
									<X className="h-3 w-3" />
								</Button>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Sustainability Section */}
			<div className="space-y-4 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
				<div className="flex items-center gap-2 mb-3">
					<div className="w-2 h-2 bg-green-500 rounded-full"></div>
					<Label className="text-sm font-semibold text-green-800 dark:text-green-200">
						Sustainability Assessment
					</Label>
				</div>

				{/* Sustainability Score */}
				<SustainabilityRatingInput
					value={formData.sustainabilityScore}
					onChange={(score) =>
						setFormData((prev) => ({ ...prev, sustainabilityScore: score }))
					}
				/>

				{/* Environmental Impact Notes */}
				<div>
					<Label
						htmlFor="environmentalNotes"
						className="text-sm font-medium text-green-700 dark:text-green-300"
					>
						Environmental Impact Notes
					</Label>
					<Textarea
						id="environmentalNotes"
						value={formData.environmentalImpact}
						onChange={(e) =>
							setFormData((prev) => ({
								...prev,
								environmentalImpact: e.target.value,
							}))
						}
						placeholder="Describe environmental benefits, certifications, production methods, recyclability..."
						className="mt-2 h-20 border-green-200 dark:border-green-700 focus:border-green-400 dark:focus:border-green-500"
						maxLength={1000}
					/>
					<p className="text-xs text-green-600 dark:text-green-400 mt-1">
						{formData.environmentalImpact.length}/1000 characters
					</p>
				</div>
			</div>

			<div className="flex items-center space-x-2">
				<Checkbox
					id="isActive"
					checked={formData.isActive}
					onCheckedChange={(checked) =>
						setFormData((prev) => ({ ...prev, isActive: Boolean(checked) }))
					}
				/>
				<Label htmlFor="isActive">Active</Label>
			</div>
		</form>
	);

	return (
		<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div className="flex items-center justify-between mb-8">
				<div>
					<h1 className="text-3xl font-neue-stance font-bold text-neutral-900">
						Fiber Management
					</h1>
					<p className="text-neutral-600 mt-2">
						Manage fiber types for material traceability within fabrics
					</p>
				</div>
				<Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
					<Plus className="h-4 w-4" />
					Add New Fiber
				</Button>
			</div>

			{/* Sustainability Analytics Dashboard */}
			{sustainabilityStats && (
				<Card className="mb-6 border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
					<CardHeader>
						<CardTitle className="text-lg flex items-center gap-2 text-green-800 dark:text-green-200">
							<div className="w-2 h-2 bg-green-500 rounded-full"></div>
							Sustainability Analytics
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
							{/* Total Fibers */}
							<div className="bg-white dark:bg-green-900 p-4 rounded-lg border border-green-200 dark:border-green-700">
								<div className="text-2xl font-bold text-green-800 dark:text-green-200">
									{sustainabilityStats.totalFibers}
								</div>
								<div className="text-sm text-green-600 dark:text-green-400">
									Total Fibers
								</div>
							</div>

							{/* Rating Coverage */}
							<div className="bg-white dark:bg-green-900 p-4 rounded-lg border border-green-200 dark:border-green-700">
								<div className="text-2xl font-bold text-green-800 dark:text-green-200">
									{sustainabilityStats.ratingCoverage.toFixed(0)}%
								</div>
								<div className="text-sm text-green-600 dark:text-green-400">
									Rating Coverage ({sustainabilityStats.ratedCount}/
									{sustainabilityStats.totalFibers})
								</div>
							</div>

							{/* Average Score */}
							<div className="bg-white dark:bg-green-900 p-4 rounded-lg border border-green-200 dark:border-green-700">
								<div className="flex items-center gap-2">
									<div className="text-2xl font-bold text-green-800 dark:text-green-200">
										{sustainabilityStats.averageScore.toFixed(1)}
									</div>
									<div className="flex">
										{[1, 2, 3, 4, 5].map((star) => (
											<Star
												key={star}
												className={`h-4 w-4 fill-current ${
													sustainabilityStats.averageScore >= star
														? "text-yellow-500"
														: "text-gray-300"
												}`}
											/>
										))}
									</div>
								</div>
								<div className="text-sm text-green-600 dark:text-green-400">
									Average Score
								</div>
							</div>

							{/* Environmental Notes */}
							<div className="bg-white dark:bg-green-900 p-4 rounded-lg border border-green-200 dark:border-green-700">
								<div className="text-2xl font-bold text-green-800 dark:text-green-200">
									{sustainabilityStats.fibersWithNotes}
								</div>
								<div className="text-sm text-green-600 dark:text-green-400">
									With Impact Notes
								</div>
							</div>
						</div>

						{/* Score Distribution */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<h4 className="font-medium text-green-800 dark:text-green-200 mb-3">
									Score Distribution
								</h4>
								<div className="space-y-2">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">
												High Impact (4-5★)
											</Badge>
										</div>
										<span className="font-medium text-green-800 dark:text-green-200">
											{sustainabilityStats.scoreDistribution.high}
										</span>
									</div>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
												Moderate (3★)
											</Badge>
										</div>
										<span className="font-medium text-green-800 dark:text-green-200">
											{sustainabilityStats.scoreDistribution.moderate}
										</span>
									</div>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<Badge className="bg-orange-100 text-orange-800 border-orange-300">
												Low Impact (1-2★)
											</Badge>
										</div>
										<span className="font-medium text-green-800 dark:text-green-200">
											{sustainabilityStats.scoreDistribution.low}
										</span>
									</div>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<Badge variant="outline">Unrated</Badge>
										</div>
										<span className="font-medium text-green-800 dark:text-green-200">
											{sustainabilityStats.unratedCount}
										</span>
									</div>
								</div>
							</div>

							{/* Top Sustainable Fibers */}
							<div>
								<h4 className="font-medium text-green-800 dark:text-green-200 mb-3">
									Top Sustainable Fibers
								</h4>
								<div className="space-y-2">
									{sustainabilityStats.topSustainableFibers.length > 0 ? (
										sustainabilityStats.topSustainableFibers.map(
											(fiber, index) => (
												<div
													key={fiber.id}
													className="flex items-center justify-between p-2 bg-white dark:bg-green-900 rounded border border-green-200 dark:border-green-700"
												>
													<div className="flex items-center gap-2">
														<span className="text-sm font-medium text-green-800 dark:text-green-200">
															#{index + 1}
														</span>
														<span className="text-sm text-green-700 dark:text-green-300">
															{fiber.name}
														</span>
													</div>
													<div className="flex items-center gap-1">
														{[1, 2, 3, 4, 5].map((star) => (
															<Star
																key={star}
																className={`h-3 w-3 fill-current ${
																	(fiber.sustainabilityScore || 0) >= star
																		? "text-yellow-500"
																		: "text-gray-300"
																}`}
															/>
														))}
														<span className="text-xs text-green-600 dark:text-green-400 ml-1">
															{fiber.sustainabilityScore}
														</span>
													</div>
												</div>
											),
										)
									) : (
										<p className="text-sm text-green-600 dark:text-green-400 italic">
											No high-impact fibers yet. Create fibers with 4-5 star
											ratings to see them here.
										</p>
									)}
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Search and Filter Controls */}
			<div className="mb-6 space-y-4">
				<div className="flex flex-wrap items-center gap-4">
					<div className="flex-1 min-w-64">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
							<Input
								placeholder="Search fibers by name, type, or description..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-10"
							/>
							{searchTerm && (
								<Button
									variant="ghost"
									size="sm"
									className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
									onClick={() => setSearchTerm("")}
								>
									<X className="h-4 w-4" />
								</Button>
							)}
						</div>
					</div>

					<Select value={filterType} onValueChange={setFilterType}>
						<SelectTrigger className="w-48">
							<SelectValue placeholder="Filter by type" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Types</SelectItem>
							{fiberTypes.map((type) => (
								<SelectItem key={type.value} value={type.value}>
									{type.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<Select value={filterStatus} onValueChange={setFilterStatus}>
						<SelectTrigger className="w-32">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Status</SelectItem>
							<SelectItem value="active">Active</SelectItem>
							<SelectItem value="inactive">Inactive</SelectItem>
						</SelectContent>
					</Select>

					{/* Sustainability Filter */}
					<Select
						value={filterSustainability}
						onValueChange={setFilterSustainability}
					>
						<SelectTrigger className="w-40">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Sustainability</SelectItem>
							<SelectItem value="high">High Impact (4-5★)</SelectItem>
							<SelectItem value="moderate">Moderate (3★)</SelectItem>
							<SelectItem value="low">Low Impact (1-2★)</SelectItem>
							<SelectItem value="unrated">Unrated</SelectItem>
						</SelectContent>
					</Select>

					{/* Sort Controls */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" size="sm" className="gap-2">
								<ArrowUpDown className="h-4 w-4" />
								Sort:{" "}
								{
									{
										name: "Name",
										type: "Type",
										created: "Created",
										status: "Status",
										sustainability: "Sustainability",
									}[sortBy]
								}
								{sortOrder === "asc" ? (
									<ChevronUp className="h-3 w-3" />
								) : (
									<ChevronDown className="h-3 w-3" />
								)}
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onClick={() => handleSort("name")}>
								Sort by Name{" "}
								{sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => handleSort("type")}>
								Sort by Type{" "}
								{sortBy === "type" && (sortOrder === "asc" ? "↑" : "↓")}
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => handleSort("created")}>
								Sort by Created{" "}
								{sortBy === "created" && (sortOrder === "asc" ? "↑" : "↓")}
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => handleSort("status")}>
								Sort by Status{" "}
								{sortBy === "status" && (sortOrder === "asc" ? "↑" : "↓")}
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => handleSort("sustainability")}>
								Sort by Sustainability{" "}
								{sortBy === "sustainability" &&
									(sortOrder === "asc" ? "↑" : "↓")}
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>

					{/* View Mode Selector */}
					<div className="flex items-center border rounded-lg p-1 bg-gray-50">
						<Button
							variant={viewMode === "list" ? "default" : "ghost"}
							size="sm"
							onClick={() => setViewMode("list")}
							className="h-8 px-3"
						>
							<List className="h-4 w-4" />
						</Button>
						<Button
							variant={viewMode === "grid" ? "default" : "ghost"}
							size="sm"
							onClick={() => setViewMode("grid")}
							className="h-8 px-3"
						>
							<Grid2X2 className="h-4 w-4" />
						</Button>
						<Button
							variant={viewMode === "detailed" ? "default" : "ghost"}
							size="sm"
							onClick={() => setViewMode("detailed")}
							className="h-8 px-3"
						>
							<Layers className="h-4 w-4" />
						</Button>
					</div>
				</div>

				{/* Bulk Operations */}
				{selectedFibers.size > 0 && (
					<div className="flex items-center gap-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
						<span className="text-sm font-medium text-blue-900">
							{selectedFibers.size} fiber{selectedFibers.size === 1 ? "" : "s"}{" "}
							selected
						</span>
						<div className="flex gap-2">
							<Button
								size="sm"
								variant="outline"
								onClick={handleBulkActivate}
								disabled={bulkUpdateMutation.isPending}
							>
								Activate All
							</Button>
							<Button
								size="sm"
								variant="outline"
								onClick={handleBulkDeactivate}
								disabled={bulkUpdateMutation.isPending}
							>
								Deactivate All
							</Button>
							<DeleteConfirmationDialog
								onConfirm={handleBulkDelete}
								title="Delete Multiple Fibers"
								description={`Are you sure you want to delete ${selectedFibers.size} fiber${selectedFibers.size === 1 ? "" : "s"}? This action cannot be undone.`}
								triggerClassName="bg-red-600 hover:bg-red-700 text-white"
								disabled={bulkDeleteMutation.isPending}
							/>
							<Button
								size="sm"
								variant="ghost"
								onClick={() => setSelectedFibers(new Set())}
							>
								Clear Selection
							</Button>
						</div>
					</div>
				)}

				{(searchTerm || filterType !== "all" || filterStatus !== "all") && (
					<div className="flex items-center gap-2">
						<span className="text-sm text-gray-600">Active filters:</span>
						{searchTerm && (
							<Badge variant="secondary" className="flex items-center gap-1">
								Search: "{searchTerm}"
								<X
									className="h-3 w-3 cursor-pointer"
									onClick={() => setSearchTerm("")}
								/>
							</Badge>
						)}
						{filterType !== "all" && (
							<Badge variant="secondary" className="flex items-center gap-1">
								Type: {fiberTypes.find((t) => t.value === filterType)?.label}
								<X
									className="h-3 w-3 cursor-pointer"
									onClick={() => setFilterType("all")}
								/>
							</Badge>
						)}
						{filterStatus !== "all" && (
							<Badge variant="secondary" className="flex items-center gap-1">
								Status: {filterStatus}
								<X
									className="h-3 w-3 cursor-pointer"
									onClick={() => setFilterStatus("all")}
								/>
							</Badge>
						)}
					</div>
				)}
			</div>

			<div className="grid grid-cols-1 gap-8">
				{/* Fibers List */}
				<div>
					<Card>
						<CardHeader>
							<CardTitle className="font-neue-stance flex items-center justify-between">
								<div className="flex items-center gap-3">
									{filteredFibers.length > 0 && (
										<Button
											variant="ghost"
											size="sm"
											onClick={handleSelectAll}
											className="p-1 h-auto"
										>
											{selectedFibers.size === filteredFibers.length &&
											selectedFibers.size > 0 ? (
												<CheckSquare className="h-4 w-4" />
											) : (
												<Square className="h-4 w-4" />
											)}
										</Button>
									)}
									Existing Fibers
								</div>
								<Badge variant="outline">{filteredFibers.length} fibers</Badge>
							</CardTitle>
						</CardHeader>
						<CardContent>
							<FiberList
								isLoading={isLoading}
								fibers={filteredFibers}
								viewMode={viewMode}
								selectedFibers={selectedFibers}
								onSelectFiber={handleSelectFiber}
								onViewDetail={handleViewDetail}
								onEdit={handleEdit}
								onDuplicate={handleDuplicateFiber}
								onDelete={handleDelete}
								searchTerm={searchTerm}
								filterType={filterType}
								filterStatus={filterStatus}
							/>
						</CardContent>
					</Card>
				</div>
			</div>

			{/* Detailed Fiber Profile Dialog */}
			<EnhancedDialog
				open={isDetailDialogOpen}
				onOpenChange={setIsDetailDialogOpen}
			>
				<EnhancedDialogContent contentType="default">
					<EnhancedDialogHeader>
						<EnhancedDialogTitle className="flex items-center gap-3">
							<div className="text-2xl">🧬</div>
							{detailFiber?.name}
							<div className="flex gap-2">
								<Badge
									variant="outline"
									className={`text-xs ${getFiberTypeColor(detailFiber?.type || "")}`}
								>
									{detailFiber?.type
										? detailFiber.type.charAt(0).toUpperCase() +
											detailFiber.type.slice(1)
										: "Unknown"}
								</Badge>
								{detailFiber?.isActive ? (
									<Badge className="text-xs bg-green-100 text-green-700 border border-green-200">
										Active
									</Badge>
								) : (
									<Badge
										variant="secondary"
										className="text-xs bg-gray-100 text-gray-600"
									>
										Inactive
									</Badge>
								)}
							</div>
						</EnhancedDialogTitle>
					</EnhancedDialogHeader>

					<EnhancedDialogBody>
						{detailFiber && (
							<div className="space-y-6">
								{/* Basic Information */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<Card>
										<CardHeader>
											<CardTitle className="text-lg flex items-center gap-2">
												<BarChart3 className="h-5 w-5" />
												Basic Information
											</CardTitle>
										</CardHeader>
										<CardContent className="space-y-4">
											<div>
												<Label className="text-sm font-medium text-gray-600">
													Fiber Name
												</Label>
												<p className="text-base font-medium">
													{detailFiber.name}
												</p>
											</div>
											<div>
												<Label className="text-sm font-medium text-gray-600">
													Type
												</Label>
												<p className="text-base">
													{detailFiber.type.charAt(0).toUpperCase() +
														detailFiber.type.slice(1)}
												</p>
											</div>
											<div>
												<Label className="text-sm font-medium text-gray-600">
													Status
												</Label>
												<p className="text-base">
													{detailFiber.isActive ? "Active" : "Inactive"}
												</p>
											</div>
											{detailFiber.createdAt && (
												<div>
													<Label className="text-sm font-medium text-gray-600">
														Created
													</Label>
													<p className="text-base">
														{new Date(detailFiber.createdAt).toLocaleDateString(
															"en-US",
															{
																year: "numeric",
																month: "long",
																day: "numeric",
																hour: "2-digit",
																minute: "2-digit",
															},
														)}
													</p>
												</div>
											)}
										</CardContent>
									</Card>

									{/* Usage Statistics */}
									<Card>
										<CardHeader>
											<CardTitle className="text-lg flex items-center gap-2">
												<BarChart3 className="h-5 w-5" />
												Usage Statistics
											</CardTitle>
										</CardHeader>
										<CardContent className="space-y-4">
											<div>
												<Label className="text-sm font-medium text-gray-600">
													Properties Count
												</Label>
												<p className="text-2xl font-bold text-blue-600">
													{getPropertiesArray(detailFiber.properties).length}
												</p>
											</div>
											<div>
												<Label className="text-sm font-medium text-gray-600">
													Used in Fabrics
												</Label>
												<p className="text-2xl font-bold text-green-600">0</p>
												<p className="text-xs text-gray-500">
													No fabric usage tracking yet
												</p>
											</div>
											<div>
												<Label className="text-sm font-medium text-gray-600">
													Usage Score
												</Label>
												<div className="flex items-center gap-2">
													<div className="flex-1 bg-gray-200 rounded-full h-2">
														<div className="bg-blue-500 h-2 rounded-full w-0"></div>
													</div>
													<span className="text-sm text-gray-600">0%</span>
												</div>
											</div>
										</CardContent>
									</Card>
								</div>

								{/* Description */}
								{detailFiber.description && (
									<Card>
										<CardHeader>
											<CardTitle className="text-lg">Description</CardTitle>
										</CardHeader>
										<CardContent>
											<p className="text-gray-700 leading-relaxed">
												{detailFiber.description}
											</p>
										</CardContent>
									</Card>
								)}

								{/* Properties */}
								{detailFiber.properties &&
									getPropertiesArray(detailFiber.properties).length > 0 && (
										<Card>
											<CardHeader>
												<CardTitle className="text-lg">
													Properties & Characteristics
												</CardTitle>
											</CardHeader>
											<CardContent>
												<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
													{getPropertiesArray(detailFiber.properties).map(
														(prop: string) => (
															<div
																key={prop}
																className="p-3 bg-gray-50 rounded-lg border"
															>
																<div className="font-medium text-gray-900 text-sm">
																	{prop}
																</div>
															</div>
														),
													)}
												</div>
											</CardContent>
										</Card>
									)}

								{/* Sustainability Assessment */}
								{(detailFiber.sustainabilityScore ||
									detailFiber.environmentalImpact) && (
									<Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
										<CardHeader>
											<CardTitle className="text-lg flex items-center gap-2 text-green-800 dark:text-green-200">
												<div className="w-2 h-2 bg-green-500 rounded-full"></div>
												Sustainability Assessment
											</CardTitle>
										</CardHeader>
										<CardContent className="space-y-4">
											{detailFiber.sustainabilityScore && (
												<div>
													<Label className="text-sm font-medium text-green-700 dark:text-green-300">
														Sustainability Score
													</Label>
													<div className="flex items-center gap-3 mt-2">
														<div className="flex items-center gap-1">
															{[1, 2, 3, 4, 5].map((score) => (
																<Star
																	key={score}
																	className={`h-5 w-5 fill-current ${
																		(detailFiber.sustainabilityScore || 0) >=
																		score
																			? "text-yellow-500"
																			: "text-gray-300"
																	}`}
																/>
															))}
														</div>
														<span className="text-lg font-semibold text-green-700 dark:text-green-300">
															{detailFiber.sustainabilityScore}/5
														</span>
														<Badge
															variant="outline"
															className={`ml-2 ${getSustainabilityBadgeColor(detailFiber.sustainabilityScore)}`}
														>
															{getSustainabilityLabel(
																detailFiber.sustainabilityScore,
															)}
														</Badge>
													</div>
													<p className="text-xs text-green-600 dark:text-green-400 mt-1">
														Environmental sustainability rating from 1 (low
														impact) to 5 (high sustainability)
													</p>
												</div>
											)}

											{detailFiber.environmentalImpact && (
												<div>
													<Label className="text-sm font-medium text-green-700 dark:text-green-300">
														Environmental Impact Notes
													</Label>
													<div className="mt-2 p-3 bg-white dark:bg-green-900 rounded-lg border border-green-200 dark:border-green-700">
														<p className="text-sm text-gray-700 dark:text-green-100 leading-relaxed whitespace-pre-wrap">
															{detailFiber.environmentalImpact}
														</p>
													</div>
												</div>
											)}
										</CardContent>
									</Card>
								)}

								{/* Quick Actions */}
								<Card>
									<CardHeader>
										<CardTitle className="text-lg">Quick Actions</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="flex flex-wrap gap-3">
											<Button
												onClick={() => {
													setIsDetailDialogOpen(false);
													handleEdit(detailFiber);
												}}
											>
												<Edit className="h-4 w-4 mr-2" />
												Edit Fiber
											</Button>
											<Button
												variant="outline"
												onClick={() => {
													setIsDetailDialogOpen(false);
													handleDuplicateFiber(detailFiber);
												}}
											>
												<Copy className="h-4 w-4 mr-2" />
												Duplicate
											</Button>
											<Button
												variant="outline"
												onClick={() => {
													const ids = [detailFiber.id];
													bulkUpdateMutation.mutate({
														ids,
														updates: { isActive: !detailFiber.isActive },
													});
													setIsDetailDialogOpen(false);
												}}
											>
												{detailFiber.isActive ? "Deactivate" : "Activate"}
											</Button>
											<DeleteConfirmationDialog
												onConfirm={() => {
													handleDelete(detailFiber.id);
													setIsDetailDialogOpen(false);
												}}
												title="Delete Fiber"
												description={`Are you sure you want to delete "${detailFiber.name}"? This action cannot be undone.`}
												triggerClassName="bg-red-600 hover:bg-red-700 text-white"
											/>
										</div>
									</CardContent>
								</Card>
							</div>
						)}
					</EnhancedDialogBody>
				</EnhancedDialogContent>
			</EnhancedDialog>

			{/* Create Fiber Modal */}
			<EnhancedDialog
				open={isCreateDialogOpen}
				onOpenChange={setIsCreateDialogOpen}
			>
				<EnhancedDialogContent contentType="form">
					<EnhancedDialogHeader>
						<EnhancedDialogTitle className="font-neue-stance">
							Add New Fiber
						</EnhancedDialogTitle>
						<EnhancedDialogDescription>
							Create a new fiber type for material traceability within fabrics
						</EnhancedDialogDescription>
					</EnhancedDialogHeader>
					<EnhancedDialogBody>
						{renderFiberForm(handleSubmit)}
					</EnhancedDialogBody>
					<EnhancedDialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => {
								setIsCreateDialogOpen(false);
								resetForm();
							}}
						>
							Cancel
						</Button>
						<Button
							onClick={(e) => {
								e.preventDefault();
								handleSubmit(e as any);
							}}
							disabled={createFiberMutation.isPending}
						>
							{createFiberMutation.isPending ? "Creating..." : "Create Fiber"}
						</Button>
					</EnhancedDialogFooter>
				</EnhancedDialogContent>
			</EnhancedDialog>

			{/* Edit Fiber Modal */}
			<EnhancedDialog
				open={isEditDialogOpen}
				onOpenChange={setIsEditDialogOpen}
			>
				<EnhancedDialogContent contentType="form">
					<EnhancedDialogHeader>
						<EnhancedDialogTitle className="font-neue-stance">
							Edit Fiber
						</EnhancedDialogTitle>
						<EnhancedDialogDescription>
							Update fiber information and properties
						</EnhancedDialogDescription>
					</EnhancedDialogHeader>
					<EnhancedDialogBody>
						{renderFiberForm(handleEditSubmit)}
					</EnhancedDialogBody>
					<EnhancedDialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => {
								setIsEditDialogOpen(false);
								setEditingFiber(null);
								resetForm();
							}}
						>
							Cancel
						</Button>
						<Button
							onClick={(e) => {
								e.preventDefault();
								handleEditSubmit(e as any);
							}}
							disabled={updateFiberMutation.isPending}
						>
							{updateFiberMutation.isPending ? "Updating..." : "Update Fiber"}
						</Button>
					</EnhancedDialogFooter>
				</EnhancedDialogContent>
			</EnhancedDialog>

			{/* Keyboard Shortcuts Help */}
			<div className="fixed bottom-4 right-4 z-modal">
				// Note: Original file content is large, applying targeted replacement
				<div className="bg-black/75 text-white text-xs px-3 py-2 rounded-lg">
					<div className="space-y-1">
						<div>
							<kbd className="bg-gray-700 px-1 rounded">Ctrl+A</kbd> Select All
						</div>
						<div>
							<kbd className="bg-gray-700 px-1 rounded">Ctrl+N</kbd> New Fiber
						</div>
						<div>
							<kbd className="bg-gray-700 px-1 rounded">Del</kbd> Delete
							Selected
						</div>
						<div>
							<kbd className="bg-gray-700 px-1 rounded">1/2/3</kbd> Switch Views
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
