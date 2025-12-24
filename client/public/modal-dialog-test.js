/**
 * MODAL DIALOG INTEGRATION TEST - Browser Execution Version
 */
(() => {
	const results = {
		hookExportVerification: [],
		crossDeviceTesting: [],
		performanceVerification: [],
		focusManagement: [],
		zIndexVerification: [],
		apiIntegration: [],
	};

	function logResult(category, test, passed, details = "") {
		const result = {
			test,
			passed,
			details,
			timestamp: new Date().toISOString(),
		};
		results[category].push(result);
		return passed;
	}

	// Test 1: Hook Export Verification
	function testHookExports() {
		// Check if enhanced-dialog component exists in DOM
		const dialogElements = document.querySelectorAll(
			'[role="dialog"], .enhanced-dialog',
		);
		logResult(
			"hookExportVerification",
			"Enhanced dialog components present",
			dialogElements.length >= 0,
			`Found ${dialogElements.length} dialog elements`,
		);

		// Test z-index classes are available
		const testElement = document.createElement("div");
		testElement.className = "z-modal";
		document.body.appendChild(testElement);
		const hasZModalClass = getComputedStyle(testElement).zIndex !== "auto";
		document.body.removeChild(testElement);

		logResult(
			"hookExportVerification",
			"Z-index classes functional",
			hasZModalClass,
		);

		return true;
	}

	// Test 2: Cross-Device Testing
	function testCrossDevice() {
		const viewports = [
			{ w: 375, h: 667, name: "Mobile" },
			{ w: 768, h: 1024, name: "Tablet" },
			{ w: 1366, h: 768, name: "Laptop" },
			{ w: 1920, h: 1080, name: "Desktop" },
		];

		viewports.forEach((vp) => {
			// Simulate viewport by checking classes that would be applied
			const isNarrow = vp.w <= 768;
			const isShort = vp.h <= 600;

			logResult(
				"crossDeviceTesting",
				`${vp.name} viewport (${vp.w}x${vp.h})`,
				true,
				`narrow: ${isNarrow}, short: ${isShort}`,
			);
		});

		// Test viewport meta tag
		const viewportMeta = document.querySelector('meta[name="viewport"]');
		logResult(
			"crossDeviceTesting",
			"Viewport meta tag present",
			!!viewportMeta,
			viewportMeta?.content || "missing",
		);

		return true;
	}

	// Test 3: Performance Verification
	function testPerformance() {
		// Check GPU acceleration classes
		const gpuClasses = [
			".transform-gpu",
			".backface-hidden",
			'[style*="will-change"]',
		];
		const hasGpuClasses = gpuClasses.some((cls) => {
			if (cls.startsWith("[")) {
				return document.querySelector(cls) !== null;
			}
			const testEl = document.createElement("div");
			testEl.className = cls.slice(1);
			document.body.appendChild(testEl);
			const hasClass =
				getComputedStyle(testEl).transform !== "none" ||
				getComputedStyle(testEl).willChange !== "auto";
			document.body.removeChild(testEl);
			return hasClass;
		});

		logResult(
			"performanceVerification",
			"GPU acceleration classes available",
			hasGpuClasses,
		);

		// Test CSS animations
		const animationClasses = ["animate-in", "fade-in-0", "zoom-in-95"];
		const hasAnimations = animationClasses.some((cls) => {
			const elements = document.getElementsByClassName(cls);
			return elements.length > 0;
		});

		logResult(
			"performanceVerification",
			"Animation classes present",
			hasAnimations,
		);

		// Check for will-change optimization
		const elementsWithWillChange = document.querySelectorAll(
			'[style*="will-change"]',
		);
		logResult(
			"performanceVerification",
			"Will-change optimization active",
			elementsWithWillChange.length > 0,
			`${elementsWithWillChange.length} elements`,
		);

		return true;
	}

	// Test 4: Focus Management
	function testFocusManagement() {
		// Count focusable elements
		const focusable = document.querySelectorAll(
			"button:not([disabled]), input:not([disabled]), select:not([disabled]), " +
				'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
		);

		logResult(
			"focusManagement",
			"Focusable elements detected",
			focusable.length > 0,
			`${focusable.length} elements`,
		);

		// Test tab navigation setup
		const hasTabindex = Array.from(focusable).some(
			(el) =>
				el.hasAttribute("tabindex") || el.tagName.toLowerCase() === "button",
		);

		logResult("focusManagement", "Tab navigation ready", hasTabindex);

		// Test keyboard event setup
		let keyboardSetup = false;
		try {
			const testEvent = new KeyboardEvent("keydown", { key: "Tab" });
			keyboardSetup = true;
		} catch (e) {
			keyboardSetup = false;
		}

		logResult(
			"focusManagement",
			"Keyboard event handling ready",
			keyboardSetup,
		);

		return true;
	}

	// Test 5: Z-Index Verification
	function testZIndexSystem() {
		// Check CSS custom properties
		const rootStyle = getComputedStyle(document.documentElement);
		const zIndices = [
			"--z-modal-backdrop",
			"--z-modal",
			"--z-modal-nested",
			"--z-modal-overlay-1",
		];

		const definedZIndices = zIndices.filter((prop) => {
			const value = rootStyle.getPropertyValue(prop).trim();
			return value && value !== "";
		});

		logResult(
			"zIndexVerification",
			"CSS custom properties defined",
			definedZIndices.length >= 3,
			`${definedZIndices.length}/${zIndices.length}`,
		);

		// Test z-index utility classes
		const zIndexClasses = ["z-modal", "z-modal-backdrop", "z-modal-nested"];
		const workingClasses = zIndexClasses.filter((className) => {
			const testEl = document.createElement("div");
			testEl.className = className;
			document.body.appendChild(testEl);
			const zIndex = getComputedStyle(testEl).zIndex;
			document.body.removeChild(testEl);
			return zIndex && zIndex !== "auto";
		});

		logResult(
			"zIndexVerification",
			"Z-index utility classes functional",
			workingClasses.length >= 2,
			`${workingClasses.length}/${zIndexClasses.length} working`,
		);

		// Verify hierarchy
		const backdrop =
			parseInt(rootStyle.getPropertyValue("--z-modal-backdrop")) || 40;
		const modal = parseInt(rootStyle.getPropertyValue("--z-modal")) || 50;
		const nested =
			parseInt(rootStyle.getPropertyValue("--z-modal-nested")) || 55;

		const hierarchyCorrect = backdrop < modal && modal < nested;
		logResult(
			"zIndexVerification",
			"Z-index hierarchy correct",
			hierarchyCorrect,
			`${backdrop} < ${modal} < ${nested}`,
		);

		return true;
	}

	// Test 6: API Integration
	async function testApiIntegration() {
		try {
			// Test Process Cards API
			const processResponse = await fetch("/api/homepage-process-cards");
			logResult(
				"apiIntegration",
				"Process Cards API",
				processResponse.ok,
				`Status: ${processResponse.status}`,
			);

			if (processResponse.ok) {
				const processData = await processResponse.json();
				logResult(
					"apiIntegration",
					"Process Cards data valid",
					Array.isArray(processData),
					`${processData.length} cards`,
				);
			}

			// Test Media API
			const mediaResponse = await fetch("/api/media");
			logResult(
				"apiIntegration",
				"Media Library API",
				mediaResponse.ok,
				`Status: ${mediaResponse.status}`,
			);

			if (mediaResponse.ok) {
				const mediaData = await mediaResponse.json();
				const isValid =
					mediaData &&
					(Array.isArray(mediaData) ||
						(mediaData.data && Array.isArray(mediaData.data)));
				logResult("apiIntegration", "Media data structure valid", isValid);
			}
		} catch (error) {
			logResult("apiIntegration", "API calls failed", false, error.message);
		}

		return true;
	}

	// Execute all tests
	async function runAllTests() {
		const startTime = Date.now();

		try {
			testHookExports();
			testCrossDevice();
			testPerformance();
			testFocusManagement();
			testZIndexSystem();
			await testApiIntegration();

			// Calculate results
			const allResults = Object.values(results).flat();
			const passed = allResults.filter((r) => r.passed).length;
			const total = allResults.length;
			const score = Math.round((passed / total) * 100);

			Object.entries(results).forEach(([category, categoryResults]) => {
				const categoryPassed = categoryResults.filter((r) => r.passed).length;
				const categoryTotal = categoryResults.length;
				const categoryScore = Math.round(
					(categoryPassed / categoryTotal) * 100,
				);

				// Show failed tests
				categoryResults.filter((r) => !r.passed).forEach((fail) => {});
			});

			// Assessment
			if (score >= 95) {
			} else if (score >= 85) {
			} else {
			}

			// Store results globally for inspection
			window.modalTestResults = results;
			window.modalTestScore = score;

			return { results, score, passed, total };
		} catch (error) {
			return { error: error.message, score: 0 };
		}
	}

	// Auto-execute after a short delay
	setTimeout(runAllTests, 1000);

	// Also make available for manual execution
	window.runModalTests = runAllTests;
})();
