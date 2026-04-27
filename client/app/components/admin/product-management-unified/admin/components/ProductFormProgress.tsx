import { Camera, Package, Search, Settings, Star, Tag, Zap } from "lucide-react";
import { useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useProductContext } from "../state/ProductFormContext";

type SectionProgress = {
  name: string;
  fields: string[];
  completed: number;
  total: number;
  icon: React.ComponentType<{ className?: string }>;
};

export function ProductFormProgress() {
  const {
    formData,
    updateField,
    queries: { categories, fabrics },
    lastSaved,
    isGeneratingSlug,
    isEditing,
    isSectionComplete,
  } = useProductContext();

  const calculateFormProgress = useCallback(() => {
    const sections = {
      basic: {
        name: "Basic Information",
        fields: ["name", "sku", "description"],
        completed: 0,
        total: 3,
        icon: Package,
      },
      categorization: {
        name: "Categorization",
        fields: ["categoryId", "fabricId"],
        completed: 0,
        total: 2,
        icon: Tag,
      },
      media: {
        name: "Media Assets",
        fields: ["primaryImageId", "imageIds", "videos"],
        completed: 0,
        total: 3,
        icon: Camera,
      },
      specifications: {
        name: "Technical Specs",
        fields: ["specifications", "minimumOrderQuantity", "leadTime"],
        completed: 0,
        total: 3,
        icon: Settings,
      },
      advanced: {
        name: "Advanced Features",
        fields: ["certificateIds", "accessoryIds", "customizationOptions"],
        completed: 0,
        total: 3,
        icon: Star,
      },
      seo: {
        name: "SEO & Marketing",
        fields: ["metaTitle", "metaDescription"],
        completed: 0,
        total: 2,
        icon: Search,
      },
    };

    Object.keys(sections).forEach((sectionKey) => {
      const section = sections[sectionKey as keyof typeof sections];
      section.completed = section.fields.reduce((count: number, field: string) => {
        const value = formData[field as keyof typeof formData];

        if (field === "specifications" && Array.isArray(value)) {
          return (
            count +
            (value.length > 0 &&
            value.some(
              (spec) =>
                typeof spec === "object" &&
                spec !== null &&
                "name" in spec &&
                "value" in spec &&
                (spec as Record<string, unknown>).name &&
                (spec as Record<string, unknown>).value,
            )
              ? 1
              : 0)
          );
        }
        if (Array.isArray(value)) return count + (value.length > 0 ? 1 : 0);
        if (typeof value === "string") return count + (value.trim().length > 0 ? 1 : 0);
        if (typeof value === "number" && field !== "sortOrder") return count + (value > 0 ? 1 : 0);
        if (field === "sortOrder") return count + 1;
        return count + (value ? 1 : 0);
      }, 0);
    });

    const totalCompleted = Object.values(sections).reduce(
      (sum, section) => sum + section.completed,
      0,
    );
    const totalFields = Object.values(sections).reduce((sum, section) => sum + section.total, 0);
    const overallProgress = Math.round((totalCompleted / totalFields) * 100);

    return { sections, totalCompleted, totalFields, overallProgress };
  }, [formData]);

  const progressData = useMemo(() => calculateFormProgress(), [calculateFormProgress]);

  const generateMetaTitle = useCallback(() => {
    if (formData.name && !formData.metaTitle) {
      const category = categories.find((c) => c.id === formData.categoryId);
      const title = `${formData.name}${category ? ` - ${category.name}` : ""} | RUN APPAREL`;
      updateField("metaTitle", title.substring(0, 60));
    }
  }, [formData.name, formData.metaTitle, formData.categoryId, categories, updateField]);

  const generateMetaDescription = useCallback(() => {
    if (formData.description && !formData.metaDescription) {
      const fabric = fabrics.find((f) => f.id === formData.fabricId);
      const desc = `${formData.description.substring(0, 100)}${fabric ? ` Made with ${fabric.name}` : ""}. B2B sportswear manufacturing by RUN APPAREL.`;
      updateField("metaDescription", desc.substring(0, 160));
    }
  }, [formData.description, formData.metaDescription, formData.fabricId, fabrics, updateField]);

  return (
    <div className="mb-4">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        {Object.entries(progressData.sections).map(([key, section]) => {
          const typedSection = section as SectionProgress;
          const IconComponent = typedSection.icon;
          const percentage = Math.round((typedSection.completed / typedSection.total) * 100);

          return (
            <div
              key={key}
              className={`rounded-lg border p-2 text-center ${
                percentage === 100
                  ? "border-emerald-500/30 bg-emerald-500/10"
                  : percentage > 0
                    ? "border-amber-500/30 bg-amber-500/10"
                    : "border-white/10 bg-white/[0.03]"
              }`}
            >
              <IconComponent
                className={`mx-auto mb-1 h-4 w-4 ${
                  percentage === 100
                    ? "text-emerald-400"
                    : percentage > 0
                      ? "text-amber-400"
                      : "text-[#68869A]/70"
                }`}
              />
              <p className="text-[#E3DFD6]/80 mb-1 text-xs font-medium">{typedSection.name}</p>
              <div className="center-flex gap-1 text-xs">
                <span
                  className={
                    percentage === 100
                      ? "font-semibold text-emerald-400"
                      : percentage > 0
                        ? "text-amber-400"
                        : "text-[#68869A]"
                  }
                >
                  {typedSection.completed}/{typedSection.total}
                </span>
                {percentage === 100 && <span className="text-emerald-400">✓</span>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <div className="flex gap-2 text-xs flex-wrap">
          {lastSaved && (
            <div className="flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-1 text-emerald-400 border border-emerald-500/20">
              <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
              <span>Draft saved {lastSaved.toLocaleTimeString()}</span>
            </div>
          )}

          {isGeneratingSlug && (
            <div className="flex items-center gap-1 rounded bg-blue-500/10 px-2 py-1 text-blue-400 border border-blue-500/20">
              <Zap className="h-3 w-3 animate-pulse" />
              <span>Generating slug…</span>
            </div>
          )}

          {!isGeneratingSlug && formData.name && formData.slug && (
            <div className="flex items-center gap-1 rounded bg-blue-500/10 px-2 py-1 text-blue-400 border border-blue-500/20">
              <Zap className="h-3 w-3" />
              <span>
                Slug auto-generated
                {isSectionComplete("basic") && " ✓"}
              </span>
            </div>
          )}

          {formData.name && formData.sku && !isEditing && (
            <div className="flex items-center gap-1 rounded bg-purple-500/10 px-2 py-1 text-purple-400 border border-purple-500/20">
              <Zap className="h-3 w-3" />
              <span>SKU auto-suggested</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {formData.name && formData.description && !formData.metaTitle && (
            <Button
              data-testid="auto-generate-meta-title-button"
              type="button"
              size="sm"
              variant="outline"
              onClick={generateMetaTitle}
              className="text-xs"
            >
              <Zap className="mr-1 h-3 w-3" />
              Auto-generate Meta Title
            </Button>
          )}

          {formData.description && !formData.metaDescription && (
            <Button
              data-testid="auto-generate-meta-description-button"
              type="button"
              size="sm"
              variant="outline"
              onClick={generateMetaDescription}
              className="text-xs"
            >
              <Zap className="mr-1 h-3 w-3" />
              Auto-generate Meta Description
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
