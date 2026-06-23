import { zodResolver } from "@hookform/resolvers/zod";
import type { ManufacturingHero, MediaAsset } from "@shared/index";
import { insertManufacturingHeroSchema } from "@shared/index";
import { useQuery } from "@tanstack/react-query";
import { Image as ImageIcon, Layout, Play, Save } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { MediaPickerModal } from "@/components/admin/shared/MediaPickerModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { createMediaQueryKey } from "@/lib/media-query-keys";
import { apiRequest, getQueryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

type HeroFormData = z.infer<typeof insertManufacturingHeroSchema>;

interface HeroManagementProps {
  mediaAssets: MediaAsset[];
}

export function HeroManagement({ mediaAssets }: HeroManagementProps) {
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);
  const [showVideoPicker, setShowVideoPicker] = useState(false);

  const { data: heroData, isLoading: heroLoading } = useQuery<ManufacturingHero>({
    queryKey: ["/api/manufacturing-hero"],
    queryFn: () => apiRequest<ManufacturingHero>("/api/manufacturing-hero"),
  });

  const { data: specificBackground } = useQuery<MediaAsset>({
    queryKey: createMediaQueryKey.single(heroData?.backgroundMediaId || 0),
    queryFn: () => apiRequest<MediaAsset>(`/api/media/${heroData?.backgroundMediaId}`),
    enabled:
      !!heroData?.backgroundMediaId &&
      !mediaAssets.find((a) => a.id === heroData.backgroundMediaId),
  });

  const { data: specificVideo } = useQuery<MediaAsset>({
    queryKey: createMediaQueryKey.single(heroData?.videoId || 0),
    queryFn: () => apiRequest<MediaAsset>(`/api/media/${heroData?.videoId}`),
    enabled: !!heroData?.videoId && !mediaAssets.find((a) => a.id === heroData.videoId),
  });

  const form = useForm<HeroFormData>({
    resolver: zodResolver(insertManufacturingHeroSchema),
    defaultValues: {
      headline: "",
      subheadline: "",
      backgroundMediaId: null,
      videoId: null,
      isActive: true,
      ctaText: "",
      ctaLink: "",
      bottomCtaTitle: "",
      bottomCtaDescription: "",
      bottomCtaText: "",
      bottomCtaLink: "",
    },
  });

  useEffect(() => {
    if (heroData) {
      form.reset({
        headline: heroData.headline || "",
        subheadline: heroData.subheadline || "",
        backgroundMediaId: heroData.backgroundMediaId || null,
        videoId: heroData.videoId || null,
        isActive: heroData.isActive ?? true,
        ctaText: heroData.ctaText || "",
        ctaLink: heroData.ctaLink || "",
        bottomCtaTitle: heroData.bottomCtaTitle || "",
        bottomCtaDescription: heroData.bottomCtaDescription || "",
        bottomCtaText: heroData.bottomCtaText || "",
        bottomCtaLink: heroData.bottomCtaLink || "",
      });
    }
  }, [heroData, form]);

  const [_state, formAction, isPending] = useActionState(
    async (_prevState: { success: boolean } | null, _formData: FormData) => {
      const isValid = await form.trigger();
      if (!isValid) return { success: false };

      const data = form.getValues();

      try {
        const response = await apiRequest<ManufacturingHero>("/api/manufacturing-hero", {
          method: "PATCH",
          body: JSON.stringify(data),
        });

        if (response) {
          form.reset({
            headline: response.headline || "",
            subheadline: response.subheadline || "",
            backgroundMediaId: response.backgroundMediaId || null,
            videoId: response.videoId || null,
            isActive: response.isActive ?? true,
            ctaText: response.ctaText || "",
            ctaLink: response.ctaLink || "",
            bottomCtaTitle: response.bottomCtaTitle || "",
            bottomCtaDescription: response.bottomCtaDescription || "",
            bottomCtaText: response.bottomCtaText || "",
            bottomCtaLink: response.bottomCtaLink || "",
          });
          getQueryClient().invalidateQueries({ queryKey: ["/api/manufacturing-hero"] });
          toast.success("Success", { description: "Hero section updated successfully" });
        }
        return { success: true };
      } catch (_error) {
        toast.error("Error", { description: "Failed to update hero section" });
        return { success: false };
      }
    },
    { success: false },
  );

  const backgroundMediaId = form.watch("backgroundMediaId");
  const videoId = form.watch("videoId");

  const selectedBackgroundMedia = Array.isArray(mediaAssets)
    ? mediaAssets.find((asset) => asset.id === backgroundMediaId)
    : undefined;

  const selectedVideo = Array.isArray(mediaAssets)
    ? mediaAssets.find((asset) => asset.id === videoId)
    : undefined;

  const finalSelectedVideo = selectedVideo || specificVideo;
  const finalSelectedBackground = selectedBackgroundMedia || specificBackground;

  if (heroLoading) {
    return (
      <Card variant="glass-premium" className="flex items-center justify-center">
        <CardContent className="p-12 w-full flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="flex space-x-2">
              <div className="h-2 w-2 animate-bounce rounded-full bg-brand-manufacturing [animation-delay:-0.3s]"></div>
              <div className="h-2 w-2 animate-bounce rounded-full bg-brand-manufacturing [animation-delay:-0.15s]"></div>
              <div className="h-2 w-2 animate-bounce rounded-full bg-brand-manufacturing"></div>
            </div>
            <p className="text-xxs font-bold text-admin-muted uppercase tracking-widest">
              Orchestrating Hero Tab...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card variant="glass-premium">
        <CardContent className="p-8">
          <Form {...form}>
            <form action={formAction} className="space-y-10">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">Hero Section</h2>
                  <p className="text-sm text-admin-muted">
                    Manage the main hero section for the manufacturing page
                  </p>
                </div>
                <div className="flex items-center space-x-3 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Switch
                            id="hero-active"
                            checked={field.value ?? true}
                            onCheckedChange={field.onChange}
                            className="data-custom-misc-49:bg-brand-manufacturing"
                          />
                        </FormControl>
                        <Label
                          htmlFor="hero-active"
                          className="text-xs font-bold text-slate-300 uppercase tracking-wider cursor-pointer"
                        >
                          Status: {field.value ? "Active" : "Hidden"}
                        </Label>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="headline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1">
                        Headline
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          className="bg-white/5 border-white/10 text-white rounded-xl py-6 focus:ring-custom-color-15/50 focus-visible:ring-offset-0 placeholder:text-white/20"
                          placeholder="e.g., Leading the Way in Precision Sportswear"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subheadline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1">
                        Subheadline
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          className="bg-white/5 border-white/10 text-white rounded-xl py-6 focus:ring-custom-color-16/50 focus-visible:ring-offset-0 placeholder:text-white/20"
                          placeholder="Enter subheadline"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-white/5">
                <FormField
                  control={form.control}
                  name="ctaText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1">
                        Main Button Text
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          className="bg-white/5 border-white/10 text-white rounded-xl py-6 focus:ring-custom-color-17/50 focus-visible:ring-offset-0 placeholder:text-white/20"
                          placeholder="e.g., Explore Our Facilities"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ctaLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1">
                        Main Button Link
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          className="bg-white/5 border-white/10 text-white rounded-xl py-6 focus:ring-custom-color-18/50 focus-visible:ring-offset-0 placeholder:text-white/20"
                          placeholder="e.g., /contact"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-6 pt-8 border-t border-white/5">
                <div className="flex items-center gap-2 mb-4">
                  <Layout className="w-4 h-4 text-brand-manufacturing" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Bottom Conversion Banner
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <FormField
                    control={form.control}
                    name="bottomCtaTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1">
                          Banner Title
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            className="bg-white/5 border-white/10 text-white rounded-xl py-6 focus:ring-custom-color-19/50 focus-visible:ring-offset-0 placeholder:text-white/20"
                            placeholder="e.g., Experience Precision Manufacturing"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bottomCtaDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1">
                          Banner Description
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            className="bg-white/5 border-white/10 text-white rounded-xl py-6 focus:ring-custom-color-20/50 focus-visible:ring-offset-0 placeholder:text-white/20"
                            placeholder="Enter conversion description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bottomCtaText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1">
                          Banner Button Text
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            className="bg-white/5 border-white/10 text-white rounded-xl py-6 focus:ring-custom-color-21/50 focus-visible:ring-offset-0 placeholder:text-white/20"
                            placeholder="e.g., Start Your Project"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bottomCtaLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1">
                          Banner Button Link
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            className="bg-white/5 border-white/10 text-white rounded-xl py-6 focus:ring-custom-color-22/50 focus-visible:ring-offset-0 placeholder:text-white/20"
                            placeholder="e.g., /contact"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-white/5">
                <div className="space-y-3">
                  <Label className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1">
                    Background Asset
                  </Label>
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all group">
                    <div className="size-16 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                      {finalSelectedBackground?.url ? (
                        <img
                          src={finalSelectedBackground.url}
                          className="w-full h-full object-cover"
                          alt="Background preview"
                        />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-white/10" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate mb-1">
                        {finalSelectedBackground?.filename || "No asset selected"}
                      </p>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setShowBackgroundPicker(true)}
                          data-testid="select-background-button"
                          aria-label={
                            finalSelectedBackground
                              ? "Change background asset"
                              : "Select background asset"
                          }
                          className="text-xxs font-bold text-brand-manufacturing hover:text-brand-manufacturing/80 transition-colors uppercase tracking-wider"
                        >
                          {finalSelectedBackground ? "Change" : "Select"}
                        </button>
                        {finalSelectedBackground && (
                          <button
                            type="button"
                            onClick={() =>
                              form.setValue("backgroundMediaId", null, { shouldDirty: true })
                            }
                            aria-label="Remove background asset"
                            className="text-xxs font-bold text-red-500/70 hover:text-red-500 transition-colors uppercase tracking-wider"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1">
                    Hero Video Overlay
                  </Label>
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all group">
                    <div className="size-16 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                      <Play
                        className={cn(
                          "w-6 h-6",
                          finalSelectedVideo ? "text-brand-manufacturing" : "text-white/10",
                        )}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate mb-1">
                        {finalSelectedVideo?.filename || "No video selected"}
                      </p>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setShowVideoPicker(true)}
                          data-testid="select-video-button"
                          aria-label={
                            finalSelectedVideo
                              ? "Change hero video overlay"
                              : "Select hero video overlay"
                          }
                          className="text-xxs font-bold text-brand-manufacturing hover:text-brand-manufacturing/80 transition-colors uppercase tracking-wider"
                        >
                          {finalSelectedVideo ? "Change Video" : "Select Video"}
                        </button>
                        {finalSelectedVideo && (
                          <button
                            type="button"
                            onClick={() => form.setValue("videoId", null, { shouldDirty: true })}
                            aria-label="Remove hero video overlay"
                            className="text-xxs font-bold text-red-500/70 hover:text-red-500 transition-colors uppercase tracking-wider"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t border-white/5">
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-primary hover:bg-primary/90 text-white px-10 py-7 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-custom-misc-50 group"
                >
                  {isPending ? (
                    "Applying Changes..."
                  ) : (
                    <span className="flex items-center gap-2 text-sm uppercase tracking-wider">
                      <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      Save Hero Settings
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </Form>

          <MediaPickerModal
            isOpen={showBackgroundPicker}
            onClose={() => setShowBackgroundPicker(false)}
            onSelect={(asset) => {
              form.setValue("backgroundMediaId", Number(asset.id), { shouldDirty: true });
              setShowBackgroundPicker(false);
            }}
            title="Select Background Asset"
            allowedTypes={["image"]}
          />

          <MediaPickerModal
            isOpen={showVideoPicker}
            onClose={() => setShowVideoPicker(false)}
            onSelect={(asset) => {
              form.setValue("videoId", Number(asset.id), { shouldDirty: true });
              setShowVideoPicker(false);
            }}
            title="Select Hero Video"
            allowedTypes={["video"]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
