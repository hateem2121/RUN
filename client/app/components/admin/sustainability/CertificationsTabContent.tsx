import type { Certificate, UnifiedSustainability } from "@shared/index";
import { Award, Check, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface CertificationsTabContentProps {
  localForm: Partial<UnifiedSustainability>;
  hasUnsavedChanges: boolean;
  isPending: boolean;
  availableCertificates: Certificate[];
  onLocalUpdate: (updates: Partial<UnifiedSustainability>) => void;
  onSave: () => void;
}

export function CertificationsTabContent({
  localForm,
  hasUnsavedChanges,
  isPending,
  availableCertificates,
  onLocalUpdate,
  onSave,
}: CertificationsTabContentProps) {
  const selectedIds = localForm.certificationIds || [];

  const toggleCertificate = (id: number) => {
    const currentIds = [...selectedIds];
    const newIds = currentIds.includes(id)
      ? currentIds.filter((cid) => cid !== id)
      : [...currentIds, id];

    onLocalUpdate({
      certificationIds: newIds,
    });
  };

  return (
    <TabsContent value="certifications" className="outline-none">
      <Card className="glass-premium p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Sovereign Certifications
            </h2>
            <p className="text-sm text-admin-muted">
              Select validated compliance protocols to showcase on the global ecosystem overview
            </p>
          </div>
          <div className="flex items-center gap-3">
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-xxs font-bold text-emerald-400 uppercase tracking-widest">
                  {selectedIds.length} Initialised
                </span>
              </div>
            )}
            <Button
              onClick={onSave}
              disabled={!hasUnsavedChanges || isPending}
              className={cn(
                "font-bold uppercase text-xxs tracking-widest h-11 px-6 rounded-xl transition-all active:scale-95 shadow-lg",
                hasUnsavedChanges
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
                  : "bg-white/5 text-admin-muted border border-white/10 cursor-not-allowed",
              )}
            >
              {isPending ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white mr-2" />
              ) : null}
              Sync Protocol
            </Button>
          </div>
        </div>

        {availableCertificates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableCertificates.map((certificate) => {
              const isSelected = selectedIds.includes(certificate.id!);
              return (
                <button
                  type="button"
                  key={certificate.id}
                  onClick={() => toggleCertificate(certificate.id!)}
                  className={cn(
                    "group relative cursor-pointer overflow-hidden rounded-2xl border transition-all duration-300 w-full text-left bg-transparent p-0 focus:outline-none focus:ring-2 focus:ring-emerald-500/50",
                    isSelected
                      ? "bg-emerald-500/10 border-emerald-500/40 shadow-emerald-glow py-6 px-5"
                      : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10 py-6 px-5",
                  )}
                  aria-pressed={isSelected}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={cn(
                        "size-12 rounded-xl flex items-center justify-center transition-colors shadow-sm",
                        isSelected
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-white/5 text-admin-muted group-hover:text-white",
                      )}
                    >
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    {isSelected && (
                      <div className="size-6 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/40 animate-in zoom-in duration-300">
                        <Check className="h-3.5 w-3.5 stroke-custom-misc-75" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <h3
                      className={cn(
                        "font-bold tracking-tight transition-colors",
                        isSelected ? "text-white" : "text-admin-foreground",
                      )}
                    >
                      {certificate.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xxs font-bold text-admin-muted uppercase tracking-widest">
                        {certificate.issueDate
                          ? new Date(certificate.issueDate).getFullYear()
                          : "N/A"}
                      </span>
                      <span className="size-1 rounded-full bg-custom-color-52/30" />
                      <span className="text-xxs font-bold text-admin-muted uppercase tracking-widest">
                        Valid until{" "}
                        {certificate.expiryDate
                          ? new Date(certificate.expiryDate).getFullYear()
                          : "Permanent"}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="absolute -right-6 -bottom-6 opacity-10 rotate-12 transition-transform group-hover:scale-110">
                      <Award className="size-24 text-emerald-400" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-center bg-white/[0.02] border border-dashed border-white/10 rounded-2xl">
            <div className="size-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Award className="h-8 w-8 text-admin-muted/40" />
            </div>
            <h3 className="text-white font-bold mb-1">No Compliance Records Found</h3>
            <p className="text-admin-muted text-sm max-w-custom-space-70">
              Validation certificates must be initialised in the central Registry first.
            </p>
          </div>
        )}
      </Card>
    </TabsContent>
  );
}
