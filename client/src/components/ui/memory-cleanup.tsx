import { useEffect } from "react";

export function MemoryCleanup() {
	useEffect(() => {
		const handleMemoryPressure = (event: CustomEvent) => {
			const { usedMB, source } = event.detail;

			// Force garbage collection if available
			if ("gc" in window && typeof window.gc === "function") {
				try {
					window.gc();
				} catch (e) {}
			}

			// Clear large objects from memory
			const clearLargeObjects = () => {
				// Clear any cached 3D models
				const modelViewers = document.querySelectorAll("model-viewer");
				modelViewers.forEach((viewer, index) => {
					if (index > 2) {
						// Keep only first 2 models loaded
						(viewer as any).src = "";
					}
				});

				// Clear large images that aren't visible
				const images = document.querySelectorAll("img");
				images.forEach((img) => {
					const rect = img.getBoundingClientRect();
					const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

					if (!isVisible && img.src.includes("proxy") && img.dataset.size) {
						const sizeBytes = parseInt(img.dataset.size);
						if (sizeBytes > 5 * 1024 * 1024) {
							// Clear images > 5MB
							img.src = "";
						}
					}
				});
			};

			// Delay cleanup to avoid interrupting critical operations
			setTimeout(clearLargeObjects, 1000);
		};

		// Monitor memory usage every 30 seconds
		const memoryMonitor = setInterval(() => {
			if ("memory" in performance && performance.memory) {
				const memory = performance.memory as any;
				const usedMB = memory.usedJSHeapSize / 1024 / 1024;
				// const totalMB = memory.totalJSHeapSize / 1024 / 1024;
				const limitMB = memory.jsHeapSizeLimit / 1024 / 1024;

				// Log memory stats occasionally
				if (usedMB > 300) {
				}

				// Trigger cleanup if memory usage is critical
				if (usedMB > 600) {
					const event = new CustomEvent("memory-pressure", {
						detail: { usedMB, source: "memory-monitor" },
					});
					window.dispatchEvent(event);
				}
			}
		}, 30000);

		window.addEventListener(
			"memory-pressure",
			handleMemoryPressure as EventListener,
		);

		return () => {
			clearInterval(memoryMonitor);
			window.removeEventListener(
				"memory-pressure",
				handleMemoryPressure as EventListener,
			);
		};
	}, []);

	return null;
}
