import type { Fabric } from "@shared/index";
import { Activity, Award, Globe, Shirt } from "lucide-react";
import type React from "react";
import { GlassCard } from "@/components/admin/shared/GlassCard";
import { parseNumericValue } from "./types";

interface FabricStatsProps {
  fabrics: Fabric[];
}

export const FabricStats: React.FC<FabricStatsProps> = ({ fabrics }) => {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
      <GlassCard className="p-4">
        <div className="flex items-center gap-2">
          <Shirt className="h-5 w-5 text-blue-400" />
          <div>
            <p className="text-admin-muted text-sm">Total Fabrics</p>
            <p className="text-2xl font-bold text-white">{fabrics.length}</p>
          </div>
        </div>
      </GlassCard>
      <GlassCard className="p-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-green-400" />
          <div>
            <p className="text-admin-muted text-sm">Active Fabrics</p>
            <p className="text-2xl font-bold text-white">
              {fabrics.filter((f) => f.isActive).length}
            </p>
          </div>
        </div>
      </GlassCard>
      <GlassCard className="p-4">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-purple-400" />
          <div>
            <p className="text-admin-muted text-sm">Certified</p>
            <p className="text-2xl font-bold text-white">
              {fabrics.filter((f) => f.certifications && f.certifications.length > 0).length}
            </p>
          </div>
        </div>
      </GlassCard>
      <GlassCard className="p-4">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-emerald-400" />
          <div>
            <p className="text-admin-muted text-sm">Sustainable</p>
            <p className="text-2xl font-bold text-white">
              {
                fabrics.filter((f) => {
                  const score = parseNumericValue(f.sustainabilityScore || "");
                  return score !== null && score >= 4;
                }).length
              }
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
