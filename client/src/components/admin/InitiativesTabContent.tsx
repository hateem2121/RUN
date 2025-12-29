import { closestCenter, DndContext } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { MediaAsset, SustainabilityInitiative } from "@shared/schema";
import { Eye, Plus, Upload } from "lucide-react";
import { useState } from "react";
import { StandardMediaSelectionDialog } from "@/components/admin/shared/StandardMediaSelectionDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [showInitiativeIconPicker, setShowInitiativeIconPicker] = useState(false);
  const [isInitiativeMediaPickerOpen, setIsInitiativeMediaPickerOpen] = useState(false);
  const [editingInitiative, setEditingInitiative] = useState<SustainabilityInitiative | null>(null);

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

  const [initiativeValidation, setInitiativeValidation] = useState<InitiativeValidation>({
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
                <Plus className="mr-2 h-4 w-4" />
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
                            onClick={() => onSetInitiativesPage(Math.max(1, initiativesPage - 1))}
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
                                Math.min(initiativesTotalPages, initiativesPage + 1),
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
              <div className="py-8 text-center text-muted-foreground">
                No initiatives yet. Create your first sustainability initiative.
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Initiative Dialog - Simplified for space, includes all form fields */}
      <Dialog open={showInitiativeDialog} onOpenChange={setShowInitiativeDialog}>
        <DialogContent contentType="form">
          <DialogHeader>
            <DialogTitle>
              {editingInitiative ? "Edit Initiative" : "Add New Initiative"}
            </DialogTitle>
            <DialogDescription>
              {editingInitiative
                ? "Update the sustainability initiative details"
                : "Create a new sustainability initiative"}
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
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
                  <p className="mt-1 text-red-500 text-sm">{initiativeValidation.title.message}</p>
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
                  className={!initiativeValidation.category.isValid ? "border-red-500" : ""}
                />
                {!initiativeValidation.category.isValid && (
                  <p className="mt-1 text-red-500 text-sm">
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
                  className={!initiativeValidation.description.isValid ? "border-red-500" : ""}
                />
                {!initiativeValidation.description.isValid && (
                  <p className="mt-1 text-red-500 text-sm">
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
                  className={!initiativeValidation.impact.isValid ? "border-red-500" : ""}
                />
                {!initiativeValidation.impact.isValid && (
                  <p className="mt-1 text-red-500 text-sm">{initiativeValidation.impact.message}</p>
                )}
              </div>
              <div>
                <Label>Icon</Label>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex items-center gap-2 rounded-lg border bg-background p-3">
                    <IconDisplay iconName={initiativeForm.iconName} showBackground={true} />
                    <span className="font-medium text-sm">{initiativeForm.iconName}</span>
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
                  className="mt-2 w-full"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {initiativeForm.imageId ? "Change Image" : "Select Image"}
                </Button>
                {initiativeForm.imageId && (
                  <p className="mt-1 text-muted-foreground text-sm">
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
          </DialogBody>
          <DialogFooter>
            <div className="flex w-full justify-between">
              <Button variant="secondary" onClick={() => setShowInitiativePreview(true)}>
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowInitiativeDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleInitiativeSubmit}
                  disabled={
                    createInitiativeMutation.isPending || updateInitiativeMutation.isPending
                  }
                >
                  {editingInitiative ? "Update" : "Create"} Initiative
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Initiative Preview Modal */}
      <Dialog open={showInitiativePreview} onOpenChange={setShowInitiativePreview}>
        <DialogContent contentType="form">
          <DialogHeader>
            <DialogTitle>Initiative Preview</DialogTitle>
            <DialogDescription>
              This is how your initiative will appear on the sustainability page
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border-2 border-border border-dashed bg-background p-6">
            <div className="rounded-xl bg-white p-6 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                    <IconDisplay iconName={initiativeForm.iconName} className="text-blue-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="rounded bg-muted px-2 py-1 font-medium text-muted-foreground text-sm">
                      {initiativeForm.category || "Category"}
                    </span>
                  </div>
                  <h3 className="mb-2 font-semibold text-foreground text-lg">
                    {initiativeForm.title || "Initiative Title"}
                  </h3>
                  <p className="mb-3 text-foreground/80 text-sm">
                    {initiativeForm.description || "Description of the initiative..."}
                  </p>
                  <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                    <p className="font-medium text-green-800 text-sm">
                      Impact: {initiativeForm.impact || "Expected impact..."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInitiativePreview(false)}>
              Close Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Initiative Icon Picker */}
      <IconPicker
        isOpen={showInitiativeIconPicker}
        onClose={() => setShowInitiativeIconPicker(false)}
        onSelect={(iconName) => setInitiativeForm((prev) => ({ ...prev, iconName }))}
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
