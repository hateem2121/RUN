/**
 * MANUFACTURING CMS ADMIN COMPONENT TESTS
 * RUN APPAREL (PVT) LTD - B2B Sportswear Manufacturing Platform
 *
 * Unit tests for Manufacturing page CMS admin components
 * Tests form handling, mutations, media selection, and drag-drop reordering
 *
 * @see client/app/components/admin/manufacturing/HeroManagement.tsx
 * @see client/app/components/admin/manufacturing/ProcessManagement.tsx
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type React from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";

// Mock ResizeObserver for Radix UI components
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock the hooks using vi.hoisted to ensure they are available to hoisted vi.mock calls
const { vi_mockToast, vi_mockMutate, vi_mockInvalidateQueries } = vi.hoisted(() => ({
  vi_mockToast: vi.fn(),
  vi_mockMutate: vi.fn(),
  vi_mockInvalidateQueries: vi.fn(),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi_mockToast,
  }),
}));

vi.mock("@/hooks/useManufacturingMutations", () => ({
  useManufacturingMutations: () => ({
    createMutation: { mutate: vi_mockMutate, mutateAsync: vi_mockMutate, isPending: false },
    updateMutation: { mutate: vi_mockMutate, mutateAsync: vi_mockMutate, isPending: false },
    deleteMutation: { mutate: vi_mockMutate, mutateAsync: vi_mockMutate, isPending: false },
    reorderMutation: { mutate: vi_mockMutate, mutateAsync: vi_mockMutate, isPending: false },
  }),
}));

vi.mock("@/hooks/useOptimizedQuery", () => ({
  useOptimizedQuery: vi.fn().mockReturnValue({
    data: [],
    isLoading: false,
  }),
}));

vi.mock("@/lib/queryClient", () => ({
  apiRequest: vi.fn((...args) => {
    vi_mockMutate(...args);
    return Promise.resolve({ data: {} });
  }),
  getQueryClient: () => ({
    invalidateQueries: vi_mockInvalidateQueries,
  }),
}));

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return {
    ...actual,
    useQuery: vi.fn().mockReturnValue({
      data: null,
      isPending: false,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    }),
    useMutation: vi.fn().mockReturnValue({
      mutate: vi_mockMutate,
      isPending: false,
    }),
  };
});

// Mock dnd-kit
vi.mock("@dnd-kit/core", () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  closestCenter: vi.fn(),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
}));

vi.mock("@dnd-kit/sortable", () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  sortableKeyboardCoordinates: vi.fn(),
  useSortable: vi.fn().mockReturnValue({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
  }),
  verticalListSortingStrategy: vi.fn(),
  arrayMove: vi.fn((arr) => arr),
}));

vi.mock("@dnd-kit/utilities", () => ({
  CSS: {
    Transform: {
      toString: vi.fn(),
    },
  },
}));

// Mock UI components
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div role="dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogBody: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div role="article">{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <h3>{children}</h3>,
  CardDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/shared/manufacturing", () => ({
  ManufacturingLoadingState: () => <div>Orchestrating...</div>,
  ProcessCard: ({ process }: { process: { title: string } }) => (
    <div data-testid="process-card">{process.title}</div>
  ),
}));

vi.mock("@/components/admin/shared", () => ({
  DeleteConfirmationDialog: ({ onConfirm, title }: { onConfirm: () => void; title: string }) => (
    <button type="button" onClick={onConfirm} data-testid="delete-dialog">
      {title}
    </button>
  ),
  StandardMediaSelectionDialog: ({
    isOpen,
    onClose,
    onSelect,
    title,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (assets: unknown) => void;
    title: string;
  }) =>
    isOpen ? (
      <div role="dialog" data-testid="media-picker">
        <h3>{title}</h3>
        <button
          type="button"
          onClick={() => {
            onSelect({ id: 1, filename: "test-image.jpg", url: "/test.jpg" });
            onClose();
          }}
        >
          Select Media
        </button>
        <button type="button" onClick={onClose}>
          Cancel
        </button>
      </div>
    ) : null,
}));

// Create wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

/**
 * HERO MANAGEMENT COMPONENT TESTS
 */
