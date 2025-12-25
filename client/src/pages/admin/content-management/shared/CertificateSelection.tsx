import type { Certificate } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";

interface CertificateSelectionProps {
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}

export function CertificateSelection({ selectedIds, onChange }: CertificateSelectionProps) {
  const { data: certificates = [] } = useQuery<Certificate[]>({
    queryKey: ["/api/certificates"],
  });

  const activeCertificates = certificates.filter((cert) => cert.isActive);

  const toggleCertificate = (certId: number) => {
    if (selectedIds.includes(certId)) {
      onChange(selectedIds.filter((id) => id !== certId));
    } else {
      onChange([...selectedIds, certId]);
    }
  };

  return (
    <div className="max-h-60 space-y-2 overflow-y-auto rounded-lg border p-3">
      {activeCertificates.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No active certificates available. Add certificates in the Certificates management page.
        </p>
      ) : (
        activeCertificates.map((cert) => (
          <button
            type="button"
            key={cert.id}
            className="flex w-full cursor-pointer items-center space-x-2 rounded p-2 text-left hover:bg-accent focus:bg-accent focus:outline-none"
            onClick={() => toggleCertificate(cert.id)}
          >
            <div
              className={`flex h-4 w-4 items-center justify-center rounded border ${selectedIds.includes(cert.id) ? "border-primary bg-primary" : "border-input"}`}
            >
              {selectedIds.includes(cert.id) && (
                <Check className="h-3 w-3 text-primary-foreground" />
              )}
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm">{cert.name}</div>
              <div className="text-muted-foreground text-xs">{cert.issuingBody}</div>
            </div>
          </button>
        ))
      )}
    </div>
  );
}
