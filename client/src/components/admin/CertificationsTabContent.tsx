import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { TabsContent } from "@/components/ui/tabs";
import type { UnifiedSustainability, Certificate } from "@shared/schema";

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
            Configure the certifications section and select which certificates
            to showcase
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-base font-medium">
              Select Certificates to Showcase
            </Label>
            <p className="text-sm text-gray-600 mb-4">
              Choose which certificates will be displayed on the public
              sustainability page
            </p>

            {availableCertificates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-64 overflow-y-auto border rounded-lg p-4">
                {availableCertificates.map((certificate) => (
                  <div
                    key={certificate.id}
                    className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      (localForm.data?.certificationIds || []).includes(
                        certificate.id!,
                      )
                        ? "bg-green-50 border-green-200"
                        : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                    }`}
                    onClick={() => {
                      const currentIds = localForm.data?.certificationIds || [];
                      const newIds = currentIds.includes(certificate.id!)
                        ? currentIds.filter(
                            (id: number) => id !== certificate.id!,
                          )
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
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                        (localForm.data?.certificationIds || []).includes(
                          certificate.id!,
                        )
                          ? "bg-green-600 border-green-600"
                          : "border-gray-300"
                      }`}
                    >
                      {(localForm.data?.certificationIds || []).includes(
                        certificate.id!,
                      ) && (
                        <svg
                          className="w-3 h-3 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900 truncate">
                        {certificate.name}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {certificate.issueDate
                          ? new Date(certificate.issueDate).getFullYear()
                          : "N/A"}
                      </div>
                      {certificate.expiryDate && (
                        <div className="text-xs text-gray-400 truncate">
                          Valid until:{" "}
                          {new Date(certificate.expiryDate).getFullYear()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 border rounded-lg">
                No certificates available. Add certificates in the Certificates
                management section first.
              </div>
            )}

            {(localForm.data?.certificationIds || []).length > 0 && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <div className="flex items-center text-sm text-green-800">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {(localForm.data?.certificationIds || []).length}{" "}
                  certificate(s) selected for display
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <div className="flex justify-end p-4 border-t">
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
