import { motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ResourceCardProps {
  title: string;
  subtitle?: string;
  description?: string;
  icon?: ReactNode;
  tags?: string[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  expandedContent?: ReactNode;
  badges?: Array<{
    label: string;
    variant?: "default" | "secondary" | "outline" | "destructive";
  }>;
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
}: ResourceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="h-full transition-shadow-sm hover:shadow-lg">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              {icon && <div className="mt-1 text-gray-600">{icon}</div>}
              <div className="space-y-1">
                <CardTitle className="text-lg">{title}</CardTitle>
                {subtitle && <p className="text-gray-600 text-sm">{subtitle}</p>}
              </div>
            </div>
            {expandedContent && (
              <Button variant="ghost" size="sm" onClick={onToggleExpand} className="ml-auto">
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
          {description && <p className="mb-3 text-gray-600 text-sm">{description}</p>}

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
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-4 border-t pt-4"
            >
              {expandedContent}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
