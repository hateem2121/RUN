import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { ReactNode } from "react";
import { useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ResourceCardProps {
  title: string;
  subtitle?: string | undefined;
  description?: string | undefined;
  icon?: ReactNode | undefined;
  tags?: string[] | undefined;
  isExpanded: boolean;
  onToggleExpand: () => void;
  expandedContent?: ReactNode | undefined;
  badges?:
    | Array<{
        label: string;
        variant?: "default" | "secondary" | "outline" | "destructive" | undefined;
      }>
    | undefined;
}

export function ResourceCard({
  title,
  subtitle,
  description,
  icon,
  tags,
  isExpanded,
  onToggleExpand,
  expandedContent,
  badges = [],
}: ResourceCardProps): React.ReactElement {
  const cardRef = useRef<HTMLDivElement>(null);
  const expandedRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from(cardRef.current, { opacity: 0, y: 20, duration: 0.3, ease: "power2.out" });
    },
    { scope: cardRef },
  );

  useGSAP(
    () => {
      if (isExpanded && expandedRef.current) {
        gsap.from(expandedRef.current, { opacity: 0, duration: 0.2, ease: "power2.out" });
      }
    },
    { scope: cardRef, dependencies: [isExpanded] },
  );

  return (
    <div ref={cardRef}>
      <Card data-testid="resource-card" className="h-full transition-shadow-sm hover:shadow-lg">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              {icon && <div className="mt-1 text-muted-foreground">{icon}</div>}
              <div className="space-y-1">
                <CardTitle className="text-lg">{title}</CardTitle>
                {subtitle && <p className="text-muted-foreground text-sm">{subtitle}</p>}
              </div>
            </div>
            {expandedContent && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleExpand}
                className="ml-auto"
                aria-label={isExpanded ? "Collapse details" : "Expand details"}
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {description && <p className="mb-3 text-muted-foreground text-sm">{description}</p>}

          {(badges.length > 0 || tags) && (
            <div className="mb-3 flex flex-wrap gap-2">
              {badges.map((badge, index) => (
                <Badge key={index} variant={badge.variant || "secondary"}>
                  {badge.label}
                </Badge>
              ))}
              {tags?.map((tag, index) => (
                <Badge key={`tag-${index}`} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {isExpanded && expandedContent && (
            <div ref={expandedRef} className="mt-4 border-t pt-4">
              {expandedContent}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
