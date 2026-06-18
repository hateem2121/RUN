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
import type { MediaAsset, TechnologyInnovation } from "@shared/index";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  ChevronRight,
  Edit3,
  GripVertical,
  History,
  Image as ImageIcon,
  Info,
  Layers,
  Plus,
  Save,
  Search,
  Settings2,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DeleteConfirmationDialog } from "@/components/admin/shared";
import { StandardMediaSelectionDialog } from "@/components/admin/shared/StandardMediaSelectionDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, getQueryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

// Types
interface InnovationFormData {
  name: string;
  category: string;
  description: string;
  shortDescription: string;
  iconName: string;
  status: string;
  technicalDetails: Record<string, string>;
  relatedProducts: string[];
  benefits: string[];
  developmentYear: string;
  imageId: number | null;
  isActive: boolean;
}

// Innovation categories
const innovationCategories = [
  "Fabric Technology",
  "Manufacturing Process",
  "Design Innovation",
  "Sustainability",
  "Digital Technology",
  "Material Science",
  "Quality Control",
  "Automation",
];

interface SortableInnovationItemProps {
  innovation: TechnologyInnovation;
  isSelected: boolean;
  onSelect: (innovation: TechnologyInnovation) => void;
  onDelete: (id: number) => void;
}

function SortableInnovationItem({
  innovation,
  isSelected,
  onSelect,
  onDelete,
}: SortableInnovationItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: innovation.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative flex items-center gap-4 p-4 rounded-xl transition-all duration-300",
        "border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10",
        isSelected && "bg-cyan-500/10 border-cyan-500/30 scale-custom-misc-123 z-10",
        isDragging && "opacity-50 z-20 shadow-2xl",
      )}
      onClick={() => onSelect(innovation)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(innovation);
        }
      }}
      aria-current={isSelected}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-move p-1 text-admin-muted hover:text-cyan-400 transition-colors bg-transparent border-0 outline-none focus:ring-2 focus:ring-cyan-500/50 rounded"
        onClick={(e) => e.stopPropagation()}
        aria-label="Drag to reorder innovation"
      >
        <GripVertical className="h-5 w-5" />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge
            variant="outline"
            className="text-custom-space-116 uppercase tracking-tighter bg-cyan-500/5 text-cyan-400 border-cyan-500/20 py-0 h-4"
          >
            {innovation.category}
          </Badge>
          {innovation.developmentYear && (
            <span className="text-xxs text-admin-muted font-mono">
              {innovation.developmentYear}
            </span>
          )}
        </div>
        <h4 className="font-bold text-white text-sm truncate uppercase tracking-tight group-hover:text-cyan-400 transition-colors">
          {innovation.name}
        </h4>
        <p className="text-xs text-admin-muted line-clamp-1 mt-0.5">
          {innovation.shortDescription || "No tech specs defined."}
        </p>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <DeleteConfirmationDialog
          onConfirm={() => onDelete(innovation.id)}
          title="Archive Protocol"
          description="Are you sure you want to archive this technological breakthrough? This will remove it from active processing."
          trigger={
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-admin-muted hover:text-red-400 hover:bg-red-400/10"
              onClick={(e) => e.stopPropagation()}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          }
        />
        <div className="text-cyan-400">
          <ChevronRight className="h-4 w-4" />
        </div>
      </div>

      {isSelected && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-cyan-500 rounded-r-lg" />
      )}
    </li>
  );
}

