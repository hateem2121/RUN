import { cleanup } from "@testing-library/react";
import { afterEach, expect } from "vitest";
import "@testing-library/jest-dom/vitest";
import * as axeMatchers from "vitest-axe/matchers";
import "vitest-axe/extend-expect";

expect.extend(axeMatchers);

// Runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});
