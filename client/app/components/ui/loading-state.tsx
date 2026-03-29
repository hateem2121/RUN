import { cn } from "@/lib/utils";

interface LoadingStateProps {
  className?: string; // Additional classes for the container
  text?: string; // Optional loading text
  size?: "sm" | "md" | "lg"; // Size of the spinner
  fullScreen?: boolean; // Whether to take up the full screen height
}

export function LoadingState({
  className,
  text = "Loading...",
  size = "md",
  fullScreen = false,
}: LoadingStateProps) {
  const sizeClasses = {
    sm: "h-6 w-6 border-2",
    md: "h-10 w-10 border-4",
    lg: "h-16 w-16 border-4",
  };

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        "flex flex-col items-center justify-center gap-4",
        fullScreen ? "min-h-[50vh] w-full" : "w-full py-12",
        className,
      )}
    >
      <div className="relative">
        <div className={cn("rounded-full border-muted", sizeClasses[size])} />
        <div
          className={cn(
            "absolute inset-0 animate-spin rounded-full border-t-primary border-r-transparent border-b-transparent border-l-transparent",
            sizeClasses[size].replace("border-muted", ""), // Inherit border width
          )}
        />
      </div>
      {text && <p className="animate-pulse font-medium text-muted-foreground text-sm">{text}</p>}
    </div>
  );
}
