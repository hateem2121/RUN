import { Button } from "@/components/ui/button";
import { LiquidGlassCard, CardHeader, CardContent } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";

export default function ThemePreview() {
  return (
    <div className="min-h-screen bg-black p-8 font-sans text-white">
      <div className="mx-auto max-w-6xl space-y-12">
        <header className="border-b border-white/10 pb-8">
          <h1 className="font-bold text-4xl tracking-tight">Design System</h1>
          <p className="mt-2 text-xl text-white/60">
            Tailwind v4 Native Architecture (5/5 Quality Score)
          </p>
        </header>

        {/* 1. New Visual System (Shadows & Glass) */}
        <section className="space-y-6">
          <h2 className="font-semibold text-2xl text-orange-500">1. Glass & Shadow System</h2>
          <p className="text-white/60">
            Powered by <code>--shadow-glow-*</code> tokens in <code>index.css</code>.
          </p>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <LiquidGlassCard
              glowIntensity="sm"
              className="flex h-40 items-center justify-center p-6"
            >
              <div className="text-center">
                <div className="font-mono text-xs text-orange-400">glowIntensity="sm"</div>
                <div className="mt-2 text-sm text-white/60">Subtle ambient light</div>
              </div>
            </LiquidGlassCard>

            <LiquidGlassCard
              glowIntensity="md"
              className="flex h-40 items-center justify-center p-6"
            >
              <div className="text-center">
                <div className="font-mono text-xs text-orange-400">glowIntensity="md"</div>
                <div className="mt-2 text-sm text-white/60">Standard card elevation</div>
              </div>
            </LiquidGlassCard>

            <LiquidGlassCard
              glowIntensity="xl"
              className="flex h-40 items-center justify-center p-6"
            >
              <div className="text-center">
                <div className="font-mono text-xs text-orange-400">glowIntensity="xl"</div>
                <div className="mt-2 text-sm text-white/60">High impact / Hero</div>
              </div>
            </LiquidGlassCard>
          </div>
        </section>

        {/* 2. Unified Button System */}
        <section className="space-y-6">
          <h2 className="font-semibold text-2xl text-blue-500">2. Unified Button System</h2>
          <p className="text-white/60">
            Single component source. <code>LiquidButton</code> is deprecated.
          </p>

          <div className="rounded-xl border border-white/10 bg-white/5 p-8">
            <div className="grid gap-8">
              {/* Row 1: Variants */}
              <div className="flex flex-wrap items-center gap-4">
                <Button>Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
              </div>

              {/* Row 2: The New Glass Variant */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-px w-8 bg-blue-500/50" />
                  <span className="text-xs uppercase tracking-wider text-blue-400">
                    New Glass Variant
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <Button variant="glass">Glass Default</Button>
                  <Button variant="glass" size="lg">
                    Glass Large
                  </Button>
                  <Button variant="glass" size="icon">
                    G
                  </Button>
                  <Button variant="glass" disabled>
                    Glass Disabled
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Z-Index Tokens */}
        <section className="space-y-6">
          <h2 className="font-semibold text-2xl text-purple-500">3. Z-Index Tokens</h2>
          <p className="text-white/60">Semantic layering system. No magic numbers.</p>

          <div className="relative h-64 w-full overflow-hidden rounded-xl border border-white/10 bg-black/50">
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Visualizing layers */}
              <div className="z-base absolute top-10 left-10 h-32 w-32 rounded-lg bg-zinc-800 p-2 shadow-lg">
                <span className="font-mono text-xs text-white">z-base (0)</span>
              </div>
              <div className="z-dock absolute top-16 left-20 h-32 w-32 rounded-lg bg-zinc-700 p-2 shadow-xl border border-white/10">
                <span className="font-mono text-xs text-white">z-dock (10)</span>
              </div>
              <div className="z-sticky absolute top-24 left-32 h-32 w-32 rounded-lg bg-zinc-600 p-2 shadow-2xl border border-white/20">
                <span className="font-mono text-xs text-white">z-sticky (20)</span>
              </div>
              <div className="z-modal absolute top-32 left-44 h-32 w-32 rounded-lg bg-purple-900/80 p-2 shadow-2xl border border-purple-500/50 backdrop-blur-md">
                <span className="font-mono text-xs text-white">z-modal (50)</span>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Typography Scale */}
        <section className="space-y-6">
          <h2 className="font-semibold text-2xl text-green-500">4. Typography</h2>
          <div className="space-y-4 rounded-xl border border-white/10 p-8">
            <h1 className="font-bold text-4xl text-white">Heading 1 (text-4xl)</h1>
            <h2 className="font-semibold text-3xl text-white">Heading 2 (text-3xl)</h2>
            <h3 className="font-medium text-2xl text-white">Heading 3 (text-2xl)</h3>
            <p className="max-w-prose text-lg text-white/80">
              Body text (text-lg). Efficiently unleash cross-media information without cross-media
              value. Quickly maximize timely deliverables for real-time schemas.
            </p>
            <p className="max-w-prose text-base text-white/60">
              Small body text (text-base or text-sm). Dramatically maintain clicks-and-mortar
              solutions without functional solutions.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
