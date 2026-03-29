import { Card, GlassCardDecorations } from "@/components/ui/card";

export function ContactInfoCardsSkeleton() {
  return (
    <div className="col-span-1 lg:col-span-2 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-1">
      {/* Skeleton 1 */}
      <Card variant="glass-premium" className="relative overflow-hidden h-64">
        <GlassCardDecorations showShimmer={false} />
        <div className="relative z-10 flex flex-col items-center p-6 text-center space-y-4 animate-pulse">
          <div className="h-12 w-12 rounded-full bg-primary/10" />
          <div className="h-6 w-32 rounded bg-muted-foreground/20" />
          <div className="space-y-2 w-full flex flex-col items-center">
            <div className="h-4 w-40 rounded bg-muted-foreground/20" />
            <div className="h-4 w-36 rounded bg-muted-foreground/20" />
          </div>
        </div>
      </Card>

      {/* Skeleton 2 */}
      <Card variant="glass-premium" className="relative overflow-hidden h-56">
        <GlassCardDecorations showShimmer={false} />
        <div className="relative z-10 flex flex-col items-center p-6 text-center space-y-4 animate-pulse">
          <div className="h-12 w-12 rounded-full bg-primary/10" />
          <div className="h-6 w-32 rounded bg-muted-foreground/20" />
          <div className="space-y-2 w-full flex flex-col items-center">
            <div className="h-4 w-48 rounded bg-muted-foreground/20" />
            <div className="h-4 w-24 rounded bg-muted-foreground/20" />
          </div>
        </div>
      </Card>

      {/* Skeleton 3 */}
      <Card variant="glass-premium" className="relative overflow-hidden h-64">
        <GlassCardDecorations showShimmer={false} />
        <div className="relative z-10 flex flex-col items-center p-6 text-center space-y-4 animate-pulse">
          <div className="h-12 w-12 rounded-full bg-primary/10" />
          <div className="h-6 w-32 rounded bg-muted-foreground/20" />
          <div className="space-y-3 w-full">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex justify-between w-full">
                <div className="h-4 w-16 rounded bg-muted-foreground/20" />
                <div className="h-4 w-20 rounded bg-muted-foreground/20" />
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
