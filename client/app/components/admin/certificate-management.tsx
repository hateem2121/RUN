import type { Certificate, InsertCertificate } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  CheckCircle,
  Clock,
  Grid3X3,
  List,
  Plus,
  Search,
  Settings,
  Table,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { StandardMediaSelectionDialog } from "@/components/admin/shared/StandardMediaSelectionDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, getQueryClient } from "@/lib/queryClient";
import { CertificateAnalytics } from "./certificate/CertificateAnalytics";
import { CertificateForm } from "./certificate/CertificateForm";
import { CertificateInsights } from "./certificate/CertificateInsights";
import { CertificateList } from "./certificate/CertificateList";
import {
  type CertificateAnalyticsData,
  type CertificateFormData,
  initialCertificateFormData,
} from "./certificate/types";

export default function CertificateManagement() {
  const [formData, setFormData] = useState<CertificateFormData>(initialCertificateFormData);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [editingCertificate, setEditingCertificate] = useState<Certificate | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [selectedCertificates, setSelectedCertificates] = useState<number[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "detailed">("grid");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [currentTab, setCurrentTab] = useState("certificates");

  const { toast } = useToast();

  const { data: certificates = [], isPending: isLoading } = useQuery<Certificate[]>({
    queryKey: ["/api/certificates"],
  });

  const sanitizeCertificateData = (data: Partial<InsertCertificate>) => ({
    ...data,
    documentUrl: data.documentUrl?.trim() || null,
    imageUrl: data.imageUrl?.trim() || null,
    type: data.type?.trim() || null,
    issuingOrganization: data.issuingOrganization?.trim() || null,
    description: data.description?.trim() || null,
  });

  const createCertificateMutation = useMutation({
    mutationFn: (data: InsertCertificate) => {
      const sanitizedData = sanitizeCertificateData(data);
      return apiRequest("/api/certificates", {
        method: "POST",
        body: JSON.stringify(sanitizedData),
      });
    },
    onSuccess: () => {
      getQueryClient().invalidateQueries({ queryKey: ["/api/certificates"] });
      toast({ title: "Success", description: "Certificate created successfully" });
      resetForm();
      setIsCreateDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateCertificateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertCertificate> }) => {
      const sanitizedData = sanitizeCertificateData(data);
      return apiRequest(`/api/certificates/${id}`, {
        method: "PUT",
        body: JSON.stringify(sanitizedData),
      });
    },
    onSuccess: () => {
      getQueryClient().invalidateQueries({ queryKey: ["/api/certificates"] });
      toast({ title: "Success", description: "Certificate updated successfully" });
      setIsEditDialogOpen(false);
      setEditingCertificate(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteCertificateMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/certificates/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      getQueryClient().invalidateQueries({ queryKey: ["/api/certificates"] });
      toast({ title: "Success", description: "Certificate deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: ({ ids, updates }: { ids: number[]; updates: Partial<InsertCertificate> }) => {
      return Promise.all(
        ids.map((id) =>
          apiRequest(`/api/certificates/${id}`, { method: "PUT", body: JSON.stringify(updates) }),
        ),
      );
    },
    onSuccess: () => {
      getQueryClient().invalidateQueries({ queryKey: ["/api/certificates"] });
      toast({ title: "Success", description: "Certificates updated successfully" });
      setSelectedCertificates([]);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: number[]) =>
      Promise.all(ids.map((id) => apiRequest(`/api/certificates/${id}`, { method: "DELETE" }))),
    onSuccess: () => {
      getQueryClient().invalidateQueries({ queryKey: ["/api/certificates"] });
      toast({ title: "Success", description: "Certificates deleted successfully" });
      setSelectedCertificates([]);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => setFormData(initialCertificateFormData);

  const handleEdit = (certificate: Certificate) => {
    setEditingCertificate(certificate);
    setFormData({
      name: certificate.name,
      type: certificate.type || "",
      issuingOrganization: certificate.issuingOrganization || "",
      description: certificate.description || "",
      documentId: certificate.documentId,
      imageId: certificate.imageId,
      documentUrl: certificate.documentUrl || "",
      imageUrl: certificate.imageUrl || "",
      isActive: certificate.isActive ?? true,
    });
    setIsEditDialogOpen(true);
  };

  const handleDuplicate = (certificate: Certificate) => {
    setFormData({
      name: `${certificate.name} (Copy)`,
      type: certificate.type || "",
      issuingOrganization: certificate.issuingOrganization || "",
      description: certificate.description || "",
      documentId: certificate.documentId,
      imageId: certificate.imageId,
      documentUrl: certificate.documentUrl || "",
      imageUrl: certificate.imageUrl || "",
      isActive: true,
    });
    setIsCreateDialogOpen(true);
  };

  const filteredAndSortedCertificates = useMemo(() => {
    const filtered = certificates.filter((cert) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !cert.name.toLowerCase().includes(query) &&
          !cert.type?.toLowerCase().includes(query) &&
          !cert.description?.toLowerCase().includes(query) &&
          !cert.issuingOrganization?.toLowerCase().includes(query)
        ) {
          return false;
        }
      }
      if (statusFilter !== "all" && (statusFilter === "active" ? !cert.isActive : cert.isActive)) {
        return false;
      }
      if (
        typeFilter !== "all" &&
        typeFilter !== "" &&
        !cert.type?.toLowerCase().includes(typeFilter.toLowerCase())
      ) {
        return false;
      }
      return true;
    });

    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === "type") {
        comparison = (a.type || "").localeCompare(b.type || "");
      } else if (sortBy === "issuingOrganization") {
        comparison = (a.issuingOrganization || "").localeCompare(b.issuingOrganization || "");
      } else if (sortBy === "createdAt") {
        comparison =
          (a.createdAt ? new Date(a.createdAt).getTime() : 0) -
          (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
    return filtered;
  }, [certificates, searchQuery, statusFilter, typeFilter, sortBy, sortDirection]);

  const analytics = useMemo((): CertificateAnalyticsData | null => {
    if (!certificates.length) {
      return null;
    }
    const now = new Date();
    const threeMonths = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    const active = certificates.filter((c) => c.isActive).length;
    const expired = certificates.filter((c) => c.expiryDate && new Date(c.expiryDate) < now).length;
    const expiringSoon = certificates.filter(
      (c) => c.expiryDate && new Date(c.expiryDate) >= now && new Date(c.expiryDate) <= threeMonths,
    ).length;
    const typeDistribution = certificates.reduce(
      (acc, c) => {
        const t = c.type || "unknown";
        acc[t] = (acc[t] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
    const issuingBodyDistribution = certificates.reduce(
      (acc, c) => {
        if (c.issuingOrganization) {
          acc[c.issuingOrganization] = (acc[c.issuingOrganization] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>,
    );
    return {
      total: certificates.length,
      active,
      expired,
      expiringSoon,
      typeDistribution,
      issuingBodyDistribution,
    };
  }, [certificates]);

  return (
    <div className="min-h-screen overflow-hidden bg-linear-to-br from-blue-50 via-white to-purple-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text font-bold font-neue-stance text-3xl text-transparent">
              Certificate Management
            </h1>
            <p className="mt-2 text-neutral-600">
              Manage compliance and sustainability certifications
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => {
                resetForm();
                setIsCreateDialogOpen(true);
              }}
              className="bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Certificate
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const dataStr = JSON.stringify(certificates, null, 2);
                const link = document.createElement("a");
                link.setAttribute(
                  "href",
                  `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`,
                );
                link.setAttribute("download", "certificates.json");
                link.click();
              }}
            >
              <BarChart3 className="mr-2 h-4 w-4" /> Export
            </Button>
          </div>
        </div>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="certificates">Certificates</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="certificates" className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 lg:flex-row">
                  <div className="relative flex-1">
                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <Input
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSearchQuery("")}
                        className="absolute top-1/2 right-2 h-6 w-6 -translate-y-1/2 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Filter type..."
                      value={typeFilter === "all" ? "" : typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value || "all")}
                      className="w-40"
                    />
                    <Button
                      variant="outline"
                      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                      className={showAdvancedFilters ? "bg-blue-50" : ""}
                    >
                      <Settings className="mr-2 h-4 w-4" /> Filters
                    </Button>
                  </div>
                  <div className="flex items-center rounded-lg border p-1">
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "detailed" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("detailed")}
                    >
                      <Table className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {showAdvancedFilters && (
                  <div className="mt-4 rounded-lg border-t bg-neutral-50 p-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <Label>Sort by</Label>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="name">Name</SelectItem>
                          <SelectItem value="type">Type</SelectItem>
                          <SelectItem value="issuingOrganization">Organization</SelectItem>
                          <SelectItem value="createdAt">Date</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Direction</Label>
                      <Select
                        value={sortDirection}
                        onValueChange={(v: "asc" | "desc") => setSortDirection(v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="asc">Ascending</SelectItem>
                          <SelectItem value="desc">Descending</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSearchQuery("");
                          setStatusFilter("all");
                          setTypeFilter("all");
                          setSortBy("name");
                          setSortDirection("asc");
                        }}
                        className="w-full"
                      >
                        Clear Filters
                      </Button>
                    </div>
                  </div>
                )}

                {selectedCertificates.length > 0 && (
                  <div className="mt-4 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-3">
                    <span className="font-medium text-blue-700 text-sm">
                      {selectedCertificates.length} selected
                    </span>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          bulkUpdateMutation.mutate({
                            ids: selectedCertificates,
                            updates: { isActive: true },
                          })
                        }
                      >
                        <CheckCircle className="mr-1 h-4 w-4" /> Activate
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          bulkUpdateMutation.mutate({
                            ids: selectedCertificates,
                            updates: { isActive: false },
                          })
                        }
                      >
                        <Clock className="mr-1 h-4 w-4" /> Deactivate
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setShowBulkDeleteDialog(true)}
                      >
                        <Trash2 className="mr-1 h-4 w-4" /> Delete
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <CertificateList
              viewMode={viewMode}
              isLoading={isLoading}
              certificates={filteredAndSortedCertificates}
              selectedCertificates={selectedCertificates}
              onSelect={setSelectedCertificates}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
              onDelete={(id) => deleteCertificateMutation.mutate(id)}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <CertificateAnalytics analytics={analytics} />
          </TabsContent>
          <TabsContent value="insights">
            <CertificateInsights
              analytics={analytics}
              onCreate={() => setIsCreateDialogOpen(true)}
            />
          </TabsContent>
        </Tabs>

        <Dialog
          open={isCreateDialogOpen || isEditDialogOpen}
          onOpenChange={(o) => {
            if (!o) {
              setIsCreateDialogOpen(false);
              setIsEditDialogOpen(false);
              resetForm();
            }
          }}
        >
          <DialogContent contentType="form">
            <DialogHeader>
              <DialogTitle>
                {editingCertificate ? "Edit Certificate" : "Create New Certificate"}
              </DialogTitle>
            </DialogHeader>
            <DialogBody>
              <CertificateForm
                formData={formData}
                setFormData={setFormData}
                onOpenMediaPicker={() => setIsMediaPickerOpen(true)}
                isPending={
                  createCertificateMutation.isPending || updateCertificateMutation.isPending
                }
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
                  editingCertificate
                    ? updateCertificateMutation.mutate({
                        id: editingCertificate.id,
                        data: formData,
                      })
                    : createCertificateMutation.mutate(formData as InsertCertificate)
                }
                disabled={
                  createCertificateMutation.isPending || updateCertificateMutation.isPending
                }
              >
                {editingCertificate ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <StandardMediaSelectionDialog
          isOpen={isMediaPickerOpen}
          onClose={() => setIsMediaPickerOpen(false)}
          onSelect={(assets) => {
            const asset = Array.isArray(assets) ? assets[0] : assets;
            if (asset?.id) {
              setFormData((prev) => ({ ...prev, imageId: asset.id }));
              setIsMediaPickerOpen(false);
              toast({ title: "Success", description: "Image selected" });
            }
          }}
          mediaPickerTarget="certificate-logo"
        />

        <Dialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
          <DialogContent contentType="form">
            <DialogHeader>
              <DialogTitle>Delete Certificates</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <p>
                Are you sure you want to delete {selectedCertificates.length} certificates? This
                cannot be undone.
              </p>
            </DialogBody>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBulkDeleteDialog(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  bulkDeleteMutation.mutate(selectedCertificates);
                  setShowBulkDeleteDialog(false);
                }}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