export function TechnologyInnovationManagement({ isLoading = false }: { isLoading?: boolean }) {
  // Form state management
  const [selectedInnovation, setSelectedInnovation] = useState<TechnologyInnovation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewInnovation, setIsNewInnovation] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [innovationForm, setInnovationForm] = useState<InnovationFormData>({
    name: "",
    category: "Fabric Technology",
    description: "",
    shortDescription: "",
    iconName: "",
    status: "Active",
    technicalDetails: {},
    relatedProducts: [],
    benefits: [],
    developmentYear: "",
    imageId: null,
    isActive: true,
  });

  // Dynamic field state
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [newBenefit, setNewBenefit] = useState("");
  const [newDetailKey, setNewDetailKey] = useState("");
  const [newDetailValue, setNewDetailValue] = useState("");

  // Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Queries
  const { data: innovations = [], isPending: innovationsLoading } = useQuery<
    TechnologyInnovation[]
  >({
    queryKey: ["/api/technology-innovations"],
  });

  const { data: mediaAssets = [] } = useQuery<MediaAsset[]>({
    queryKey: ["/api/media-assets"],
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: InnovationFormData) =>
      apiRequest("/api/technology-innovations", {
        method: "POST",
        body: JSON.stringify({ ...data, position: innovations.length }),
      }),
    onSuccess: (data: unknown) => {
      getQueryClient().invalidateQueries({ queryKey: ["/api/technology-innovations"] });
      setSelectedInnovation(data as TechnologyInnovation);
      setIsNewInnovation(false);
      setHasChanges(false);
      toast.success("Innovation Integrated", {
        description: "New technological breakthrough added to the ecosystem.",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InnovationFormData> }) =>
      apiRequest(`/api/technology-innovations/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      getQueryClient().invalidateQueries({ queryKey: ["/api/technology-innovations"] });
      setHasChanges(false);
      toast.success("Protocol Updated", {
        description: "Innovation technical specs have been synchronized.",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/technology-innovations/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      getQueryClient().invalidateQueries({ queryKey: ["/api/technology-innovations"] });
      setSelectedInnovation(null);
      toast.success("Archive Success", {
        description: "Innovation archived from the active database.",
      });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (updates: { id: number; position: number }[]) =>
      apiRequest("/api/technology-innovations/reorder", {
        method: "PATCH",
        body: JSON.stringify({ innovations: updates }),
      }),
    onSuccess: () =>
      getQueryClient().invalidateQueries({ queryKey: ["/api/technology-innovations"] }),
  });

  // Effects
  useEffect(() => {
    if (selectedInnovation) {
      setInnovationForm({
        name: selectedInnovation.name,
        category: selectedInnovation.category || "Fabric Technology",
        description: selectedInnovation.description || "",
        shortDescription: selectedInnovation.shortDescription || "",
        iconName: selectedInnovation.iconName || "",
        status: selectedInnovation.status || "Active",
        technicalDetails: (selectedInnovation.technicalDetails as Record<string, string>) || {},
        relatedProducts: selectedInnovation.relatedProducts || [],
        benefits: selectedInnovation.benefits || [],
        developmentYear: selectedInnovation.developmentYear || "",
        imageId: selectedInnovation.imageId || null,
        isActive: selectedInnovation.isActive ?? true,
      });
      setHasChanges(false);
      setIsNewInnovation(false);
    }
  }, [selectedInnovation]);

  // Handlers
  const handleInputChange = (updates: Partial<InnovationFormData>) => {
    setInnovationForm((prev) => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNewInnovation) {
      createMutation.mutate(innovationForm);
    } else if (selectedInnovation) {
      updateMutation.mutate({ id: selectedInnovation.id, data: innovationForm });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = innovations.findIndex((i) => i.id === active.id);
      const newIndex = innovations.findIndex((i) => i.id === over.id);
      const newInnovations = arrayMove(innovations, oldIndex, newIndex);
      reorderMutation.mutate(newInnovations.map((inn, idx) => ({ id: inn.id, position: idx })));
    }
  };

  const handleAddNew = () => {
    setSelectedInnovation(null);
    setInnovationForm({
      name: "",
      category: "Fabric Technology",
      description: "",
      shortDescription: "",
      iconName: "",
      status: "Active",
      technicalDetails: {},
      relatedProducts: [],
      benefits: [],
      developmentYear: "",
      imageId: null,
      isActive: true,
    });
    setIsNewInnovation(true);
    setHasChanges(false);
  };

  const filteredInnovations = useMemo(() => {
    return innovations.filter(
      (inn) =>
        inn.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inn.category?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [innovations, searchQuery]);

  const selectedImage = useMemo(() => {
    return mediaAssets.find((a) => a.id === innovationForm.imageId);
  }, [mediaAssets, innovationForm.imageId]);

  if (innovationsLoading || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <div className="flex space-x-2">
          <div className="h-2 w-2 animate-bounce rounded-full bg-cyan-500 [animation-delay:-0.3s]"></div>
          <div className="h-2 w-2 animate-bounce rounded-full bg-cyan-500 [animation-delay:-0.15s]"></div>
          <div className="h-2 w-2 animate-bounce rounded-full bg-cyan-500"></div>
        </div>
        <p className="text-xxs font-bold text-admin-muted uppercase tracking-widest text-center">
          Calibrating Innovation Matrices...
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-custom-misc-124 gap-8 h-custom-misc-125 min-h-custom-space-117">
      {/* Left Pane - List */}
      <div className="flex flex-col gap-6 h-full overflow-hidden">
        <Card variant="glass-premium" className="shrink-0">
          <CardContent className="p-6 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="size-4 text-cyan-400 font-bold" />
                <h3 className="text-xs font-bold text-white uppercase tracking-widest">
                  Protocol Index
                </h3>
              </div>
              <Button
                onClick={handleAddNew}
                className="h-9 px-4 bg-cyan-600 hover:bg-cyan-700 text-white font-bold uppercase text-custom-space-118 tracking-widest border-0"
                title="Integrate Innovation"
              >
                <Plus className="mr-1 h-3 w-3" />
                New Breakthrough
              </Button>
            </div>

            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-admin-muted group-focus-within:text-cyan-400 transition-colors" />
              <Input
                placeholder="Filter innovations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-11 bg-white/[0.03] border-white/10 rounded-xl text-sm focus:ring-cyan-500/30 transition-all placeholder:text-white/20"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredInnovations.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="space-y-3 p-1 list-none">
                {filteredInnovations.map((inn) => (
                  <SortableInnovationItem
                    key={inn.id}
                    innovation={inn}
                    isSelected={selectedInnovation?.id === inn.id}
                    onSelect={setSelectedInnovation}
                    onDelete={(id) => deleteMutation.mutate(id)}
                  />
                ))}
                {filteredInnovations.length === 0 && (
                  <div className="py-12 text-center">
                    <History className="h-8 w-8 text-white/5 mx-auto mb-3" />
                    <p className="text-xxs text-admin-muted font-medium uppercase tracking-widest">
                      No matching archives
                    </p>
                  </div>
                )}
              </ul>
            </SortableContext>
          </DndContext>
        </div>
      </div>

      {/* Right Pane - Detail/Form */}
      <div className="h-full overflow-y-auto custom-scrollbar pr-2">
        {selectedInnovation || isNewInnovation ? (
          <Card variant="glass-premium" className="min-h-full">
            <CardContent className="p-8 space-y-12">
              <div className="flex items-center justify-between border-b border-white/5 pb-8">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                    <Edit3 className="size-6 text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">
                      {isNewInnovation ? "Initialize Innovation" : selectedInnovation?.name}
                    </h2>
                    <p className="text-sm text-admin-muted">
                      {isNewInnovation
                        ? "Defining parameters for a new technological breakthrough."
                        : "Specifying technical data and ecosystem integration."}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => {
                      setSelectedInnovation(null);
                      setIsNewInnovation(false);
                    }}
                    variant="ghost"
                    className="text-xxs font-bold uppercase tracking-widest hover:bg-white/5 h-11 px-4 text-admin-muted"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Dismiss
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!hasChanges || createMutation.isPending || updateMutation.isPending}
                    className="h-11 bg-cyan-600 hover:bg-cyan-700 text-white px-8 font-bold uppercase text-xxs tracking-widest shadow-lg shadow-cyan-500/20 active:scale-95 transition-all outline-none border-0"
                  >
                    {createMutation.isPending || updateMutation.isPending ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {createMutation.isPending || updateMutation.isPending
                      ? "Syncing..."
                      : "Apply Protocol"}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                <div className="xl:col-span-2 space-y-10">
                  {/* Visual Identity */}
                  <section className="space-y-6">
                    <div className="flex items-center gap-2">
                      <Info className="size-4 text-cyan-400" />
                      <h3 className="text-xxs font-bold text-white uppercase tracking-widest">
                        Base specifications
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label
                          htmlFor="name"
                          className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1"
                        >
                          Protocol Name
                        </Label>
                        <Input
                          id="name"
                          value={innovationForm.name}
                          onChange={(e) => handleInputChange({ name: e.target.value })}
                          className="bg-white/5 border-white/10 text-white rounded-xl h-11 focus:ring-cyan-500/50 placeholder:text-white/20"
                          placeholder="e.g., AeroWeave Mesh"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="category"
                          className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1"
                        >
                          Sector Class
                        </Label>
                        <Select
                          value={innovationForm.category}
                          onValueChange={(val) => handleInputChange({ category: val })}
                        >
                          <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-xl h-11 shadow-none">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-custom-color-161 border-white/10 text-white">
                            {innovationCategories.map((cat) => (
                              <SelectItem
                                key={cat}
                                value={cat}
                                className="hover:bg-cyan-500/20 focus:bg-cyan-500/20 transition-colors"
                              >
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="shortDescription"
                        className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1"
                      >
                        Brief Technical Abstract
                      </Label>
                      <Input
                        id="shortDescription"
                        value={innovationForm.shortDescription}
                        onChange={(e) => handleInputChange({ shortDescription: e.target.value })}
                        className="bg-white/5 border-white/10 text-white rounded-xl h-11 focus:ring-cyan-500/50 placeholder:text-white/20"
                        placeholder="High-performance summary..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="description"
                        className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1"
                      >
                        Full Technical Documentation
                      </Label>
                      <Textarea
                        id="description"
                        value={innovationForm.description}
                        onChange={(e) => handleInputChange({ description: e.target.value })}
                        className="bg-white/5 border-white/10 text-white rounded-xl min-h-custom-space-119 focus:ring-cyan-500/50 placeholder:text-white/20 resize-none"
                        placeholder="Detail the mechanism of action, material composition, and performance metrics..."
                      />
                    </div>
                  </section>

                  {/* Technical Parameters */}
                  <section className="space-y-6 pt-10 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <Settings2 className="size-4 text-cyan-400" />
                      <h3 className="text-xxs font-bold text-white uppercase tracking-widest">
                        Digital Specs & Assets
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <Label className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1">
                          Innovation Visual
                        </Label>
                        <button
                          type="button"
                          className={cn(
                            "aspect-video rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.02] flex items-center justify-center relative overflow-hidden group cursor-pointer w-full",
                            innovationForm.imageId && "border-solid border-cyan-500/30",
                          )}
                          onClick={() => setShowImagePicker(true)}
                          aria-label="Select innovation visual"
                        >
                          {selectedImage ? (
                            <img
                              src={selectedImage.url}
                              alt="Preview"
                              className="absolute inset-0 object-cover w-full h-full opacity-60 group-hover:opacity-100 transition-opacity"
                            />
                          ) : (
                            <div className="text-center">
                              <ImageIcon className="size-8 text-admin-muted mx-auto mb-2" />
                              <p className="text-xxs uppercase font-bold text-admin-muted tracking-widest">
                                Sync Media
                              </p>
                            </div>
                          )}
                        </button>
                      </div>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label
                            htmlFor="developmentYear"
                            className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1"
                          >
                            R&D Release Year
                          </Label>
                          <Input
                            id="developmentYear"
                            value={innovationForm.developmentYear}
                            onChange={(e) => handleInputChange({ developmentYear: e.target.value })}
                            className="bg-white/5 border-white/10 text-white rounded-xl h-11 focus:ring-cyan-500/50"
                            placeholder="e.g., 2024"
                          />
                        </div>
                        <div className="space-y-4">
                          <Label className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1">
                            System Operationality
                          </Label>
                          <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/5">
                            <span className="text-xs text-white/60">Visible Offline</span>
                            <Switch
                              checked={innovationForm.isActive}
                              onCheckedChange={(checked) =>
                                handleInputChange({ isActive: checked })
                              }
                              className="data-custom-misc-126:bg-cyan-600"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>

                {/* Sidebar/Quick Configs */}
                <div className="space-y-10">
                  <section className="space-y-6 p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-cyan-400" />
                      <h3 className="text-xxs font-bold text-white uppercase tracking-widest">
                        Protocol Benefits
                      </h3>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={newBenefit}
                        onChange={(e) => setNewBenefit(e.target.value)}
                        placeholder="Add benefit..."
                        className="bg-white/5 border-white/10 text-xs h-9 rounded-lg"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (newBenefit) {
                              handleInputChange({
                                benefits: [...innovationForm.benefits, newBenefit],
                              });
                              setNewBenefit("");
                            }
                          }
                        }}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 border border-white/10 hover:bg-cyan-500/10 text-cyan-400"
                        onClick={() => {
                          if (newBenefit) {
                            handleInputChange({
                              benefits: [...innovationForm.benefits, newBenefit],
                            });
                            setNewBenefit("");
                          }
                        }}
                        title="Add Benefit"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-custom-space-120 overflow-y-auto pr-2 custom-scrollbar">
                      {innovationForm.benefits.map((benefit, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-xl bg-white/[0.04] border border-white/5 group hover:border-cyan-500/20 transition-colors"
                        >
                          <span className="text-xs text-admin-foreground">{benefit}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 text-red-400 hover:bg-red-400/10 transition-all"
                            onClick={() =>
                              handleInputChange({
                                benefits: innovationForm.benefits.filter((_, i) => i !== idx),
                              })
                            }
                            title="Remove Benefit"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="space-y-6 p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center gap-2">
                      <Zap className="size-4 text-cyan-400" />
                      <h3 className="text-xxs font-bold text-white uppercase tracking-widest">
                        Matrix Parameters
                      </h3>
                    </div>
                    <div className="grid gap-4">
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Spec (e.g., Weight)"
                          value={newDetailKey}
                          onChange={(e) => setNewDetailKey(e.target.value)}
                          className="bg-white/5 border-white/10 text-xxs h-9"
                        />
                        <Input
                          placeholder="Value (e.g., 200g)"
                          value={newDetailValue}
                          onChange={(e) => setNewDetailValue(e.target.value)}
                          className="bg-white/5 border-white/10 text-xxs h-9"
                        />
                      </div>
                      <Button
                        className="w-full bg-white/5 border border-white/10 text-cyan-400 text-custom-space-121 uppercase font-bold tracking-widest h-9"
                        onClick={() => {
                          if (newDetailKey && newDetailValue) {
                            handleInputChange({
                              technicalDetails: {
                                ...innovationForm.technicalDetails,
                                [newDetailKey]: newDetailValue,
                              },
                            });
                            setNewDetailKey("");
                            setNewDetailValue("");
                          }
                        }}
                        title="Add Spec"
                      >
                        Index Spec
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {Object.entries(innovationForm.technicalDetails).map(([key, value]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/10 group"
                        >
                          <div>
                            <span className="text-custom-space-122 font-bold text-cyan-400 uppercase tracking-widest block mb-0.5">
                              {key}
                            </span>
                            <span className="text-sm font-bold text-white">{value}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 text-red-400 transition-all"
                            onClick={() => {
                              const next = { ...innovationForm.technicalDetails };
                              delete next[key];
                              handleInputChange({ technicalDetails: next });
                            }}
                            title="Remove Spec"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="h-full border-2 border-dashed border-white/5 rounded-3xl flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-cyan-500/[0.02] animate-pulse" />
            <div className="text-center relative z-10 space-y-4">
              <div className="size-20 rounded-full bg-cyan-500/5 border border-cyan-500/10 flex items-center justify-center mx-auto mb-6">
                <Zap className="size-10 text-cyan-500/40" />
              </div>
              <h3 className="text-lg font-bold text-white uppercase tracking-tight">System Idle</h3>
              <p className="text-sm text-admin-muted max-w-custom-space-123 mx-auto">
                Select a technological breakthrough from the index to begin technical
                synchronization.
              </p>
              <Button
                onClick={handleAddNew}
                variant="outline"
                className="mt-6 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
              >
                Initialize New Protocol
              </Button>
            </div>
          </div>
        )}
      </div>

      <StandardMediaSelectionDialog
        isOpen={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onSelect={(assets: MediaAsset | MediaAsset[]) => {
          const asset = Array.isArray(assets) ? assets[0] : assets;
          if (asset) {
            handleInputChange({ imageId: asset.id });
            setShowImagePicker(false);
          }
        }}
        title="Select Archive Imagery"
        mediaPickerTarget="innovation-image"
      />
    </div>
  );
}
