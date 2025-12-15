import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EnhancedDialog, EnhancedDialogContent, EnhancedDialogHeader, EnhancedDialogTitle, EnhancedDialogFooter } from "@/components/ui/enhanced-dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, GripVertical, BarChart3, TrendingUp, Package, Users, Zap, Globe, Award, Shield } from "lucide-react";
import { IconSelector } from "@/components/admin/IconSelector";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { AboutStatistic } from "@shared/schema";

interface StatisticItemProps {
  statistic: AboutStatistic;
  onEdit: (statistic: AboutStatistic) => void;
  onDelete: (id: number) => void;
}

function SortableStatisticItem({ statistic, onEdit, onDelete }: StatisticItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: statistic.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getIcon = (iconName: string) => {
    const iconMap: Record<string, any> = {
      'BarChart3': BarChart3,
      'TrendingUp': TrendingUp,
      'Package': Package,
      'Users': Users,
      'Zap': Zap,
      'Globe': Globe,
      'Award': Award,
      'Shield': Shield,
    };
    const Icon = iconMap[iconName] || BarChart3;
    return <Icon className="h-5 w-5" />;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white dark:bg-gray-950 border rounded-lg p-4 ${isDragging ? 'shadow-lg' : ''}`}
    >
      <div className="flex items-center gap-4">
        <button
          className="cursor-grab"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5 text-gray-400" />
        </button>

        <div className="flex items-center gap-3 flex-1">
          <div className="text-primary">
            {getIcon(statistic.icon || 'BarChart3')}
          </div>
          <div>
            <div className="font-semibold">{statistic.label}</div>
            <div className="text-2xl font-bold text-primary">
              {statistic.value}{statistic.unit}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {statistic.isActive === false && (
            <span className="text-sm text-red-600 bg-red-100 dark:bg-red-900/20 px-2 py-1 rounded">
              Hidden
            </span>
          )}
          <Button size="sm" variant="ghost" onClick={() => onEdit(statistic)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onDelete(statistic.id)}>
            <Trash2 className="h-4 w-4" />
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
    icon: "BarChart3" as string,
    isActive: true
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data: statistics = [], isLoading } = useQuery<AboutStatistic[]>({
    queryKey: ['/api/about-statistics'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/about-statistics', { method: 'POST', body: data });
    },
    onSuccess: () => {
      // Invalidate both individual and batch cache for sync
      getQueryClient().invalidateQueries({ queryKey: ['/api/about-statistics'] });
      getQueryClient().invalidateQueries({ queryKey: ['/api/about-batch'] });
      toast({ title: "Success", description: "Statistic created successfully" });
      handleCloseDialog();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create statistic", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest(`/api/about-statistics/${id}`, { method: 'PATCH', body: data });
    },
    onSuccess: () => {
      // Invalidate both individual and batch cache for sync
      getQueryClient().invalidateQueries({ queryKey: ['/api/about-statistics'] });
      getQueryClient().invalidateQueries({ queryKey: ['/api/about-batch'] });
      toast({ title: "Success", description: "Statistic updated successfully" });
      handleCloseDialog();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update statistic", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const result = await apiRequest(`/api/about-statistics/${id}`, { method: 'DELETE' });
      return result;
    },
    onSuccess: () => {
      // Invalidate both individual and batch cache for sync
      getQueryClient().invalidateQueries({ queryKey: ['/api/about-statistics'] });
      getQueryClient().invalidateQueries({ queryKey: ['/api/about-batch'] });
      toast({ title: "Success", description: "Statistic deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete statistic", variant: "destructive" });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (statistics: { id: number; position: number }[]) => {
      return apiRequest('/api/about-statistics/reorder', { method: 'PATCH', body: { statistics } });
    },
    onSuccess: () => {
      // Invalidate both individual and batch cache for sync
      getQueryClient().invalidateQueries({ queryKey: ['/api/about-statistics'] });
      getQueryClient().invalidateQueries({ queryKey: ['/api/about-batch'] });
    },
  });

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id && Array.isArray(statistics)) {
      const oldIndex = statistics.findIndex((item: AboutStatistic) => item.id === active.id);
      const newIndex = statistics.findIndex((item: AboutStatistic) => item.id === over.id);

      const newStatistics = arrayMove(statistics, oldIndex, newIndex);
      const reorderedStatistics = newStatistics.map((stat: AboutStatistic, index: number) => ({
        id: stat.id,
        position: index
      }));

      getQueryClient().setQueryData(['/api/about-statistics'], newStatistics);
      reorderMutation.mutate(reorderedStatistics);
    }
  };

  const handleEdit = (statistic: AboutStatistic) => {
    setEditingStatistic(statistic);
    setFormData({
      label: statistic.label,
      value: statistic.value,
      unit: statistic.unit || "",
      icon: statistic.icon || "BarChart3",
      isActive: statistic.isActive !== false
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
      icon: "BarChart3",
      isActive: true
    });
  };

  const sortedStatistics = Array.isArray(statistics) ? [...statistics].sort((a: AboutStatistic, b: AboutStatistic) => (a.position || 0) - (b.position || 0)) : [];

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
              <Plus className="h-4 w-4 mr-2" />
              Add Statistic
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {sortedStatistics.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No statistics yet. Add your first key metric!
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sortedStatistics.map(s => s.id)}
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

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Tip:</strong> Statistics are displayed prominently on your About page. Use impressive numbers
              that showcase your company's scale, reach, and achievements.
            </p>
          </div>
        </CardContent>
      </Card>

      <EnhancedDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <EnhancedDialogContent contentType="form">
          <EnhancedDialogHeader>
            <EnhancedDialogTitle>
              {editingStatistic ? "Edit Statistic" : "Add Statistic"}
            </EnhancedDialogTitle>
          </EnhancedDialogHeader>

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
              value={formData.icon || "BarChart3"}
              onChange={(value) => {
                setFormData(prev => ({ ...prev, icon: value as string }));
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

          <EnhancedDialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.label || !formData.value}>
              {editingStatistic ? "Update" : "Create"}
            </Button>
          </EnhancedDialogFooter>
        </EnhancedDialogContent>
      </EnhancedDialog>
    </div>
  );
}