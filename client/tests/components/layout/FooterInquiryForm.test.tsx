import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FooterInquiryForm } from "../../../app/components/layout/FooterInquiryForm";

// Mock GSAP
vi.mock("gsap", () => ({
  default: {
    timeline: () => ({
      to: vi.fn().mockReturnThis(),
      call: vi.fn().mockImplementation((cb) => {
        cb();
        return { to: vi.fn() };
      }),
    }),
  },
}));

// Mock Magnetic
vi.mock("../../../app/components/ui/Magnetic", () => ({
  Magnetic: ({ children }: any) => <div>{children}</div>,
}));

// Mock Store
vi.mock("../../../app/stores/useCursorStore", () => ({
  useCursorStore: () => ({ setCursor: vi.fn(), resetCursor: vi.fn() }),
}));

// Mock utils
vi.mock("../../../app/lib/utils", () => ({
  cn: (...args: any[]) => args.join(" "),
}));

describe("FooterInquiryForm", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders correctly", () => {
    render(<FooterInquiryForm />);
    expect(screen.getByLabelText(/COMPANY NAME/i)).toBeTruthy();
    expect(screen.getByLabelText(/EMAIL ADDRESS/i)).toBeTruthy();
    expect(screen.getByLabelText(/PROJECT SPECIFICATIONS/i)).toBeTruthy();
  });

  it("handles input changes without crashing", async () => {
    render(<FooterInquiryForm />);
    const emailInput = screen.getByLabelText(/EMAIL ADDRESS/i);
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    expect((emailInput as HTMLInputElement).value).toBe("test@example.com");
  });
});
