import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import type { MediaAsset } from "@shared/schema";

export function useMediaOperations() {
  const { toast } = useToast();

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "URL copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      });
    }
  }, [toast]);

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const getFileTypeFromMime = useCallback((mimeType: string): MediaAsset['type'] => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.includes('gltf') || mimeType.includes('glb') || mimeType.includes('model')) return 'model';
    return 'document';
  }, []);

  return {
    copyToClipboard,
    formatFileSize,
    getFileTypeFromMime,
  };
}