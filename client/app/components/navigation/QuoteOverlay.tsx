import { InquiryDrawer } from "@/components/inquiry/InquiryDrawer";
import { useHydratedStore } from "@/lib/useHydratedStore";
import { type QuoteItem, useQuoteStore } from "@/stores/useQuoteStore";

export function QuoteOverlay() {
  // SSR-safe: Returns undefined until hydrated to prevent mismatch with localStorage state
  const items = useHydratedStore(useQuoteStore, (state) => state.items) as QuoteItem[] | undefined;
  const isDrawerOpen = useHydratedStore(useQuoteStore, (state) => state.isDrawerOpen);
  const openDrawer = useQuoteStore((state) => state.openDrawer);
  const closeDrawer = useQuoteStore((state) => state.closeDrawer);

  // Don't render until hydrated to ensure SSR/client parity
  if (items === undefined) {
    return null;
  }

  const count = items?.length ?? 0;

  if (count === 0 && !isDrawerOpen) {
    return null;
  }

  return (
    <>
      {/* Floating Action Button */}
      <button
        type="button"
        onClick={openDrawer}
        className="group center-flex fixed right-6 bottom-6 z-dock rounded-full bg-primary p-4 text-primary-foreground shadow-2xl transition-transform hover:scale-105 hover:bg-primary/90 active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <div className="relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <title>Inquiry Quote Icon</title>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <span className="absolute -top-3 -right-3 flex h-5 w-5 items-center justify-center rounded-full border-2 border-primary bg-destructive font-bold text-destructive-foreground text-xs">
            {count}
          </span>
        </div>
      </button>

      {/* Drawer */}
      <InquiryDrawer isOpen={!!isDrawerOpen} onClose={closeDrawer} />
    </>
  );
}
