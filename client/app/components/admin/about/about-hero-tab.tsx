import type { AboutHero, MediaAsset } from "@run-remix/shared";
import { ABOUT_API } from "@shared/api-constants";
import { useQuery } from "@tanstack/react-query";
import { Eye, Save, Trash2, Upload } from "lucide-react";
import { useActionState, useEffect, useOptimistic, useState, useTransition } from "react";
import { StandardMediaSelectionDialog } from "@/components/admin/shared/StandardMediaSelectionDialog";
import { HeroSection } from "@/components/sections/HeroSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, getQueryClient } from "@/lib/queryClient";

export function AboutHeroTab() {
  const { toast } = useToast();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaAsset | null>(null);
  const [isPending, startTransition] = useTransition();

  const { data: heroData, isLoading } = useQuery<AboutHero>({
    queryKey: [ABOUT_API.HERO],
  });

  const [optimisticHero, setOptimisticHero] = useOptimistic<AboutHero | null, Partial<AboutHero>>(
    heroData || null,
    (state, updated) => (state ? { ...state, ...updated } : (updated as AboutHero)),
  );

  // Sync selected media when heroData or optimisticHero changes
  useEffect(() => {
    const mediaId = optimisticHero?.backgroundMediaId;
    if (mediaId) {
      fetch(`/api/media/${mediaId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.success && data?.data) {
            setSelectedMedia(data.data);
          }
        })
        .catch(() => setSelectedMedia(null));
    } else {
      setSelectedMedia(null);
    }
  }, [optimisticHero?.backgroundMediaId]);

  const [_state, formAction] = useActionState(
    async (_prevState: { success: boolean } | null, formData: FormData) => {
      const payload = {
        title: formData.get("title") as string,
        subtitle: formData.get("subtitle") as string,
        description: formData.get("description") as string,
        backgroundMediaId: formData.get("backgroundMediaId")
          ? Number(formData.get("backgroundMediaId"))
          : null,
        isActive: true,
      };

      startTransition(() => {
        setOptimisticHero(payload as AboutHero);
      });

      try {
        await apiRequest(ABOUT_API.HERO, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });

        getQueryClient().invalidateQueries({ queryKey: [ABOUT_API.HERO] });
        getQueryClient().invalidateQueries({ queryKey: [ABOUT_API.BATCH] });

        toast({
          title: "Success",
          description: "Hero section updated successfully",
        });
        return { success: true };
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to update hero section",
          variant: "destructive",
        });
        return { success: false, error };
      }
    },
    null,
  );

  const handleRemoveMedia = () => {
    setSelectedMedia(null);
    // We can't easily trigger formAction here without a submit,
    // but we can update the optimistic state or just let the user hit Save.
    // For React 19 forms, it's better to have a hidden input for the mediaId.
  };

  if (isLoading) {
    return <div className="py-8 text-center text-muted-foreground">Loading hero data...</div>;
  }

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
              <form action={formAction} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    defaultValue={optimisticHero?.title || ""}
                    placeholder="Main Title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subtitle">Subtitle</Label>
                  <Input
                    id="subtitle"
                    name="subtitle"
                    defaultValue={optimisticHero?.subtitle || ""}
                    placeholder="Subtitle"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={optimisticHero?.description || ""}
                    placeholder="Description"
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Background Media</Label>
                  <input type="hidden" name="backgroundMediaId" value={selectedMedia?.id || ""} />
                  <div className="flex items-center gap-4">
                    {selectedMedia ? (
                      <div className="group relative">
                        {selectedMedia.type === "video" ? (
                          <video
                            src={`/api/media/${selectedMedia.id}/content`}
                            className="h-20 w-32 rounded-md border object-cover"
                            aria-label="Background video preview"
                          />
                        ) : (
                          <img
                            src={`/api/media/${selectedMedia.id}/content`}
                            alt={selectedMedia.altText || "Background preview"}
                            className="h-20 w-32 rounded-md border object-cover"
                          />
                        )}
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                          onClick={handleRemoveMedia}
                          aria-label="Remove background media"
                        >
                          <Trash2 className="h-3 w-3" aria-hidden="true" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex h-20 w-32 items-center justify-center rounded-md border border-dashed bg-white/[0.03]">
                        <span className="text-admin-muted text-xs">No media</span>
                      </div>
                    )}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsPickerOpen(true)}
                      aria-label="Select background media"
                    >
                      <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
                      Select Media
                    </Button>
                  </div>
                </div>

                <Button type="submit" disabled={isPending}>
                  <Save className="mr-2 h-4 w-4" aria-hidden="true" />
                  {isPending ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Preview Column */}
        <div className="space-y-6">
          <Card className="flex h-full flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" aria-hidden="true" />
                Live Preview
              </CardTitle>
              <CardDescription>Real-time preview of the hero section</CardDescription>
            </CardHeader>
            <CardContent className="relative min-h-96 flex-1 overflow-hidden rounded-b-lg border bg-background p-0">
              <div className="absolute inset-0 overflow-y-auto">
                <div className="w-[125%] origin-top scale-[0.8] transform md:w-[125%] md:origin-top-left">
                  <HeroSection
                    heroData={{
                      title: optimisticHero?.title || "",
                      subtitle: optimisticHero?.subtitle || null,
                      description: optimisticHero?.description || null,
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
