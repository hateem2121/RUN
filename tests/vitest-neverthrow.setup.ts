import { expect } from "vitest";

expect.extend({
  toBeOk(received) {
    const isResult = received && typeof received === "object" && "isOk" in received;
    if (!isResult) {
      return {
        pass: false,
        message: () => `expected ${received} to be a neverthrow Result`,
      };
    }
    const pass = received.isOk();
    if (pass) {
      return {
        pass: true,
        message: () => `expected Result not to be Ok`,
      };
    } else {
      return {
        pass: false,
        message: () => `expected Result to be Ok, but got Err(${received.error})`,
      };
    }
  },
  toBeErr(received) {
    const isResult = received && typeof received === "object" && "isErr" in received;
    if (!isResult) {
      return {
        pass: false,
        message: () => `expected ${received} to be a neverthrow Result`,
      };
    }
    const pass = received.isErr();
    if (pass) {
      return {
        pass: true,
        message: () => `expected Result not to be Err`,
      };
    } else {
      return {
        pass: false,
        message: () => `expected Result to be Err, but got Ok(${received.value})`,
      };
    }
  },
});
