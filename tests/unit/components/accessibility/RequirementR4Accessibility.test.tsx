import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Footer } from "@/components/layout/Footer";
import { FooterInquiryForm } from "@/components/layout/FooterInquiryForm";
import { CustomCursor } from "@/components/ui/CustomCursor";

// Mock GSAP & GSAP react
vi.mock("@gsap/react", () => ({
  useGSAP: vi.fn((_cb: any) => {
    // optional execution if needed
  }),
}));

vi.mock("gsap", () => ({
  default: {
    timeline: () => ({
      to: vi.fn().mockReturnThis(),
      call: vi.fn().mockImplementation((cb) => {
        if (typeof cb === "function") cb();
        return { to: vi.fn() };
      }),
    }),
    set: vi.fn(),
    to: vi.fn(),
    quickTo: vi.fn().mockReturnValue(vi.fn()),
  },
}));

vi.mock("@/lib/gsap", () => ({
  gsap: {
    fromTo: vi.fn(),
    set: vi.fn(),
    to: vi.fn(),
    quickTo: vi.fn().mockReturnValue(vi.fn()),
  },
}));

// Mock react-router
vi.mock("react-router", () => ({
  useRouteLoaderData: () => ({ cspNonce: "test-nonce" }),
}));

// Mock React Query
let mockFooterConfig: any = null;
let mockContactConfig: any = null;
let mockIsLoading = false;

vi.mock("@tanstack/react-query", () => ({
  useQuery: ({ queryKey }: { queryKey: string[] }) => {
    const key = queryKey[0];
    if (key === "/api/footer") {
      return { data: mockFooterConfig, isLoading: mockIsLoading };
    }
    if (key === "/api/contact-info") {
      return { data: mockContactConfig, isLoading: false };
    }
    return { data: null, isLoading: false };
  },
}));

// Mock Magnetic
vi.mock("@/components/ui/Magnetic", () => ({
  Magnetic: ({ children }: any) => <div>{children}</div>,
}));

// Mock cursor store
let mockCursorVariant = "default";
let mockCursorImage: string | null = null;

vi.mock("@/stores/useCursorStore", () => ({
  useCursorStore: () => ({
    cursorVariant: mockCursorVariant,
    cursorImage: mockCursorImage,
    setCursor: vi.fn(),
    resetCursor: vi.fn(),
  }),
}));

// Mock skeleton
vi.mock("@/components/ui/skeleton", () => ({
  Skeleton: ({ className }: any) => <div className={className} data-testid="skeleton" />,
}));

