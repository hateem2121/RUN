/**
 * PHASE 2: TECHNOLOGY MODERNIZATION
 *
 * Extracted Equipment Management Component - Second Module
 * Original: technology-management.tsx lines 1742-1996 + mutations + handlers (398 lines)
 *
 * SAFETY MEASURES:
 * - Feature flag controlled (useModularTechnologyComponents)
 * - Maintains exact API compatibility
 * - Preserves all CRUD operations and drag-and-drop functionality
 * - Zero functional changes - pure extraction
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  EnhancedDialog,
  EnhancedDialogContent,
  EnhancedDialogDescription,
  EnhancedDialogBody,
  EnhancedDialogFooter,
  EnhancedDialogHeader,
  EnhancedDialogTitle,
} from "@/components/ui/enhanced-dialog";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Edit, GripVertical, X } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { StandardMediaSelectionDialog } from "@/components/admin/shared/StandardMediaSelectionDialog";
import { DeleteConfirmationDialog } from "@/components/admin/shared";
import type { TechnologyEquipment, MediaAsset } from "@shared/schema";

interface EquipmentFormData {
  name: string;
  manufacturer: string;
  model: string;
  category: string;
  quantity: number;
  capacity: string;
  maintenanceSchedule: string;
  certifications: string[];
  description: string;
  specifications: Record<string, any>;
  imageId: number | null;
  installationDate: Date | null;
  isActive: boolean;
}

interface SortableEquipmentItemProps {
  equipment: TechnologyEquipment;
  onEdit: (equipment: TechnologyEquipment) => void;
  onDelete: (id: number) => void;
}

function SortableEquipmentItem({ equipment, onEdit, onDelete }: SortableEquipmentItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: equipment.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-white rounded-lg border p-4 mb-3 shadow-sm-xs">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div {...attributes} {...listeners} className="mt-1 cursor-grab active:cursor-grabbing">
            <GripVertical className="w-4 h-4 text-gray-400" />
          </div>

          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="font-semibold text-lg">{equipment.name}</h3>
              {!equipment.isActive && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  Inactive
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
              {equipment.manufacturer && (
                <div>
                  <span className="font-medium">Manufacturer:</span> {equipment.manufacturer}
                </div>
              )}
              {equipment.model && (
                <div>
                  <span className="font-medium">Model:</span> {equipment.model}
                </div>
              )}
            </div>

            {equipment.description && (
              <div className="mb-3">
                <div className="font-medium text-sm text-gray-700 mb-1">Description:</div>
                <div className="text-sm text-gray-600">{equipment.description}</div>
              </div>
            )}

            {equipment.specifications && Object.keys(equipment.specifications).length > 0 && (
              <div className="mb-3">
                <div className="font-medium text-sm text-gray-700 mb-1">Specifications:</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(equipment.specifications).map(([key, value]) => (
                    <div key={key}>
                      <span className="font-medium">{key}:</span> {String(value)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(equipment)}
            className="text-blue-600 hover:text-blue-700"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <DeleteConfirmationDialog
            onConfirm={() => onDelete(equipment.id)}
            title="Delete Equipment"
            description="Are you sure you want to delete this equipment? This action cannot be undone."
          />
        </div>
      </div>
    </div>
  );
}

interface TechnologyEquipmentManagementProps {
  isLoading?: boolean;
}

export function TechnologyEquipmentManagement({
  isLoading = false,
}: TechnologyEquipmentManagementProps) {
  const { toast } = useToast();

  // Form state management
  const [editingEquipment, setEditingEquipment] = useState<TechnologyEquipment | null>(null);
  const [showEquipmentDialog, setShowEquipmentDialog] = useState(false);
  const [equipmentForm, setEquipmentForm] = useState<EquipmentFormData>({
    name: "",
    manufacturer: "",
    model: "",
    category: "",
    quantity: 1,
    capacity: "",
    maintenanceSchedule: "",
    certifications: [],
    description: "",
    specifications: {},
    imageId: null,
    installationDate: null,
    isActive: true,
  });

  // Dynamic form fields state
  const [newEquipSpecKey, setNewEquipSpecKey] = useState("");
  const [newEquipSpecValue, setNewEquipSpecValue] = useState("");
  const [newCertification, setNewCertification] = useState("");
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Equipment data query
  const { data: equipment = [], isPending: equipmentLoading } = useQuery<TechnologyEquipment[]>({
    queryKey: ["/api/technology-equipment"],
  });

  // Equipment mutations
  const createEquipmentMutation = useMutation({
    mutationFn: (data: EquipmentFormData) =>
      apiRequest("/api/technology-equipment", {
        method: "POST",
        body: {
          ...data,
          position: equipment.length,
        },
      }),
    onSuccess: () => {
      getQueryClient().invalidateQueries({ queryKey: ["/api/technology-equipment"] });
      setShowEquipmentDialog(false);
      setEditingEquipment(null);
      setEquipmentForm({
        name: "",
        manufacturer: "",
        model: "",
        category: "",
        quantity: 1,
        capacity: "",
        maintenanceSchedule: "",
        certifications: [],
        description: "",
        specifications: {},
        imageId: null,
        installationDate: null,
        isActive: true,
      });
      toast({
        title: "Success",
        description: "Equipment created successfully",
      });
    },
  });

  const updateEquipmentMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<EquipmentFormData> }) =>
      apiRequest(`/api/technology-equipment/${id}`, { method: "PATCH", body: data }),
    onSuccess: () => {
      getQueryClient().invalidateQueries({ queryKey: ["/api/technology-equipment"] });
      setShowEquipmentDialog(false);
      setEditingEquipment(null);
      toast({
        title: "Success",
        description: "Equipment updated successfully",
      });
    },
  });

  const deleteEquipmentMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/technology-equipment/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      getQueryClient().invalidateQueries({ queryKey: ["/api/technology-equipment"] });
      toast({
        title: "Success",
        description: "Equipment deleted successfully",
      });
    },
  });

  const reorderEquipmentMutation = useMutation({
    mutationFn: (equipment: { id: number; position: number }[]) =>
      apiRequest("/api/technology-equipment/reorder", { method: "PATCH", body: { equipment } }),
    onSuccess: () => {
      getQueryClient().invalidateQueries({ queryKey: ["/api/technology-equipment"] });
    },
  });

  // Event handlers
  const handleEquipmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEquipment) {
      updateEquipmentMutation.mutate({
        id: editingEquipment.id,
        data: equipmentForm,
      });
    } else {
      createEquipmentMutation.mutate(equipmentForm);
    }
  };

  const handleEditEquipment = (equipment: TechnologyEquipment) => {
    setEditingEquipment(equipment);
    setEquipmentForm({
      name: equipment.name,
      manufacturer: equipment.manufacturer || "",
      model: equipment.model || "",
      category: equipment.category || "",
      quantity: equipment.quantity || 1,
      capacity: equipment.capacity || "",
      maintenanceSchedule: equipment.maintenanceSchedule || "",
      certifications: equipment.certifications || [],
      description: equipment.description || "",
      specifications: equipment.specifications || {},
      imageId: equipment.imageId || null,
      installationDate: equipment.installationDate || null,
      isActive: equipment.isActive ?? true,
    });
    setShowEquipmentDialog(true);
  };

  const handleEquipmentDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = equipment.findIndex((e) => e.id === active.id);
      const newIndex = equipment.findIndex((e) => e.id === over.id);
      const newEquipment = arrayMove(equipment, oldIndex, newIndex);
      const updates = newEquipment.map((equip, index) => ({
        id: equip.id,
        position: index,
      }));
      reorderEquipmentMutation.mutate(updates);
    }
  };

  const handleAddEquipSpec = () => {
    if (newEquipSpecKey && newEquipSpecValue) {
      setEquipmentForm({
        ...equipmentForm,
        specifications: {
          ...equipmentForm.specifications,
          [newEquipSpecKey]: newEquipSpecValue,
        },
      });
      setNewEquipSpecKey("");
      setNewEquipSpecValue("");
    }
  };

  const handleRemoveEquipSpec = (key: string) => {
    const { [key]: _, ...rest } = equipmentForm.specifications;
    setEquipmentForm({
      ...equipmentForm,
      specifications: rest,
    });
  };

  const handleAddCertification = () => {
    if (newCertification) {
      setEquipmentForm({
        ...equipmentForm,
        certifications: [...equipmentForm.certifications, newCertification],
      });
      setNewCertification("");
    }
  };

  const handleRemoveCertification = (index: number) => {
    setEquipmentForm({
      ...equipmentForm,
      certifications: equipmentForm.certifications.filter((_, i) => i !== index),
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Technology Equipment</CardTitle>
              <CardDescription>Manage your advanced manufacturing equipment</CardDescription>
            </div>
            <Button
              onClick={() => {
                setEditingEquipment(null);
                setEquipmentForm({
                  name: "",
                  manufacturer: "",
                  model: "",
                  category: "",
                  quantity: 1,
                  capacity: "",
                  maintenanceSchedule: "",
                  certifications: [],
                  description: "",
                  specifications: {},
                  imageId: null,
                  installationDate: null,
                  isActive: true,
                });
                setShowEquipmentDialog(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Equipment
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {equipmentLoading || isLoading ? (
            <div>Loading...</div>
          ) : equipment.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No equipment added yet. Click "Add Equipment" to showcase your technology equipment.
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleEquipmentDragEnd}
            >
              <SortableContext
                items={equipment.map((e) => e.id)}
                strategy={verticalListSortingStrategy}
              >
                {equipment.map((equip) => (
                  <SortableEquipmentItem
                    key={equip.id}
                    equipment={equip}
                    onEdit={handleEditEquipment}
                    onDelete={(id) => deleteEquipmentMutation.mutate(id)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* Equipment Dialog */}
      <EnhancedDialog open={showEquipmentDialog} onOpenChange={setShowEquipmentDialog}>
        <EnhancedDialogContent contentType="form">
          <EnhancedDialogHeader>
            <EnhancedDialogTitle>
              {editingEquipment ? "Edit Equipment" : "Add Equipment"}
            </EnhancedDialogTitle>
            <EnhancedDialogDescription>
              Showcase your advanced manufacturing technology and equipment capabilities.
            </EnhancedDialogDescription>
          </EnhancedDialogHeader>
          <form onSubmit={handleEquipmentSubmit} className="flex flex-col flex-1 min-h-0">
            <EnhancedDialogBody className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="equipment-name">Name *</Label>
                  <Input
                    id="equipment-name"
                    value={equipmentForm.name}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, name: e.target.value })}
                    placeholder="e.g., Automated Cutting System"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="equipment-description">Description</Label>
                  <Textarea
                    id="equipment-description"
                    value={equipmentForm.description}
                    onChange={(e) =>
                      setEquipmentForm({ ...equipmentForm, description: e.target.value })
                    }
                    placeholder="Describe the equipment and its purpose"
                    rows={3}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="equipment-manufacturer">Manufacturer</Label>
                  <Input
                    id="equipment-manufacturer"
                    value={equipmentForm.manufacturer}
                    onChange={(e) =>
                      setEquipmentForm({ ...equipmentForm, manufacturer: e.target.value })
                    }
                    placeholder="e.g., Brother, Juki"
                  />
                </div>
                <div>
                  <Label htmlFor="equipment-model">Model</Label>
                  <Input
                    id="equipment-model"
                    value={equipmentForm.model}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, model: e.target.value })}
                    placeholder="e.g., KM-4000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="equipment-category">Category</Label>
                  <Input
                    id="equipment-category"
                    value={equipmentForm.category}
                    onChange={(e) =>
                      setEquipmentForm({ ...equipmentForm, category: e.target.value })
                    }
                    placeholder="e.g., Cutting, Sewing"
                  />
                </div>
                <div>
                  <Label htmlFor="equipment-quantity">Quantity</Label>
                  <Input
                    id="equipment-quantity"
                    type="number"
                    min="1"
                    value={equipmentForm.quantity}
                    onChange={(e) =>
                      setEquipmentForm({
                        ...equipmentForm,
                        quantity: parseInt(e.target.value) || 1,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="equipment-capacity">Capacity</Label>
                  <Input
                    id="equipment-capacity"
                    value={equipmentForm.capacity}
                    onChange={(e) =>
                      setEquipmentForm({ ...equipmentForm, capacity: e.target.value })
                    }
                    placeholder="e.g., 500 units/hour"
                  />
                </div>
                <div>
                  <Label htmlFor="equipment-maintenance">Maintenance Schedule</Label>
                  <Input
                    id="equipment-maintenance"
                    value={equipmentForm.maintenanceSchedule}
                    onChange={(e) =>
                      setEquipmentForm({ ...equipmentForm, maintenanceSchedule: e.target.value })
                    }
                    placeholder="e.g., Monthly"
                  />
                </div>
              </div>

              {/* Certifications Section */}
              <div>
                <Label>Certifications</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={newCertification}
                    onChange={(e) => setNewCertification(e.target.value)}
                    placeholder="Enter certification"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCertification();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddCertification}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {equipmentForm.certifications.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {equipmentForm.certifications.map((cert, index) => (
                      <div
                        key={index}
                        className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-sm flex items-center gap-1"
                      >
                        {cert}
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-4 w-4 p-0 hover:bg-yellow-200"
                          onClick={() => handleRemoveCertification(index)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Installation Date */}
              <div>
                <Label htmlFor="equipment-installation-date">Installation Date</Label>
                <Input
                  id="equipment-installation-date"
                  type="date"
                  value={
                    equipmentForm.installationDate
                      ? new Date(equipmentForm.installationDate).toISOString().split("T")[0]
                      : ""
                  }
                  onChange={(e) =>
                    setEquipmentForm({
                      ...equipmentForm,
                      installationDate: e.target.value ? new Date(e.target.value) : null,
                    })
                  }
                />
              </div>

              {/* Specifications Section */}
              <div>
                <Label>Specifications</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <Input
                    value={newEquipSpecKey}
                    onChange={(e) => setNewEquipSpecKey(e.target.value)}
                    placeholder="Key (e.g., Max Speed)"
                  />
                  <Input
                    value={newEquipSpecValue}
                    onChange={(e) => setNewEquipSpecValue(e.target.value)}
                    placeholder="Value (e.g., 1000 rpm)"
                  />
                  <Button type="button" onClick={handleAddEquipSpec}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {Object.keys(equipmentForm.specifications).length > 0 && (
                  <div className="mt-2 space-y-1">
                    {Object.entries(equipmentForm.specifications).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between bg-gray-50 p-2 rounded"
                      >
                        <span className="text-sm">
                          <strong>{key}:</strong> {String(value)}
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveEquipSpec(key)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Image Selection */}
              <div>
                <Label>Equipment Image</Label>
                <div className="mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsImagePickerOpen(true)}
                    className="w-full"
                  >
                    {equipmentForm.imageId ? "Change Image" : "Select Image"}
                  </Button>
                </div>
                {equipmentForm.imageId && (
                  <div className="mt-2 text-sm text-gray-600">
                    Selected image ID: {equipmentForm.imageId}
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="ml-2 text-red-600"
                      onClick={() => setEquipmentForm({ ...equipmentForm, imageId: null })}
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>

              {/* Active Status */}
              <div className="flex items-center space-x-2">
                <Switch
                  checked={equipmentForm.isActive}
                  onCheckedChange={(checked) =>
                    setEquipmentForm({ ...equipmentForm, isActive: checked })
                  }
                />
                <Label>Active (visible on public site)</Label>
              </div>
            </EnhancedDialogBody>

            <EnhancedDialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEquipmentDialog(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createEquipmentMutation.isPending || updateEquipmentMutation.isPending}
              >
                {createEquipmentMutation.isPending || updateEquipmentMutation.isPending
                  ? "Saving..."
                  : editingEquipment
                  ? "Update Equipment"
                  : "Create Equipment"}
              </Button>
            </EnhancedDialogFooter>
          </form>
        </EnhancedDialogContent>
      </EnhancedDialog>

      {/* Image Selection Dialog */}
      <StandardMediaSelectionDialog
        isOpen={isImagePickerOpen}
        onClose={() => setIsImagePickerOpen(false)}
        onSelect={(assets: MediaAsset | MediaAsset[]) => {
          const selectedAsset = Array.isArray(assets) ? assets[0] : assets;
          if (selectedAsset) {
            setEquipmentForm({
              ...equipmentForm,
              imageId: selectedAsset.id,
            });
          }
          setIsImagePickerOpen(false);
        }}
        title="Select Equipment Image"
        mediaPickerTarget="equipment-management"
        selectionMode="single"
      />
    </>
  );
}
