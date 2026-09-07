import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FooterInquiryForm } from "../../../app/components/layout/FooterInquiryForm";

// Mock GSAP
vi.mock("@/lib/gsap", () => ({
  gsap: {
    timeline: () => ({
      to: vi.fn().mockReturnThis(),
      call: vi.fn().mockImplementation((cb) => {
        cb();
        return { to: vi.fn() };
      }),
      kill: vi.fn(),
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

// Mock API
vi.mock("@/lib/api", () => ({
  apiRequest: vi.fn().mockResolvedValue({ success: true, id: 99 }),
}));

import { apiRequest } from "@/lib/api";

describe("FooterInquiryForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ token: "tp_123", name: "blueprint.pdf", size: "1.2 MB" }),
    } as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders correctly with default heading", () => {
    render(<FooterInquiryForm />);
    expect(screen.getByText(/Start Your/i)).toBeTruthy();
    expect(screen.getByLabelText(/COMPANY NAME/i)).toBeTruthy();
    expect(screen.getByLabelText(/EMAIL ADDRESS/i)).toBeTruthy();
    expect(screen.getByLabelText(/PROJECT SPECIFICATIONS/i)).toBeTruthy();
  });

  it("renders custom CMS heading when provided as prop", () => {
    render(<FooterInquiryForm heading="CUSTOM B2B ORDER DESK" />);
    expect(screen.getByText("CUSTOM B2B ORDER DESK")).toBeTruthy();
  });

  it("handles input changes without crashing", async () => {
    render(<FooterInquiryForm />);
    const emailInput = screen.getByLabelText(/EMAIL ADDRESS/i);
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    expect((emailInput as HTMLInputElement).value).toBe("test@example.com");
  });

  it("validates email and description min length before submitting", async () => {
    const { container } = render(<FooterInquiryForm />);
    const form = container.querySelector("form");
    expect(form).not.toBeNull();

    // Submit empty form
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(screen.getByText(/\[INVALID EMAIL FORMAT\]/i)).toBeTruthy();
    });

    expect(apiRequest).not.toHaveBeenCalled();
  });

  it("prevents default navigation on dragover and captures drop file", async () => {
    render(<FooterInquiryForm />);

    const dropzone = screen.getByText(/DROP .PDF, .AI, .DXF TECH-PACK/i).closest("section, div");
    expect(dropzone).not.toBeNull();

    // Drag over
    const dragEvent = new Event("dragover", { bubbles: true, cancelable: true });
    dropzone?.dispatchEvent(dragEvent);
    expect(dragEvent.defaultPrevented).toBe(true);

    // Drop file
    const file = new File(["test techpack"], "techpack.pdf", { type: "application/pdf" });
    await act(async () => {
      fireEvent.drop(dropzone!, {
        dataTransfer: { files: [file] },
      });
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/inquiries/upload-techpack",
        expect.any(Object),
      );
    });
  });

  it("submits valid inquiry payload conforming to createInquirySchema", async () => {
    const { container } = render(<FooterInquiryForm />);
    const form = container.querySelector("form");
    expect(form).not.toBeNull();

    fireEvent.change(screen.getByLabelText(/COMPANY NAME/i), {
      target: { value: "Patagonia Procurement" },
    });
    fireEvent.change(screen.getByLabelText(/EMAIL ADDRESS/i), {
      target: { value: "procurement@patagonia.com" },
    });
    fireEvent.change(screen.getByLabelText(/PROJECT SPECIFICATIONS/i), {
      target: { value: "5,000 unit organic recycled cotton jerseys" },
    });

    fireEvent.submit(form!);

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith(
        "/api/inquiries",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("Patagonia Procurement"),
        }),
      );
    });

    const calledBody = JSON.parse(vi.mocked(apiRequest).mock.calls[0][1]?.body as string);
    expect(calledBody.contact.name).toBe("Patagonia Procurement");
    expect(calledBody.contact.company).toBe("Patagonia Procurement");
    expect(calledBody.contact.email).toBe("procurement@patagonia.com");
    expect(calledBody.contact.message).toBe("5,000 unit organic recycled cotton jerseys");
    expect(calledBody.source).toBe("footer_form");
  });
});
