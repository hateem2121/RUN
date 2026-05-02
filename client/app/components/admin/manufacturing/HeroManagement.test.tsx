import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { HeroManagement } from "./HeroManagement";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as queryClientModule from "@/lib/queryClient";
import * as useToastModule from "@/hooks/use-toast";

// Mock ResizeObserver
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

global.ResizeObserver = MockResizeObserver as any;
window.ResizeObserver = MockResizeObserver as any;

// Mock the modules
vi.mock("@/lib/queryClient", () => ({
  apiRequest: vi.fn(),
  getQueryClient: vi.fn(),
  createMediaQueryKey: {
    single: (id: number) => ["media", id],
  },
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
    dismiss: vi.fn(),
    toasts: [],
  })),
}));

// Mock Lucide icons to avoid rendering issues
vi.mock("lucide-react", () => ({
  Save: () => <div data-testid="save-icon" />,
  RefreshCw: () => <div data-testid="refresh-icon" />,
  Image: () => <div data-testid="image-icon" />,
  Video: () => <div data-testid="video-icon" />,
  ChevronDown: () => <div data-testid="chevron-down" />,
  ChevronUp: () => <div data-testid="chevron-up" />,
  ExternalLink: () => <div data-testid="external-link" />,
  MousePointer2: () => <div data-testid="mouse-pointer" />,
  Layout: () => <div data-testid="layout-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
  Play: () => <div data-testid="play-icon" />,
  Info: () => <div data-testid="info-icon" />,
  AlertCircle: () => <div data-testid="alert-icon" />,
  Check: () => <div data-testid="check-icon" />,
  X: () => <div data-testid="x-icon" />,
}));

const mockMediaAssets = [
  { 
    id: 1, 
    filename: "test-image.jpg", 
    url: "/test-image.jpg", 
    type: "image" as const,
    tags: [],
    caption: null,
    metadata: {},
    originalName: "test-image.jpg",
    fileSize: 1024,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  },
  { 
    id: 2, 
    filename: "test-video.mp4", 
    url: "/test-video.mp4", 
    type: "video" as const,
    tags: [],
    caption: null,
    metadata: {},
    originalName: "test-video.mp4",
    fileSize: 2048,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  },
] as any;

const mockHeroData = {
  headline: "Original Headline",
  subheadline: "Original Subheadline",
  backgroundMediaId: 1,
  videoId: 2,
  isActive: true,
  ctaText: "Explore",
  ctaLink: "/explore",
  bottomCtaTitle: "Bottom Title",
  bottomCtaDescription: "Bottom Desc",
  bottomCtaText: "Start",
  bottomCtaLink: "/start",
};

describe("HeroManagement", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Configure QueryClient with a default queryFn that uses our mocked apiRequest
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          queryFn: async ({ queryKey }) => {
            if (queryKey[0] === "/api/manufacturing-hero") {
              return mockHeroData;
            }
            return { data: {} };
          },
        },
      },
    });

    vi.mocked(queryClientModule.getQueryClient).mockReturnValue(queryClient);
    vi.mocked(queryClientModule.apiRequest).mockImplementation(async (url) => {
      if (url === "/api/manufacturing-hero") return mockHeroData;
      return { data: {} };
    });
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <HeroManagement mediaAssets={mockMediaAssets} />
      </QueryClientProvider>
    );
  };

  it("renders with initial data", async () => {
    renderComponent();

    // Wait for loading state to finish
    await waitFor(() => {
      expect(screen.queryByText(/Orchestrating Hero Tab/i)).not.toBeInTheDocument();
    });

    // Check for Headline input by its ID since label might be tricky
    const headlineInput = screen.getByDisplayValue("Original Headline");
    expect(headlineInput).toBeInTheDocument();
    expect(screen.getByDisplayValue("Original Subheadline")).toBeInTheDocument();
  });

  it("updates headline optimistically", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.queryByText(/Orchestrating Hero Tab/i)).not.toBeInTheDocument();
    });

    const headlineInput = screen.getByDisplayValue("Original Headline");
    fireEvent.change(headlineInput, { target: { value: "Updated Headline" } });

    expect(headlineInput).toHaveValue("Updated Headline");
  });

  it("submits form data and shows success toast", async () => {
    const mockToast = vi.fn();
    vi.mocked(useToastModule.useToast).mockReturnValue({ 
      toast: mockToast,
      dismiss: vi.fn(),
      toasts: [],
    });
    
    // Mock successful PATCH
    vi.mocked(queryClientModule.apiRequest).mockImplementation(async (url, options) => {
      if (url === "/api/manufacturing-hero" && options?.method === "PATCH") {
        return { ...mockHeroData, headline: "Saved Headline" };
      }
      return mockHeroData;
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.queryByText(/Orchestrating Hero Tab/i)).not.toBeInTheDocument();
    });

    const headlineInput = screen.getByDisplayValue("Original Headline");
    fireEvent.change(headlineInput, { target: { value: "Saved Headline" } });

    const saveButton = screen.getByText(/Save Hero Settings/i).closest("button");
    if (!saveButton) throw new Error("Save button not found");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: "Success",
        description: "Hero section updated successfully",
      }));
    });
  });

  it("handles submission errors", async () => {
    const mockToast = vi.fn();
    vi.mocked(useToastModule.useToast).mockReturnValue({ 
      toast: mockToast,
      dismiss: vi.fn(),
      toasts: [],
    });
    
    vi.mocked(queryClientModule.apiRequest).mockImplementation(async (url, options) => {
      if (url === "/api/manufacturing-hero" && options?.method === "PATCH") {
        throw new Error("Failed");
      }
      return mockHeroData;
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.queryByText(/Orchestrating Hero Tab/i)).not.toBeInTheDocument();
    });

    const saveButton = screen.getByText(/Save Hero Settings/i).closest("button");
    if (!saveButton) throw new Error("Save button not found");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: "Error",
        description: "Failed to update hero section",
        variant: "destructive",
      }));
    });
  });
});
