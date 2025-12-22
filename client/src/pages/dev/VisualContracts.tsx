import { IconHome, IconLayout, IconTerminal } from "@tabler/icons-react";
import { FloatingDock } from "@/components/ui/floating-dock";

export default function VisualContracts() {
  const navItems = [
    {
      title: "Home",
      icon: (
        <IconHome className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "#",
    },
    {
      title: "Terminal",
      icon: (
        <IconTerminal className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "#",
    },
    {
      title: "Layout",
      icon: (
        <IconLayout className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "#",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] p-8 space-y-12">
      <header className="border-b border-black/10 pb-4">
        <h1 className="text-4xl font-bold">Visual Contracts Audit</h1>
        <p className="text-gray-500">Tailwind v4 Regression Safeguard Page</p>
      </header>

      {/* Z-INDEX & OVERLAYS */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">
          1. Stacking Contexts (Z-Index Map)
        </h2>
        <div className="relative h-64 border border-dashed border-gray-300 rounded-xl p-4 bg-white overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-br from-blue-50 to-indigo-50 opacity-50" />

          <div className="absolute top-4 left-4 z-10 bg-white p-4 shadow-md border rounded-lg">
            <p className="font-mono text-xs text-blue-600">z-10 (Content)</p>
          </div>

          <div className="absolute inset-0 flex items-center justify-center z-dock">
            <div className="bg-black/80 backdrop-blur-xs text-white px-8 py-3 rounded-full shadow-xl">
              <p className="font-mono text-xs">
                z-dock (40) + backdrop-blur-xs
              </p>
            </div>
          </div>

          <div className="absolute bottom-4 right-4 z-modal bg-white p-4 shadow-xl border-2 border-indigo-500 rounded-lg">
            <p className="font-mono text-xs text-indigo-600">z-modal (50)</p>
          </div>
        </div>
      </section>

      {/* ATOMIC UTILITIES */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">2. Shadows (v4 Utility)</h2>
          <div className="space-y-4">
            <div className="h-20 w-full bg-white rounded-lg shadow-sm-xs flex items-center justify-center">
              <span className="text-xs font-mono">shadow-sm-xs</span>
            </div>
            <div className="h-20 w-full bg-white rounded-lg shadow-sm-luxury-md flex items-center justify-center">
              <span className="text-xs font-mono">shadow-sm-luxury-md</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">3. Backdrop Blurs</h2>
          <div className="relative h-44 w-full rounded-xl overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1590644365607-1c5a29d250c4?q=80&w=400"
              alt="Backdrop blur test background"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center gap-4">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-xs flex items-center justify-center border border-white/30 rounded-lg">
                <span className="text-[10px] text-white font-bold">
                  blur-xs
                </span>
              </div>
              <div className="w-20 h-20 bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 rounded-lg">
                <span className="text-[10px] text-white font-bold">
                  blur-md
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">4. Floating Dock Sim</h2>
          <div className="h-44 w-full bg-neutral-100 rounded-xl flex items-center justify-center border">
            <FloatingDock items={navItems} />
          </div>
        </div>
      </section>

      {/* TYPOGRAPHY */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">5. Typography & Gradient</h2>
        <div className="p-8 bg-black rounded-2xl overflow-hidden">
          <h3 className="text-6xl font-bold uppercase tracking-tighter text-transparent bg-clip-text bg-linear-to-r from-blue-500 to-white bg-300% animate-gradient">
            Athletic Performance
          </h3>
          <p className="mt-4 text-gray-400 max-w-lg">
            Verify font rendering (Anton) and gradient animation stability on
            black backgrounds.
          </p>
        </div>
      </section>

      <footer className="text-center py-12 text-gray-400 text-xs font-mono">
        Audit Completed via Antigravity Agent - 2025
      </footer>
    </div>
  );
}
