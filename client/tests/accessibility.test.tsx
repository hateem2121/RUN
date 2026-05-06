import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { AdminLayout } from "@/components/admin/admin-layout";
import { AdminProvider } from "@/context/AdminContext";

// Create a test query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// Mock matchMedia for Radix UI components
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

// Mock CSS.supports for useViewportAwarePositioning hook
if (typeof window !== "undefined") {
  (window as any).CSS = {
    supports: vi.fn().mockReturnValue(true),
  };
}

describe("Admin Console Accessibility", () => {
  it("AdminLayout should have no basic accessibility violations", async () => {
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AdminProvider>
            <AdminLayout>
              <div id="test-content">
                <h1>Test Dashboard</h1>
                <p>Welcome to the admin console.</p>
              </div>
            </AdminLayout>
          </AdminProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    // Run axe on the container
    const results = await axe(container);

    // Verify no violations (using the matcher we added to setup.ts)
    expect(results).toHaveNoViolations();
  });

  it("Skip to main content link should be present", () => {
    const { getByText } = render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AdminProvider>
            <AdminLayout>
              <div>Content</div>
            </AdminLayout>
          </AdminProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const skipLink = getByText(/Skip to main content/i);
    expect(skipLink).toBeInTheDocument();
    expect(skipLink.getAttribute("href")).toBe("#main-content");
  });
});
