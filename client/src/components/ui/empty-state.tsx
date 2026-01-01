import { Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ElementType<{ className?: string }>;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
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
        "fade-in-50 animate-in flex min-h-[400px] w-full flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center",
        "border-border/50 bg-surface-subtle/50 dark:bg-muted/10",
        className,
      )}
    >
      <div className="bg-surface-muted dark:bg-muted mx-auto flex h-12 w-12 items-center justify-center rounded-full">
        <Icon className="text-muted-foreground h-6 w-6" />
      </div>
      <h3 className="text-foreground mt-4 text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-2 mb-4 max-w-sm text-sm">{description}</p>
      {action && (
        <Button onClick={action.onClick} variant="outline">
          {action.label}
        </Button>
      )}
    </div>
  );
}
