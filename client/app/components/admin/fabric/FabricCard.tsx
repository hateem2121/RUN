import type { Certificate, Fabric } from "@shared/index";
import { Activity, Award, ChevronDown, ChevronUp, Edit, Globe, Trash2, Zap } from "lucide-react";
import type React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { parseNumericValue } from "./types";

interface FabricCardProps {
  fabric: Fabric;
  isExpanded: boolean;
  onToggleExpand: (id: number) => void;
  onEdit: (fabric: Fabric) => void;
  onDelete: (fabric: Fabric) => void;
  certificates: Certificate[];
}

export const FabricCard: React.FC<FabricCardProps> = ({
  fabric,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  certificates,
}) => {
  return (
    <Card className="transition-all duration-200 hover:shadow-lg">
      <CardContent className="p-6">
        {/* Always visible summary */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-semibold">{fabric.name}</h3>
            <div className="flex items-center gap-2">
              <Badge variant={fabric.isActive ? "default" : "secondary"}>
                {fabric.isActive ? "Active" : "Inactive"}
              </Badge>
              {(() => {
                const score = parseNumericValue(fabric.sustainabilityScore || "");
                return score !== null && score >= 4;
              })() && (
                <Badge variant="outline" className="border-emerald-600 text-emerald-600">
                  <Globe className="mr-1 h-3 w-3" />
                  Sustainable
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              data-testid={`button-edit-fabric-${fabric.id}`}
              variant="outline"
              size="sm"
              onClick={() => onEdit(fabric)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button
              data-testid={`button-delete-fabric-${fabric.id}`}
              variant="outline"
              size="sm"
              onClick={() => onDelete(fabric)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
            <Button
              data-testid={`button-details-fabric-${fabric.id}`}
              variant="ghost"
              size="sm"
              onClick={() => onToggleExpand(fabric.id)}
              className="shrink-0"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="mr-2 h-4 w-4" />
                  Collapse
                </>
              ) : (
                <>
                  <ChevronDown className="mr-2 h-4 w-4" />
                  Details
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Basic info always visible */}
        <p className="text-muted-foreground mb-4">{fabric.description}</p>

        {/* Expandable detailed view */}
        <Collapsible open={isExpanded} onOpenChange={() => onToggleExpand(fabric.id)}>
          <CollapsibleContent>
            <div className="grid grid-cols-1 gap-6 border-t pt-4 lg:grid-cols-3">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-xl font-semibold">{fabric.name}</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant={fabric.isActive ? "default" : "secondary"}>
                        {fabric.isActive ? "Active" : "Inactive"}
                      </Badge>
                      {(() => {
                        const score = parseNumericValue(fabric.sustainabilityScore || "");
                        return score !== null && score >= 4;
                      })() && (
                        <Badge variant="outline" className="border-emerald-600 text-emerald-600">
                          <Globe className="mr-1 h-3 w-3" />
                          Sustainable
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-muted-foreground">{fabric.description}</p>
                </div>

                {/* Classification */}
                {fabric.fabricType && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Classification</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{fabric.fabricType}</Badge>
                      {fabric.properties?.keyApplications?.map((app: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {app}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Certifications */}
                {fabric.certifications && fabric.certifications.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Certifications</h4>
                    <div className="flex flex-wrap gap-2">
                      {fabric.certifications?.map((certName: string, idx: number) => {
                        const cert = certificates.find((c) => c.name === certName);
                        return cert ? (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="border-blue-600 text-blue-600"
                          >
                            <Award className="mr-1 h-3 w-3" />
                            {cert.name}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Performance & Technical */}
              <div className="space-y-4">
                <h4 className="font-medium">Performance & Technical</h4>

                {/* Weight & Construction */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {fabric.weight && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Weight:</span>
                      <Badge
                        variant={(() => {
                          const weight = parseNumericValue(fabric.weight);
                          if (!weight) {
                            return "default";
                          }
                          return weight < 150
                            ? "secondary"
                            : weight < 300
                              ? "default"
                              : "destructive";
                        })()}
                      >
                        <Zap className="mr-1 h-3 w-3" />
                        {fabric.weight} GSM
                      </Badge>
                    </div>
                  )}
                  {fabric.properties?.yarnCountConstruction && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Construction:</span>
                      <span className="text-xs font-medium">
                        {fabric.properties?.yarnCountConstruction}
                      </span>
                    </div>
                  )}
                </div>

                {/* Performance Features */}
                {fabric.properties?.performanceFeatures &&
                  fabric.properties.performanceFeatures.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-muted-foreground text-sm">Performance Features:</span>
                      <div className="flex flex-wrap gap-1">
                        {fabric.properties.performanceFeatures.map(
                          (feature: string, idx: number) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="border-green-600 text-xs text-green-600"
                            >
                              <Activity className="mr-1 h-3 w-3" />
                              {feature}
                            </Badge>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                {/* Technical Metrics */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {fabric.properties?.stretchPercentage && (
                    <div className="rounded bg-blue-50 p-2">
                      <div className="text-muted-foreground">Stretch</div>
                      <div className="font-semibold">{fabric.properties.stretchPercentage}%</div>
                    </div>
                  )}
                  {fabric.properties?.airPermeability && (
                    <div className="rounded bg-green-50 p-2">
                      <div className="text-muted-foreground">Air Perm.</div>
                      <div className="font-semibold">{fabric.properties.airPermeability} mm/s</div>
                    </div>
                  )}
                  {fabric.properties?.waterColumn && (
                    <div className="rounded bg-purple-50 p-2">
                      <div className="text-muted-foreground">Waterproof</div>
                      <div className="font-semibold">{fabric.properties.waterColumn} mm</div>
                    </div>
                  )}
                  {fabric.sustainabilityScore && (
                    <div className="rounded bg-emerald-50 p-2">
                      <div className="text-muted-foreground">Sustainability</div>
                      <div className="font-semibold">
                        {"★".repeat(parseNumericValue(fabric.sustainabilityScore) || 0)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-4">
                <div className="space-y-2 border-t pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(fabric)}
                    className="w-full justify-start"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Fabric
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(fabric)}
                    className="text-destructive hover:text-destructive w-full justify-start"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};
