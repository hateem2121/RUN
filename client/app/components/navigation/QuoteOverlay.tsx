import { InquiryDrawer } from "@/components/inquiry/InquiryDrawer";
import { useHydratedStore } from "@/lib/useHydratedStore";
import { useQuoteStore } from "@/stores/useQuoteStore";

export function QuoteOverlay() {
  // SSR-safe: Returns undefined until hydrated to prevent mismatch with localStorage state
  const items = useHydratedStore(useQuoteStore, (state) => state.items);
  const isDrawerOpen = useHydratedStore(useQuoteStore, (state) => state.isDrawerOpen);
  const openDrawer = useQuoteStore((state) => state.openDrawer);
  const closeDrawer = useQuoteStore((state) => state.closeDrawer);

  // Don't render until hydrated to ensure SSR/client parity
  if (items === undefined) {
    return null;
  }

  // biome-ignore lint/suspicious/noExplicitAny: Store items typing
  const count = (items as any[])?.length ?? 0;

  if (count === 0 && !isDrawerOpen) {
    return null;
  }

  return (
    <>
      {/* Floating Action Button */}
      <button
        type="button"
        onClick={openDrawer}
        className="group center-flex fixed right-6 bottom-6 z-dock rounded-full bg-blue-600 p-4 text-white shadow-2xl transition-transform hover:scale-105 hover:bg-blue-700 active:scale-95"
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
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <span className="absolute -top-3 -right-3 flex h-5 w-5 items-center justify-center rounded-full border-2 border-blue-600 bg-red-500 font-bold text-white text-xs">
            {count}
          </span>
        </div>
      </button>

      {/* Drawer */}
      <InquiryDrawer isOpen={!!isDrawerOpen} onClose={closeDrawer} />
    </>
  );
}
