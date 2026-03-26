import type React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SectionItem {
  id: number;
  name: string;
  title?: string | null;
  heroTitle?: string | null;
  content?: string | null;
  sectionType: string;
  data?: Record<string, unknown> | null;
  mediaIds?: number[] | null;
  isActive?: boolean | null;
  sortOrder?: number | null;
}

interface SectionsProps {
  data: SectionItem[] | undefined;
}

export const Sections: React.FC<SectionsProps> = ({ data }) => {
  const sections = data
    ?.filter((s) => s.isActive !== false)
    ?.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  if (!sections || sections.length === 0) {
    return null;
  }

  return (
    <section
      className="w-full bg-background px-4 py-32 md:px-8"
      role="region"
      aria-labelledby="sections-heading"
    >
      <div className="mx-auto max-w-container-2xl">
        <h2 id="sections-heading" className="sr-only">
          About RUN Apparel
        </h2>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {sections.map((section) => (
            <Card
              key={section.id}
              className={cn(
                "group overflow-hidden border-border transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl",
                section.sectionType === "sustainability" && "md:col-span-2",
              )}
              variant="glass-premium"
            >
              <CardContent className="p-8 md:p-12">
                {/* Section Title */}
                {(section.heroTitle || section.title) && (
                  <h3 className="mb-4 font-bold text-2xl uppercase tracking-tight md:text-3xl">
                    {section.heroTitle || section.title}
                  </h3>
                )}

                {/* Section Content */}
                {section.content && (
                  <p className="text-muted-foreground leading-relaxed md:text-lg">
                    {section.content}
                  </p>
                )}

                {/* Section Type Badge */}
                <div className="mt-6">
                  <span className="inline-block rounded-full border border-foreground/10 px-3 py-1 font-mono text-xs tracking-widest uppercase text-muted-foreground">
                    {section.sectionType.replace(/_/g, " ")}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
