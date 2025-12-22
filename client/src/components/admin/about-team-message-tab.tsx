import { ADMIN_MEDIA_QUERIES, buildMediaApiParams } from "@shared/api-constants";
import type { AboutTeamMessage, MediaAsset } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Save, Trash2, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { StandardMediaSelectionDialog } from "@/components/admin/shared/StandardMediaSelectionDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createMediaQueryKey } from '@/lib/media-query-keys';
import { apiRequest, getQueryClient } from "@/lib/queryClient";

export function AboutTeamMessageTab() {
  const { toast } = useToast();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaAsset | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [formData, setFormData] = useState<Partial<AboutTeamMessage>>({
    title: "",
    message: "",
    signature: "",
    imageId: undefined,
    isActive: true
  });

  const { data: messageData, isLoading } = useQuery<AboutTeamMessage>({
    queryKey: ['/api/about-team-message'],
  });

  const { data: mediaResponse } = useQuery<{ success: boolean; data: { data: MediaAsset[] } }>({
    queryKey: createMediaQueryKey.recent(50),
    queryFn: async () => {
      // Only fetch 50 recent media assets instead of 1000+
      const response = await fetch(`/api/media?${buildMediaApiParams(ADMIN_MEDIA_QUERIES.RECENT_ADMIN)}`);
      if (!response.ok) throw new Error('Failed to fetch media');
      return response.json();
    },
  });

  const mediaAssets = mediaResponse?.data?.data || [];

  useEffect(() => {
    // Only sync server data if user hasn't made unsaved changes
    if (!isDirty && messageData) {
      setFormData(messageData);
      // Auto-select media from server data
      if (messageData.imageId) {
        const media = mediaAssets.find((m: MediaAsset) => m.id === messageData.imageId);
        if (media) {
          setSelectedMedia(media);
        } else {
          // If not in cache, fetch by ID
          fetch(`/api/media/${messageData.imageId}`)
            .then(res => res.ok ? res.json() : null)
            .then(data => {
              if (data?.success && data?.data) {
                setSelectedMedia(data.data);
              }
            })
            .catch(() => setSelectedMedia(null));
        }
      }
    }
  }, [messageData, mediaAssets, isDirty]);

  // Warn user before leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<AboutTeamMessage>) => {
      return apiRequest('/api/about-team-message', { method: 'PATCH', body: data });
    },
    onSuccess: () => {
      // Invalidate both individual and batch cache for sync
      getQueryClient().invalidateQueries({ queryKey: ['/api/about-team-message'] });
      getQueryClient().invalidateQueries({ queryKey: ['/api/about-batch'] });
      setIsDirty(false);
      toast({
        title: "Success",
        description: "Team message updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update team message",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleRemoveMedia = () => {
    setSelectedMedia(null);
    setFormData({ ...formData, imageId: undefined });
    setIsDirty(true);
  };

  if (isLoading) {
    return <div>Loading...</div>;
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
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title || ""}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value });
                setIsDirty(true);
              }}
              placeholder="A Message from Our Team"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={formData.message || ""}
              onChange={(e) => {
                setFormData({ ...formData, message: e.target.value });
                setIsDirty(true);
              }}
              placeholder="We are committed to delivering excellence in every thread..."
              rows={8}
              className="resize-none"
            />
            <p className="text-sm text-gray-500">
              Write a compelling message that showcases your company's values and commitment
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="signature">Signature</Label>
            <Input
              id="signature"
              value={formData.signature || ""}
              onChange={(e) => {
                setFormData({ ...formData, signature: e.target.value });
                setIsDirty(true);
              }}
              placeholder="John Doe, CEO"
            />
          </div>

          <div className="space-y-2">
            <Label>Team/Signature Image (Optional)</Label>
            <div className="flex items-center gap-4">
              {selectedMedia ? (
                <div className="relative">
                  <img
                    src={selectedMedia.id && selectedMedia.id < 1000000000000 ? `/api/media/${selectedMedia.id}/content` : undefined}
                    alt="Team"
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute -top-2 -right-2"
                    onClick={handleRemoveMedia}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="w-32 h-32 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <Upload className="h-6 w-6 text-gray-400" />
                </div>
              )}
              <Button onClick={() => setIsPickerOpen(true)} variant="outline">
                Select Image
              </Button>
            </div>
            <p className="text-sm text-gray-500">
              Add a photo of your team, CEO, or company leadership
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>
            See how your message will appear on the About page
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
            <div className="max-w-3xl mx-auto">
              {formData.title && (
                <h3 className="text-2xl font-bold mb-4">{formData.title}</h3>
              )}

              <div className="flex items-start gap-6">
                {selectedMedia && (
                  <img
                    src={selectedMedia.id && selectedMedia.id < 1000000000000 ? `/api/media/${selectedMedia.id}/content` : undefined}
                    alt="Team"
                    className="w-24 rounded-lg object-contain shrink-0"
                  />
                )}

                <div className="flex-1">
                  {formData.message ? (
                    <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap mb-4">
                      {formData.message}
                    </p>
                  ) : (
                    <p className="text-gray-400 italic mb-4">
                      Your message will appear here...
                    </p>
                  )}

                  {formData.signature && (
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      — {formData.signature}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <StandardMediaSelectionDialog
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={(asset) => {
          const selectedAsset = Array.isArray(asset) ? asset[0] : asset;
          if (selectedAsset) {
            setSelectedMedia(selectedAsset);
            setFormData({ ...formData, imageId: selectedAsset.id });
            setIsDirty(true);
          }
        }}
        title="Select Team Message Image"
        mediaPickerTarget="team-message-image"
        selectionMode="single"
      />
    </div>
  );
}