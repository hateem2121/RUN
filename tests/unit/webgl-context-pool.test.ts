import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useWebGLSlot } from "../../client/app/hooks/use-webgl-slot";
import { WebGLContextPool, webGLContextPool } from "../../client/app/lib/webgl-context-pool";

describe("Task 3D-05: WebGLContextPool & useWebGLSlot", () => {
  beforeEach(() => {
    webGLContextPool.reset();
    webGLContextPool.setMaxActiveContexts(2);
  });

  describe("WebGLContextPool Class", () => {
    it("claims slots up to the maximum active limit (2)", () => {
      const pool = new WebGLContextPool(2);

      expect(pool.claimSlot("model-1")).toBe(true);
      expect(pool.claimSlot("model-2")).toBe(true);
      expect(pool.getActiveSlots()).toEqual(["model-1", "model-2"]);

      // Third claim fails because capacity is full
      expect(pool.claimSlot("model-3")).toBe(false);
      expect(pool.getActiveSlots()).toEqual(["model-1", "model-2"]);
      expect(pool.getWaitingQueue()).toEqual(["model-3"]);
    });

    it("re-claiming an active slot updates its position without using extra capacity", () => {
      const pool = new WebGLContextPool(2);

      pool.claimSlot("model-1");
      pool.claimSlot("model-2");
      expect(pool.claimSlot("model-1")).toBe(true);

      // Order should now have model-1 as most recently used
      expect(pool.getActiveSlots()).toEqual(["model-2", "model-1"]);
    });

    it("evicts least recently used slot when evictLru is true", () => {
      const pool = new WebGLContextPool(2);
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      pool.subscribe("model-1", listener1);
      pool.subscribe("model-2", listener2);

      pool.claimSlot("model-1");
      pool.claimSlot("model-2");

      // Claim model-3 with evictLru: true -> should evict model-1 (oldest)
      const claimed = pool.claimSlot("model-3", true);
      expect(claimed).toBe(true);
      expect(pool.isSlotActive("model-1")).toBe(false);
      expect(pool.isSlotActive("model-2")).toBe(true);
      expect(pool.isSlotActive("model-3")).toBe(true);
      expect(listener1).toHaveBeenCalledWith(false);
    });

    it("releases slot and automatically promotes the next waiting element", () => {
      const pool = new WebGLContextPool(2);
      const listener3 = vi.fn();

      pool.claimSlot("model-1");
      pool.claimSlot("model-2");

      pool.subscribe("model-3", listener3);
      pool.claimSlot("model-3"); // queued

      expect(pool.isSlotActive("model-3")).toBe(false);
      expect(pool.getWaitingQueue()).toContain("model-3");

      // Release model-1 -> model-3 should be promoted
      pool.releaseSlot("model-1");

      expect(pool.isSlotActive("model-1")).toBe(false);
      expect(pool.isSlotActive("model-3")).toBe(true);
      expect(listener3).toHaveBeenCalledWith(true);
      expect(pool.getWaitingQueue()).not.toContain("model-3");
    });

    it("unsubscribing removes element and frees slot", () => {
      const pool = new WebGLContextPool(2);
      const unsub = pool.subscribe("model-1", vi.fn());

      pool.claimSlot("model-1");
      expect(pool.isSlotActive("model-1")).toBe(true);

      unsub();
      expect(pool.isSlotActive("model-1")).toBe(false);
    });
  });

  describe("useWebGLSlot React Hook", () => {
    it("allocates slot when intersecting and capacity is available", () => {
      const { result } = renderHook(() => useWebGLSlot("model-a", true));
      expect(result.current.canRender3D).toBe(true);
    });

    it("does not allocate slot when not intersecting", () => {
      const { result } = renderHook(() => useWebGLSlot("model-b", false));
      expect(result.current.canRender3D).toBe(false);
    });

    it("transitions state when isIntersecting toggles", () => {
      let isIntersecting = false;
      const { result, rerender } = renderHook(() => useWebGLSlot("model-c", isIntersecting));

      expect(result.current.canRender3D).toBe(false);

      // Scrolled into view
      isIntersecting = true;
      rerender();
      expect(result.current.canRender3D).toBe(true);

      // Scrolled out of view
      isIntersecting = false;
      rerender();
      expect(result.current.canRender3D).toBe(false);
      expect(webGLContextPool.isSlotActive("model-c")).toBe(false);
    });

    it("queues third element and grants slot when one of the first two unmounts", () => {
      // Mount 2 active elements
      const hook1 = renderHook(() => useWebGLSlot("slot-1", true));
      const hook2 = renderHook(() => useWebGLSlot("slot-2", true));

      expect(hook1.result.current.canRender3D).toBe(true);
      expect(hook2.result.current.canRender3D).toBe(true);

      // Mount 3rd element -> should be queued (canRender3D: false)
      const hook3 = renderHook(() => useWebGLSlot("slot-3", true));
      expect(hook3.result.current.canRender3D).toBe(false);

      // Unmount hook1 -> slot freed, hook3 should now receive canRender3D: true
      act(() => {
        hook1.unmount();
      });

      expect(hook3.result.current.canRender3D).toBe(true);
      expect(hook2.result.current.canRender3D).toBe(true);
    });
  });
});
