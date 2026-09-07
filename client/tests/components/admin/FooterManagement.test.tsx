import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FooterManagement } from "../../../app/components/admin/footer-management/FooterManagement";

// Mock API request & Query client
const mockMutate = vi.fn();
let mockFooterConfig: any = null;
let mockIsLoading = false;
let mockCertificates: any = [];

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(({ queryKey, select }: { queryKey: string[]; select?: any }) => {
    if (queryKey[0] === "/api/footer") {
      const data = select ? select(mockFooterConfig) : mockFooterConfig;
      return { data, isLoading: mockIsLoading };
    }
    if (queryKey[0] === "/api/certificates") {
      return { data: mockCertificates, isLoading: false };
    }
    return { data: null, isLoading: false };
  }),
  useMutation: vi.fn(({ mutationFn }: any) => ({
    mutate: mockMutate.mockImplementation((payload) => mutationFn?.(payload)),
    isPending: false,
  })),
}));

vi.mock("@/lib/query-client", () => ({
  apiRequest: vi.fn().mockResolvedValue({ success: true }),
  getQueryClient: () => ({
    invalidateQueries: vi.fn(),
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("FooterManagement Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsLoading = false;

    class MockResizeObserver {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    }
    window.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
    mockFooterConfig = {
      id: 1,
      contactFormHeading: "START A CUSTOM RUN",
      contactFormEnabled: true,
      navigationColumns: [
        {
          title: "Technical Fabrics",
          links: [{ label: "Merino Wool", href: "/fabrics/merino" }],
        },
      ],
      socialLinks: [
        {
          name: "Instagram",
          icon: "Instagram",
          href: "https://instagram.com/run",
          hoverColor: "text-pink-500",
        },
      ],
      legalLinks: [{ label: "Privacy Policy", href: "/privacy" }],
      certificateIds: [101],
      companyName: "RUN APPAREL (PVT) LTD",
      companyAddress: "13km Daska Road, Sialkot",
      companyPhone: "+92 336 1777313",
      companyEmail: "team@run-apparel.com",
      brandText: "RUN APPAREL",
      brandTagline: "Engineered Perfection",
      brandSubtext: "ISO Certified Facility",
    };

    mockCertificates = [
      {
        id: 101,
        name: "OEKO-TEX Standard 100",
        issuingOrganization: "OEKO-TEX Association",
      },
      {
        id: 102,
        name: "GOTS Certified",
        issuingOrganization: "Global Standard gGmbH",
      },
    ];
  });

  it("renders loading state when footer query is loading", () => {
    mockIsLoading = true;
    render(<FooterManagement />);
    expect(screen.getByText(/Loading footer configuration.../i)).toBeTruthy();
  });

  it("renders all 5 tabs and populates initial general form values", () => {
    render(<FooterManagement />);

    // Check all tab buttons exist
    expect(screen.getByRole("tab", { name: /General/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /Links/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /Social/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /Certs/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /Branding/i })).toBeTruthy();

    // Check initial values in General tab
    const nameInput = screen.getByLabelText(/Legal Entity Name/i) as HTMLInputElement;
    expect(nameInput.value).toBe("RUN APPAREL (PVT) LTD");
    const emailInput = screen.getByLabelText(/Contact Email/i) as HTMLInputElement;
    expect(emailInput.value).toBe("team@run-apparel.com");
  });

  it("retains inputs across tab switching due to forceMount", async () => {
    render(<FooterManagement />);

    // Edit legal entity name in General tab
    const nameInput = screen.getByLabelText(/Legal Entity Name/i);
    fireEvent.change(nameInput, { target: { value: "RUN SPORTSWEAR CORP" } });

    // Switch to Branding tab
    const brandingTab = screen.getByRole("tab", { name: /Branding/i });
    fireEvent.click(brandingTab);

    // Verify Branding fields are mounted and visible
    const taglineInput = screen.getByLabelText(/Footer Tagline/i) as HTMLInputElement;
    expect(taglineInput.value).toBe("Engineered Perfection");

    // Switch back to General tab
    const generalTab = screen.getByRole("tab", { name: /General/i });
    fireEvent.click(generalTab);

    // Value should still be retained
    expect((screen.getByLabelText(/Legal Entity Name/i) as HTMLInputElement).value).toBe(
      "RUN SPORTSWEAR CORP",
    );
  });

  it("renders certificate multi-select and toggles certificate inclusion", () => {
    render(<FooterManagement />);

    // Switch to Certs tab
    const certsTab = screen.getByRole("tab", { name: /Certs/i });
    fireEvent.click(certsTab);

    expect(screen.getByText("OEKO-TEX Standard 100")).toBeTruthy();
    expect(screen.getByText("GOTS Certified")).toBeTruthy();

    // Click GOTS Certified to select it
    const gotsBtn = screen.getByText("GOTS Certified").closest("button");
    expect(gotsBtn).toBeTruthy();
    if (gotsBtn) {
      fireEvent.click(gotsBtn);
    }
  });

  it("submits the form when Save Changes is clicked", async () => {
    render(<FooterManagement />);

    const saveBtn = screen.getByRole("button", { name: /Save Changes/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalled();
    });

    const submittedPayload = mockMutate.mock.calls[0][0];
    expect(submittedPayload.id).toBeUndefined(); // Stripped id
    expect(submittedPayload.companyName).toBe("RUN APPAREL (PVT) LTD");
  });
});
