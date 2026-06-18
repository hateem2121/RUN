"use client";

import { IconMail, IconWorld } from "@tabler/icons-react";
import { Card, CardContent } from "@/components/ui/card";

interface SEOPreviewProps {
  title: string;
  description: string;
  slug: string;
  ogImage?: string | undefined;
  type: "google" | "social";
}

export function SEOPreview({ title, description, slug, ogImage, type }: SEOPreviewProps) {
  const displayTitle = title || "Post Title Preview";
  const displayDescription =
    description ||
    "This is a preview of your post's meta description. It should be concise and engaging to encourage clicks.";
  const displayUrl = `wear-run.com/blog/${slug || "your-post-slug"}`;

  if (type === "google") {
    return (
      <Card className="bg-white/[0.03] border-white/10 shadow-sm">
        <CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <div className="w-7 h-7 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
              <IconWorld size={14} />
            </div>
            <div className="flex flex-col">
              <span className="text-zinc-900 dark:text-zinc-100 font-medium">RUN APPAREL</span>
              <span className="text-xs truncate">{displayUrl}</span>
            </div>
          </div>
          <h3 className="text-custom-color-1 dark:text-custom-color-2 text-xl font-normal hover:underline cursor-pointer">
            {displayTitle}
          </h3>
          <p className="text-custom-color-3 dark:text-custom-color-4 text-sm line-clamp-2">
            {displayDescription}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden bg-white/[0.03] border-white/10 shadow-sm max-w-md">
      <div className="aspect-custom-misc-14 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center relative overflow-hidden">
        {ogImage ? (
          <img src={ogImage} alt="OG Preview" className="w-full h-full object-cover" />
        ) : (
          <div className="text-zinc-400 dark:text-zinc-600 flex flex-col items-center gap-2">
            <IconMail size={40} stroke={1} />
            <span className="text-xs font-medium uppercase tracking-wider">
              Social Preview Image
            </span>
          </div>
        )}
      </div>
      <CardContent className="p-3 border-t border-zinc-200 dark:border-zinc-800">
        <div className="text-custom-space-6 text-zinc-500 dark:text-zinc-500 uppercase font-semibold tracking-wider mb-1">
          WEAR-RUN.COM
        </div>
        <h4 className="text-zinc-900 dark:text-zinc-100 font-bold leading-tight mb-1 line-clamp-2">
          {displayTitle}
        </h4>
        <p className="text-zinc-600 dark:text-zinc-400 text-xs line-clamp-2 leading-snug">
          {displayDescription}
        </p>
      </CardContent>
    </Card>
  );
}
