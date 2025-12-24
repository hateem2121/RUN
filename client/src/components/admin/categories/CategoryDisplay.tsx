import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Category } from "@shared/schema";
import {
	ChevronDown,
	ChevronRight,
	Edit2,
	GripVertical,
	Image,
	MoreVertical,
	Package,
	Trash2,
} from "lucide-react";
import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Unified props interface for all display modes
interface CategoryDisplayProps {
	category: Category;
	mode: "table" | "grid" | "tree";
	isSelected: boolean;
	isExpanded?: boolean;
	depth?: number;
	productCount: number;
	parentName?: string;
	isLoading?: boolean;
	onToggleSelection: (id: number) => void;
	onToggleExpanded?: (id: number) => void;
	onEdit: (category: Category) => void;
	onDelete: (category: Category) => void;
	// Drag and drop props
	isDragging?: boolean;
	enableDragDrop?: boolean;
}

// Helper functions
const getProductCountColor = (count: number) => {
	if (count === 0) return "bg-gray-100 text-gray-600";
	if (count <= 10) return "bg-blue-100 text-blue-700";
	if (count <= 50) return "bg-green-100 text-green-700";
	return "bg-purple-100 text-purple-700";
};

const CategoryImage = memo(({ category }: { category: Category }) => (
	<div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden shrink-0">
		{category.primaryImageId ? (
			<img
				src={`/api/media/${category.primaryImageId}`}
				alt={category.name}
				className="w-full h-full object-cover"
				onError={(e) => {
					const target = e.currentTarget;
					target.style.display = "none";
					const parent = target.parentElement!;
					parent.innerHTML =
						'<div class="w-full h-full flex items-center justify-center text-gray-400"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';
				}}
			/>
		) : (
			<div className="w-full h-full flex items-center justify-center text-gray-400">
				<Image className="w-5 h-5" />
			</div>
		)}
	</div>
));

const CategoryActions = memo(
	({
		category,
		onEdit,
		onDelete,
		isLoading,
	}: {
		category: Category;
		onEdit: (category: Category) => void;
		onDelete: (category: Category) => void;
		isLoading?: boolean;
	}) => (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					size="sm"
					variant="ghost"
					className="h-8 w-8 p-0"
					disabled={isLoading}
				>
					<MoreVertical className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem onClick={() => onEdit(category)}>
					<Edit2 className="h-4 w-4 mr-2" />
					Edit
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={() => onDelete(category)}
					className="text-red-600 focus:text-red-600"
				>
					<Trash2 className="h-4 w-4 mr-2" />
					Delete
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	),
);

// Table row display
const CategoryTableRow = memo((props: CategoryDisplayProps) => {
	const {
		category,
		isSelected,
		productCount,
		parentName,
		isLoading,
		onToggleSelection,
		onEdit,
		onDelete,
		enableDragDrop = true,
	} = props;

	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({
		id: category.id,
		disabled: !enableDragDrop,
	});

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	return (
		<tr
			ref={setNodeRef}
			style={style}
			className={`
        group transition-colors hover:bg-gray-50 
        ${isSelected ? "bg-blue-50" : ""}
        ${isDragging ? "opacity-50 bg-blue-100 border-2 border-blue-300 border-dashed" : ""}
      `}
		>
			<td className="w-12 px-4 py-3">
				<div className="flex items-center gap-2">
					{enableDragDrop && (
						<button
							className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 transition-colors"
							{...attributes}
							{...listeners}
							title="Drag to reorder"
						>
							<GripVertical className="h-4 w-4" />
						</button>
					)}
					<Checkbox
						checked={isSelected}
						onCheckedChange={() => onToggleSelection(category.id)}
						disabled={isLoading}
					/>
				</div>
			</td>
			<td className="px-4 py-3">
				<CategoryImage category={category} />
			</td>
			<td className="px-4 py-3">
				<div className="flex flex-col">
					<span className="font-medium text-gray-900">{category.name}</span>
					<span className="text-sm text-gray-500">{category.slug}</span>
				</div>
			</td>
			<td className="px-4 py-3">
				<span className="text-sm text-gray-600">
					{parentName || "No parent"}
				</span>
			</td>
			<td className="px-4 py-3">
				<Badge className={getProductCountColor(productCount)}>
					{productCount}
				</Badge>
			</td>
			<td className="px-4 py-3">
				<Badge variant={category.isActive ? "default" : "secondary"}>
					{category.isActive ? "Active" : "Inactive"}
				</Badge>
			</td>
			<td className="px-4 py-3">
				<CategoryActions
					category={category}
					onEdit={onEdit}
					onDelete={onDelete}
					isLoading={isLoading}
				/>
			</td>
		</tr>
	);
});

