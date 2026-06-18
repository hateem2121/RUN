import { Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title?: string | undefined;
  description?: string | undefined;
  icon?: React.ElementType<{ className?: string }>;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string | undefined;
}

export function EmptyState({
  title = "No items found",
  description = "There are no items to display at this time.",
  icon: Icon = Box,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "fade-in-50 flex min-h-custom-space-276 w-full animate-in flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center",
        "border-border/50 bg-surface-subtle/50 dark:bg-muted/10",
        className,
      )}
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted dark:bg-muted">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="mt-4 font-semibold text-foreground text-lg">{title}</h3>
      <p className="mt-2 mb-4 max-w-sm text-muted-foreground text-sm">{description}</p>
      {action && (
        <Button onClick={action.onClick} variant="outline">
          {action.label}
        </Button>
      )}
    </div>
  );
}