describe("Requirement R4 Accessibility Fixes Verification", () => {
  beforeEach(() => {
    mockFooterConfig = null;
    mockContactConfig = null;
    mockIsLoading = false;
    mockCursorVariant = "default";
    mockCursorImage = null;
    vi.clearAllMocks();
  });

  describe("Footer.tsx Accessibility & Fallback Social Links (R4.1)", () => {
    it("renders null and does not output dead href='/' social links when footerConfig and contactConfig socialLinks are missing", () => {
      mockFooterConfig = {
        companyName: "RUN APPAREL",
        socialLinks: undefined,
      };
      mockContactConfig = {
        socialLinks: undefined,
      };

      const { container } = render(<Footer />);

      // Find all anchor links in the container
      const links = container.querySelectorAll("a");
      const deadLinks = Array.from(links).filter((a) => a.getAttribute("href") === "/");

      // Verify that no dead href="/" links were outputted as fallback social links (e.g. Instagram, LinkedIn, Behance)
      expect(deadLinks.length).toBe(0);

      // Verify Instagram, LinkedIn, Behance text are not rendered when socialLinks is missing
      expect(screen.queryByText("Instagram")).toBeNull();
      expect(screen.queryByText("LinkedIn")).toBeNull();
      expect(screen.queryByText("Behance")).toBeNull();
    });

    it("renders null and does not output dead href='/' social links when socialLinks is an empty array", () => {
      mockFooterConfig = {
        socialLinks: [],
      };
      mockContactConfig = {
        socialLinks: {},
      };

      const { container } = render(<Footer />);

      const links = container.querySelectorAll("a");
      const deadLinks = Array.from(links).filter((a) => a.getAttribute("href") === "/");

      expect(deadLinks.length).toBe(0);
      expect(screen.queryByText("Instagram")).toBeNull();
      expect(screen.queryByText("LinkedIn")).toBeNull();
      expect(screen.queryByText("Behance")).toBeNull();
    });

    it("renders real social links cleanly when footerConfig.socialLinks are provided", () => {
      mockFooterConfig = {
        socialLinks: [
          { name: "Instagram", href: "https://instagram.com/runapparel", hoverColor: "#E1306C" },
          {
            name: "LinkedIn",
            href: "https://linkedin.com/company/runapparel",
            hoverColor: "#0A66C2",
          },
        ],
      };

      render(<Footer />);

      const instagramLink = screen.getByText("Instagram");
      const linkedinLink = screen.getByText("LinkedIn");

      expect(instagramLink).toBeTruthy();
      expect(instagramLink.getAttribute("href")).toBe("https://instagram.com/runapparel");
      expect(linkedinLink).toBeTruthy();
      expect(linkedinLink.getAttribute("href")).toBe("https://linkedin.com/company/runapparel");
    });
  });

  describe("FooterInquiryForm.tsx Redundant Aria-Labels & Label Resolution (R4.2)", () => {
    it("has NO aria-label attribute on #company input and resolves accessible name via <label htmlFor='company'>", () => {
      const { container } = render(<FooterInquiryForm />);

      const companyInput = container.querySelector("#company") as HTMLInputElement;
      expect(companyInput).not.toBeNull();

      // Check no redundant aria-label exists
      expect(companyInput.getAttribute("aria-label")).toBeNull();

      // Check explicit label association
      const label = container.querySelector("label[for='company']");
      expect(label).not.toBeNull();
      expect(label?.textContent).toContain("COMPANY NAME");

      // Verify accessible name resolution via Testing Library getByLabelText
      const resolvedInput = screen.getByLabelText(/COMPANY NAME/i);
      expect(resolvedInput).toBe(companyInput);
    });

    it("has NO aria-label attribute on #footer-email input and resolves accessible name via <label htmlFor='footer-email'>", () => {
      const { container } = render(<FooterInquiryForm />);

      const emailInput = container.querySelector("#footer-email") as HTMLInputElement;
      expect(emailInput).not.toBeNull();

      // Check no redundant aria-label exists
      expect(emailInput.getAttribute("aria-label")).toBeNull();

      // Check explicit label association
      const label = container.querySelector("label[for='footer-email']");
      expect(label).not.toBeNull();
      expect(label?.textContent).toContain("EMAIL ADDRESS");

      // Verify accessible name resolution
      const resolvedInput = screen.getByLabelText(/EMAIL ADDRESS/i);
      expect(resolvedInput).toBe(emailInput);
    });

    it("has NO aria-label attribute on #specs textarea and resolves accessible name via <label htmlFor='specs'>", () => {
      const { container } = render(<FooterInquiryForm />);

      const specsTextarea = container.querySelector("#specs") as HTMLTextAreaElement;
      expect(specsTextarea).not.toBeNull();

      // Check no redundant aria-label exists
      expect(specsTextarea.getAttribute("aria-label")).toBeNull();

      // Check explicit label association
      const label = container.querySelector("label[for='specs']");
      expect(label).not.toBeNull();
      expect(label?.textContent).toContain("PROJECT SPECIFICATIONS");

      // Verify accessible name resolution
      const resolvedInput = screen.getByLabelText(/PROJECT SPECIFICATIONS/i);
      expect(resolvedInput).toBe(specsTextarea);
    });
  });

  describe("CustomCursor.tsx Aria-Hidden & Alt Text (R4.3)", () => {
    it("has aria-hidden='true' on both cursor container divs", () => {
      const { container } = render(<CustomCursor />);

      const cursorDot = container.querySelector(".cursor-dot");
      const cursorFollower = container.querySelector(".cursor-follower");

      expect(cursorDot).not.toBeNull();
      expect(cursorFollower).not.toBeNull();

      expect(cursorDot?.getAttribute("aria-hidden")).toBe("true");
      expect(cursorFollower?.getAttribute("aria-hidden")).toBe("true");
    });

    it("has alt='' on cursor follower image when in 'view' variant with image", () => {
      mockCursorVariant = "view";
      mockCursorImage = "/images/preview.jpg";

      const { container } = render(<CustomCursor />);

      const img = container.querySelector(".cursor-follower img") as HTMLImageElement;
      expect(img).not.toBeNull();
      expect(img.getAttribute("alt")).toBe("");
    });
  });
});
