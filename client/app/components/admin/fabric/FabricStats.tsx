import type { Fabric } from "@shared/schema";
import { Activity, Award, Globe, Shirt } from "lucide-react";
import type React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { parseNumericValue } from "./types";

interface FabricStatsProps {
  fabrics: Fabric[];
}

export const FabricStats: React.FC<FabricStatsProps> = ({ fabrics }) => {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Shirt className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-muted-foreground text-sm">Total Fabrics</p>
              <p className="text-2xl font-bold">{fabrics.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-muted-foreground text-sm">Active Fabrics</p>
              <p className="text-2xl font-bold">{fabrics.filter((f) => f.isActive).length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-purple-500" />
            <div>
              <p className="text-muted-foreground text-sm">Certified</p>
              <p className="text-2xl font-bold">
                {fabrics.filter((f) => f.certifications && f.certifications.length > 0).length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-emerald-500" />
            <div>
              <p className="text-muted-foreground text-sm">Sustainable</p>
              <p className="text-2xl font-bold">
                {
                  fabrics.filter((f) => {
                    const score = parseNumericValue(f.sustainabilityScore || "");
                    return score !== null && score >= 4;
                  }).length
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
