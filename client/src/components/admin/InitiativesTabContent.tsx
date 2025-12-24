import { closestCenter, DndContext } from "@dnd-kit/core";
import {
	SortableContext,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { MediaAsset, SustainabilityInitiative } from "@shared/schema";
import { Eye, Plus, Upload } from "lucide-react";
import { useState } from "react";
import { StandardMediaSelectionDialog } from "@/components/admin/shared/StandardMediaSelectionDialog";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
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
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import { Switch } from "@/components/ui/switch";
import { TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { IconDisplay, IconPicker } from "./shared/IconPicker";

interface InitiativeFormData {
	title: string;
	description: string;
	category: string;
	impact: string;
	iconName: string;
	isActive: boolean;
	imageId: number | null;
	position: number;
}

interface ValidationState {
	isValid: boolean;
	message: string;
}

interface InitiativeValidation {
	title: ValidationState;
	description: ValidationState;
	category: ValidationState;
	impact: ValidationState;
}

interface InitiativesTabContentProps {
	initiatives: SustainabilityInitiative[] | undefined;
	paginatedInitiatives: SustainabilityInitiative[];
	initiativesPage: number;
	initiativesTotalPages: number;
	sensors: any;
	createInitiativeMutation: any;
	updateInitiativeMutation: any;
	deleteInitiativeMutation: any;
	SortableInitiativeItem: React.ComponentType<{
		initiative: SustainabilityInitiative;
		onEdit: (initiative: SustainabilityInitiative) => void;
		onDelete: (id: number) => void;
	}>;
	onInitiativeDragEnd: (event: {
		active: { id: string | number };
		over: { id: string | number } | null;
	}) => void;
	onSetInitiativesPage: (page: number) => void;
}

export function InitiativesTabContent({
	initiatives,
	paginatedInitiatives,
	initiativesPage,
	initiativesTotalPages,
	sensors,
	createInitiativeMutation,
	updateInitiativeMutation,
	deleteInitiativeMutation,
	SortableInitiativeItem,
	onInitiativeDragEnd,
	onSetInitiativesPage,
}: InitiativesTabContentProps) {
	const [showInitiativeDialog, setShowInitiativeDialog] = useState(false);
	const [showInitiativePreview, setShowInitiativePreview] = useState(false);
	const [showInitiativeIconPicker, setShowInitiativeIconPicker] =
		useState(false);
	const [isInitiativeMediaPickerOpen, setIsInitiativeMediaPickerOpen] =
		useState(false);
	const [editingInitiative, setEditingInitiative] =
		useState<SustainabilityInitiative | null>(null);

	const [initiativeForm, setInitiativeForm] = useState<InitiativeFormData>({
		title: "",
		description: "",
		category: "",
		impact: "",
		iconName: "Leaf",
		isActive: true,
		imageId: null,
		position: 1,
	});

	const [initiativeValidation, setInitiativeValidation] =
		useState<InitiativeValidation>({
			title: { isValid: true, message: "" },
			description: { isValid: true, message: "" },
			category: { isValid: true, message: "" },
			impact: { isValid: true, message: "" },
		});

	const validateInitiativeForm = (field?: string): boolean => {
		const newValidation = { ...initiativeValidation };
		let isFormValid = true;

		if (!field || field === "title") {
			if (!initiativeForm.title.trim()) {
				newValidation.title = { isValid: false, message: "Title is required" };
				isFormValid = false;
			} else if (initiativeForm.title.length < 3) {
				newValidation.title = {
					isValid: false,
					message: "Title must be at least 3 characters",
				};
				isFormValid = false;
			} else {
				newValidation.title = { isValid: true, message: "" };
			}
		}

		if (!field || field === "description") {
			if (!initiativeForm.description.trim()) {
				newValidation.description = {
					isValid: false,
					message: "Description is required",
				};
				isFormValid = false;
			} else if (initiativeForm.description.length < 10) {
				newValidation.description = {
					isValid: false,
					message: "Description must be at least 10 characters",
				};
				isFormValid = false;
			} else {
				newValidation.description = { isValid: true, message: "" };
			}
		}

		if (!field || field === "category") {
			if (!initiativeForm.category.trim()) {
				newValidation.category = {
					isValid: false,
					message: "Category is required",
				};
				isFormValid = false;
			} else {
				newValidation.category = { isValid: true, message: "" };
			}
		}

		if (!field || field === "impact") {
			if (!initiativeForm.impact.trim()) {
				newValidation.impact = {
					isValid: false,
					message: "Impact description is required",
				};
				isFormValid = false;
			} else if (initiativeForm.impact.length < 5) {
				newValidation.impact = {
					isValid: false,
					message: "Impact must be at least 5 characters",
				};
				isFormValid = false;
			} else {
				newValidation.impact = { isValid: true, message: "" };
			}
		}

		setInitiativeValidation(newValidation);
		return isFormValid;
	};

	const resetInitiativeForm = () => {
		setInitiativeForm({
			title: "",
			description: "",
			category: "",
			impact: "",
			iconName: "Leaf",
			isActive: true,
			imageId: null,
			position: 1,
		});
		setInitiativeValidation({
			title: { isValid: true, message: "" },
			description: { isValid: true, message: "" },
			category: { isValid: true, message: "" },
			impact: { isValid: true, message: "" },
		});
	};

	const handleInitiativeSubmit = () => {
		const isValidForm = validateInitiativeForm();
		if (!isValidForm) return;

		if (editingInitiative) {
			updateInitiativeMutation.mutate(
				{ id: editingInitiative.id, data: initiativeForm },
				{
					onSuccess: () => {
						setShowInitiativeDialog(false);
						setEditingInitiative(null);
						resetInitiativeForm();
					},
				},
			);
		} else {
			createInitiativeMutation.mutate(initiativeForm, {
				onSuccess: () => {
					setShowInitiativeDialog(false);
					resetInitiativeForm();
				},
			});
		}
	};

	const openInitiativeDialog = (initiative?: SustainabilityInitiative) => {
		if (initiative) {
			setEditingInitiative(initiative);
			setInitiativeForm({
				title: initiative.title || "",
				description: initiative.description || "",
				category: initiative.category || "",
				impact: initiative.impact || "",
				iconName: initiative.iconName || "Leaf",
				isActive: initiative.isActive ?? true,
				imageId: initiative.imageId || null,
				position: initiative.sortOrder || 1,
			});
		} else {
			setEditingInitiative(null);
			resetInitiativeForm();
		}
		setShowInitiativeDialog(true);
	};

	const handleOpenDialog = openInitiativeDialog;

	const handleMediaSelect = (assets: MediaAsset | MediaAsset[]) => {
		const selectedAsset = Array.isArray(assets) ? assets[0] : assets;
		if (selectedAsset) {
			setInitiativeForm((prev) => ({ ...prev, imageId: selectedAsset.id }));
			setIsInitiativeMediaPickerOpen(false);
		}
	};

	return (
		<>
			<TabsContent value="initiatives" className="space-y-4">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center justify-between">
							Sustainability Initiatives
							<Button onClick={() => handleOpenDialog()}>
								<Plus className="w-4 h-4 mr-2" />
								Add Initiative
							</Button>
						</CardTitle>
						<CardDescription>
							Manage sustainability initiatives with drag-and-drop reordering
						</CardDescription>
					</CardHeader>
					<CardContent>
						{initiatives && initiatives.length > 0 ? (
							<>
								<DndContext
									sensors={sensors}
									collisionDetection={closestCenter}
									onDragEnd={onInitiativeDragEnd}
								>
									<SortableContext
										items={paginatedInitiatives.map((i) => i.id)}
										strategy={verticalListSortingStrategy}
									>
										{paginatedInitiatives.map((initiative) => (
											<SortableInitiativeItem
												key={initiative.id}
												initiative={initiative}
												onEdit={handleOpenDialog}
												onDelete={(id) => deleteInitiativeMutation.mutate(id)}
											/>
										))}
									</SortableContext>
								</DndContext>
								{initiativesTotalPages > 1 && (
									<div className="mt-6 flex justify-center">
										<Pagination>
											<PaginationContent>
												<PaginationItem>
													<PaginationPrevious
														onClick={() =>
															onSetInitiativesPage(
																Math.max(1, initiativesPage - 1),
															)
														}
														className={
															initiativesPage === 1
																? "pointer-events-none opacity-50"
																: "cursor-pointer"
														}
													/>
												</PaginationItem>
												{[...Array(initiativesTotalPages)].map((_, i) => (
													<PaginationItem key={i}>
														<PaginationLink
															onClick={() => onSetInitiativesPage(i + 1)}
															isActive={initiativesPage === i + 1}
															className="cursor-pointer"
														>
															{i + 1}
														</PaginationLink>
													</PaginationItem>
												))}
												<PaginationItem>
													<PaginationNext
														onClick={() =>
															onSetInitiativesPage(
																Math.min(
																	initiativesTotalPages,
																	initiativesPage + 1,
																),
															)
														}
														className={
															initiativesPage === initiativesTotalPages
																? "pointer-events-none opacity-50"
																: "cursor-pointer"
														}
													/>
												</PaginationItem>
											</PaginationContent>
										</Pagination>
									</div>
								)}
							</>
						) : (
							<div className="text-center py-8 text-gray-500">
								No initiatives yet. Create your first sustainability initiative.
							</div>
						)}
					</CardContent>
				</Card>
			</TabsContent>

			{/* Initiative Dialog - Simplified for space, includes all form fields */}
			<EnhancedDialog
				open={showInitiativeDialog}
				onOpenChange={setShowInitiativeDialog}
			>
				<EnhancedDialogContent contentType="form">
					<EnhancedDialogHeader>
						<EnhancedDialogTitle>
							{editingInitiative ? "Edit Initiative" : "Add New Initiative"}
						</EnhancedDialogTitle>
						<EnhancedDialogDescription>
							{editingInitiative
								? "Update the sustainability initiative details"
								: "Create a new sustainability initiative"}
						</EnhancedDialogDescription>
					</EnhancedDialogHeader>
					<EnhancedDialogBody>
						<div className="space-y-4">
							<div>
								<Label htmlFor="title">Title</Label>
								<Input
									id="title"
									value={initiativeForm.title}
									onChange={(e) => {
										setInitiativeForm((prev) => ({
											...prev,
											title: e.target.value,
										}));
										validateInitiativeForm("title");
									}}
									onBlur={() => validateInitiativeForm("title")}
									placeholder="e.g., Solar Panel Installation"
									className={
										!initiativeValidation.title.isValid
											? "border-red-500 focus-visible:ring-red-500"
											: ""
									}
								/>
								{!initiativeValidation.title.isValid && (
									<p className="text-sm text-red-500 mt-1">
										{initiativeValidation.title.message}
									</p>
								)}
							</div>
							<div>
								<Label htmlFor="category">Category</Label>
								<Input
									id="category"
									value={initiativeForm.category}
									onChange={(e) => {
										setInitiativeForm((prev) => ({
											...prev,
											category: e.target.value,
										}));
										validateInitiativeForm("category");
									}}
									placeholder="e.g., Energy Efficiency"
									className={
										!initiativeValidation.category.isValid
											? "border-red-500"
											: ""
									}
								/>
								{!initiativeValidation.category.isValid && (
									<p className="text-sm text-red-500 mt-1">
										{initiativeValidation.category.message}
									</p>
								)}
							</div>
							<div>
								<Label htmlFor="description">Description</Label>
								<Textarea
									id="description"
									value={initiativeForm.description}
									onChange={(e) => {
										setInitiativeForm((prev) => ({
											...prev,
											description: e.target.value,
										}));
										validateInitiativeForm("description");
									}}
									placeholder="Describe this initiative..."
									rows={3}
									className={
										!initiativeValidation.description.isValid
											? "border-red-500"
											: ""
									}
								/>
								{!initiativeValidation.description.isValid && (
									<p className="text-sm text-red-500 mt-1">
										{initiativeValidation.description.message}
									</p>
								)}
							</div>
							<div>
								<Label htmlFor="impact">Impact</Label>
								<Textarea
									id="impact"
									value={initiativeForm.impact}
									onChange={(e) => {
										setInitiativeForm((prev) => ({
											...prev,
											impact: e.target.value,
										}));
										validateInitiativeForm("impact");
									}}
									placeholder="Expected environmental impact..."
									rows={2}
									className={
										!initiativeValidation.impact.isValid ? "border-red-500" : ""
									}
								/>
								{!initiativeValidation.impact.isValid && (
									<p className="text-sm text-red-500 mt-1">
										{initiativeValidation.impact.message}
									</p>
								)}
							</div>
							<div>
								<Label>Icon</Label>
								<div className="flex items-center gap-3 mt-2">
									<div className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50">
										<IconDisplay
											iconName={initiativeForm.iconName}
											showBackground={true}
										/>
										<span className="text-sm font-medium">
											{initiativeForm.iconName}
										</span>
									</div>
									<Button
										type="button"
										variant="outline"
										onClick={() => setShowInitiativeIconPicker(true)}
									>
										Choose Icon
									</Button>
								</div>
							</div>
							<div>
								<Label>Image</Label>
								<Button
									type="button"
									variant="outline"
									onClick={() => setIsInitiativeMediaPickerOpen(true)}
									className="w-full mt-2"
								>
									<Upload className="w-4 h-4 mr-2" />
									{initiativeForm.imageId ? "Change Image" : "Select Image"}
								</Button>
								{initiativeForm.imageId && (
									<p className="text-sm text-gray-600 mt-1">
										Image ID: {initiativeForm.imageId}
									</p>
								)}
							</div>
							<div className="flex items-center space-x-2">
								<Switch
									id="initiative-active"
									checked={initiativeForm.isActive}
									onCheckedChange={(checked) =>
										setInitiativeForm((prev) => ({
											...prev,
											isActive: checked,
										}))
									}
								/>
								<Label htmlFor="initiative-active">Active</Label>
							</div>
						</div>
					</EnhancedDialogBody>
					<EnhancedDialogFooter>
						<div className="flex justify-between w-full">
							<Button
								variant="secondary"
								onClick={() => setShowInitiativePreview(true)}
							>
								<Eye className="w-4 h-4 mr-2" />
								Preview
							</Button>
							<div className="flex gap-2">
								<Button
									variant="outline"
									onClick={() => setShowInitiativeDialog(false)}
								>
									Cancel
								</Button>
								<Button
									onClick={handleInitiativeSubmit}
									disabled={
										createInitiativeMutation.isPending ||
										updateInitiativeMutation.isPending
									}
								>
									{editingInitiative ? "Update" : "Create"} Initiative
								</Button>
							</div>
						</div>
					</EnhancedDialogFooter>
				</EnhancedDialogContent>
			</EnhancedDialog>

			{/* Initiative Preview Modal */}
			<EnhancedDialog
				open={showInitiativePreview}
				onOpenChange={setShowInitiativePreview}
			>
				<EnhancedDialogContent contentType="form">
					<EnhancedDialogHeader>
						<EnhancedDialogTitle>Initiative Preview</EnhancedDialogTitle>
						<EnhancedDialogDescription>
							This is how your initiative will appear on the sustainability page
						</EnhancedDialogDescription>
					</EnhancedDialogHeader>
					<div className="p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
						<div className="bg-white rounded-xl p-6 shadow-lg">
							<div className="flex items-start gap-4">
								<div className="shrink-0">
									<div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
										<IconDisplay
											iconName={initiativeForm.iconName}
											className="text-blue-600"
										/>
									</div>
								</div>
								<div className="flex-1">
									<div className="flex items-center gap-2 mb-2">
										<span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
											{initiativeForm.category || "Category"}
										</span>
									</div>
									<h3 className="text-lg font-semibold text-gray-900 mb-2">
										{initiativeForm.title || "Initiative Title"}
									</h3>
									<p className="text-gray-700 text-sm mb-3">
										{initiativeForm.description ||
											"Description of the initiative..."}
									</p>
									<div className="bg-green-50 border border-green-200 rounded-lg p-3">
										<p className="text-sm font-medium text-green-800">
											Impact: {initiativeForm.impact || "Expected impact..."}
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
					<EnhancedDialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowInitiativePreview(false)}
						>
							Close Preview
						</Button>
					</EnhancedDialogFooter>
				</EnhancedDialogContent>
			</EnhancedDialog>

			{/* Initiative Icon Picker */}
			<IconPicker
				isOpen={showInitiativeIconPicker}
				onClose={() => setShowInitiativeIconPicker(false)}
				onSelect={(iconName) =>
					setInitiativeForm((prev) => ({ ...prev, iconName }))
				}
				currentIcon={initiativeForm.iconName}
				title="Select Initiative Icon"
			/>

			{/* Initiative Media Picker */}
			<StandardMediaSelectionDialog
				isOpen={isInitiativeMediaPickerOpen}
				onClose={() => setIsInitiativeMediaPickerOpen(false)}
				onSelect={handleMediaSelect}
				title="Select Initiative Image"
				mediaPickerTarget="initiative-image"
				selectionMode="single"
			/>
		</>
	);
}
