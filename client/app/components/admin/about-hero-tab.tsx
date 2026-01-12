import { zodResolver } from "@hookform/resolvers/zod";
import type { AboutHero, InsertAboutHero, MediaAsset } from "@shared/schema";
import { insertAboutHeroSchema } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Eye, Save, Trash2, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { StandardMediaSelectionDialog } from "@/components/admin/shared/StandardMediaSelectionDialog";
import { HeroSection } from "@/components/sections/HeroSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, getQueryClient } from "@/lib/queryClient";

export function AboutHeroTab() {
  const { toast } = useToast();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaAsset | null>(null);

  const { data: heroData, isLoading } = useQuery<AboutHero>({
    queryKey: ["/api/about-hero"],
  });

  const form = useForm({
    resolver: zodResolver(insertAboutHeroSchema),
    defaultValues: {
      title: "",
      subtitle: "",
      description: "",
      backgroundMediaId: undefined as number | undefined,
      isActive: true,
    },
  });

  // Watch values for preview
  const watchedValues = form.watch();

  // Load initial data
  useEffect(() => {
    if (heroData) {
      form.reset({
        title: heroData.title || "",
        subtitle: heroData.subtitle || "",
        description: heroData.description || "",
        backgroundMediaId: heroData.backgroundMediaId || undefined,
        isActive: heroData.isActive ?? true,
      });

      if (heroData.backgroundMediaId) {
        // We'll let the media fetcher below handle resolving the asset
      }
    }
  }, [heroData, form]);

  // Fetch selected/background media details for preview
  const mediaIdToFetch = watchedValues.backgroundMediaId || heroData?.backgroundMediaId;
  const { data: mediaResponse } = useQuery<{
    success: boolean;
    data: MediaAsset;
  }>({
    queryKey: ["/api/media", mediaIdToFetch],
    queryFn: async () => {
      const res = await fetch(`/api/media/${mediaIdToFetch}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!mediaIdToFetch,
  });

  useEffect(() => {
    if (mediaResponse?.data) {
      setSelectedMedia(mediaResponse.data);
    } else if (!mediaIdToFetch) {
      setSelectedMedia(null);
    }
  }, [mediaResponse, mediaIdToFetch]);

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<AboutHero>) => {
      // Ensure specific types
      const payload = {
        ...data,
        backgroundMediaId: data.backgroundMediaId ? Number(data.backgroundMediaId) : null,
      };
      return apiRequest("/api/about-hero", {
        method: "PATCH",
        body: JSON.stringify(payload),
      }) as Promise<AboutHero>;
    },
    onSuccess: () => {
      getQueryClient().invalidateQueries({ queryKey: ["/api/about-hero"] });
      getQueryClient().invalidateQueries({ queryKey: ["/api/about-batch"] });
      toast({
        title: "Success",
        description: "Hero section updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update hero section",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertAboutHero) => {
    updateMutation.mutate(data as unknown as Record<string, unknown>);
  };

  const handleRemoveMedia = () => {
    form.setValue("backgroundMediaId", undefined, { shouldDirty: true });
    setSelectedMedia(null);
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Editor Column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Hero Configuration</CardTitle>
              <CardDescription>Edit content and background</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ""} placeholder="Main Title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="subtitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subtitle</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ""} placeholder="Subtitle" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            value={field.value ?? ""}
                            placeholder="Description"
                            rows={4}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <Label>Background Media</Label>
                    <div className="flex items-center gap-4">
                      {selectedMedia ? (
                        <div className="group relative">
                          <img
                            src={`/api/media/${selectedMedia.id}/content`}
                            alt="Preview"
                            className="h-20 w-32 rounded-md border object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                            onClick={handleRemoveMedia}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex h-20 w-32 items-center justify-center rounded-md border border-dashed bg-muted">
                          <span className="text-muted-foreground text-xs">No media</span>
                        </div>
                      )}

                      <Button type="button" variant="outline" onClick={() => setIsPickerOpen(true)}>
                        <Upload className="mr-2 h-4 w-4" />
                        Select Media
                      </Button>
                    </div>
                  </div>

                  <Button type="submit" disabled={updateMutation.isPending}>
                    <Save className="mr-2 h-4 w-4" />
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Preview Column */}
        <div className="space-y-6">
          <Card className="flex h-full flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Live Preview
              </CardTitle>
              <CardDescription>Real-time preview of the hero section</CardDescription>
            </CardHeader>
            <CardContent className="relative min-h-96 flex-1 overflow-hidden rounded-b-lg border bg-background p-0">
              <div className="absolute inset-0 overflow-y-auto">
                <div className="w-[125%] origin-top scale-[0.8] transform md:w-[125%] md:origin-top-left">
                  <HeroSection
                    heroData={{
                      title: watchedValues.title,
                      subtitle: watchedValues.subtitle || null,
                      description: watchedValues.description || null,
                      isActive: true,
                    }}
                    mediaUrl={selectedMedia ? `/api/media/${selectedMedia.id}/content` : undefined}
                    mediaType={selectedMedia?.type === "video" ? "video" : "image"}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <StandardMediaSelectionDialog
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={(asset: MediaAsset | MediaAsset[]) => {
          const selected = Array.isArray(asset) ? asset[0] : asset;
          if (selected) {
            form.setValue("backgroundMediaId", selected.id, {
              shouldDirty: true,
            });
            setSelectedMedia(selected);
          }
        }}
        title="Select Background"
        mediaPickerTarget="about-hero"
        selectionMode="single"
      />
    </div>
  );
}
