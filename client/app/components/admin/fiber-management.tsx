import type { Fiber } from "@shared/index";
import { useMutation, useQuery } from "@tanstack/react-query";
import { BarChart3, Grid2X2, Layers, List, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { propertiesToObject } from "@/lib/fiber-utils";
import { apiRequest, getQueryClient } from "@/lib/queryClient";
import { FiberDetails } from "./fiber/FiberDetails";
import { FiberForm } from "./fiber/FiberForm";
import { FiberList } from "./fiber/FiberList";
import { type FiberFormData, initialFiberFormData } from "./fiber/types";

export function FiberManagement() {
  const [formData, setFormData] = useState<FiberFormData>(initialFiberFormData);
  const [propertyList, setPropertyList] = useState<string[]>([]);
  const [newProperty, setNewProperty] = useState("");
  const [isCustomType, setIsCustomType] = useState(false);
  const [customType, setCustomType] = useState("");

  const [editingFiber, setEditingFiber] = useState<Fiber | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const [nameError, setNameError] = useState("");
  const [selectedFibers, setSelectedFibers] = useState<Set<number>>(new Set());
  const [sortBy, _setSortBy] = useState<"name" | "type" | "created" | "status" | "sustainability">(
    "name",
  );
  const [sortOrder, _setSortOrder] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<"list" | "grid" | "detailed">("list");
  const [detailFiber, setDetailFiber] = useState<Fiber | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const { toast } = useToast();

  const { data: fibers = [], isPending: isLoading } = useQuery<Fiber[]>({
    queryKey: ["/api/fibers"],
  });

  const resetForm = () => {
    setFormData(initialFiberFormData);
    setPropertyList([]);
    setNewProperty("");
    setNameError("");
    setIsCustomType(false);
    setCustomType("");
  };

  const addProperty = () => {
    if (newProperty?.trim() && !propertyList.includes(newProperty.trim())) {
      const updatedList = [...propertyList, newProperty.trim()];
      setPropertyList(updatedList);
      setFormData((prev) => ({ ...prev, properties: updatedList.join(", ") }));
      setNewProperty("");
    }
  };

  const removeProperty = (index: number) => {
    const updatedList = propertyList.filter((_, i) => i !== index);
    setPropertyList(updatedList);
    setFormData((prev) => ({ ...prev, properties: updatedList.join(", ") }));
  };

  const createFiberMutation = useMutation({
    mutationFn: async (data: FiberFormData) => {
      const transformedData = {
        ...data,
        properties: data.properties
          ? propertiesToObject(
              data.properties
                .split(",")
                .map((p) => p.trim())
                .filter(Boolean),
            )
          : undefined,
      };
      return await apiRequest("/api/fibers", {
        method: "POST",
        body: JSON.stringify(transformedData),
      });
    },
    onSuccess: () => {
      getQueryClient().invalidateQueries({ queryKey: ["/api/fibers"] });
      toast({ title: "Success", description: "Fiber created successfully" });
      resetForm();
      setIsCreateDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateFiberMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: FiberFormData }) => {
      const transformedData = {
        ...data,
        properties: data.properties
          ? propertiesToObject(
              data.properties
                .split(",")
                .map((p) => p.trim())
                .filter(Boolean),
            )
          : undefined,
      };
      return await apiRequest(`/api/fibers/${id}`, {
        method: "PATCH",
        body: JSON.stringify(transformedData),
      });
    },
    onSuccess: () => {
      getQueryClient().invalidateQueries({ queryKey: ["/api/fibers"] });
      toast({ title: "Success", description: "Fiber updated successfully" });
      setIsEditDialogOpen(false);
      setEditingFiber(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteFiberMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/fibers/${id}`, { method: "DELETE" });
    },
    onSuccess: (_, deletedId) => {
      getQueryClient().invalidateQueries({ queryKey: ["/api/fibers"] });
      toast({ title: "Success", description: "Fiber deleted successfully" });
      setSelectedFibers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(deletedId);
        return newSet;
      });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleEdit = (fiber: Fiber) => {
    setEditingFiber(fiber);
    setFormData({
      name: fiber.name,
      type: fiber.type,
      description: fiber.description || "",
      properties: fiber.properties ? Object.keys(fiber.properties).join(", ") : "",
      sustainabilityScore: fiber.sustainabilityScore || undefined,
      environmentalImpact: fiber.environmentalImpact || "",
      isActive: fiber.isActive ?? true,
    });
    setPropertyList(fiber.properties ? Object.keys(fiber.properties) : []);
    setIsEditDialogOpen(true);
  };

  const handleDuplicate = (fiber: Fiber) => {
    setFormData({
      name: `${fiber.name} (Copy)`,
      type: fiber.type,
      description: fiber.description || "",
      properties: fiber.properties ? Object.keys(fiber.properties).join(", ") : "",
      sustainabilityScore: fiber.sustainabilityScore || undefined,
      environmentalImpact: fiber.environmentalImpact || "",
      isActive: fiber.isActive ?? true,
    });
    setPropertyList(fiber.properties ? Object.keys(fiber.properties) : []);
    setIsCreateDialogOpen(true);
  };

  const filteredFibers = useMemo(() => {
    return fibers
      .filter((fiber) => {
        const matchesSearch = fiber.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === "all" || fiber.type === filterType;
        const matchesStatus =
          filterStatus === "all" || (filterStatus === "active" ? fiber.isActive : !fiber.isActive);
        return matchesSearch && matchesType && matchesStatus;
      })
      .sort((a, b) => {
        const factor = sortOrder === "asc" ? 1 : -1;
        if (sortBy === "name") {
          return factor * a.name.localeCompare(b.name);
        }
        return 0;
      });
  }, [fibers, searchTerm, filterType, filterStatus, sortBy, sortOrder]);

  const stats = useMemo(() => {
    const total = fibers.length;
    const active = fibers.filter((f) => f.isActive).length;
    const types = Array.from(new Set(fibers.map((f) => f.type))).length;
    return { total, active, types };
  }, [fibers]);

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Fiber Management</h1>
          <p className="text-[#68869A]">
            Manage raw material fibers, their properties and sustainability impact.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowStats(!showStats)}>
            <BarChart3 className="mr-2 h-4 w-4" />
            {showStats ? "Hide Stats" : "Show Stats"}
          </Button>
          <Button
            onClick={() => {
              resetForm();
              setIsCreateDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Fiber
          </Button>
        </div>
      </div>

      {showStats && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="glass-premium">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-neutral-500">Total Fibers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="glass-premium">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-neutral-500">Active Fibers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            </CardContent>
          </Card>
          <Card className="glass-premium">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-neutral-500">Unique Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.types}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="glass-premium mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#68869A]" />
              <Input
                placeholder="Search fibers..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="natural">Natural</SelectItem>
                  <SelectItem value="synthetic">Synthetic</SelectItem>
                  <SelectItem value="blended">Blended</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center rounded-md border border-white/10 bg-white/5 p-1">
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid2X2 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "detailed" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setViewMode("detailed")}
                >
                  <Layers className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <FiberList
        isLoading={isLoading}
        fibers={filteredFibers}
        viewMode={viewMode}
        selectedFibers={selectedFibers}
        onSelectFiber={(id) => {
          const newSet = new Set(selectedFibers);
          if (newSet.has(id)) {
            newSet.delete(id);
          } else {
            newSet.add(id);
          }
          setSelectedFibers(newSet);
        }}
        onViewDetail={(fiber) => {
          setDetailFiber(fiber);
          setIsDetailDialogOpen(true);
        }}
        onEdit={handleEdit}
        onDuplicate={handleDuplicate}
        onDelete={(id) => deleteFiberMutation.mutate(id)}
        searchTerm={searchTerm}
        filterType={filterType}
        filterStatus={filterStatus}
      />

      <Dialog
        open={isCreateDialogOpen || isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setIsEditDialogOpen(false);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-2xl" contentType="form">
          <DialogHeader>
            <DialogTitle>{editingFiber ? "Edit Fiber" : "Create New Fiber"}</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <FiberForm
              formData={formData}
              setFormData={setFormData}
              nameError={nameError}
              isCustomType={isCustomType}
              setIsCustomType={setIsCustomType}
              customType={customType}
              setCustomType={setCustomType}
              propertyList={propertyList}
              newProperty={newProperty}
              setNewProperty={setNewProperty}
              addProperty={addProperty}
              removeProperty={removeProperty}
            />
          </DialogBody>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setIsEditDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                editingFiber
                  ? updateFiberMutation.mutate({ id: editingFiber.id, data: formData })
                  : createFiberMutation.mutate(formData)
              }
            >
              {editingFiber ? "Update Fiber" : "Create Fiber"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FiberDetails
        fiber={detailFiber}
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
      />
    </div>
  );
}
