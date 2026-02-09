import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "@/components/shared/theme-provider";
import FloatingDockHeader from "./floating-dock-header";

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock implementation of hooks and components to isolate test
vi.mock("@/components/ui/theme-toggle", () => ({
  ThemeToggle: () => <div data-testid="theme-toggle" />,
}));

vi.mock("./responsive-navigation", () => ({
  default: () => <div data-testid="responsive-navigation" />,
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe("FloatingDockHeader", () => {
  it("renders content after mounting", async () => {
    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <FloatingDockHeader />
          </ThemeProvider>
        </QueryClientProvider>
      </MemoryRouter>,
    );

    // Wait for mounting
    const header = await screen.findByRole("banner");
    expect(header).toBeTruthy();
    expect(screen.getByText("RUN APPAREL")).toBeTruthy();
    expect(screen.getByTestId("theme-toggle")).toBeTruthy();
    expect(screen.getByTestId("responsive-navigation")).toBeTruthy();
  });

  it("applies correct z-index class", async () => {
    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <FloatingDockHeader />
          </ThemeProvider>
        </QueryClientProvider>
      </MemoryRouter>,
    );

    const header = await screen.findByRole("banner");
    expect(header.classList.contains("z-(--z-index-dock)")).toBe(true);
  });
});