// Grid card display
const CategoryGridCard = memo((props: CategoryDisplayProps) => {
	const {
		category,
		isSelected,
		productCount,
		isLoading,
		onToggleSelection,
		onEdit,
		onDelete,
		enableDragDrop = true,
	} = props;

	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({
		id: category.id,
		disabled: !enableDragDrop,
	});

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	return (
		<Card
			ref={setNodeRef}
			style={style}
			className={`
        group transition-all hover:shadow-md 
        ${isSelected ? "ring-2 ring-blue-500 bg-blue-50" : ""}
        ${isDragging ? "opacity-50 ring-2 ring-blue-300 ring-dashed shadow-lg scale-105" : ""}
      `}
		>
			<CardContent className="p-4">
				<div className="space-y-3">
					<div className="flex items-start justify-between">
						<div className="flex items-center gap-2">
							<Checkbox
								checked={isSelected}
								onCheckedChange={() => onToggleSelection(category.id)}
								disabled={isLoading}
							/>
							{enableDragDrop && (
								<button
									className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 transition-colors p-1"
									{...attributes}
									{...listeners}
									title="Drag to reorder"
								>
									<GripVertical className="h-4 w-4" />
								</button>
							)}
						</div>
						<CategoryActions
							category={category}
							onEdit={onEdit}
							onDelete={onDelete}
							isLoading={isLoading}
						/>
					</div>

					<div className="flex items-center space-x-3">
						<CategoryImage category={category} />
						<div className="flex-1 min-w-0">
							<h3 className="font-medium text-gray-900 truncate">
								{category.name}
							</h3>
							<p className="text-sm text-gray-500 truncate">{category.slug}</p>
						</div>
					</div>

					<div className="space-y-2">
						{category.description && (
							<p className="text-sm text-gray-600 line-clamp-2">
								{category.description}
							</p>
						)}

						<div className="flex items-center justify-between">
							<Badge className={getProductCountColor(productCount)}>
								<Package className="w-3 h-3 mr-1" />
								{productCount}
							</Badge>
							<Badge variant={category.isActive ? "default" : "secondary"}>
								{category.isActive ? "Active" : "Inactive"}
							</Badge>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
});

// Tree item display
const CategoryTreeItem = memo((props: CategoryDisplayProps) => {
	const {
		category,
		isSelected,
		isExpanded,
		depth = 0,
		productCount,
		isLoading,
		onToggleSelection,
		onToggleExpanded,
		onEdit,
		onDelete,
		enableDragDrop = true,
	} = props;

	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({
		id: category.id,
		disabled: !enableDragDrop,
	});

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	const hasChildren = false; // Would be passed from parent component
	const indent = depth * 24;

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={`
        group flex items-center p-2 rounded-lg transition-colors
        hover:bg-gray-50 
        ${isSelected ? "bg-blue-50" : ""}
        ${isDragging ? "opacity-50 bg-blue-100 border-2 border-blue-300 border-dashed scale-105" : ""}
      `}
			data-depth={depth}
		>
			{/* Expand/collapse button */}
			{hasChildren && onToggleExpanded ? (
				<Button
					size="sm"
					variant="ghost"
					className="h-6 w-6 p-0 mr-2"
					onClick={() => onToggleExpanded(category.id)}
				>
					{isExpanded ? (
						<ChevronDown className="h-4 w-4" />
					) : (
						<ChevronRight className="h-4 w-4" />
					)}
				</Button>
			) : (
				<div className="w-8" />
			)}

			{/* Drag handle and Checkbox */}
			<div
				className="flex items-center gap-2 mr-3"
				style={{ paddingLeft: `${indent}px` }}
			>
				{enableDragDrop && (
					<button
						className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 transition-colors p-1"
						{...attributes}
						{...listeners}
						title="Drag to reorder"
					>
						<GripVertical className="h-4 w-4" />
					</button>
				)}
				<Checkbox
					checked={isSelected}
					onCheckedChange={() => onToggleSelection(category.id)}
					disabled={isLoading}
				/>
			</div>

			{/* Category info */}
			<div className="flex items-center flex-1 min-w-0">
				<CategoryImage category={category} />
				<div className="ml-3 flex-1 min-w-0">
					<div className="flex items-center space-x-2">
						<span className="font-medium text-gray-900 truncate">
							{category.name}
						</span>
						<Badge className={getProductCountColor(productCount)}>
							{productCount}
						</Badge>
						<Badge
							variant={category.isActive ? "default" : "secondary"}
							className="text-xs"
						>
							{category.isActive ? "Active" : "Inactive"}
						</Badge>
					</div>
					<p className="text-sm text-gray-500 truncate">{category.slug}</p>
				</div>
			</div>

			{/* Actions */}
			<div className="opacity-0 group-hover:opacity-100 transition-opacity">
				<CategoryActions
					category={category}
					onEdit={onEdit}
					onDelete={onDelete}
					isLoading={isLoading}
				/>
			</div>
		</div>
	);
});

// Main display component
const CategoryDisplay = memo(function CategoryDisplay(
	props: CategoryDisplayProps,
) {
	switch (props.mode) {
		case "grid":
			return <CategoryGridCard {...props} />;
		case "tree":
			return <CategoryTreeItem {...props} />;
		default:
			return <CategoryTableRow {...props} />;
	}
});

export default CategoryDisplay;

// Export individual components for specific use cases
export { CategoryTableRow, CategoryGridCard, CategoryTreeItem };
