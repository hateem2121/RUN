import type { HomepageSection } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { Save, X } from "lucide-react";
import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { apiRequest, getQueryClient } from "@/lib/queryClient";

interface HomepageSectionsManagerProps {
	readonly sections: HomepageSection[];
}

export function HomepageSectionsManager({
	sections,
}: Readonly<HomepageSectionsManagerProps>) {
	const [editingSectionId, setEditingSectionId] = useState<number | null>(null);
	const [editSectionForm, setEditSectionForm] = useState<{
		title: string;
		description: string; // Single field for content/subtitle
		data: Record<string, any>; // Generic data field for section-specific settings
	}>({
		title: "",
		description: "",
		data: {},
	});

	const updateSectionMutation = useMutation({
		mutationFn: async ({
			id,
			data,
		}: {
			id: number;
			data: Partial<HomepageSection>;
		}) => {
			return await apiRequest(`/api/homepage-sections/${id}`, {
				method: "PATCH",
				body: data,
			});
		},
		onMutate: async ({ id, data }) => {
			// Cancel outgoing queries
			await getQueryClient().cancelQueries({
				queryKey: ["/api/homepage-sections"],
			});

			// Snapshot previous value
			const previousSections = getQueryClient().getQueryData([
				"/api/homepage-sections",
			]);

			// Optimistically update
			getQueryClient().setQueryData<HomepageSection[]>(
				["/api/homepage-sections"],
				(old) => {
					if (!Array.isArray(old)) return old;
					return old.map((section: HomepageSection) =>
						section.id === id ? { ...section, ...data } : section,
					);
				},
			);

			return { previousSections };
		},
		onError: (_err, _variables, context) => {
			if (context?.previousSections) {
				getQueryClient().setQueryData(
					["/api/homepage-sections"],
					context.previousSections,
				);
			}
			toast({
				title: "Error",
				description: "Failed to update section. Please try again.",
				variant: "destructive",
			});
		},
		onSuccess: () => {
			getQueryClient().invalidateQueries({
				queryKey: ["/api/homepage-sections"],
			});
			getQueryClient().invalidateQueries({ queryKey: ["/api/homepage-batch"] });
			setEditingSectionId(null);
			toast({
				title: "Success",
				description: "Section updated successfully",
			});
		},
	});

	const handleEditSection = (section: HomepageSection) => {
		setEditSectionForm({
			title: section.title || "",
			description: section.content || "",
			data: section.data || {},
		});
		setEditingSectionId(section.id);
	};

	const handleSaveSection = (section: HomepageSection) => {
		// Client-side validation prevents ID/name confusion reaching backend.
		if (typeof section.id !== "number" || !Number.isFinite(section.id)) {
			toast({
				title: "Error",
				description: "Invalid section ID - cannot save changes",
				variant: "destructive",
			});
			return;
		}

		const updateData: Partial<HomepageSection> = {
			title: editSectionForm.title,
			// Update content field
			content: editSectionForm.description,
			data: editSectionForm.data,
		};

		updateSectionMutation.mutate({ id: section.id, data: updateData });
	};

	const handleToggleSection = (section: HomepageSection) => {
		// Client-side validation prevents ID/name confusion reaching backend.
		if (typeof section.id !== "number" || !Number.isFinite(section.id)) {
			toast({
				title: "Error",
				description: "Invalid section ID - cannot toggle",
				variant: "destructive",
			});
			return;
		}

		updateSectionMutation.mutate({
			id: section.id,
			data: { isActive: !section.isActive },
		});
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Homepage Sections</CardTitle>
				<CardDescription>
					Enable/disable and configure various homepage sections
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-6">
					{sections.map((section) => (
						<div key={section.id} className="p-4 border rounded-lg space-y-4">
							<div className="flex items-center justify-between">
								<div className="flex-1">
									{editingSectionId === section.id ? (
										// Edit Mode
										<div className="space-y-3">
											<div>
												<Label htmlFor={`section-title-${section.id}`}>
													Section Title
												</Label>
												<Input
													id={`section-title-${section.id}`}
													value={editSectionForm.title}
													onChange={(e) =>
														setEditSectionForm({
															...editSectionForm,
															title: e.target.value,
														})
													}
													placeholder="Enter section title"
												/>
											</div>
											<div>
												<Label htmlFor={`section-description-${section.id}`}>
													Content
												</Label>
												<Textarea
													id={`section-description-${section.id}`}
													value={editSectionForm.description}
													onChange={(e) =>
														setEditSectionForm({
															...editSectionForm,
															description: e.target.value,
														})
													}
													placeholder="Enter section content"
													rows={3}
												/>
											</div>

											<div className="flex items-center gap-2">
												<Button
													size="sm"
													onClick={(e) => {
														e.preventDefault();
														e.stopPropagation();
														handleSaveSection(section);
													}}
													disabled={updateSectionMutation.isPending}
												>
													<Save className="h-4 w-4 mr-1" />
													Save
												</Button>
												<Button
													variant="ghost"
													size="sm"
													onClick={() => setEditingSectionId(null)}
												>
													<X className="h-4 w-4 mr-1" />
													Cancel
												</Button>
											</div>
										</div>
									) : (
										// View Mode
										<div>
											<h3 className="font-semibold text-lg">
												{section.title || section.name}
											</h3>
											<p className="text-sm text-muted-foreground mt-1">
												{section.content || "No description"}
											</p>
											<Button
												variant="ghost"
												size="sm"
												className="mt-2"
												onClick={() => handleEditSection(section)}
											>
												Edit
											</Button>
										</div>
									)}
								</div>
								<div className="flex items-center gap-3">
									<span className="text-sm text-muted-foreground">
										{section.isActive ? "Active" : "Inactive"}
									</span>
									<Switch
										checked={section.isActive ?? false}
										onCheckedChange={() => handleToggleSection(section)}
									/>
								</div>
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
