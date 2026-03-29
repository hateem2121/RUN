import { AlertTriangle, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  itemName: string;
  isPermanent?: boolean;
}

export function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  isPermanent = false,
}: DeleteConfirmDialogProps) {
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Reset state when dialong opens/closes
  useEffect(() => {
    if (!isOpen) {
      setConfirmText("");
      setIsDeleting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const canConfirm = !isPermanent || confirmText === "DELETE";

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-[440px] bg-[#121212]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full text-white/40 hover:text-white transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon Container */}
        <div
          className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center mb-6 shadow-lg",
            isPermanent ? "bg-red-500 shadow-red-500/20" : "bg-red-500/10",
          )}
        >
          {isPermanent ? (
            <AlertTriangle className="w-8 h-8 text-white" />
          ) : (
            <Trash2 className="w-8 h-8 text-red-500" />
          )}
        </div>

        <h2 className="text-xl font-bold mb-3 text-white">{title}</h2>
        <p className="text-[#68869A] mb-6 leading-relaxed">
          {description} <span className="text-white font-medium">{itemName}</span>
        </p>

        {isPermanent && (
          <div className="w-full mb-6">
            <div className="w-full bg-red-500/5 border border-red-500/20 rounded-lg p-3 mb-4">
              <p className="text-red-500 text-sm font-medium flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 mr-2" />
                This action is permanent and cannot be undone.
              </p>
            </div>

            <div className="text-left">
              <label
                htmlFor="confirm-delete"
                className="block text-[10px] font-bold text-[#68869A] mb-2 uppercase tracking-widest"
              >
                Type DELETE to confirm
              </label>
              <input
                id="confirm-delete"
                type="text"
                autoFocus
                placeholder="DELETE"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/20 focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-all duration-200 outline-none"
              />
            </div>
          </div>
        )}

        <div className="flex flex-col w-full gap-3">
          <button
            disabled={!canConfirm || isDeleting}
            onClick={handleConfirm}
            className={cn(
              "w-full py-3 px-4 font-semibold rounded-lg transition-all duration-200",
              canConfirm && !isDeleting
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-red-500/20 text-white/20 cursor-not-allowed",
            )}
          >
            {isDeleting ? "Deleting..." : isPermanent ? "Permanently Delete" : "Delete"}
          </button>

          <button
            onClick={onClose}
            className="w-full py-3 px-4 bg-transparent border border-white/10 hover:bg-white/5 text-white font-semibold rounded-lg transition-all duration-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
