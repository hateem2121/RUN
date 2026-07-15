import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDebounce } from "../../../../client/app/hooks/use-debounce.js";

describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return the initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("initial", 500));
    expect(result.current).toBe("initial");
  });

  it("should debounce value updates", () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: "first", delay: 500 },
    });

    expect(result.current).toBe("first");

    rerender({ value: "second", delay: 500 });

    // Before timer fires, value should still be "first"
    expect(result.current).toBe("first");

    // Advance timer and flush effects
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBe("second");
  });

  it("should reset the timer on rapid changes", () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: "a", delay: 300 },
    });

    rerender({ value: "b", delay: 300 });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    rerender({ value: "c", delay: 300 });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Still should be "a" — neither timer has fully elapsed
    expect(result.current).toBe("a");

    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Now the last value ("c") should have settled
    expect(result.current).toBe("c");
  });
});
