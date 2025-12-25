import { IconHome, IconLayout, IconTerminal } from "@tabler/icons-react";
import { FloatingDock } from "@/components/ui/floating-dock";
import { Typography, headingVariants } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

export default function VisualContracts() {
  const navItems = [
    {
      title: "Home",
      icon: <IconHome className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      href: "#",
    },
    {
      title: "Terminal",
      icon: <IconTerminal className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      href: "#",
    },
    {
      title: "Layout",
      icon: <IconLayout className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      href: "#",
    },
  ];

  return (
    <div className="min-h-screen space-y-12 bg-[#FAFAFA] p-8">
      <header className="border-black/10 border-b pb-4">
        <Typography.H1 className="font-bold text-4xl">Visual Contracts Audit</Typography.H1>
        <Typography.P className="text-gray-500">Tailwind v4 Regression Safeguard Page</Typography.P>
      </header>

      {/* Z-INDEX & OVERLAYS */}
      <section className="space-y-6">
        <Typography.H2 className="font-bold text-2xl">
          1. Stacking Contexts (Z-Index Map)
        </Typography.H2>
        <div className="relative h-64 overflow-hidden rounded-xl border border-gray-300 border-dashed bg-white p-4">
          <div className="absolute inset-0 bg-linear-to-br from-blue-50 to-indigo-50 opacity-50" />

          <div className="absolute top-4 left-4 z-default rounded-lg border bg-white p-4 shadow-md">
            <Typography.P className="font-mono text-blue-600 text-xs">z-elevated (Content)</Typography.P>
          </div>

          <div className="absolute inset-0 z-dock center-flex">
            <div className="rounded-full bg-black/80 px-8 py-3 text-white shadow-xl backdrop-blur-xs">
              <Typography.P className="font-mono text-xs">
                z-dock (40) + backdrop-blur-xs
              </Typography.P>
            </div>
          </div>

          <div className="absolute right-4 bottom-4 z-modal rounded-lg border-2 border-indigo-500 bg-white p-4 shadow-xl">
            <Typography.P className="font-mono text-indigo-600 text-xs">z-modal (50)</Typography.P>
          </div>
        </div>
      </section>

      {/* ATOMIC UTILITIES */}
      <section className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="space-y-4">
          <Typography.H2 className="font-bold text-2xl">2. Shadows (v4 Utility)</Typography.H2>
          <div className="space-y-4">
            <div className="flex h-20 w-full items-center justify-center rounded-lg bg-white shadow-sm-xs">
              <span className="font-mono text-xs">shadow-sm-xs</span>
            </div>
            <div className="flex h-20 w-full items-center justify-center rounded-lg bg-white shadow-sm-luxury-md">
              <span className="font-mono text-xs">shadow-sm-luxury-md</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Typography.H2 className="font-bold text-2xl">3. Backdrop Blurs</Typography.H2>
          <div className="relative h-44 w-full overflow-hidden rounded-xl">
            <img
              src="https://images.unsplash.com/photo-1590644365607-1c5a29d250c4?q=80&w=400"
              alt="Backdrop blur test background"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 center-flex gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-white/30 bg-white/20 backdrop-blur-xs">
                <span className="font-bold text-[10px] text-white">blur-xs</span>
              </div>
              <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-white/30 bg-white/20 backdrop-blur-md">
                <span className="font-bold text-[10px] text-white">blur-md</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Typography.H2 className="font-bold text-2xl">4. Floating Dock Sim</Typography.H2>
          <div className="flex h-44 w-full items-center justify-center rounded-xl border bg-neutral-100">
            <FloatingDock items={navItems} />
          </div>
        </div>
      </section>

      {/* TYPOGRAPHY */}
      <section className="space-y-4">
        <Typography.H2 className="font-bold text-2xl">5. Typography & Gradient</Typography.H2>
        <div className="overflow-hidden rounded-2xl bg-black p-8">
          <Typography.H3 className="animate-gradient bg-300% bg-linear-to-r from-blue-500 to-white bg-clip-text font-bold text-6xl text-transparent uppercase tracking-tighter">
            Athletic Performance
          </Typography.H3>
          <Typography.P className="mt-4 max-w-lg text-gray-400">
            Verify font rendering (Anton) and gradient animation stability on black backgrounds.
          </Typography.P>
        </div>
      </section>

      <footer className="py-12 text-center font-mono text-gray-400 text-xs">
        Audit Completed via Antigravity Agent - 2025
      </footer>
    </div>
  );
}
