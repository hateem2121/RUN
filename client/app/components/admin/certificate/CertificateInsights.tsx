import { AlertTriangle, Award, Calendar, Clock, Plus } from "lucide-react";
import type React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CertificateAnalyticsData } from "./types";

interface CertificateInsightsProps {
  analytics: CertificateAnalyticsData | null;
  onCreate: () => void;
}

export const CertificateInsights: React.FC<CertificateInsightsProps> = ({
  analytics,
  onCreate,
}) => {
  if (!analytics) {
    return null;
  }

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
