import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";
import { cn } from "@/lib/utils";

export function DesignShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      gsap.from(containerRef.current, { opacity: 0, duration: 0.5 });
    },
    { scope: containerRef },
  );
  return (
    <div
      ref={containerRef}
      className={cn("p-8 space-y-12 bg-slate-950 min-h-screen text-slate-100 font-sans")}
    >
      <header className="space-y-4">
        <h1 className="text-display-md font-neue-stance tracking-premium">
          AntiGravity <span className="text-brand-lime">v2.0</span>
        </h1>
        <p className="text-text-subtle max-w-2xl text-lg">
          Deterministic Identity. Precision Workflow. Perfect Design.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Glass Premium Card */}
        <div className="glass-premium p-6 rounded-xl border border-white/10 space-y-4">
          <h3 className="text-xl font-semibold">Glassmorphism</h3>
          <p className="text-sm text-slate-400">
            Dimension 2: Skin. Using backdrop filters and subtle transparency for depth.
          </p>
          <div className="h-24 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 animate-pulse" />
        </div>

        {/* Border Beam Card */}
        <div className="border-beam p-6 rounded-xl space-y-4">
          <h3 className="text-xl font-semibold">Border Beam</h3>
          <p className="text-sm text-slate-400">
            Dimension 5: Soul. Animated gradients tracking element boundaries at 60fps.
          </p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-lime animate-ping" />
            <span className="text-xs uppercase tracking-widest text-brand-lime">Active Soul</span>
          </div>
        </div>

        {/* Bento Cell / Aurora UI */}
        <div className="relative overflow-hidden p-6 rounded-xl bg-slate-900 border border-slate-800 group">
          <div className="absolute inset-0 bg-aurora-gradient opacity-20 group-hover:opacity-40 transition-opacity" />
          <div className="relative z-10 space-y-4">
            <h3 className="text-xl font-semibold">Aurora UI</h3>
            <p className="text-sm text-slate-400">
              Mesh gradients and organic glows for a premium technical atmosphere.
            </p>
          </div>
        </div>
      </section>

      {/* Bento Grid Layout Example */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-wide">Dimension 1: Skeleton (Bento)</h2>
        <div className="grid grid-cols-4 grid-rows-2 gap-4 h-[400px]">
          <div className="col-span-2 row-span-2 glass-premium rounded-2xl flex items-center justify-center border border-white/5">
            <span className="text- slate-500 italic">Primary Feature</span>
          </div>
          <div className="col-span-2 glass-premium rounded-2xl flex items-center justify-center border border-white/5">
            <span className="text-slate-500 italic">Secondary Feature</span>
          </div>
          <div className="glass-premium rounded-2xl flex items-center justify-center border border-white/5">
            <span className="text-slate-500 italic">Stat A</span>
          </div>
          <div className="glass-premium rounded-2xl flex items-center justify-center border border-white/5 border-beam">
            <span className="text-slate-100 italic">Stat B</span>
          </div>
        </div>
      </section>

      <footer className="pt-12 border-t border-slate-900 text-slate-600 text-sm font-mono uppercase tracking-widest">
        Protocol 0 :: Operational Excellence :: System Pilot v2.0
      </footer>
    </div>
  );
}
