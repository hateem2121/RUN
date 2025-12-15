// Test script to verify dropdown functionality
console.log("Testing dropdown functionality at /admin/products");

// Check for z-index values
const checkZIndex = () => {
  // Check Dialog overlay
  const dialogOverlay = document.querySelector('[data-radix-dialog-overlay]');
  if (dialogOverlay) {
    const overlayZIndex = window.getComputedStyle(dialogOverlay).zIndex;
    console.log("Dialog Overlay z-index:", overlayZIndex);
  }
  
  // Check Dialog content
  const dialogContent = document.querySelector('[data-radix-dialog-content]');
  if (dialogContent) {
    const contentZIndex = window.getComputedStyle(dialogContent).zIndex;
    console.log("Dialog Content z-index:", contentZIndex);
  }
  
  // Check Select content when open
  const selectContent = document.querySelector('[data-radix-select-content]');
  if (selectContent) {
    const selectZIndex = window.getComputedStyle(selectContent).zIndex;
    console.log("Select Content z-index:", selectZIndex);
  }
};

// Check overflow styles
const checkOverflow = () => {
  const dialogContent = document.querySelector('[data-radix-dialog-content]');
  if (dialogContent) {
    const overflow = window.getComputedStyle(dialogContent).overflow;
    console.log("Dialog Content overflow:", overflow);
    
    // Check inner div
    const innerDiv = dialogContent.querySelector('div');
    if (innerDiv) {
      const innerOverflow = window.getComputedStyle(innerDiv).overflow;
      console.log("Inner div overflow:", innerOverflow);
    }
  }
};

// Test portal rendering
const checkPortals = () => {
  const portals = document.querySelectorAll('[data-radix-portal]');
  console.log("Number of portals found:", portals.length);
  
  portals.forEach((portal, index) => {
    console.log(`Portal ${index}:`, portal.tagName, portal.className);
  });
};

// Run tests
checkZIndex();
checkOverflow();
checkPortals();

console.log("Dropdown functionality test complete");
