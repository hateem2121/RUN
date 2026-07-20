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

const DEFAULT_SECTIONS: SectionItem[] = [
  {
    id: 1,
    name: "manufacturing",
    title: "Precision Manufacturing",
    content:
      "Our state-of-the-art facility integrates advanced circular knitting, precision laser cutting, and automated sewing systems to deliver consistent high-performance athletic wear at scale.",
    sectionType: "manufacturing",
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 2,
    name: "technology",
    title: "Technological Edge",
    content:
      "Using virtual prototyping and 3D fit visualization tools, we accelerate the R&D process from concept to approved design, drastically reducing sample lead times and fabric waste.",
    sectionType: "technology",
    isActive: true,
    sortOrder: 2,
  },
  {
    id: 3,
    name: "sustainability",
    title: "Circular Sustainability",
    content:
      "We offer certified GOTS organic cotton, GRS recycled polyester, and biodegradable synthetics. Our facility is zero-discharge certified, reusing 95% of water in our dyehouse.",
    sectionType: "sustainability",
    isActive: true,
    sortOrder: 3,
  },
];

export const Sections: React.FC<SectionsProps> = ({ data }) => {
  const activeData = data?.filter((s) => s.isActive !== false);
  const sections =
    activeData && activeData.length > 0
      ? [...activeData].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      : DEFAULT_SECTIONS;

  return (
    <section
      className="w-full bg-background px-4 py-32 md:px-8 content-auto"
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
                "scroll-reveal group overflow-hidden border-border transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl",
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
