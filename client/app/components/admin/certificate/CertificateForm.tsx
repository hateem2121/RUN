import { Image } from "lucide-react";
import type React from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CertificateFormData } from "./types";

interface CertificateFormProps {
  formData: CertificateFormData;
  setFormData: React.Dispatch<React.SetStateAction<CertificateFormData>>;
  onOpenMediaPicker: () => void;
  isPending: boolean;
}

export const CertificateForm: React.FC<CertificateFormProps> = ({
  formData,
  setFormData,
  onOpenMediaPicker,
}) => {
  return (
    <div className="space-y-4">
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
          <Button type="button" variant="outline" onClick={onOpenMediaPicker} className="w-full">
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
              <span className="text-muted-foreground text-sm">Image ID: {formData.imageId}</span>
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
              isActive: checked === true,
            }))
          }
        />
        <Label htmlFor="isActive">Active</Label>
      </div>
    </div>
  );
};
