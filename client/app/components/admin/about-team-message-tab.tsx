import type { AboutTeamMessage, MediaAsset } from "@run-remix/shared";
import { ABOUT_API, ADMIN_MEDIA_QUERIES, buildMediaApiParams } from "@shared/api-constants";
import { useQuery } from "@tanstack/react-query";
import { Save, Trash2, Upload } from "lucide-react";
import { useActionState, useEffect, useOptimistic, useState, useTransition } from "react";
import { StandardMediaSelectionDialog } from "@/components/admin/shared/StandardMediaSelectionDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createMediaQueryKey } from "@/lib/media-query-keys";
import { apiRequest, getQueryClient } from "@/lib/queryClient";

export function AboutTeamMessageTab() {
  const { toast } = useToast();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaAsset | null>(null);
  const [isPending, startTransition] = useTransition();

  const { data: messageData, isLoading } = useQuery<AboutTeamMessage>({
    queryKey: [ABOUT_API.TEAM_MESSAGE],
  });

  const [optimisticMessage, setOptimisticMessage] = useOptimistic<
    AboutTeamMessage | null,
    Partial<AboutTeamMessage>
  >(messageData || null, (state, updated) =>
    state ? { ...state, ...updated } : (updated as AboutTeamMessage),
  );

  const { data: mediaResponse } = useQuery<{
    success: boolean;
    data: { data: MediaAsset[] };
  }>({
    queryKey: createMediaQueryKey.recent(50),
    queryFn: async () => {
      const response = await fetch(
        `/api/media?${buildMediaApiParams(ADMIN_MEDIA_QUERIES.RECENT_ADMIN)}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch media");
      }
      return response.json();
    },
  });

  const mediaAssets = mediaResponse?.data?.data || [];

  // Sync selected media when optimisticMessage changes
  useEffect(() => {
    const imageId = optimisticMessage?.imageId;
    if (imageId) {
      const media = mediaAssets.find((m: MediaAsset) => m.id === imageId);
      if (media) {
        setSelectedMedia(media);
      } else {
        fetch(`/api/media/${imageId}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data?.success && data?.data) {
              setSelectedMedia(data.data);
            }
          })
          .catch(() => setSelectedMedia(null));
      }
    } else {
      setSelectedMedia(null);
    }
  }, [optimisticMessage?.imageId, mediaAssets]);

  const [_state, formAction] = useActionState(
    async (_prevState: { success: boolean } | null, formData: FormData) => {
      const payload = {
        name: formData.get("name") as string,
        position: formData.get("position") as string,
        title: formData.get("title") as string,
        message: formData.get("message") as string,
        signature: formData.get("signature") as string,
        imageId: formData.get("imageId") ? Number(formData.get("imageId")) : null,
        isActive: true,
      };

      startTransition(() => {
        setOptimisticMessage(payload as AboutTeamMessage);
      });

      try {
        await apiRequest(ABOUT_API.TEAM_MESSAGE, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });

        getQueryClient().invalidateQueries({ queryKey: [ABOUT_API.TEAM_MESSAGE] });
        getQueryClient().invalidateQueries({ queryKey: [ABOUT_API.BATCH] });

        toast({
          title: "Success",
          description: "Team message updated successfully",
        });
        return { success: true };
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to update team message",
          variant: "destructive",
        });
        return { success: false, error };
      }
    },
    null,
  );

  const handleRemoveMedia = () => {
    setSelectedMedia(null);
  };

  if (isLoading) {
    return <div className="py-8 text-center text-muted-foreground">Loading team message...</div>;
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Message from the Team</CardTitle>
          <CardDescription>
            Add a personal message from your leadership team or company
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Executive Name (Internal/Meta)</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={optimisticMessage?.name || ""}
                  placeholder="e.g. M. Hateem Jamshaid"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  name="position"
                  defaultValue={optimisticMessage?.position || ""}
                  placeholder="e.g. Business Development Director"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Public Title</Label>
              <Input
                id="title"
                name="title"
                defaultValue={optimisticMessage?.title || ""}
                placeholder="A Message from Our Team"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                name="message"
                defaultValue={optimisticMessage?.message || ""}
                placeholder="We are committed to delivering excellence in every thread..."
                rows={8}
                className="resize-none"
                required
              />
              <p className="text-admin-muted text-sm">
                Write a compelling message that showcases your company's values and commitment
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signature">Signature Label (Public)</Label>
              <Input
                id="signature"
                name="signature"
                defaultValue={optimisticMessage?.signature || ""}
                placeholder="John Doe, CEO"
              />
            </div>

            <div className="space-y-2">
              <Label>Team/Signature Image (Optional)</Label>
              <input type="hidden" name="imageId" value={selectedMedia?.id || ""} />
              <div className="flex items-center gap-4">
                {selectedMedia ? (
                  <div className="relative">
                    <img
                      src={`/api/media/${selectedMedia.id}/content`}
                      alt="Team preview"
                      className="h-32 w-32 rounded-lg object-cover"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-8 w-8 rounded-full"
                      onClick={handleRemoveMedia}
                      aria-label="Remove team image"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex h-32 w-32 items-center justify-center rounded-lg bg-white/[0.03]">
                    <Upload className="h-6 w-6 text-admin-muted/70" aria-hidden="true" />
                  </div>
                )}
                <Button
                  type="button"
                  onClick={() => setIsPickerOpen(true)}
                  variant="outline"
                  aria-label="Select team image"
                >
                  Select Image
                </Button>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isPending}>
                <Save className="mr-2 h-4 w-4" aria-hidden="true" />
                {isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>See how your message will appear on the About page</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-background p-6 dark:bg-surface-black border">
            <div className="mx-auto max-w-3xl">
              {optimisticMessage?.title && (
                <h3 className="mb-6 font-bold text-2xl">{optimisticMessage.title}</h3>
              )}

              <div className="flex flex-col md:flex-row items-start gap-8">
                {selectedMedia && (
                  <img
                    src={`/api/media/${selectedMedia.id}/content`}
                    alt={selectedMedia.altText || "Team member"}
                    className="w-32 md:w-48 shrink-0 rounded-xl object-cover shadow-lg"
                  />
                )}

                <div className="flex-1">
                  {optimisticMessage?.message ? (
                    <p className="mb-6 whitespace-pre-wrap text-admin-muted leading-relaxed">
                      {optimisticMessage.message}
                    </p>
                  ) : (
                    <p className="mb-6 text-admin-muted/70 italic">
                      Your message will appear here...
                    </p>
                  )}

                  {(optimisticMessage?.signature || optimisticMessage?.name) && (
                    <div className="border-t border-white/10 pt-4">
                      <p className="font-semibold text-foreground">
                        {optimisticMessage.signature || optimisticMessage.name}
                      </p>
                      {optimisticMessage.position && (
                        <p className="text-admin-muted text-sm">{optimisticMessage.position}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <StandardMediaSelectionDialog
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={(asset) => {
          const selectedAsset = Array.isArray(asset) ? asset[0] : asset;
          if (selectedAsset) {
            setSelectedMedia(selectedAsset);
          }
        }}
        title="Select Team Message Image"
        mediaPickerTarget="team-message-image"
        selectionMode="single"
      />
    </div>
  );
}
