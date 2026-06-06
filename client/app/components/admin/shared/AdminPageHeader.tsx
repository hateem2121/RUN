import { ArrowLeft, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router";
import { cn } from "@/lib/utils";

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  onAction?: () => void;
  actionLabel?: string;
  actionIcon?: React.ElementType;
  showBackButton?: boolean;
  children?: ReactNode;
  className?: string;
}

/**
 * Common page header for admin modules matching the Stitch design pattern.
 */
export function AdminPageHeader({
  title,
  description,
  onAction,
  actionLabel,
  actionIcon: ActionIcon = Plus,
  showBackButton = false,
  children,
  className,
}: AdminPageHeaderProps) {
  const navigate = useNavigate();

  return (
    <div
      className={cn(
        "mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex items-start gap-4">
        {showBackButton && (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white transition-colors hover:bg-white/10"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h1>
          {description && <p className="mt-1 text-admin-muted">{description}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {children}
        {onAction && actionLabel && (
          <button
            aria-label="Action button"
            type="button"
            onClick={onAction}
            className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-600 hover:shadow-blue-500/40 active:scale-[0.98]"
          >
            <ActionIcon className="h-4 w-4" />
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
