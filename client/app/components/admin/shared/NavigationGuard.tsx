import { AlertTriangle } from "lucide-react";

interface NavigationGuardProps {
  isOpen: boolean;
  onStay: () => void;
  onDiscard: () => void;
  onSaveAndContinue?: () => void;
}

/**
 * Modal shown when user tries to navigate away with unsaved changes.
 * Based on Stitch screen #4.
 */
export function NavigationGuard({
  isOpen,
  onStay,
  onDiscard,
  onSaveAndContinue,
}: NavigationGuardProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-[440px] bg-[#0A0A0A]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in duration-200">
        {/* Warning Icon */}
        <div className="mb-6 w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-amber-500" />
        </div>

        <h2 className="text-xl font-semibold text-white mb-2 tracking-tight">Unsaved Changes</h2>
        <p className="text-[#68869A] text-sm leading-relaxed mb-8">
          You have unsaved changes that will be lost. Are you sure you want to navigate away from
          this page?
        </p>

        <div className="w-full space-y-3">
          <button
            onClick={onStay}
            className="w-full py-2.5 text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all shadow-[0_4px_12px_rgba(59,130,246,0.15)]"
          >
            Stay on Page
          </button>

          <button
            onClick={onDiscard}
            className="w-full py-2.5 text-sm font-medium text-red-500 border border-red-500/30 hover:bg-red-500/10 rounded-lg transition-all"
          >
            Discard & Leave
          </button>

          {onSaveAndContinue && (
            <button
              onClick={onSaveAndContinue}
              className="w-full py-2.5 text-sm font-medium text-[#68869A] hover:text-white transition-all underline underline-offset-4"
            >
              Save & Continue
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
