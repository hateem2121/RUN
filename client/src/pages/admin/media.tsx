// React import handled by JSX transform
import MediaLibraryContainerEnhanced from "@/components/admin/media-library/MediaLibraryContainerEnhanced";
import { MediaLibraryEnhancedProvider } from "@/components/admin/media-library/MediaLibraryContextEnhanced";

export default function AdminMediaPage() {
  return (
    <div className="admin-media-page h-screen overflow-hidden bg-background">
      <MediaLibraryEnhancedProvider>
        <MediaLibraryContainerEnhanced />
      </MediaLibraryEnhancedProvider>
    </div>
  );
}
