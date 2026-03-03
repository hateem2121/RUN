import type { Certificate } from "@shared/index";
import {
  Award,
  CheckCircle,
  Copy,
  Edit2,
  ExternalLink,
  FileText,
  MoreVertical,
  Shield,
  Trash2,
} from "lucide-react";
import type React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";

const getCertificateTypeIcon = (type: string | undefined) => {
  if (!type) {
    return <FileText className="h-4 w-4" />;
  }

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

export const CertificateList: React.FC<CertificateListProps> = ({
  viewMode,
  isLoading,
  certificates,
  selectedCertificates,
  onSelect,
  onEdit,
  onDuplicate,
  onDelete,
}) => {
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

  const renderActions = (certificate: Certificate) => (
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
        <DropdownMenuItem onClick={() => onDelete(certificate.id)} className="text-red-600">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div>
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
                          {certificate.type
                            ? certificate.type.charAt(0).toUpperCase() + certificate.type.slice(1)
                            : "No Type"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {renderActions(certificate)}
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
                      {certificate.type
                        ? certificate.type.charAt(0).toUpperCase() + certificate.type.slice(1)
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

              {renderActions(certificate)}
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
                            {certificate.type
                              ? certificate.type.charAt(0).toUpperCase() + certificate.type.slice(1)
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
                            <p className="text-neutral-600 font-bold uppercase">
                              {certificate.type}
                            </p>
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
                    <Button
                      onClick={() => onDelete(certificate.id)}
                      variant="destructive"
                      className="w-full bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
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
