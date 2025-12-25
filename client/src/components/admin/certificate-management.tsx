import type { Certificate } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Award,
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  Copy,
  Edit2,
  ExternalLink,
  FileText,
  Grid3X3,
  Image,
  List,
  MoreVertical,
  Plus,
  Search,
  Settings,
  Shield,
  Table,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { DeleteConfirmationDialog } from "@/components/admin/shared/DeleteConfirmationDialog";
import { StandardMediaSelectionDialog } from "@/components/admin/shared/StandardMediaSelectionDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  EnhancedDialog,
  EnhancedDialogBody,
  EnhancedDialogContent,
  EnhancedDialogFooter,
  EnhancedDialogHeader,
  EnhancedDialogTitle,
} from "@/components/ui/enhanced-dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, getQueryClient } from "@/lib/queryClient";

const getCertificateTypeIcon = (type: string | undefined) => {
  if (!type) return <FileText className="h-4 w-4" />;

  switch (type.toLowerCase()) {
    case "sustainability":
      return <Award className="h-4 w-4" />;
    case "compliance":
      return <Shield className="h-4 w-4" />;
    case "quality":
      return <CheckCircle className="h-4 w-4" />;
    case "safety":
      return <Shield className="h-4 w-4" />;
    case "environmental":
      return <Award className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

interface CertificateListProps {
  viewMode: "grid" | "list" | "detailed";
  isLoading: boolean;
  certificates: Certificate[];
  selectedCertificates: number[];
  onSelect: (ids: number[]) => void;
  onEdit: (certificate: Certificate) => void;
  onDuplicate: (certificate: Certificate) => void;
  onDelete: (id: number) => void;
}

const CertificateList = ({
  viewMode,
  isLoading,
  certificates,
  selectedCertificates,
  onSelect,
  onEdit,
  onDuplicate,
  onDelete,
}: CertificateListProps) => {
  const toggleSelectAll = () => {
    if (selectedCertificates.length === (certificates?.length || 0)) {
      onSelect([]);
    } else {
      onSelect(certificates?.map((cert) => cert.id) || []);
    }
  };

  const handleCheckboxChange = (checked: boolean, id: number) => {
    if (checked) {
      onSelect([...selectedCertificates, id]);
    } else {
      onSelect(selectedCertificates.filter((certId) => certId !== id));
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Card key={`skeleton-${i}`} className="animate-pulse">
            <CardContent className="p-6">
              <div className="mb-4 h-6 rounded bg-neutral-200"></div>
              <div className="mb-2 h-4 rounded bg-neutral-200"></div>
              <div className="h-4 w-3/4 rounded bg-neutral-200"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!certificates || certificates.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
            <Award className="h-8 w-8 text-neutral-400" />
          </div>
          <h3 className="mb-2 font-medium text-lg text-neutral-900">No certificates found</h3>
          <p className="mb-4 text-neutral-500">Try adjusting your filters or search terms.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      {/* Select All Checkbox */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={selectedCertificates.length === certificates.length && certificates.length > 0}
            onCheckedChange={toggleSelectAll}
          />
          <Label className="text-neutral-600 text-sm">
            Select all {certificates.length} certificate
            {certificates.length === 1 ? "" : "s"}
          </Label>
        </div>
        <div className="text-neutral-500 text-sm">Showing {certificates.length} certificates</div>
      </div>

      {/* Certificate Grid/List */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {certificates.map((certificate) => (
            <Card
              key={certificate.id}
              className={`group relative transition-all duration-200 hover:shadow-lg ${
                selectedCertificates.includes(certificate.id) ? "bg-blue-50 ring-2 ring-ring" : ""
              }`}
            >
              <CardContent className="p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={selectedCertificates.includes(certificate.id)}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange(checked as boolean, certificate.id)
                      }
                    />
                    <div className="flex items-center space-x-2">
                      {getCertificateTypeIcon(certificate.type || undefined)}
                      <div>
                        <h3 className="font-semibold text-lg text-neutral-900">
                          {certificate.name}
                        </h3>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {certificate.status
                            ? certificate.status.charAt(0).toUpperCase() +
                              certificate.status.slice(1)
                            : "No Type"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(certificate)}>
                        <Edit2 className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDuplicate(certificate)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(certificate.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={certificate.isActive ? "default" : "secondary"}>
                      {certificate.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  {certificate.issuingOrganization && (
                    <p className="text-neutral-600 text-sm">
                      <strong>Issued by:</strong> {certificate.issuingOrganization}
                    </p>
                  )}

                  {certificate.description && (
                    <p className="line-clamp-2 text-neutral-600 text-sm">
                      {certificate.description}
                    </p>
                  )}

                  <div className="text-neutral-500 text-sm">
                    <p>
                      <strong>Created:</strong>{" "}
                      {certificate.createdAt
                        ? new Date(certificate.createdAt).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>

                  {certificate.documentId && (
                    <a
                      href={`/api/media/${certificate.documentId}/content`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-blue-600 text-sm hover:text-blue-800"
                    >
                      <ExternalLink className="mr-1 h-3 w-3" />
                      View Document
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {viewMode === "list" && (
        <div className="space-y-2">
          {certificates.map((certificate, index) => (
            <div
              key={certificate.id}
              className={`flex items-center space-x-4 rounded-lg p-4 transition-all duration-200 hover:bg-neutral-50 ${
                index % 2 === 0 ? "bg-neutral-25" : "bg-white"
              } ${
                selectedCertificates.includes(certificate.id) ? "bg-blue-50 ring-2 ring-ring" : ""
              }`}
            >
              <Checkbox
                checked={selectedCertificates.includes(certificate.id)}
                onCheckedChange={(checked) =>
                  handleCheckboxChange(checked as boolean, certificate.id)
                }
              />

              <div className="flex flex-1 items-center space-x-3">
                {getCertificateTypeIcon(certificate.type || undefined)}
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center space-x-2">
                    <h3 className="truncate font-medium text-neutral-900">{certificate.name}</h3>
                    <Badge variant="outline" className="text-xs">
                      {certificate.status
                        ? certificate.status.charAt(0).toUpperCase() + certificate.status.slice(1)
                        : "No Type"}
                    </Badge>
                  </div>
                  <p className="truncate text-neutral-600 text-sm">
                    {certificate.issuingOrganization &&
                      `Issued by: ${certificate.issuingOrganization}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Badge variant={certificate.isActive ? "default" : "secondary"} className="text-xs">
                  {certificate.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>

              <div className="w-24 min-w-0 text-right text-neutral-500 text-sm sm:w-28 lg:w-32">
                {certificate.createdAt
                  ? new Date(certificate.createdAt).toLocaleDateString()
                  : "N/A"}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(certificate)}>
                    <Edit2 className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDuplicate(certificate)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(certificate.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}

      {viewMode === "detailed" && (
        <div className="space-y-4">
          {certificates.map((certificate) => (
            <Card
              key={certificate.id}
              className={`transition-all duration-200 hover:shadow-lg ${
                selectedCertificates.includes(certificate.id) ? "bg-blue-50 ring-2 ring-ring" : ""
              }`}
            >
              <CardContent className="p-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  <div className="lg:col-span-2">
                    <div className="mb-4 flex items-start space-x-4">
                      <Checkbox
                        checked={selectedCertificates.includes(certificate.id)}
                        onCheckedChange={(checked) =>
                          handleCheckboxChange(checked as boolean, certificate.id)
                        }
                      />
                      <div className="flex-1">
                        <div className="mb-2 flex items-center space-x-3">
                          {getCertificateTypeIcon(certificate.type || undefined)}
                          <h3 className="font-semibold text-neutral-900 text-xl">
                            {certificate.name}
                          </h3>
                        </div>
                        <div className="mb-3 flex items-center space-x-2">
                          <Badge variant="outline">
                            {certificate.status
                              ? certificate.status.charAt(0).toUpperCase() +
                                certificate.status.slice(1)
                              : "No Type"}
                          </Badge>
                          <Badge variant={certificate.isActive ? "default" : "secondary"}>
                            {certificate.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>

                        {certificate.issuingOrganization && (
                          <p className="mb-2 text-neutral-600">
                            <strong>Issued by:</strong> {certificate.issuingOrganization}
                          </p>
                        )}

                        {certificate.description && (
                          <p className="mb-4 text-neutral-600">{certificate.description}</p>
                        )}

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-neutral-700">Created:</span>
                            <p className="text-neutral-600">
                              {certificate.createdAt
                                ? new Date(certificate.createdAt).toLocaleDateString()
                                : "N/A"}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-neutral-700">Type:</span>
                            <p className="text-neutral-600">{certificate.status}</p>
                          </div>
                        </div>

                        {certificate.documentId && (
                          <div className="mt-4">
                            <a
                              href={`/api/media/${certificate.documentId}/content`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-blue-600 hover:text-blue-800"
                            >
                              <ExternalLink className="mr-2 h-4 w-4" />
                              View Certificate Document
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2">
                    <Button onClick={() => onEdit(certificate)} className="w-full">
                      <Edit2 className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      onClick={() => onDuplicate(certificate)}
                      variant="outline"
                      className="w-full"
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Duplicate
                    </Button>
                    <DeleteConfirmationDialog
                      title="Delete Certificate"
                      description={`Are you sure you want to delete "${certificate.name}"? This action cannot be undone.`}
                      confirmText="Delete"
                      onConfirm={() => onDelete(certificate.id)}
                      triggerClassName="w-full bg-red-600 hover:bg-red-700 text-white"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

interface CertificateInsightsProps {
  analytics: any;
  onCreate: () => void;
}

const CertificateInsights = ({ analytics, onCreate }: CertificateInsightsProps) => {
  if (!analytics) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Certificate Management Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.expired > 0 && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 text-yellow-600" />
                  <div className="flex-1">
                    <h4 className="mb-1 font-medium text-neutral-900">Expired Certificates</h4>
                    <p className="mb-2 text-neutral-600">
                      You have {analytics.expired} expired certificate
                      {analytics.expired === 1 ? "" : "s"} that need renewal.
                    </p>
                    <p className="font-medium text-neutral-700 text-sm">
                      Recommended Action: Review and renew expired certificates
                    </p>
                  </div>
                </div>
              </div>
            )}

            {analytics.expiringSoon > 0 && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-start space-x-3">
                  <Clock className="mt-0.5 h-5 w-5 text-blue-600" />
                  <div className="flex-1">
                    <h4 className="mb-1 font-medium text-neutral-900">
                      Certificates Expiring Soon
                    </h4>
                    <p className="mb-2 text-neutral-600">
                      {analytics.expiringSoon} certificate
                      {analytics.expiringSoon === 1 ? "" : "s"} will expire within the next 3
                      months.
                    </p>
                    <p className="font-medium text-neutral-700 text-sm">
                      Recommended Action: Plan renewal process for expiring certificates
                    </p>
                  </div>
                </div>
              </div>
            )}

            {analytics.total > 0 && (analytics.active / analytics.total) * 100 < 80 && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 text-yellow-600" />
                  <div className="flex-1">
                    <h4 className="mb-1 font-medium text-neutral-900">
                      Low Active Certificate Ratio
                    </h4>
                    <p className="mb-2 text-neutral-600">
                      Only {Math.round((analytics.active / analytics.total) * 100)}% of your
                      certificates are currently active.
                    </p>
                    <p className="font-medium text-neutral-700 text-sm">
                      Recommended Action: Review inactive certificates and activate if needed
                    </p>
                  </div>
                </div>
              </div>
            )}

            {analytics.total === 0 && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-start space-x-3">
                  <Award className="mt-0.5 h-5 w-5 text-blue-600" />
                  <div className="flex-1">
                    <h4 className="mb-1 font-medium text-neutral-900">No Certificates Found</h4>
                    <p className="mb-2 text-neutral-600">
                      Start building your certification portfolio for better compliance and
                      sustainability.
                    </p>
                    <p className="font-medium text-neutral-700 text-sm">
                      Recommended Action: Add your first certificate to begin tracking
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Button onClick={onCreate} className="h-auto flex-col items-start p-4">
              <Plus className="mb-2 h-5 w-5" />
              <span className="font-medium">Add New Certificate</span>
              <span className="mt-1 text-neutral-500 text-xs">
                Create a new certification record
              </span>
            </Button>
            <Button variant="outline" className="h-auto flex-col items-start p-4">
              <Calendar className="mb-2 h-5 w-5" />
              <span className="font-medium">Schedule Renewals</span>
              <span className="mt-1 text-neutral-500 text-xs">
                Set up automatic renewal reminders
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const CertificateAnalytics = ({ analytics }: { analytics: any }) => {
  if (!analytics) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="mb-2 flex items-center space-x-2">
              <Award className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-neutral-600 text-sm">Total Certificates</span>
            </div>
            <div className="font-bold text-2xl text-neutral-900">{analytics.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="mb-2 flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium text-neutral-600 text-sm">Active</span>
            </div>
            <div className="font-bold text-2xl text-green-600">{analytics.active}</div>
            <div className="text-neutral-500 text-xs">
              {analytics.total > 0 ? Math.round((analytics.active / analytics.total) * 100) : 0}% of
              total
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="mb-2 flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <span className="font-medium text-neutral-600 text-sm">Expiring Soon</span>
            </div>
            <div className="font-bold text-2xl text-yellow-600">{analytics.expiringSoon}</div>
            <div className="text-neutral-500 text-xs">Within 3 months</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="mb-2 flex items-center space-x-2">
              <X className="h-5 w-5 text-red-600" />
              <span className="font-medium text-neutral-600 text-sm">Expired</span>
            </div>
            <div className="font-bold text-2xl text-red-600">{analytics.expired}</div>
            <div className="text-neutral-500 text-xs">Require renewal</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Certificate Types Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(analytics.typeDistribution).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="font-medium text-sm capitalize">{type}</span>
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-32 rounded-full bg-neutral-200">
                    <div
                      className="h-2 rounded-full bg-blue-600"
                      style={{
                        width: `${((count as number) / analytics.total) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="w-8 text-right text-neutral-600 text-sm">{count as number}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Certificate Issuers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(analytics.issuingBodyDistribution)
              .sort(([, a], [, b]) => (b as number) - (a as number))
              .slice(0, 5)
              .map(([issuer, count]) => (
                <div
                  key={issuer}
                  className="flex items-center justify-between rounded-lg bg-neutral-50 p-3"
                >
                  <span className="font-medium">{issuer}</span>
                  <Badge variant="outline">
                    {count as number} certificate
                    {(count as number) === 1 ? "" : "s"}
                  </Badge>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default function CertificateManagement() {
  // Core state management
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    issuingOrganization: "",
    description: "",
    documentId: null as number | null,
    imageId: null as number | null,
    documentUrl: "",
    imageUrl: "",
    isActive: true,
  });

  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  const [editingCertificate, setEditingCertificate] = useState<Certificate | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [selectedCertificates, setSelectedCertificates] = useState<number[]>([]);

  // Search and filtering state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "detailed">("grid");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [currentTab, setCurrentTab] = useState("certificates");

  const { toast } = useToast();

  const { data: certificates, isPending: isLoading } = useQuery<Certificate[]>({
    queryKey: ["/api/certificates"],
  });

  // Helper function to sanitize form data (convert empty strings to null)
  const sanitizeCertificateData = (data: any) => {
    return {
      ...data,
      documentUrl: data.documentUrl?.trim() || null,
      imageUrl: data.imageUrl?.trim() || null,
      type: data.type?.trim() || null,
      issuingOrganization: data.issuingOrganization?.trim() || null,
      description: data.description?.trim() || null,
    };
  };

  // Mutations
  const createCertificateMutation = useMutation({
    mutationFn: async (data: any) => {
      const sanitizedData = sanitizeCertificateData(data);
      return await apiRequest("/api/certificates", {
        method: "POST",
        body: JSON.stringify(sanitizedData),
      });
    },
    onSuccess: () => {
      getQueryClient().invalidateQueries({ queryKey: ["/api/certificates"] });
      toast({
        title: "Success",
        description: "Certificate created successfully",
      });
      resetForm();
      setIsCreateDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create certificate",
        variant: "destructive",
      });
    },
  });

  const updateCertificateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const sanitizedData = sanitizeCertificateData(data);
      return await apiRequest(`/api/certificates/${id}`, {
        method: "PUT",
        body: JSON.stringify(sanitizedData),
      });
    },
    onSuccess: () => {
      getQueryClient().invalidateQueries({ queryKey: ["/api/certificates"] });
      toast({
        title: "Success",
        description: "Certificate updated successfully",
      });
      setIsEditDialogOpen(false);
      setEditingCertificate(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update certificate",
        variant: "destructive",
      });
    },
  });

  const deleteCertificateMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/certificates/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      getQueryClient().invalidateQueries({ queryKey: ["/api/certificates"] });
      toast({
        title: "Success",
        description: "Certificate deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete certificate",
        variant: "destructive",
      });
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, updates }: { ids: number[]; updates: any }) => {
      return await Promise.all(
        ids.map((id) =>
          apiRequest(`/api/certificates/${id}`, {
            method: "PUT",
            body: JSON.stringify(updates),
          }),
        ),
      );
    },
    onSuccess: () => {
      getQueryClient().invalidateQueries({ queryKey: ["/api/certificates"] });
      toast({
        title: "Success",
        description: "Certificates updated successfully",
      });
      setSelectedCertificates([]);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update certificates",
        variant: "destructive",
      });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      return await Promise.all(
        ids.map((id) => apiRequest(`/api/certificates/${id}`, { method: "DELETE" })),
      );
    },
    onSuccess: () => {
      getQueryClient().invalidateQueries({ queryKey: ["/api/certificates"] });
      toast({
        title: "Success",
        description: "Certificates deleted successfully",
      });
      setSelectedCertificates([]);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete certificates",
        variant: "destructive",
      });
    },
  });

  // Helper functions
  const resetForm = () => {
    setFormData({
      name: "",
      type: "",
      issuingOrganization: "",
      description: "",
      documentId: null,
      imageId: null,
      documentUrl: "",
      imageUrl: "",
      isActive: true,
    });
  };

  // Form handlers
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCertificateMutation.mutate(formData);
  };

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

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCertificate) return;
    updateCertificateMutation.mutate({
      id: editingCertificate.id,
      data: formData,
    });
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

  const handleBulkActivate = () => {
    bulkUpdateMutation.mutate({
      ids: selectedCertificates,
      updates: { isActive: true },
    });
  };

  const handleBulkDeactivate = () => {
    bulkUpdateMutation.mutate({
      ids: selectedCertificates,
      updates: { isActive: false },
    });
  };

  const handleBulkDelete = () => {
    bulkDeleteMutation.mutate(selectedCertificates);
  };

  const exportCertificates = () => {
    if (!certificates) return;

    const dataStr = JSON.stringify(certificates, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;

    const exportFileDefaultName = "certificates.json";

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  // Constants - removed predefined certificate types for custom input

  // Filtering and sorting logic
  const filteredAndSortedCertificates = useMemo(() => {
    if (!certificates) return [];

    const filtered = certificates.filter((cert) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          cert.name.toLowerCase().includes(query) ||
          cert.type?.toLowerCase().includes(query) ||
          cert.description?.toLowerCase().includes(query) ||
          cert.issuingOrganization?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter !== "all") {
        if (statusFilter === "active" && !cert.isActive) return false;
        if (statusFilter === "inactive" && cert.isActive) return false;
      }

      // Type filter (partial match for custom types)
      if (
        typeFilter !== "all" &&
        typeFilter !== "" &&
        !cert.type?.toLowerCase().includes(typeFilter.toLowerCase())
      )
        return false;

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "type":
          comparison = (a.type || "").localeCompare(b.type || "");
          break;
        case "issuingOrganization":
          comparison = (a.issuingOrganization || "").localeCompare(b.issuingOrganization || "");
          break;
        case "createdAt": {
          const aCreated = a.createdAt ? new Date(a.createdAt) : new Date(0);
          const bCreated = b.createdAt ? new Date(b.createdAt) : new Date(0);
          comparison = aCreated.getTime() - bCreated.getTime();
          break;
        }
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [certificates, searchQuery, statusFilter, typeFilter, sortBy, sortDirection]);

  // Analytics calculations
  const analytics = useMemo(() => {
    if (!certificates) return null;

    const now = new Date();
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(now.getMonth() + 3);

    const total = certificates.length;
    const active = certificates.filter((cert) => cert.isActive).length;

    // Calculate expired and expiring soon based on expiryDate
    const expired = certificates.filter((cert) => {
      if (!cert.expiryDate) return false;
      const expiryDate = new Date(cert.expiryDate);
      return expiryDate < now;
    }).length;

    const expiringSoon = certificates.filter((cert) => {
      if (!cert.expiryDate) return false;
      const expiryDate = new Date(cert.expiryDate);
      return expiryDate >= now && expiryDate <= threeMonthsFromNow;
    }).length;

    const typeDistribution = certificates.reduce(
      (acc, cert) => {
        const certType = cert.type || "unknown";
        acc[certType] = (acc[certType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const issuingBodyDistribution = certificates.reduce(
      (acc, cert) => {
        if (cert.issuingOrganization) {
          acc[cert.issuingOrganization] = (acc[cert.issuingOrganization] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      total,
      active,
      inactive: total - active,
      expired,
      expiringSoon,
      valid: total - expired,
      typeDistribution,
      issuingBodyDistribution,
      mostCommonType:
        Object.entries(typeDistribution).sort(([, a], [, b]) => b - a)[0]?.[0] || "N/A",
      mostCommonIssuer:
        Object.entries(issuingBodyDistribution).sort(([, a], [, b]) => b - a)[0]?.[0] || "N/A",
    };
  }, [certificates]);

  return (
    <div className="min-h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text font-bold font-neue-stance text-3xl text-transparent">
              Certificate Management
            </h1>
            <p className="mt-2 text-neutral-600">
              Manage compliance and sustainability certifications
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Certificate
            </Button>
            <Button variant="outline" onClick={exportCertificates}>
              <BarChart3 className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="certificates">Certificates</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          {/* Certificates Tab */}
          <TabsContent value="certificates" className="space-y-6">
            {/* Search and Filter Bar */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 lg:flex-row">
                  {/* Search */}
                  <div className="relative flex-1">
                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-neutral-400" />
                    <Input
                      placeholder="Search certificates..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSearchQuery("")}
                        className="absolute top-1/2 right-2 h-6 w-6 -translate-y-1/2 transform p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  {/* Quick Filters */}
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
                      placeholder="Filter by type..."
                      value={typeFilter === "all" ? "" : typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value || "all")}
                      className="w-40"
                    />

                    <Button
                      variant="outline"
                      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                      className={showAdvancedFilters ? "border-blue-200 bg-blue-50" : ""}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Filters
                    </Button>
                  </div>

                  {/* View Mode Selector */}
                  <div className="flex items-center rounded-lg border p-1">
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className="h-8 px-3"
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className="h-8 px-3"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "detailed" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("detailed")}
                      className="h-8 px-3"
                    >
                      <Table className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Advanced Filters */}
                {showAdvancedFilters && (
                  <div className="mt-4 rounded-lg border-t bg-neutral-50 p-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div>
                        <Label>Sort by</Label>
                        <Select value={sortBy} onValueChange={setSortBy}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="name">Name</SelectItem>
                            <SelectItem value="type">Type</SelectItem>
                            <SelectItem value="issuingOrganization">
                              Issuing Organization
                            </SelectItem>
                            <SelectItem value="createdAt">Created Date</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Direction</Label>
                        <Select
                          value={sortDirection}
                          onValueChange={(value: "asc" | "desc") => setSortDirection(value)}
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
                          Clear All Filters
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bulk Actions */}
                {selectedCertificates.length > 0 && (
                  <div className="mt-4 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-3">
                    <span className="font-medium text-blue-700 text-sm">
                      {selectedCertificates.length} certificate
                      {selectedCertificates.length === 1 ? "" : "s"} selected
                    </span>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline" onClick={handleBulkActivate}>
                        <CheckCircle className="mr-1 h-4 w-4" />
                        Activate
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleBulkDeactivate}>
                        <Clock className="mr-1 h-4 w-4" />
                        Deactivate
                      </Button>
                      <EnhancedDialog
                        open={showBulkDeleteDialog}
                        onOpenChange={setShowBulkDeleteDialog}
                      >
                        <EnhancedDialogContent contentType="form">
                          <EnhancedDialogHeader>
                            <EnhancedDialogTitle>Delete Certificates</EnhancedDialogTitle>
                          </EnhancedDialogHeader>
                          <EnhancedDialogBody>
                            <p className="text-neutral-600 text-sm">
                              Are you sure you want to delete {selectedCertificates.length}{" "}
                              certificate
                              {selectedCertificates.length === 1 ? "" : "s"}? This action cannot be
                              undone.
                            </p>
                          </EnhancedDialogBody>
                          <EnhancedDialogFooter>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setShowBulkDeleteDialog(false)}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={() => {
                                handleBulkDelete();
                                setShowBulkDeleteDialog(false);
                              }}
                              className="bg-red-600 text-white hover:bg-red-700"
                            >
                              Delete
                            </Button>
                          </EnhancedDialogFooter>
                        </EnhancedDialogContent>
                      </EnhancedDialog>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setShowBulkDeleteDialog(true)}
                      >
                        <Trash2 className="mr-1 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Certificates Display */}
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

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <CertificateAnalytics analytics={analytics} />
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <CertificateInsights
              analytics={analytics}
              onCreate={() => setIsCreateDialogOpen(true)}
            />
          </TabsContent>
        </Tabs>

        {/* Create Certificate Dialog */}
        <EnhancedDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <EnhancedDialogContent contentType="form">
            <EnhancedDialogHeader>
              <EnhancedDialogTitle className="font-neue-stance">
                Create New Certificate
              </EnhancedDialogTitle>
            </EnhancedDialogHeader>
            <EnhancedDialogBody>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Certificate Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter certificate name"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="type">Certificate Type</Label>
                    <Input
                      id="type"
                      value={formData.type}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          type: e.target.value,
                        }))
                      }
                      placeholder="Enter certificate type (e.g., Sustainability, Compliance, Quality)"
                    />
                  </div>
                  <div>
                    <Label htmlFor="issuingOrganization">Issuing Organization</Label>
                    <Input
                      id="issuingOrganization"
                      value={formData.issuingOrganization}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          issuingOrganization: e.target.value,
                        }))
                      }
                      placeholder="Organization that issued the certificate"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Describe what this certificate covers"
                    className="h-20"
                  />
                </div>

                <div>
                  <Label>Certificate Logo</Label>
                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsMediaPickerOpen(true)}
                      className="w-full"
                    >
                      <Image className="mr-2 h-4 w-4" />
                      {formData.imageId ? "Change Image" : "Select Image from Library"}
                    </Button>
                    {formData.imageId && (
                      <div className="mt-2 flex items-center gap-2">
                        <img
                          src={`/api/media/${formData.imageId}/content`}
                          alt="Certificate logo preview"
                          className="h-16 w-16 rounded border object-contain"
                        />
                        <span className="text-muted-foreground text-sm">
                          Image ID: {formData.imageId}
                        </span>
                      </div>
                    )}
                    <div className="text-muted-foreground text-sm">Or use URL instead:</div>
                    <Input
                      type="url"
                      value={formData.imageUrl}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          imageUrl: e.target.value,
                        }))
                      }
                      placeholder="https://example.com/certificate-logo.png"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="documentUrl">Document URL</Label>
                  <Input
                    id="documentUrl"
                    type="url"
                    value={formData.documentUrl}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        documentUrl: e.target.value,
                      }))
                    }
                    placeholder="https://example.com/certificate.pdf"
                  />
                  <p className="mt-1 text-muted-foreground text-sm">
                    Link to the certificate document (PDF, etc.)
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        isActive: checked as boolean,
                      }))
                    }
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              </form>
            </EnhancedDialogBody>
            <EnhancedDialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  handleSubmit(e as any);
                }}
                disabled={createCertificateMutation.isPending}
              >
                {createCertificateMutation.isPending ? "Creating..." : "Create Certificate"}
              </Button>
            </EnhancedDialogFooter>
          </EnhancedDialogContent>
        </EnhancedDialog>

        {/* Edit Certificate Dialog */}
        <EnhancedDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <EnhancedDialogContent contentType="form">
            <EnhancedDialogHeader>
              <EnhancedDialogTitle className="font-neue-stance">
                Edit Certificate
              </EnhancedDialogTitle>
            </EnhancedDialogHeader>
            <EnhancedDialogBody>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Certificate Name</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter certificate name"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="edit-type">Certificate Type</Label>
                    <Input
                      id="edit-type"
                      value={formData.type}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          type: e.target.value,
                        }))
                      }
                      placeholder="Enter certificate type (e.g., Sustainability, Compliance, Quality)"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-issuingBody">Issuing Body</Label>
                    <Input
                      id="edit-issuingBody"
                      value={formData.issuingOrganization}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          issuingOrganization: e.target.value,
                        }))
                      }
                      placeholder="Organization that issued the certificate"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Describe what this certificate covers"
                    className="h-20"
                  />
                </div>

                <div>
                  <Label>Certificate Logo</Label>
                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsMediaPickerOpen(true)}
                      className="w-full"
                    >
                      <Image className="mr-2 h-4 w-4" />
                      {formData.imageId ? "Change Image" : "Select Image from Library"}
                    </Button>
                    {formData.imageId && (
                      <div className="mt-2 flex items-center gap-2">
                        <img
                          src={`/api/media/${formData.imageId}/content`}
                          alt="Certificate logo preview"
                          className="h-16 w-16 rounded border object-contain"
                        />
                        <span className="text-muted-foreground text-sm">
                          Image ID: {formData.imageId}
                        </span>
                      </div>
                    )}
                    <div className="text-muted-foreground text-sm">Or use URL instead:</div>
                    <Input
                      type="url"
                      value={formData.imageUrl}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          imageUrl: e.target.value,
                        }))
                      }
                      placeholder="https://example.com/certificate-logo.png"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-documentUrl">Document URL</Label>
                  <Input
                    id="edit-documentUrl"
                    type="url"
                    value={formData.documentUrl}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        documentUrl: e.target.value,
                      }))
                    }
                    placeholder="https://example.com/certificate.pdf"
                  />
                  <p className="mt-1 text-muted-foreground text-sm">
                    Link to the certificate document (PDF, etc.)
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        isActive: checked as boolean,
                      }))
                    }
                  />
                  <Label htmlFor="edit-isActive">Active</Label>
                </div>
              </form>
            </EnhancedDialogBody>
            <EnhancedDialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  handleEditSubmit(e as any);
                }}
                disabled={updateCertificateMutation.isPending}
              >
                {updateCertificateMutation.isPending ? "Updating..." : "Update Certificate"}
              </Button>
            </EnhancedDialogFooter>
          </EnhancedDialogContent>
        </EnhancedDialog>

        {/* Media Picker Modal - STANDARDIZED */}
        <StandardMediaSelectionDialog
          isOpen={isMediaPickerOpen}
          onClose={() => setIsMediaPickerOpen(false)}
          onSelect={(asset) => {
            // Fix: Use proper asset data structure with proper typing
            const imageId = (asset as any).id || null;
            setFormData((prev) => ({ ...prev, imageId }));
          }}
          title="Select Certificate Image"
          mediaPickerTarget="certificate-image"
          selectionMode="single"
        />
      </div>
    </div>
  );
}
