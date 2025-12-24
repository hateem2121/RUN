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

// MOCK HEADER: Replicates the Z-Index structure of FloatingDockHeader
// But without any heavy dependencies or data fetching.
// Structure from FloatingDockHeader:
// <header className="relative z-dock">
//   <div className="fixed top-4 left-4 z-modal">...Logo...</div>
// </header>
function MockHeader() {
	return (
		<header
			className="relative z-dock h-16 w-full bg-white/50 border-b border-black/10"
			data-testid="mock-header"
		>
			<div
				className="fixed top-4 left-4 z-modal bg-white p-2 border border-black"
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
			<main className="p-20 relative z-0">
				<h1 className="text-2xl font-bold mb-4">Z-Index Interaction Proof</h1>

				{/* Hydration Indicator */}
				<div
					data-testid="hydration-status"
					className="mb-4 p-2 bg-green-100 border border-green-500 inline-block"
				>
					{hydrated ? "HYDRATED" : "LOADING"}
				</div>

				{/* 3. Overlay Layer (Should be z-modal or higher and cover Header) */}
				<AlertDialog>
					<AlertDialogTrigger asChild>
						<button
							className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
							data-testid="open-dialog-btn"
						>
							Open Overlay Dialog
						</button>
					</AlertDialogTrigger>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Z-Index Proof Modal</AlertDialogTitle>
							<AlertDialogDescription>
								This modal should appear ABOVE the Mock Header. The backdrop
								should cover the Header.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<AlertDialogAction>Confirm</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>

				<div className="mt-8 text-sm text-gray-500">
					<p>Test Scenario:</p>
					<ul className="list-disc pl-5">
						<li>Header is z-dock (50) / Logo z-modal (100)</li>
						<li>Dialog Overlay should be &gt; 100</li>
						<li>
							Clicking Header Logo should be impossible when Dialog is open
						</li>
					</ul>
				</div>
			</main>
		</div>
	);
}
