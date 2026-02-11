import { AlertTriangle, Award, CheckCircle, X } from "lucide-react";
import type React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CertificateAnalyticsData } from "./types";

interface CertificateAnalyticsProps {
  analytics: CertificateAnalyticsData | null;
}

export const CertificateAnalytics: React.FC<CertificateAnalyticsProps> = ({ analytics }) => {
  if (!analytics) {
    return null;
  }

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
                        width: `${((count as number) / (analytics.total || 1)) * 100}%`,
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
