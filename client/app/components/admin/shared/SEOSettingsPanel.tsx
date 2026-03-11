import { Eye, Globe, Image as ImageIcon, Info, Share2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { GlassCard } from "./GlassCard";

interface SEOData {
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
}

interface SEOSettingsPanelProps {
  data: SEOData;
  onChange: (data: SEOData) => void;
  baseUrl: string;
}

export function SEOSettingsPanel({ data, onChange, baseUrl }: SEOSettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  const updateField = (field: keyof SEOData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const titleCount = data.metaTitle.length;
  const descCount = data.metaDescription.length;

  return (
    <div className="space-y-8">
      {/* Header with Tabs */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab("edit")}
            className={cn(
              "pb-4 text-sm font-medium transition-all",
              activeTab === "edit"
                ? "text-blue-500 border-b-2 border-blue-500 font-bold"
                : "text-[#68869A] hover:text-white",
            )}
          >
            Configuration
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            className={cn(
              "pb-4 text-sm font-medium transition-all",
              activeTab === "preview"
                ? "text-blue-500 border-b-2 border-blue-500 font-bold"
                : "text-[#68869A] hover:text-white",
            )}
          >
            Search & Social Preview
          </button>
        </div>
      </div>

      {activeTab === "edit" ? (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Left Column: Core SEO */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest flex items-center gap-2">
                Meta Title
                <Info className="w-3 h-3" />
              </label>
              <input
                type="text"
                value={data.metaTitle}
                onChange={(e) => updateField("metaTitle", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                placeholder="Page title for search engines"
              />
              <div className="flex justify-between items-center mt-1.5">
                <p className="text-[10px] text-[#68869A] font-medium">Recommended: 50-60 chars</p>
                <p
                  className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded",
                    titleCount > 60 || titleCount < 30
                      ? "bg-amber-500/10 text-amber-500"
                      : "bg-emerald-500/10 text-emerald-500",
                  )}
                >
                  {titleCount}/70
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest">
                Canonical URL
              </label>
              <div className="flex items-center">
                <span className="bg-white/10 border border-r-0 border-white/10 rounded-l-lg px-3 py-2.5 text-xs text-[#68869A] whitespace-nowrap">
                  {baseUrl}/
                </span>
                <input
                  type="text"
                  value={data.canonicalUrl}
                  onChange={(e) => updateField("canonicalUrl", e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-r-lg p-3 py-2.5 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none"
                  placeholder="slug-path"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest">
                Meta Description
              </label>
              <textarea
                rows={4}
                value={data.metaDescription}
                onChange={(e) => updateField("metaDescription", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none resize-none transition-all"
                placeholder="Brief summary of the page content for search results"
              />
              <div className="flex justify-between items-center mt-1.5">
                <p className="text-[10px] text-[#68869A] font-medium">Recommended: 150-160 chars</p>
                <p
                  className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded",
                    descCount > 160 || descCount < 100
                      ? "bg-amber-500/10 text-amber-500"
                      : "bg-emerald-500/10 text-emerald-500",
                  )}
                >
                  {descCount}/160
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Social Share */}
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest">
                Social Share Image (OG Image)
              </label>
              <GlassCard className="p-5 flex items-center gap-6">
                <div className="relative group overflow-hidden rounded-lg border border-white/10 w-40 h-24 bg-black/20 flex items-center justify-center">
                  {data.ogImage ? (
                    <img
                      src={data.ogImage}
                      alt="OG Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-white/10" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all"
                      title="Preview OG Image"
                      aria-label="Preview OG Image"
                    >
                      <Eye className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white mb-1 truncate">
                    {data.ogImage ? data.ogImage.split("/").pop() : "No image selected"}
                  </p>
                  <p className="text-[10px] text-[#68869A] mb-4">1200 x 630 px recommended</p>
                  <div className="flex gap-2">
                    <button className="bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-lg text-[10px] font-bold text-white transition-colors">
                      Change Image
                    </button>
                    {data.ogImage && (
                      <button className="text-[#68869A] hover:text-red-400 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors">
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </GlassCard>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest">
                Social Title (Optional)
              </label>
              <input
                type="text"
                value={data.ogTitle || ""}
                onChange={(e) => updateField("ogTitle", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none"
                placeholder="Alternative title for social media"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Google Preview */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest flex items-center gap-2">
              <Globe className="w-3 h-3" />
              Google Search Preview
            </h3>
            <div className="bg-[#f8f9fa] rounded-xl p-6 shadow-xl border border-black/5">
              <div className="max-w-md">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm border border-white/10">
                    <Globe className="w-2 h-2 text-slate-900" />
                  </div>
                  <p className="text-[11px] text-[#4d5156] truncate">
                    {baseUrl}/{data.canonicalUrl}
                  </p>
                </div>
                <h4 className="text-[#1a0dab] text-xl hover:underline cursor-pointer font-normal mb-1">
                  {data.metaTitle || "Page Title Sample"}
                </h4>
                <p className="text-[13px] text-[#4d5156] leading-relaxed line-clamp-2">
                  <span className="text-[#70757a]">
                    {new Date().toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}{" "}
                    —{" "}
                  </span>
                  {data.metaDescription ||
                    "Don't let the cold stop your stride. Discover the top essentials every athlete needs this season..."}
                </p>
              </div>
            </div>
          </div>

          {/* Social Media Preview */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest flex items-center gap-2">
              <Share2 className="w-3 h-3" />
              Social Media Preview
            </h3>
            <div className="bg-[#1b222c] rounded-xl overflow-hidden border border-white/10 shadow-xl group">
              <div className="aspect-[1.91/1] w-full overflow-hidden bg-black/20 flex items-center justify-center">
                {data.ogImage ? (
                  <img
                    src={data.ogImage}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    alt="Social Preview"
                  />
                ) : (
                  <ImageIcon className="w-12 h-12 text-white/5" />
                )}
              </div>
              <div className="p-4 bg-white/5 border-t border-white/5">
                <p className="text-[9px] text-[#68869A] uppercase font-bold tracking-widest mb-1">
                  {baseUrl.replace(/^https?:\/\//, "").toUpperCase()}
                </p>
                <h4 className="text-white text-base font-bold mb-1 line-clamp-1">
                  {data.ogTitle || data.metaTitle || "Social Media Share Title"}
                </h4>
                <p className="text-xs text-[#68869A] line-clamp-2">
                  {data.ogDescription ||
                    data.metaDescription ||
                    "Social media description sample text goes here."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