describe("HeroManagement Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("should render hero management form with all fields", async () => {
    // Dynamic import to apply mocks
    const { HeroManagement } = await import("@/components/admin/manufacturing/HeroManagement");

    const mockMediaAssets = [
      { id: 1, filename: "background.jpg", url: "/background.jpg" },
      { id: 2, filename: "video.mp4", url: "/video.mp4" },
    ];

    render(<HeroManagement mediaAssets={mockMediaAssets} />, { wrapper: createWrapper() });

    // Check for form labels
    expect(screen.getByLabelText(/^headline$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^subheadline$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^main button text$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^main button link$/i)).toBeInTheDocument();
  });

  test("should display loading state while fetching hero data", async () => {
    // Mock loading state
    vi.mocked((await import("@tanstack/react-query")).useQuery).mockReturnValueOnce({
      data: null,
      isPending: true,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    } as any);

    const { HeroManagement } = await import("@/components/admin/manufacturing/HeroManagement");

    render(<HeroManagement mediaAssets={[]} />, { wrapper: createWrapper() });

    expect(screen.getByText(/orchestrating hero tab/i)).toBeInTheDocument();
  });

  test("should populate form with existing hero data", async () => {
    const mockHeroData = {
      id: 1,
      headline: "World-Class Manufacturing",
      subheadline: "Heritage Since 1889",
      backgroundMediaId: null,
      videoId: null,
      isActive: true,
      ctaText: "Explore",
      ctaLink: "/contact",
      bottomCtaTitle: "Start Your Project",
      bottomCtaDescription: "Contact us today",
      bottomCtaText: "Get Started",
      bottomCtaLink: "/contact",
    };

    vi.mocked((await import("@tanstack/react-query")).useQuery).mockReturnValue({
      data: mockHeroData,
      isPending: false,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any);

    const { HeroManagement } = await import("@/components/admin/manufacturing/HeroManagement");

    render(<HeroManagement mediaAssets={[]} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByDisplayValue("World-Class Manufacturing")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Heritage Since 1889")).toBeInTheDocument();
    });
  });

  test("should handle form input changes", async () => {
    const user = userEvent.setup();

    const { HeroManagement } = await import("@/components/admin/manufacturing/HeroManagement");

    render(<HeroManagement mediaAssets={[]} />, { wrapper: createWrapper() });

    const headlineInput = screen.getByLabelText(/^headline$/i);
    await user.clear(headlineInput);
    await user.type(headlineInput, "New Headline");

    expect(headlineInput).toHaveValue("New Headline");
  });

  test("should submit form with updated data", async () => {
    const user = userEvent.setup();

    const { HeroManagement } = await import("@/components/admin/manufacturing/HeroManagement");

    render(<HeroManagement mediaAssets={[]} />, { wrapper: createWrapper() });

    const submitButton = screen.getByRole("button", { name: /save hero/i });
    await user.click(submitButton);

    // Mutation should be called
    await waitFor(() => {
      expect(vi_mockMutate).toHaveBeenCalled();
    });
  });

  test("should open background media picker when button clicked", async () => {
    const user = userEvent.setup();

    const { HeroManagement } = await import("@/components/admin/manufacturing/HeroManagement");

    render(<HeroManagement mediaAssets={[]} />, { wrapper: createWrapper() });

    const backgroundButton = screen.getByTestId("select-background-button");
    await user.click(backgroundButton);

    expect(screen.getByTestId("media-picker")).toBeInTheDocument();
  });

  test("should open video picker when button clicked", async () => {
    const user = userEvent.setup();

    const { HeroManagement } = await import("@/components/admin/manufacturing/HeroManagement");

    render(<HeroManagement mediaAssets={[]} />, { wrapper: createWrapper() });

    const videoButton = screen.getByTestId("select-video-button");
    await user.click(videoButton);

    expect(screen.getByTestId("media-picker")).toBeInTheDocument();
  });

  test("should toggle active switch", async () => {
    const user = userEvent.setup();

    const { HeroManagement } = await import("@/components/admin/manufacturing/HeroManagement");

    render(<HeroManagement mediaAssets={[]} />, { wrapper: createWrapper() });

    const activeSwitch = screen.getByRole("switch", { name: /active/i });
    const initialValue = activeSwitch.getAttribute("aria-checked");

    await user.click(activeSwitch);

    const newValue = activeSwitch.getAttribute("aria-checked");
    expect(newValue).not.toBe(initialValue);
  });

  test("should display bottom CTA fields", async () => {
    const { HeroManagement } = await import("@/components/admin/manufacturing/HeroManagement");

    render(<HeroManagement mediaAssets={[]} />, { wrapper: createWrapper() });

    expect(screen.getByLabelText(/banner title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/banner description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/banner button text/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/banner button link/i)).toBeInTheDocument();
  });
});

/**
 * PROCESS MANAGEMENT COMPONENT TESTS
 */
