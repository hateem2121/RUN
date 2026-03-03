import type { Certificate, UnifiedSustainability } from "@shared/index";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { TabsContent } from "@/components/ui/tabs";

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
  return (
    <TabsContent value="certifications" className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Certifications Section</CardTitle>
          <CardDescription>
            Configure the certifications section and select which certificates to showcase
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="font-medium text-base">Select Certificates to Showcase</Label>
            <p className="mb-4 text-muted-foreground text-sm">
              Choose which certificates will be displayed on the public sustainability page
            </p>

            {availableCertificates.length > 0 ? (
              <div className="grid max-h-64 grid-cols-1 gap-4 overflow-y-auto rounded-lg border p-4 md:grid-cols-2 lg:grid-cols-3">
                {availableCertificates.map((certificate) => (
                  <div
                    key={certificate.id}
                    className={`flex cursor-pointer items-center space-x-3 rounded-lg border p-3 transition-colors ${
                      (localForm.data?.certificationIds || []).includes(certificate.id!)
                        ? "border-green-200 bg-green-50"
                        : "border-border bg-background hover:bg-muted"
                    }`}
                    onClick={() => {
                      const currentIds = localForm.data?.certificationIds || [];
                      const newIds = currentIds.includes(certificate.id!)
                        ? currentIds.filter((id: number) => id !== certificate.id!)
                        : [...currentIds, certificate.id!];
                      onLocalUpdate({
                        data: {
                          ...localForm.data,
                          certificationIds: newIds,
                        },
                      });
                    }}
                  >
                    <div
                      className={`flex h-4 w-4 items-center justify-center rounded border-2 ${
                        (localForm.data?.certificationIds || []).includes(certificate.id!)
                          ? "border-green-600 bg-green-600"
                          : "border-border/50"
                      }`}
                    >
                      {(localForm.data?.certificationIds || []).includes(certificate.id!) && (
                        <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-foreground text-sm">
                        {certificate.name}
                      </div>
                      <div className="truncate text-muted-foreground text-xs">
                        {certificate.issueDate
                          ? new Date(certificate.issueDate).getFullYear()
                          : "N/A"}
                      </div>
                      {certificate.expiryDate && (
                        <div className="truncate text-muted-foreground/70 text-xs">
                          Valid until: {new Date(certificate.expiryDate).getFullYear()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border py-8 text-center text-muted-foreground">
                No certificates available. Add certificates in the Certificates management section
                first.
              </div>
            )}

            {(localForm.data?.certificationIds || []).length > 0 && (
              <div className="mt-4 rounded-lg bg-green-50 p-3">
                <div className="flex items-center text-green-800 text-sm">
                  <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {(localForm.data?.certificationIds || []).length} certificate(s) selected for
                  display
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <div className="flex justify-end border-t p-4">
          <Button
            onClick={onSave}
            disabled={!hasUnsavedChanges || isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            {isPending ? "Saving..." : "Save Certifications"}
          </Button>
        </div>
      </Card>
    </TabsContent>
  );
}
