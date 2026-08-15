import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { FloatingDock } from "@/components/ui/floating-dock";

describe("FloatingDock Adversarial Tests", () => {
  const items = [
    { title: "Home", icon: <span data-testid="icon-home">H</span>, href: "/" },
    { title: "Products", icon: <span data-testid="icon-prod">P</span>, href: "/products" },
  ];

  it("captures element reference and correctly cleans up event listeners on unmount even if ref is nullified", () => {
    let removeListenerCalls = 0;
    const origRemove = EventTarget.prototype.removeEventListener;

    vi.spyOn(EventTarget.prototype, "removeEventListener").mockImplementation(function (
      this: EventTarget,
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | EventListenerOptions,
    ) {
      if (type === "mousemove" || type === "mouseleave") {
        removeListenerCalls++;
      }
      return origRemove.call(this, type, listener, options);
    });

    const { container, unmount } = render(
      <MemoryRouter>
        <FloatingDock items={items} iconSize="medium" />
      </MemoryRouter>,
    );

    const navElement = container.querySelector("nav");
    expect(navElement).not.toBeNull();

    // Unmount to trigger cleanup
    unmount();

    // Verify removeEventListener was called for mousemove and mouseleave
    expect(removeListenerCalls).toBeGreaterThanOrEqual(2);
    vi.restoreAllMocks();
  });

  it("handles mousemove and mouseleave events without throwing when elements exist", () => {
    const { container, unmount } = render(
      <MemoryRouter>
        <FloatingDock items={items} iconSize="medium" />
      </MemoryRouter>,
    );

    const navElement = container.querySelector("nav");
    expect(navElement).not.toBeNull();

    // Trigger mousemove event
    const mouseMoveEvent = new MouseEvent("mousemove", { clientX: 100, clientY: 100 });
    navElement?.dispatchEvent(mouseMoveEvent);

    // Trigger mouseleave event
    const mouseLeaveEvent = new MouseEvent("mouseleave");
    navElement?.dispatchEvent(mouseLeaveEvent);

    expect(() => unmount()).not.toThrow();
  });

  it("cleans up event listeners on unmount after prop rerender", () => {
    let removeListenerCalls = 0;
    const origRemove = EventTarget.prototype.removeEventListener;

    vi.spyOn(EventTarget.prototype, "removeEventListener").mockImplementation(function (
      this: EventTarget,
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | EventListenerOptions,
    ) {
      if (type === "mousemove" || type === "mouseleave") {
        removeListenerCalls++;
      }
      return origRemove.call(this, type, listener, options);
    });

    const { rerender, unmount } = render(
      <MemoryRouter>
        <FloatingDock items={items} iconSize="small" />
      </MemoryRouter>,
    );

    // Rerender with different iconSize
    rerender(
      <MemoryRouter>
        <FloatingDock items={items} iconSize="large" />
      </MemoryRouter>,
    );

    unmount();

    expect(removeListenerCalls).toBeGreaterThanOrEqual(2);
    vi.restoreAllMocks();
  });
});
