import { useEffect, useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Typography } from "@/components/ui/typography";

// MOCK HEADER: Replicates the Z-Index structure of FloatingDockHeader
// But without any heavy dependencies or data fetching.
// Structure from FloatingDockHeader:
// <header className="relative z-dock">
//   <div className="fixed top-4 left-4 z-modal">...Logo...</div>
// </header>
function MockHeader() {
  return (
    <header
      className="relative z-dock h-16 w-full border-black/10 border-b bg-white/50"
      data-testid="mock-header"
    >
      <div
        className="fixed top-4 left-4 z-modal border border-black bg-white p-2"
        data-testid="mock-header-logo"
      >
        <span className="font-bold">RUN APPAREL (MOCK)</span>
      </div>
    </header>
  );
}

export default function E2EOverlayTest() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* 1. Header Layer (z-dock / z-modal) */}
      <MockHeader />

      {/* 2. Main Content */}
      <main className="relative z-base p-20">
        <Typography.H1 className="mb-4 font-bold text-2xl">Z-Index Interaction Proof</Typography.H1>

        {/* Hydration Indicator */}
        <div
          data-testid="hydration-status"
          className="mb-4 inline-block border border-green-500 bg-green-100 p-2"
        >
          {hydrated ? "HYDRATED" : "LOADING"}
        </div>

        {/* 3. Overlay Layer (Should be z-modal or higher and cover Header) */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              className="rounded bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
              data-testid="open-dialog-btn"
            >
              Open Overlay Dialog
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Z-Index Proof Modal</AlertDialogTitle>
              <AlertDialogDescription>
                This modal should appear ABOVE the Mock Header. The backdrop should cover the
                Header.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>Confirm</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="mt-8 text-muted-foreground text-sm">
          <Typography.P>Test Scenario:</Typography.P>
          <ul className="list-disc pl-5">
            <li>Header is z-dock (50) / Logo z-modal (100)</li>
            <li>Dialog Overlay should be &gt; 100</li>
            <li>Clicking Header Logo should be impossible when Dialog is open</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
