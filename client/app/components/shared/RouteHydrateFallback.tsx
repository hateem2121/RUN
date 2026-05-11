import { Typography } from "@/components/ui/typography";

/**
 * Standard loading fallback for SSR routes during hydration.
 */
export function RouteHydrateFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center animate-in fade-in duration-700">
      <div className="relative mb-8">
        {/* RUN Branded Loader */}
        <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        </div>
      </div>

      <Typography.H3 className="mb-2 tracking-tighter opacity-80">LOADING EXPERIENCE</Typography.H3>
      <Typography.P className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
        Synchronizing assets...
      </Typography.P>
    </div>
  );
}
