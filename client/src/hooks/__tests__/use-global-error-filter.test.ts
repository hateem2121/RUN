import { describe, expect, it } from "vitest";
import { isAbortError, isExtensionNoise } from "../use-global-error-filter";

describe("Global Error Filtering Logic", () => {
	it("should identify standard AbortError", () => {
		const err = new Error("Aborted");
		err.name = "AbortError";
		expect(isAbortError(err)).toBe(true);
	});

	it("should identify DOMException AbortError", () => {
		const err = new DOMException("The user aborted a request.", "AbortError");
		expect(isAbortError(err)).toBe(true);
	});

	it("should identify string-based aborts", () => {
		expect(isAbortError("The user aborted a request")).toBe(true);
	});

	it("should identify extension noise", () => {
		const err = new Error("Some extension error");
		err.stack = "Error at chrome-extension://abcdef/content.js:1:1";
		expect(isExtensionNoise(err)).toBe(true);
	});

	it("should NOT flag legitimate errors", () => {
		const err = new Error("API Failed");
		expect(isAbortError(err)).toBe(false);
		expect(isExtensionNoise(err)).toBe(false);
	});
});
