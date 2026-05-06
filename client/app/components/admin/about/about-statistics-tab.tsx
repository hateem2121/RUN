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
import { ABOUT_API } from "@shared/api-constants";
import type { AboutStatistic, InsertAboutStatistic } from "@shared/index";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Award,
  BarChart3,
  Edit,
  Globe,
  GripVertical,
  type LucideIcon,
  Package,
  Plus,
  Shield,
  Trash2,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { IconSelector } from "@/components/admin/IconSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, getQueryClient } from "@/lib/queryClient";

interface StatisticItemProps {
  statistic: AboutStatistic;
  onEdit: (statistic: AboutStatistic) => void;
  onDelete: (id: number) => void;
}

function SortableStatisticItem({ statistic, onEdit, onDelete }: StatisticItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: statistic.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getIcon = (iconName: string) => {
    const iconMap: Record<string, LucideIcon> = {
      BarChart3: BarChart3,
      TrendingUp: TrendingUp,
      Package: Package,
      Users: Users,
      Zap: Zap,
      Globe: Globe,
      Award: Award,
      Shield: Shield,
    };
    const Icon = iconMap[iconName] || BarChart3;
    return <Icon className="h-5 w-5" />;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border bg-white/[0.03] p-4 ${isDragging ? "shadow-lg" : ""}`}
    >
      <div className="flex items-center gap-4">
        <button
          className="cursor-grab"
          aria-label="Drag to reorder statistic"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5 text-admin-muted/70" aria-hidden="true" />
        </button>

        <div className="flex flex-1 items-center gap-3">
          <div className="text-primary">{getIcon(statistic.iconName || "BarChart3")}</div>
          <div>
            <div className="font-semibold">{statistic.label}</div>
            <div className="font-bold text-2xl text-primary">
              {statistic.value}
              {statistic.unit}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {statistic.isActive === false && (
            <span className="rounded bg-red-100 px-2 py-1 text-red-600 text-sm dark:bg-red-900/20">
              Hidden
            </span>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(statistic)}
            aria-label={`Edit ${statistic.label}`}
          >
            <Edit className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(statistic.id)}
            aria-label={`Delete ${statistic.label}`}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AboutStatisticsTab() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStatistic, setEditingStatistic] = useState<AboutStatistic | null>(null);
  const [formData, setFormData] = useState({
    label: "",
    value: "",
    unit: "",
    iconName: "BarChart3" as string,
    isActive: true,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const { data: statistics = [], isLoading } = useQuery<AboutStatistic[]>({
    queryKey: [ABOUT_API.STATISTICS],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertAboutStatistic) => {
      return apiRequest(ABOUT_API.STATISTICS, {
        method: "POST",
        body: JSON.stringify(data),
      }) as Promise<AboutStatistic>;
    },
    onSuccess: () => {
      // Invalidate both individual and batch cache for sync
      getQueryClient().invalidateQueries({
        queryKey: [ABOUT_API.STATISTICS],
      });
      getQueryClient().invalidateQueries({ queryKey: [ABOUT_API.BATCH] });
      toast({
        title: "Success",
        description: "Statistic created successfully",
      });
      handleCloseDialog();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create statistic",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertAboutStatistic> }) => {
      return apiRequest(`/api/about-statistics/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }) as Promise<AboutStatistic>;
    },
    onSuccess: () => {
      // Invalidate both individual and batch cache for sync
      getQueryClient().invalidateQueries({
        queryKey: [ABOUT_API.STATISTICS],
      });
      getQueryClient().invalidateQueries({ queryKey: [ABOUT_API.BATCH] });
      toast({
        title: "Success",
        description: "Statistic updated successfully",
      });
      handleCloseDialog();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update statistic",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const result = await apiRequest(`/api/about-statistics/${id}`, {
        method: "DELETE",
      });
      return result;
    },
    onSuccess: () => {
      // Invalidate both individual and batch cache for sync
      getQueryClient().invalidateQueries({
        queryKey: [ABOUT_API.STATISTICS],
      });
      getQueryClient().invalidateQueries({ queryKey: [ABOUT_API.BATCH] });
      toast({
        title: "Success",
        description: "Statistic deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete statistic",
        variant: "destructive",
      });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (statistics: { id: number; sortOrder: number }[]) => {
      return apiRequest(ABOUT_API.STATISTICS_REORDER, {
        method: "PATCH",
        body: JSON.stringify({ entries: statistics }),
      }) as Promise<AboutStatistic[]>;
    },
    onSuccess: () => {
      // Invalidate both individual and batch cache for sync
      getQueryClient().invalidateQueries({
        queryKey: [ABOUT_API.STATISTICS],
      });
      getQueryClient().invalidateQueries({ queryKey: [ABOUT_API.BATCH] });
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      return;
    }

    if (active.id !== over.id && Array.isArray(statistics)) {
      const oldIndex = statistics.findIndex((item: AboutStatistic) => item.id === active.id);
      const newIndex = statistics.findIndex((item: AboutStatistic) => item.id === over.id);

      const newStatistics = arrayMove(statistics, oldIndex, newIndex);
      const reorderedStatistics = newStatistics.map((stat: AboutStatistic, index: number) => ({
        id: stat.id,
        sortOrder: index,
      }));

      getQueryClient().setQueryData([ABOUT_API.STATISTICS], newStatistics);
      reorderMutation.mutate(reorderedStatistics);
    }
  };

  const handleEdit = (statistic: AboutStatistic) => {
    setEditingStatistic(statistic);
    setFormData({
      label: statistic.label,
      value: statistic.value,
      unit: statistic.unit || "",
      iconName: statistic.iconName || "BarChart3",
      isActive: statistic.isActive !== false,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this statistic?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = () => {
    if (editingStatistic) {
      updateMutation.mutate({ id: editingStatistic.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingStatistic(null);
    setFormData({
      label: "",
      value: "",
      unit: "",
      iconName: "BarChart3",
      isActive: true,
    });
  };

  const sortedStatistics = Array.isArray(statistics)
    ? [...statistics].sort(
        (a: AboutStatistic, b: AboutStatistic) => (a.sortOrder || 0) - (b.sortOrder || 0),
      )
    : [];

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Key Statistics</CardTitle>
              <CardDescription>
                Manage impressive numbers and metrics to showcase on the About page
              </CardDescription>
            </div>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Statistic
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {sortedStatistics.length === 0 ? (
            <div className="py-12 text-center text-admin-muted">
              No statistics yet. Add your first key metric!
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sortedStatistics.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {sortedStatistics.map((statistic) => (
                    <SortableStatisticItem
                      key={statistic.id}
                      statistic={statistic}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          <div className="mt-6 rounded-lg bg-blue-50 p-4 dark:bg-blue-950/20">
            <p className="text-blue-800 text-sm dark:text-blue-200">
              <strong>Tip:</strong> Statistics are displayed prominently on your About page. Use
              impressive numbers that showcase your company's scale, reach, and achievements.
            </p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent contentType="form">
          <DialogHeader>
            <DialogTitle>{editingStatistic ? "Edit Statistic" : "Add Statistic"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="label">Label</Label>
              <Input
                id="label"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="Active Clients"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="value">Value</Label>
                <Input
                  id="value"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder="200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit (Optional)</Label>
                <Input
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="+"
                />
              </div>
            </div>

            <IconSelector
              value={formData.iconName || "BarChart3"}
              onChange={(value) => {
                setFormData((prev) => ({ ...prev, iconName: value as string }));
              }}
              label="Icon"
              placeholder="Select an icon"
              allowCustom={true}
            />

            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="active">Active (show on About page)</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.label || !formData.value}>
              {editingStatistic ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