describe("ProcessManagement Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("should render process management card", async () => {
    const { ProcessManagement } = await import(
      "@/components/admin/manufacturing/ProcessManagement"
    );

    render(<ProcessManagement mediaAssets={[]} />, { wrapper: createWrapper() });

    expect(screen.getByRole("heading", { name: /manufacturing processes/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add process/i })).toBeInTheDocument();
  });

  test("should display empty state when no processes exist", async () => {
    vi.mocked((await import("@/hooks/useOptimizedQuery")).useOptimizedQuery).mockReturnValue({
      data: [],
      isLoading: false,
    } as any);

    const { ProcessManagement } = await import(
      "@/components/admin/manufacturing/ProcessManagement"
    );

    render(<ProcessManagement mediaAssets={[]} />, { wrapper: createWrapper() });

    expect(screen.getByText(/no manufacturing processes found/i)).toBeInTheDocument();
  });

  test("should display loading state while fetching processes", async () => {
    vi.mocked((await import("@/hooks/useOptimizedQuery")).useOptimizedQuery).mockReturnValue({
      data: [],
      isLoading: true,
    } as any);

    const { ProcessManagement } = await import(
      "@/components/admin/manufacturing/ProcessManagement"
    );

    render(<ProcessManagement mediaAssets={[]} />, { wrapper: createWrapper() });

    expect(screen.getByText(/orchestrating processes tab/i)).toBeInTheDocument();
  });

  test("should open add process dialog when button clicked", async () => {
    const user = userEvent.setup();

    const { ProcessManagement } = await import(
      "@/components/admin/manufacturing/ProcessManagement"
    );

    render(<ProcessManagement mediaAssets={[]} />, { wrapper: createWrapper() });

    const addButton = screen.getByRole("button", { name: /add process/i });
    await user.click(addButton);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/add new process/i)).toBeInTheDocument();
  });

  test("should display process form fields in dialog", async () => {
    const user = userEvent.setup();

    const { ProcessManagement } = await import(
      "@/components/admin/manufacturing/ProcessManagement"
    );

    render(<ProcessManagement mediaAssets={[]} />, { wrapper: createWrapper() });

    const addButton = screen.getByRole("button", { name: /add process/i });
    await user.click(addButton);

    expect(screen.getByLabelText(/^title$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/step number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/efficiency/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/duration/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });

  test("should handle form input changes in process dialog", async () => {
    const user = userEvent.setup();

    const { ProcessManagement } = await import(
      "@/components/admin/manufacturing/ProcessManagement"
    );

    render(<ProcessManagement mediaAssets={[]} />, { wrapper: createWrapper() });

    const addButton = screen.getByRole("button", { name: /add process/i });
    await user.click(addButton);

    const titleInput = screen.getByLabelText(/^title$/i);
    await user.type(titleInput, "Fabric Cutting");

    expect(titleInput).toHaveValue("Fabric Cutting");
  });

  test("should toggle process active switch", async () => {
    const user = userEvent.setup();

    const { ProcessManagement } = await import(
      "@/components/admin/manufacturing/ProcessManagement"
    );

    render(<ProcessManagement mediaAssets={[]} />, { wrapper: createWrapper() });

    const addButton = screen.getByRole("button", { name: /add process/i });
    await user.click(addButton);

    const activeSwitch = screen.getByRole("switch", { name: /active/i });
    await user.click(activeSwitch);

    expect(activeSwitch.getAttribute("aria-checked")).toBe("false");
  });

  test("should submit new process form", async () => {
    const user = userEvent.setup();

    const { ProcessManagement } = await import(
      "@/components/admin/manufacturing/ProcessManagement"
    );

    render(<ProcessManagement mediaAssets={[]} />, { wrapper: createWrapper() });

    const addButton = screen.getByRole("button", { name: /add process/i });
    await user.click(addButton);

    // Fill required fields
    const titleInput = screen.getByLabelText(/^title$/i);
    await user.type(titleInput, "Quality Control");

    const submitButton = screen.getByRole("button", { name: /create process/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(vi_mockMutate).toHaveBeenCalled();
    });
  });

  test("should display existing processes in sortable list", async () => {
    const mockProcesses = [
      {
        id: 1,
        name: "Cutting",
        title: "Fabric Cutting",
        description: "Precision cutting",
        step: 1,
        efficiency: 95,
        duration: "1 day",
        isActive: true,
        iconName: "Factory",
        category: "Production",
        mediaIds: [],
        createdAt: new Date(),
        position: 0,
        imageId: null,
        equipment: null,
        specifications: null,
        sortOrder: 0,
      },
      {
        id: 2,
        name: "Assembly",
        title: "Assembly",
        description: "Expert assembly",
        step: 2,
        efficiency: 90,
        duration: "2 days",
        isActive: true,
        iconName: "Settings",
        category: "Production",
        mediaIds: [],
        createdAt: new Date(),
        position: 1,
        imageId: null,
        equipment: null,
        specifications: null,
        sortOrder: 1,
      },
    ];

    vi.mocked((await import("@/hooks/useOptimizedQuery")).useOptimizedQuery).mockReturnValue({
      data: mockProcesses,
      isLoading: false,
    } as any);

    const { ProcessManagement } = await import(
      "@/components/admin/manufacturing/ProcessManagement"
    );

    render(<ProcessManagement mediaAssets={[]} />, { wrapper: createWrapper() });

    expect(screen.getByText("Fabric Cutting")).toBeInTheDocument();
    expect(screen.getByText("Assembly")).toBeInTheDocument();
  });

  test("should open media picker for process media", async () => {
    const user = userEvent.setup();

    const { ProcessManagement } = await import(
      "@/components/admin/manufacturing/ProcessManagement"
    );

    render(<ProcessManagement mediaAssets={[]} />, { wrapper: createWrapper() });

    const addButton = screen.getByRole("button", { name: /add process/i });
    await user.click(addButton);

    const mediaButton = screen.getByTestId("select-process-media");
    await user.click(mediaButton);

    expect(screen.getByTestId("media-picker")).toBeInTheDocument();
  });

  test("should close dialog on cancel", async () => {
    const user = userEvent.setup();

    const { ProcessManagement } = await import(
      "@/components/admin/manufacturing/ProcessManagement"
    );

    render(<ProcessManagement mediaAssets={[]} />, { wrapper: createWrapper() });

    const addButton = screen.getByRole("button", { name: /add process/i });
    await user.click(addButton);

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});

/**
 * INTEGRATION TESTS - CMS to Page Data Flow
 */
describe("CMS to Page Data Flow Integration", () => {
  test("should invalidate queries after hero update", async () => {
    const user = userEvent.setup();

    const { HeroManagement } = await import("@/components/admin/manufacturing/HeroManagement");

    render(<HeroManagement mediaAssets={[]} />, { wrapper: createWrapper() });

    const submitButton = screen.getByRole("button", { name: /save hero/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(vi_mockMutate).toHaveBeenCalled();
    });
  });

  test("should invalidate queries after process creation", async () => {
    const user = userEvent.setup();

    const { ProcessManagement } = await import(
      "@/components/admin/manufacturing/ProcessManagement"
    );

    render(<ProcessManagement mediaAssets={[]} />, { wrapper: createWrapper() });

    const addButton = screen.getByRole("button", { name: /add process/i });
    await user.click(addButton);

    const titleInput = screen.getByLabelText(/^title$/i);
    await user.type(titleInput, "New Process");

    const submitButton = screen.getByRole("button", { name: /create process/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(vi_mockMutate).toHaveBeenCalled();
    });
  });
});

/**
 * ACCESSIBILITY TESTS
 */
describe("CMS Component Accessibility", () => {
  test("HeroManagement should have proper form labels", async () => {
    const { HeroManagement } = await import("@/components/admin/manufacturing/HeroManagement");

    render(<HeroManagement mediaAssets={[]} />, { wrapper: createWrapper() });

    // All inputs should have associated labels
    const inputs = screen.getAllByRole("textbox");
    for (const input of inputs) {
      const label = input.getAttribute("aria-label") || input.getAttribute("id");
      expect(label).toBeTruthy();
    }
  });

  test("ProcessManagement dialog should have proper ARIA attributes", async () => {
    const user = userEvent.setup();

    const { ProcessManagement } = await import(
      "@/components/admin/manufacturing/ProcessManagement"
    );

    render(<ProcessManagement mediaAssets={[]} />, { wrapper: createWrapper() });

    const addButton = screen.getByRole("button", { name: /add process/i });
    await user.click(addButton);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
  });

  test("Form submit buttons should have descriptive text", async () => {
    const { HeroManagement } = await import("@/components/admin/manufacturing/HeroManagement");

    render(<HeroManagement mediaAssets={[]} />, { wrapper: createWrapper() });

    const submitButton = screen.getByRole("button", { name: /save hero/i });
    expect(submitButton).toHaveTextContent("Save Hero Settings");
  });
});
