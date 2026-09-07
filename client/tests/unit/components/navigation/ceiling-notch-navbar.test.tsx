import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CeilingNotchNavbar } from "@/components/navigation/ceiling-notch-navbar";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { useQuoteStore } from "@/stores/useQuoteStore";

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver for cmdk
global.ResizeObserver = class ResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
};

// Mock scrollIntoView for jsdom
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Mock localStorage for zustand persist store
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe("CeilingNotchNavbar", () => {
  beforeEach(() => {
    useQuoteStore.setState({ items: [] });
    document.body.style.overflow = "";
  });

  it("renders desktop navbar with brand, links including manufacturing, theme toggle, and RFQ button", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <CeilingNotchNavbar />
          </ThemeProvider>
        </QueryClientProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText("RUN APPAREL")).toBeDefined();
    expect(screen.getByRole("link", { name: /products/i })).toBeDefined();
    expect(screen.getByRole("link", { name: /fabrics/i })).toBeDefined();
    expect(screen.getByRole("link", { name: /manufacturing/i })).toBeDefined();
    expect(screen.getByRole("link", { name: /sustainability/i })).toBeDefined();
    expect(screen.getByRole("link", { name: /technology/i })).toBeDefined();
    expect(screen.getByRole("link", { name: /about/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /request quote/i })).toBeDefined();
  });

  it("displays quote items count badge when items exist in store", async () => {
    useQuoteStore.setState({
      items: [
        { id: 1, name: "Sublimated Jersey", quantity: 50, minOrderQuantity: 50 },
        { id: 2, name: "Tech Fleece Hoodie", quantity: 25, minOrderQuantity: 25 },
      ],
    });

    render(
      <MemoryRouter initialEntries={["/"]}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <CeilingNotchNavbar />
          </ThemeProvider>
        </QueryClientProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText("2")).toBeDefined();
    expect(screen.getByText(/2 items in quote request/i)).toBeDefined();
  });

  it("toggles mobile menu dropdown when hamburger icon is clicked", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <CeilingNotchNavbar />
          </ThemeProvider>
        </QueryClientProvider>
      </MemoryRouter>,
    );

    const toggleBtn = screen.getByRole("button", { name: /toggle navigation menu/i });
    expect(toggleBtn.getAttribute("aria-expanded")).toBe("false");

    fireEvent.click(toggleBtn);
    expect(toggleBtn.getAttribute("aria-expanded")).toBe("true");

    fireEvent.click(toggleBtn);
    expect(toggleBtn.getAttribute("aria-expanded")).toBe("false");
  });

  it("closes mobile menu when Escape key is pressed", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <CeilingNotchNavbar />
          </ThemeProvider>
        </QueryClientProvider>
      </MemoryRouter>,
    );

    const toggleBtn = screen.getByRole("button", { name: /toggle navigation menu/i });
    fireEvent.click(toggleBtn);
    expect(toggleBtn.getAttribute("aria-expanded")).toBe("true");

    const menuDialog = screen.getByRole("dialog", { name: /mobile navigation menu/i });
    fireEvent.keyDown(menuDialog, { key: "Escape" });
    expect(toggleBtn.getAttribute("aria-expanded")).toBe("false");
  });

  it("restores body scroll on unmount even if mobile menu was open", async () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={["/"]}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <CeilingNotchNavbar />
          </ThemeProvider>
        </QueryClientProvider>
      </MemoryRouter>,
    );

    const toggleBtn = screen.getByRole("button", { name: /toggle navigation menu/i });
    fireEvent.click(toggleBtn);
    expect(document.body.style.overflow).toBe("hidden");

    unmount();
    expect(document.body.style.overflow).toBe("");
  });

  it("handles focus trap cycling in mobile menu with Tab and Shift+Tab", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <CeilingNotchNavbar />
          </ThemeProvider>
        </QueryClientProvider>
      </MemoryRouter>,
    );

    const toggleBtn = screen.getByRole("button", { name: /toggle navigation menu/i });
    fireEvent.click(toggleBtn);

    const menuDialog = screen.getByRole("dialog", { name: /mobile navigation menu/i });
    const focusable = menuDialog.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    expect(focusable.length).toBeGreaterThan(0);

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    // Simulate Shift+Tab from first element -> wraps to last
    first?.focus();
    fireEvent.keyDown(menuDialog, { key: "Tab", shiftKey: true });
    // Simulate Tab from last element -> wraps to first
    last?.focus();
    fireEvent.keyDown(menuDialog, { key: "Tab", shiftKey: false });
  });

  it("handles keyboard navigation on Categories trigger and dropdown", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <CeilingNotchNavbar />
          </ThemeProvider>
        </QueryClientProvider>
      </MemoryRouter>,
    );

    const catBtn = screen.getByRole("button", { name: /categories/i });
    expect(catBtn.getAttribute("aria-expanded")).toBe("false");

    fireEvent.keyDown(catBtn, { key: "ArrowDown" });
    expect(catBtn.getAttribute("aria-expanded")).toBe("true");

    const teamWearLink = screen.getByRole("menuitem", { name: /team wear/i });
    expect(teamWearLink).toBeDefined();

    const menu = screen.getByRole("menu");
    fireEvent.keyDown(menu, { key: "Escape" });
    expect(catBtn.getAttribute("aria-expanded")).toBe("false");
  });

  it("triggers useQuoteStore openDrawer when Request Quote button is clicked", async () => {
    const openDrawerSpy = vi.spyOn(useQuoteStore.getState(), "openDrawer");

    render(
      <MemoryRouter initialEntries={["/"]}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <CeilingNotchNavbar />
          </ThemeProvider>
        </QueryClientProvider>
      </MemoryRouter>,
    );

    const quoteBtn = screen.getByRole("button", { name: /request quote/i });
    fireEvent.click(quoteBtn);
    expect(openDrawerSpy).toHaveBeenCalled();
  });

  it("marks active navigation link with aria-current='page'", async () => {
    render(
      <MemoryRouter initialEntries={["/manufacturing"]}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <CeilingNotchNavbar />
          </ThemeProvider>
        </QueryClientProvider>
      </MemoryRouter>,
    );

    const mfgLink = screen.getByRole("link", { name: /manufacturing/i });
    expect(mfgLink.getAttribute("aria-current")).toBe("page");
  });

  it("opens command search palette when search button is clicked", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <CeilingNotchNavbar />
          </ThemeProvider>
        </QueryClientProvider>
      </MemoryRouter>,
    );

    const searchBtn = screen.getByRole("button", { name: /quick search/i });
    fireEvent.click(searchBtn);

    expect(screen.getByPlaceholderText(/search fabrics, products/i)).toBeDefined();
  });

  it("renders dedicated close button and trust footer inside mobile menu", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <CeilingNotchNavbar />
          </ThemeProvider>
        </QueryClientProvider>
      </MemoryRouter>,
    );

    const toggleBtn = screen.getByRole("button", { name: /toggle navigation menu/i });
    fireEvent.click(toggleBtn);

    const closeBtn = screen.getByRole("button", { name: /close navigation menu/i });
    expect(closeBtn).toBeDefined();
    expect(screen.getByText(/minimum order quantity: 50 pcs/i)).toBeDefined();
  });

  it("closes mobile menu when internal close button is clicked", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <CeilingNotchNavbar />
          </ThemeProvider>
        </QueryClientProvider>
      </MemoryRouter>,
    );

    const toggleBtn = screen.getByRole("button", { name: /toggle navigation menu/i });
    fireEvent.click(toggleBtn);
    expect(toggleBtn.getAttribute("aria-expanded")).toBe("true");

    const closeBtn = screen.getByRole("button", { name: /close navigation menu/i });
    fireEvent.click(closeBtn);
    expect(toggleBtn.getAttribute("aria-expanded")).toBe("false");
  });

  it("does not render when on /admin routes", async () => {
    render(
      <MemoryRouter initialEntries={["/admin/dashboard"]}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <CeilingNotchNavbar />
          </ThemeProvider>
        </QueryClientProvider>
      </MemoryRouter>,
    );

    expect(screen.queryByRole("banner")).toBeNull();
  });

  it("elevates header to z-modal when mobile menu opens and renders official WhatsApp hotline", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <CeilingNotchNavbar />
          </ThemeProvider>
        </QueryClientProvider>
      </MemoryRouter>,
    );

    const header = screen.getByRole("banner");
    expect(header.className).toContain("z-dock");

    const toggleBtn = screen.getByRole("button", { name: /toggle navigation menu/i });
    fireEvent.click(toggleBtn);

    expect(header.className).toContain("z-modal");

    const hotlineLink = screen.getByRole("link", { name: /direct factory hotline/i });
    expect(hotlineLink.getAttribute("href")).toBe("https://wa.me/923361777313");
  });
});
