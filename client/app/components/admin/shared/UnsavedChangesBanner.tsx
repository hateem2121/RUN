import { AlertTriangle, Save } from "lucide-react";

interface UnsavedChangesBannerProps {
  isVisible: boolean;
  onSave: () => void;
  onDiscard: () => void;
  isSaving?: boolean;
}

/**
 * Sticky banner that appears when there are unsaved changes, matching Stitch screen #4.
 */
export function UnsavedChangesBanner({
  isVisible,
  onSave,
  onDiscard,
  isSaving = false,
}: UnsavedChangesBannerProps) {
  if (!isVisible) return null;

  return (
    <header
      className="sticky top-0 z-[60] w-full bg-[#1A1610] border-b border-[#D4A853]/30 px-6 py-3 flex items-center justify-between shadow-lg animate-in slide-in-from-top duration-300"
      data-purpose="unsaved-changes-banner"
    >
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-[#D4A853]" />
        <span className="text-sm font-medium text-[#D4A853] tracking-tight">
          You have unsaved changes
        </span>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={onDiscard}
          className="px-4 py-1.5 text-sm font-medium text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 rounded-md transition-all duration-200"
        >
          Discard Changes
        </button>
        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-all duration-200 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
        >
          {isSaving ? (
            "Saving..."
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </header>
  );
}
