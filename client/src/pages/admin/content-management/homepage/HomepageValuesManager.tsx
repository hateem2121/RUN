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
import type { HomepageSection, MediaAsset } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { GripVertical, Image as ImageIcon, Plus, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import { StandardMediaSelectionDialog } from "@/components/admin/shared/StandardMediaSelectionDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { apiRequest, getQueryClient } from "@/lib/queryClient";

interface ValueItem {
  id: string;
  title: string;
  subtitle: string;
  colSpan: string;
  mediaId?: number;
  icon?: string; // Icon name e.g. "ShieldCheck"
}

interface HomepageValuesManagerProps {
  sectionData?: HomepageSection;
  onUpdateSection?: (params: { id: number; data: Partial<HomepageSection> }) => void;
}

const SortableValueItem = ({
  item,
  index,
  updateItem,
  removeItem,
  onSelectMedia,
}: {
  item: ValueItem;
  index: number;
  updateItem: (index: number, field: keyof ValueItem, value: any) => void;
  removeItem: (index: number) => void;
  onSelectMedia: (index: number) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-4 rounded-lg border bg-muted/50 p-4 dark:bg-muted/30"
    >
      <div
        {...attributes}
        {...listeners}
        className="mt-2 cursor-grab text-muted-foreground/50 hover:text-muted-foreground active:cursor-grabbing"
      >
        <GripVertical className="h-5 w-5" />
      </div>
      <div className="grid flex-1 gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Title</Label>
            <Input
              value={item.title}
              onChange={(e) => updateItem(index, "title", e.target.value)}
            />
          </div>
          <div>
            <Label>Subtitle</Label>
            <Input
              value={item.subtitle}
              onChange={(e) => updateItem(index, "subtitle", e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Column Span</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
              value={item.colSpan}
              onChange={(e) => updateItem(index, "colSpan", e.target.value)}
            >
              <option value="col-span-1">Single (1)</option>
              <option value="md:col-span-2">Double (2)</option>
            </select>
          </div>
          <div>
            <Label>Icon Name</Label>
            <Input
              value={item.icon || ""}
              onChange={(e) => updateItem(index, "icon", e.target.value)}
              placeholder="Lucide Icon Name"
            />
          </div>
        </div>
        <div>
          <Label>Background Image</Label>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelectMedia(index)}
              className="w-full"
            >
              <ImageIcon className="mr-2 h-4 w-4" />
              {item.mediaId ? `Image Selected (ID: ${item.mediaId})` : "Select Image"}
            </Button>
            {item.mediaId && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => updateItem(index, "mediaId", undefined)}
              >
                <Trash className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => removeItem(index)}
        className="text-red-500 hover:bg-red-50 hover:text-red-700"
      >
        <Trash className="h-4 w-4" />
      </Button>
    </div>
  );
};

export function HomepageValuesManager({
  sectionData,
  onUpdateSection,
}: HomepageValuesManagerProps) {
  const [values, setValues] = useState<ValueItem[]>([]);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);

  useEffect(() => {
    if (sectionData?.data && Array.isArray(sectionData.data.values)) {
      setValues(sectionData.data.values);
    } else {
      setValues([
        {
          id: "1",
          title: "Heritage Innovation",
          subtitle: "135 Years of textile engineering.",
          colSpan: "md:col-span-2",
          icon: "ShieldCheck",
        },
        {
          id: "2",
          title: "Eco-Forward",
          subtitle: "40% Water reduction.",
          colSpan: "col-span-1",
          icon: "Leaf",
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
      setValues((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const updateValuesMutation = useMutation({
    mutationFn: async (updatedValues: ValueItem[]) => {
      if (!sectionData) return;
      // Extract media IDs for the media_ids column to ensure they are loaded
      const mediaIds = updatedValues
        .map((v) => v.mediaId)
        .filter((id): id is number => typeof id === "number");

      return await apiRequest(`/api/homepage-sections/${sectionData.id}`, {
        method: "PATCH",
        body: {
          data: { ...sectionData.data, values: updatedValues },
          mediaIds: mediaIds,
        },
      });
    },
    onSuccess: () => {
      getQueryClient().invalidateQueries({
        queryKey: ["/api/homepage-sections"],
      });
      toast({ title: "Success", description: "Values updated successfully" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update values",
        variant: "destructive",
      });
    },
  });

  const handleAddItem = () => {
    setValues([
      ...values,
      {
        id: crypto.randomUUID(),
        title: "New Value",
        subtitle: "Description",
        colSpan: "col-span-1",
        icon: "Star",
      },
    ]);
  };

  const handleUpdateItem = (index: number, field: keyof ValueItem, value: any) => {
    const newValues = [...values];
    // Cast to any to allow dynamic property update with generic value
    newValues[index] = { ...newValues[index], [field]: value } as ValueItem;
    setValues(newValues);
  };

  const handleRemoveItem = (index: number) => {
    setValues(values.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    updateValuesMutation.mutate(values);
  };

  return (
    <div className="space-y-6">
      {sectionData && (
        <Card>
          <CardHeader>
            <CardTitle>Section Settings</CardTitle>
            <CardDescription>
              Manage visibility for the Values (Bento Grid) section.
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
          <CardTitle>Core Values</CardTitle>
          <CardDescription>
            Configure the bento grid cards displaying company values.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={values} strategy={verticalListSortingStrategy}>
              <div className="space-y-4">
                {values.map((value, index) => (
                  <SortableValueItem
                    key={value.id}
                    item={value}
                    index={index}
                    updateItem={handleUpdateItem}
                    removeItem={handleRemoveItem}
                    onSelectMedia={(idx) => {
                      setActiveItemIndex(idx);
                      setMediaPickerOpen(true);
                    }}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          <Button variant="outline" onClick={handleAddItem} className="w-full border-dashed">
            <Plus className="mr-2 h-4 w-4" /> Add Value Card
          </Button>
          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={updateValuesMutation.isPending}>
              {updateValuesMutation.isPending ? "Saving..." : "Save Values"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <StandardMediaSelectionDialog
        mediaPickerTarget="homepage-values-media"
        isOpen={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={(asset: MediaAsset | MediaAsset[]) => {
          const singleAsset = Array.isArray(asset) ? asset[0] : asset;
          if (singleAsset && activeItemIndex !== null) {
            handleUpdateItem(activeItemIndex, "mediaId", singleAsset.id);
            setMediaPickerOpen(false);
          }
        }}
        title="Select Card Background"
        selectionMode="single"
      />
    </div>
  );
}
