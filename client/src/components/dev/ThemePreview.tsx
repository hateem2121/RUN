import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ThemePreview() {
  return (
    <div className="min-h-screen bg-background p-8 font-sans">
      <div className="mx-auto max-w-4xl space-y-12">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Theme Preview</h1>
          <p className="text-muted-foreground text-lg">
            Verification of Industrial B2B Design Token System
          </p>
        </header>

        {/* Color Palette Section */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Brand Colors</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <ColorCard name="Primary" className="bg-primary text-primary-foreground" />
            <ColorCard name="Secondary" className="bg-secondary text-secondary-foreground" />
            <ColorCard name="Accent" className="bg-accent text-accent-foreground" />
            <ColorCard name="Destructive" className="bg-destructive text-destructive-foreground" />
            <ColorCard name="Muted" className="bg-muted text-muted-foreground" />
            <ColorCard name="Card" className="bg-card text-card-foreground border border-border" />
            <ColorCard
              name="Popover"
              className="bg-popover text-popover-foreground border border-border"
            />
            <div className="rounded-lg border border-input bg-background p-4 shadow-sm flex items-center justify-center">
              <span className="text-sm font-medium">Input / Border</span>
            </div>
          </div>
        </section>

        {/* Typography Section */}
        <section className="space-y-4 rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-6">Typography Scale</h2>
          <div className="space-y-4">
            <h1>Heading 1 - Industrial Excellence</h1>
            <h2>Heading 2 - Manufacturing Data</h2>
            <h3>Heading 3 - Production Metrics</h3>
            <p className="text-muted-foreground leading-7">
              This is a standard body paragraph using the Inter font family. It is optimized for
              readability in data-dense B2B interfaces. The text wrapping is set to "pretty" to
              prevent orphans.
            </p>
          </div>
        </section>

        {/* Components Section */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Interactive Components</h2>
          <div className="grid gap-6 rounded-lg border p-6 bg-muted/20">
            {/* Buttons Row */}
            <div className="flex flex-wrap items-center gap-4">
              <Button>Primary Action</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Critical Error</Button>
              <Button variant="link">Link Style</Button>
            </div>

            {/* Sizes */}
            <div className="flex flex-wrap items-center gap-4">
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large Action</Button>
              <Button size="icon" variant="outline">
                <span className="sr-only">Icon</span>+
              </Button>
            </div>

            {/* States */}
            <div className="flex flex-wrap items-center gap-4">
              <Button disabled>Disabled</Button>
              <Button variant="secondary" disabled>
                Disabled Secondary
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function ColorCard({ name, className }: { name: string; className?: string }) {
  return (
    <div
      className={cn(
        "flex h-24 items-center justify-center rounded-lg shadow-sm font-medium text-sm",
        className,
      )}
    >
      {name}
    </div>
  );
}
