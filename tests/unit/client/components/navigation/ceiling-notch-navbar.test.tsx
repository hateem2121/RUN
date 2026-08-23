import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
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
  it("renders desktop navbar with brand, links, theme toggle, and RFQ button", async () => {
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
    expect(screen.getByRole("link", { name: /sustainability/i })).toBeDefined();
    expect(screen.getByRole("link", { name: /technology/i })).toBeDefined();
    expect(screen.getByRole("link", { name: /about/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /request quote/i })).toBeDefined();
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

  it("does not render when on /admin routes", async () => {
    const { container } = render(
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
});
