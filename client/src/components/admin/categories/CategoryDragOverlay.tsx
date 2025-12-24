import type { Category } from "@shared/schema";
import { Package } from "lucide-react";

interface CategoryDragOverlayProps {
	category: Category;
}

export default function CategoryDragOverlay({
	category,
}: CategoryDragOverlayProps) {
	return (
		<div className="p-3 bg-white border border-blue-300 rounded-lg shadow-lg opacity-95 transform rotate-3">
			<div className="flex items-center gap-2">
				<div className="w-8 h-8 bg-neutral-100 rounded overflow-hidden shrink-0">
					{category.primaryImageId ? (
						<img
							src={`/api/media/${category.primaryImageId}/content`}
							alt={category.name}
							className="w-full h-full object-cover"
						/>
					) : (
						<div className="w-full h-full bg-neutral-200 flex items-center justify-center">
							<Package className="w-4 h-4 text-neutral-400" />
						</div>
					)}
				</div>
				<div className="min-w-0 flex-1">
					<div className="font-medium text-sm text-neutral-900 truncate">
						{category.name}
					</div>
					<div className="text-xs text-neutral-500">/{category.slug}</div>
				</div>
			</div>
		</div>
	);
}
