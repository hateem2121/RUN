// Check for z-index values
const checkZIndex = () => {
	// Check Dialog overlay
	const dialogOverlay = document.querySelector("[data-radix-dialog-overlay]");
	if (dialogOverlay) {
		const overlayZIndex = window.getComputedStyle(dialogOverlay).zIndex;
	}

	// Check Dialog content
	const dialogContent = document.querySelector("[data-radix-dialog-content]");
	if (dialogContent) {
		const contentZIndex = window.getComputedStyle(dialogContent).zIndex;
	}

	// Check Select content when open
	const selectContent = document.querySelector("[data-radix-select-content]");
	if (selectContent) {
		const selectZIndex = window.getComputedStyle(selectContent).zIndex;
	}
};

// Check overflow styles
const checkOverflow = () => {
	const dialogContent = document.querySelector("[data-radix-dialog-content]");
	if (dialogContent) {
		const overflow = window.getComputedStyle(dialogContent).overflow;

		// Check inner div
		const innerDiv = dialogContent.querySelector("div");
		if (innerDiv) {
			const innerOverflow = window.getComputedStyle(innerDiv).overflow;
		}
	}
};

// Test portal rendering
const checkPortals = () => {
	const portals = document.querySelectorAll("[data-radix-portal]");

	portals.forEach((portal, index) => {});
};

// Run tests
checkZIndex();
checkOverflow();
checkPortals();
