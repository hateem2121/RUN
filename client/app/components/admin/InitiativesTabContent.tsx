import type { SensorDescriptor } from "@dnd-kit/core";
import { closestCenter, DndContext } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type {
  InsertSustainabilityInitiative,
  MediaAsset,
  SustainabilityInitiative,
} from "@shared/index";
import type { UseMutationResult } from "@tanstack/react-query";
import { Eye, ImageIcon, LayoutTemplate, Leaf, Plus, Save, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { StandardMediaSelectionDialog } from "@/components/admin/shared/StandardMediaSelectionDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { cn } from "@/lib/utils";
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
  sensors: SensorDescriptor<object>[];
  createInitiativeMutation: UseMutationResult<unknown, unknown, InsertSustainabilityInitiative>;
  updateInitiativeMutation: UseMutationResult<
    unknown,
    unknown,
    { id: number; data: Partial<InsertSustainabilityInitiative> }
  >;
  deleteInitiativeMutation: UseMutationResult<unknown, unknown, number>;
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
    if (!isValidForm) {
      return;
    }

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
    const asset = Array.isArray(assets) ? assets[0] : assets;
    if (asset) {
      setInitiativeForm((prev) => ({ ...prev, imageId: asset.id }));
      setIsInitiativeMediaPickerOpen(false);
    }
  };

  return (
    <>
      <TabsContent value="initiatives" className="outline-none">
        <Card className="glass-premium p-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Active Ecosystem Initiatives
              </h2>
              <p className="text-sm text-[#68869A]">
                Strategic programs driving regenerative change across the production cycle
              </p>
            </div>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase text-[10px] tracking-widest h-11 px-6 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
            >
              <Plus className="mr-2 h-4 w-4" />
              Launch Initiative
            </Button>
          </div>

          {initiatives && initiatives.length > 0 ? (
            <div className="space-y-6">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={onInitiativeDragEnd}
              >
                <SortableContext
                  items={paginatedInitiatives.map((i) => i.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="grid gap-4">
                    {paginatedInitiatives.map((initiative) => (
                      <SortableInitiativeItem
                        key={initiative.id}
                        initiative={initiative}
                        onEdit={handleOpenDialog}
                        onDelete={(id) => deleteInitiativeMutation.mutate(id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              {initiativesTotalPages > 1 && (
                <div className="mt-8 flex justify-center">
                  <Pagination>
                    <PaginationContent className="bg-white/5 border border-white/10 rounded-xl p-1">
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => onSetInitiativesPage(Math.max(1, initiativesPage - 1))}
                          className={cn(
                            "rounded-lg text-[#68869A] hover:bg-white/10 hover:text-white",
                            initiativesPage === 1 && "pointer-events-none opacity-30",
                          )}
                        />
                      </PaginationItem>
                      {[...Array(initiativesTotalPages)].map((_, i) => (
                        <PaginationItem key={i}>
                          <PaginationLink
                            onClick={() => onSetInitiativesPage(i + 1)}
                            isActive={initiativesPage === i + 1}
                            className={cn(
                              "rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                              initiativesPage === i + 1
                                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                                : "text-[#68869A] hover:bg-white/10",
                            )}
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
                          className={cn(
                            "rounded-lg text-[#68869A] hover:bg-white/10 hover:text-white",
                            initiativesPage === initiativesTotalPages &&
                              "pointer-events-none opacity-30",
                          )}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-center bg-white/[0.02] border border-dashed border-white/10 rounded-2xl">
              <div className="size-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-[#68869A]/40" />
              </div>
              <h3 className="text-white font-bold mb-1">No Initiatives Operational</h3>
              <p className="text-[#68869A] text-sm max-w-[280px]">
                New sustainability programs have not been initialised.
              </p>
            </div>
          )}
        </Card>
      </TabsContent>

      <Dialog open={showInitiativeDialog} onOpenChange={setShowInitiativeDialog}>
        <DialogContent
          contentType="form"
          className="max-w-2xl bg-[#0A0A0A] border-white/10 p-0 overflow-hidden rounded-[32px] shadow-2xl ring-1 ring-white/10"
        >
          <DialogHeader className="p-8 pb-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Leaf className="h-5 w-5" />
                </div>
                <DialogTitle className="text-xl font-bold text-white tracking-tight">
                  {editingInitiative ? "Refine Initiative" : "New Ecosystem Initiative"}
                </DialogTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowInitiativeDialog(false)}
                className="rounded-full hover:bg-white/5 text-[#68869A]"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <DialogDescription className="text-[#68869A] ml-13">
              Configure strategic protocols for regenerative manufacturing and environmental health.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label
                  htmlFor="title"
                  className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest pl-1"
                >
                  Initiative Title
                </Label>
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
                  placeholder="e.g., Renewable Energy Matrix"
                  className={cn(
                    "bg-white/5 border-white/10 text-white rounded-xl py-6 focus:ring-emerald-500/50 placeholder:text-white/20",
                    !initiativeValidation.title.isValid && "border-red-500/50 bg-red-500/5",
                  )}
                />
                {!initiativeValidation.title.isValid && (
                  <p className="mt-1 text-red-400 text-[10px] font-bold uppercase tracking-widest ml-1">
                    {initiativeValidation.title.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="category"
                  className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest pl-1"
                >
                  Strategic Sector
                </Label>
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
                  placeholder="e.g., Circular Economy"
                  className={cn(
                    "bg-white/5 border-white/10 text-white rounded-xl py-6 focus:ring-emerald-500/50 placeholder:text-white/20",
                    !initiativeValidation.category.isValid && "border-red-500/50 bg-red-500/5",
                  )}
                />
                {!initiativeValidation.category.isValid && (
                  <p className="mt-1 text-red-400 text-[10px] font-bold uppercase tracking-widest ml-1">
                    {initiativeValidation.category.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest pl-1"
              >
                Initiative Scope
              </Label>
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
                placeholder="Detail the operational scope and mission parameters..."
                rows={3}
                className={cn(
                  "bg-white/5 border-white/10 text-white rounded-xl min-h-[100px] focus:ring-emerald-500/50 placeholder:text-white/20 resize-none",
                  !initiativeValidation.description.isValid && "border-red-500/50 bg-red-500/5",
                )}
              />
              {!initiativeValidation.description.isValid && (
                <p className="mt-1 text-red-400 text-[10px] font-bold uppercase tracking-widest ml-1">
                  {initiativeValidation.description.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="impact"
                className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest pl-1"
              >
                Environmental Impact Forecast
              </Label>
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
                placeholder="Quantify the expected regenerative outcome..."
                rows={2}
                className={cn(
                  "bg-white/5 border-white/10 text-white rounded-xl min-h-[80px] focus:ring-emerald-500/50 placeholder:text-white/20 resize-none",
                  !initiativeValidation.impact.isValid && "border-red-500/50 bg-red-500/5",
                )}
              />
              {!initiativeValidation.impact.isValid && (
                <p className="mt-1 text-red-400 text-[10px] font-bold uppercase tracking-widest ml-1">
                  {initiativeValidation.impact.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest pl-1">
                  Visual Symbology
                </Label>
                <div
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                  onClick={() => setShowInitiativeIconPicker(true)}
                >
                  <div className="size-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <IconDisplay iconName={initiativeForm.iconName} />
                  </div>
                  <span className="text-sm font-bold text-white tracking-tight">
                    {initiativeForm.iconName}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest pl-1">
                  Key Visual Asset
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsInitiativeMediaPickerOpen(true)}
                  className="w-full h-[66px] bg-white/5 border-white/10 text-[#68869A] rounded-xl hover:bg-white/10 hover:text-white transition-all border shadow-none"
                >
                  <ImageIcon className="mr-3 h-5 w-5 text-emerald-400" />
                  <span className="truncate">
                    {initiativeForm.imageId
                      ? `Asset ID: ${initiativeForm.imageId}`
                      : "Select Image"}
                  </span>
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex flex-col gap-0.5">
                <Label
                  htmlFor="initiative-active"
                  className="text-sm font-bold text-white tracking-tight"
                >
                  Active Protocol
                </Label>
                <p className="text-[10px] text-[#68869A] uppercase font-bold tracking-widest">
                  Visibility in Ecosystem Overview
                </p>
              </div>
              <Switch
                id="initiative-active"
                checked={initiativeForm.isActive}
                onCheckedChange={(checked) =>
                  setInitiativeForm((prev) => ({ ...prev, isActive: checked }))
                }
                className="data-[state=checked]:bg-emerald-600"
              />
            </div>
          </DialogBody>

          <DialogFooter className="p-8 pt-0 border-0 bg-transparent">
            <div className="flex w-full items-center justify-between gap-4">
              <Button
                variant="ghost"
                onClick={() => setShowInitiativePreview(true)}
                className="h-12 px-6 rounded-xl text-[#68869A] hover:bg-white/5 font-bold uppercase text-[10px] tracking-widest"
              >
                <Eye className="mr-2 h-4 w-4" />
                Live Preview
              </Button>
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setShowInitiativeDialog(false)}
                  className="h-12 px-6 rounded-xl text-[#68869A] hover:bg-white/5 font-bold uppercase text-[10px] tracking-widest"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleInitiativeSubmit}
                  disabled={
                    createInitiativeMutation.isPending || updateInitiativeMutation.isPending
                  }
                  className="h-12 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all outline-none border-0"
                >
                  {createInitiativeMutation.isPending || updateInitiativeMutation.isPending ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white mr-2" />
                  ) : editingInitiative ? (
                    <Save className="h-4 w-4 mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  {editingInitiative ? "Sync Initiative" : "Initialise Initiative"}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Initiative Preview Modal */}
      <Dialog open={showInitiativePreview} onOpenChange={setShowInitiativePreview}>
        <DialogContent
          contentType="form"
          className="max-w-md bg-[#0A0A0A] border-white/10 p-0 overflow-hidden rounded-[32px] shadow-2xl ring-1 ring-white/10"
        >
          <DialogHeader className="p-8 pb-4">
            <div className="mx-auto mb-2 inline-flex w-fit items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
              <LayoutTemplate className="h-4 w-4 text-emerald-400" />
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                Mobile Viewport Simulation
              </span>
            </div>
            <DialogTitle className="text-xl font-bold text-white tracking-tight text-center">
              Protocol Preview
            </DialogTitle>
          </DialogHeader>

          <div className="px-8 pb-8 flex justify-center">
            <div className="aspect-[9/16] w-full max-w-[280px] rounded-[32px] border-[8px] border-white/10 bg-black overflow-hidden relative shadow-2xl ring-1 ring-white/5 p-6 flex flex-col items-start">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-transparent to-black z-0" />

              <div className="relative z-10 space-y-6 flex flex-col w-full h-full">
                <div className="flex justify-between items-start">
                  <div className="size-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <IconDisplay iconName={initiativeForm.iconName} className="size-6" />
                  </div>
                  <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    {initiativeForm.category || "Strategic Initiative"}
                  </span>
                </div>

                <div className="space-y-3 flex-1">
                  <h3 className="text-xl font-bold text-white tracking-tight leading-tight">
                    {initiativeForm.title || "Next-Gen Sustainability"}
                  </h3>
                  <p className="text-[10px] text-white/50 leading-relaxed line-clamp-6">
                    {initiativeForm.description ||
                      "Advancing environmental health through precision engineering and sovereign resource oversight."}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                  <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles className="size-2" />
                    Environmental Impact
                  </span>
                  <p className="text-[10px] font-bold text-white leading-relaxed">
                    {initiativeForm.impact ||
                      "Projected 35% reduction in total operational carbon output."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-8 pt-0 border-0">
            <Button
              onClick={() => setShowInitiativePreview(false)}
              className="w-full h-12 rounded-xl bg-white/5 border border-white/10 text-white font-bold uppercase text-[10px] tracking-widest hover:bg-white/10"
            >
              Terminate Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <IconPicker
        isOpen={showInitiativeIconPicker}
        onClose={() => setShowInitiativeIconPicker(false)}
        onSelect={(iconName) => setInitiativeForm((prev) => ({ ...prev, iconName }))}
        currentIcon={initiativeForm.iconName}
        title="Select Initiative Icon"
      />

      <StandardMediaSelectionDialog
        isOpen={isInitiativeMediaPickerOpen}
        onClose={() => setIsInitiativeMediaPickerOpen(false)}
        onSelect={handleMediaSelect}
        title="Select Initiative Image"
        mediaPickerTarget="initiatives"
      />
    </>
  );
}
