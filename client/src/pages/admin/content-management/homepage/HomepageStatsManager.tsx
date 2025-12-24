import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { HomepageSection } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { GripVertical, Plus, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { apiRequest, getQueryClient } from "@/lib/queryClient";

interface StatItem {
	id: string;
	value: string;
	label: string;
	description: string;
}

interface HomepageStatsManagerProps {
	sectionData?: HomepageSection;
	onUpdateSection?: (params: {
		id: number;
		data: Partial<HomepageSection>;
	}) => void;
}

const SortableStatItem = ({
	item,
	index,
	updateItem,
	removeItem,
}: {
	item: StatItem;
	index: number;
	updateItem: (index: number, field: keyof StatItem, value: string) => void;
	removeItem: (index: number) => void;
}) => {
	const { attributes, listeners, setNodeRef, transform, transition } =
		useSortable({ id: item.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className="flex gap-4 items-start border p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50"
		>
			<div
				{...attributes}
				{...listeners}
				className="mt-2 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
			>
				<GripVertical className="h-5 w-5" />
			</div>
			<div className="flex-1 grid gap-4">
				<div className="grid grid-cols-2 gap-4">
					<div>
						<Label>Value</Label>
						<Input
							value={item.value}
							onChange={(e) => updateItem(index, "value", e.target.value)}
							placeholder="e.g. 135"
						/>
					</div>
					<div>
						<Label>Label</Label>
						<Input
							value={item.label}
							onChange={(e) => updateItem(index, "label", e.target.value)}
							placeholder="e.g. Years of Heritage"
						/>
					</div>
				</div>
				<div>
					<Label>Description</Label>
					<Input
						value={item.description}
						onChange={(e) => updateItem(index, "description", e.target.value)}
						placeholder="Legacy defining craftsmanship..."
					/>
				</div>
			</div>
			<Button
				variant="ghost"
				size="icon"
				onClick={() => removeItem(index)}
				className="text-red-500 hover:text-red-700 hover:bg-red-50"
			>
				<Trash className="h-4 w-4" />
			</Button>
		</div>
	);
};

export function HomepageStatsManager({
	sectionData,
	onUpdateSection,
}: HomepageStatsManagerProps) {
	const [stats, setStats] = useState<StatItem[]>([]);

	useEffect(() => {
		if (sectionData?.data && Array.isArray(sectionData.data.stats)) {
			setStats(sectionData.data.stats);
		} else {
			// Default initialization if empty
			setStats([
				{
					id: "1",
					value: "135",
					label: "Years of Heritage",
					description: "Legacy defining craftsmanship since 1889.",
				},
				{
					id: "2",
					value: "200+",
					label: "Master Artisans",
					description: "Dedicated specialists in technical apparel.",
				},
				{
					id: "3",
					value: "100K",
					label: "Monthly Capacity",
					description: "Units produced with precision engineering.",
				},
			]);
		}
	}, [sectionData]);

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		if (over && active.id !== over.id) {
			setStats((items) => {
				const oldIndex = items.findIndex((item) => item.id === active.id);
				const newIndex = items.findIndex((item) => item.id === over.id);
				return arrayMove(items, oldIndex, newIndex);
			});
		}
	};

	const updateStatsMutation = useMutation({
		mutationFn: async (updatedStats: StatItem[]) => {
			if (!sectionData) return;
			return await apiRequest(`/api/homepage-sections/${sectionData.id}`, {
				method: "PATCH",
				body: { data: { ...sectionData.data, stats: updatedStats } },
			});
		},
		onSuccess: () => {
			getQueryClient().invalidateQueries({
				queryKey: ["/api/homepage-sections"],
			});
			toast({ title: "Success", description: "Stats updated successfully" });
		},
		onError: () => {
			toast({
				title: "Error",
				description: "Failed to update stats",
				variant: "destructive",
			});
		},
	});

	const handleAddItem = () => {
		setStats([
			...stats,
			{
				id: crypto.randomUUID(),
				value: "0",
				label: "New Stat",
				description: "Description",
			},
		]);
	};

	const handleUpdateItem = (
		index: number,
		field: keyof StatItem,
		value: string,
	) => {
		const newStats = [...stats];
		newStats[index] = { ...newStats[index], [field]: value } as StatItem;
		setStats(newStats);
	};

	const handleRemoveItem = (index: number) => {
		const newStats = stats.filter((_, i) => i !== index);
		setStats(newStats);
	};

	const handleSave = () => {
		updateStatsMutation.mutate(stats);
	};

	return (
		<div className="space-y-6">
			{sectionData && (
				<Card>
					<CardHeader>
						<CardTitle>Section Settings</CardTitle>
						<CardDescription>
							Manage visibility for the Stats section.
						</CardDescription>
					</CardHeader>
					<CardContent className="flex items-center justify-between">
						<Label>Visibility</Label>
						<Switch
							checked={sectionData.isActive ?? true}
							onCheckedChange={(checked) =>
								onUpdateSection?.({
									id: sectionData.id,
									data: { isActive: checked },
								})
							}
						/>
					</CardContent>
				</Card>
			)}

			<Card>
				<CardHeader>
					<CardTitle>Key Statistics</CardTitle>
					<CardDescription>
						Manage the numbers and labels displayed in the scrolling stats
						section.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<DndContext
						sensors={sensors}
						collisionDetection={closestCenter}
						onDragEnd={handleDragEnd}
					>
						<SortableContext
							items={stats}
							strategy={verticalListSortingStrategy}
						>
							<div className="space-y-4">
								{stats.map((stat, index) => (
									<SortableStatItem
										key={stat.id}
										item={stat}
										index={index}
										updateItem={handleUpdateItem}
										removeItem={handleRemoveItem}
									/>
								))}
							</div>
						</SortableContext>
					</DndContext>

					<Button
						variant="outline"
						onClick={handleAddItem}
						className="w-full border-dashed"
					>
						<Plus className="mr-2 h-4 w-4" /> Add Statistic
					</Button>

					<div className="flex justify-end pt-4">
						<Button
							onClick={handleSave}
							disabled={updateStatsMutation.isPending}
						>
							{updateStatsMutation.isPending ? "Saving..." : "Save Stats"}
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
