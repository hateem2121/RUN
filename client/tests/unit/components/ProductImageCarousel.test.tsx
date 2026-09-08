import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProductImageCarousel } from "@/components/products/ProductImageCarousel";

describe("ProductImageCarousel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders placeholder image when images array is empty and no video is provided", () => {
    render(<ProductImageCarousel images={[]} productName="Apex Performance Tee" />);

    const img = screen.getByAltText("Apex Performance Tee");
    expect(img).toBeInTheDocument();
    expect(img.getAttribute("src")).toBe("/images/placeholders/product-placeholder.webp");
  });

  it("renders primary video at index 0 when primaryVideo is provided", () => {
    render(
      <ProductImageCarousel
        images={[{ id: 1, type: "image", url: "/image1.webp" }]}
        primaryVideo={{ id: 99, type: "video", url: "/video1.mp4" }}
        productName="Apex Performance Tee"
      />,
    );

    const video = screen.getByLabelText("Apex Performance Tee product video");
    expect(video).toBeInTheDocument();
    expect(video.getAttribute("src")).toBe("/video1.mp4");
  });

  it("renders loader state initially and removes it upon image load", () => {
    const { container } = render(
      <ProductImageCarousel
        images={[{ id: 101, type: "image", url: "/product-1.webp" }]}
        productName="Aero Compression Short"
      />,
    );

    // Initial state: animate-pulse loader state is visible
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
    const img = screen.getByAltText("Aero Compression Short");
    expect(img.className).toContain("opacity-0");

    // Trigger load
    act(() => {
      fireEvent.load(img);
    });

    // Loaded state: loader is removed, opacity-100 applied
    expect(container.querySelector(".animate-pulse")).not.toBeInTheDocument();
    expect(img.className).toContain("opacity-100");
  });

  it("handles image error and falls back to placeholder image", () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { container } = render(
      <ProductImageCarousel
        images={[{ id: 202, type: "image", url: "/broken-image.webp" }]}
        productName="Endurance Singlet"
      />,
    );

    const img = screen.getByAltText("Endurance Singlet");

    act(() => {
      fireEvent.error(img);
    });

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("[ImageCarousel] Failed to load image 202 for Endurance Singlet"),
    );
    expect(img.getAttribute("src")).toBe("/images/placeholders/product-placeholder.webp");
    expect(img.className).toContain("opacity-80");
    expect(container.querySelector(".animate-pulse")).not.toBeInTheDocument();

    consoleWarnSpy.mockRestore();
  });

  it("generates stable unique keys for images with id 0 and url without collision", () => {
    const { container } = render(
      <ProductImageCarousel
        images={[
          { id: 0, type: "image", url: "/sample-a.webp" },
          { id: 0, type: "image", url: "/sample-b.webp" },
        ]}
        productName="Carbon Split Shorts"
      />,
    );

    const img = screen.getByAltText("Carbon Split Shorts");
    expect(img.getAttribute("src")).toBe("/sample-a.webp");

    // Load the first image
    act(() => {
      fireEvent.load(img);
    });
    expect(img.className).toContain("opacity-100");

    // Navigate to next image
    const dots = container.querySelectorAll("button[aria-label^='Go to image']");
    expect(dots.length).toBe(2);

    act(() => {
      fireEvent.click(dots[1]);
    });

    const secondImg = screen.getByAltText("Carbon Split Shorts");
    expect(secondImg.getAttribute("src")).toBe("/sample-b.webp");
    // Second image has distinct key so it should not erroneously inherit the loaded state of the first image
    expect(secondImg.className).toContain("opacity-0");
  });

  it("triggers safety timeout after 3500ms if image fails to finish loading", () => {
    vi.useFakeTimers();

    const { container } = render(
      <ProductImageCarousel
        images={[{ id: 303, type: "image", url: "/hanging-request.webp" }]}
        productName="Ventilated Singlet"
      />,
    );

    const img = screen.getByAltText("Ventilated Singlet");

    // Still pulsing before 3500ms
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3499);
    });
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();

    // Advance past 3500ms safety timeout
    act(() => {
      vi.advanceTimersByTime(2);
    });

    // Now marked as failed, pulse stops
    expect(container.querySelector(".animate-pulse")).not.toBeInTheDocument();
    expect(img.className).toContain("opacity-80");
  });

  it("navigates through multiple images using navigation buttons", async () => {
    const { container } = render(
      <ProductImageCarousel
        images={[
          { id: 10, type: "image", url: "/img-1.webp" },
          { id: 20, type: "image", url: "/img-2.webp" },
        ]}
        productName="Multi-image Product"
      />,
    );

    const section = container.querySelector("section");
    expect(section).toBeInTheDocument();

    // Hover to reveal navigation arrows
    act(() => {
      fireEvent.mouseEnter(section!);
    });

    const nextButton = screen.getByLabelText("Next image");
    expect(nextButton).toBeInTheDocument();

    act(() => {
      fireEvent.click(nextButton);
    });

    const currentImg = screen.getByAltText("Multi-image Product");
    expect(currentImg.getAttribute("src")).toBe("/img-2.webp");

    // Wait for the 200ms navigation debounce lock to release
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 250));
    });

    const prevButton = screen.getByLabelText("Previous image");
    act(() => {
      fireEvent.click(prevButton);
    });

    const prevImg = screen.getByAltText("Multi-image Product");
    expect(prevImg.getAttribute("src")).toBe("/img-1.webp");
  });

  it("handles images with neither id nor url falling back to index composite key and placeholder src", () => {
    render(
      <ProductImageCarousel
        images={[
          { type: "image" } as unknown as { id: number; type: "image" },
          { type: "image" } as unknown as { id: number; type: "image" },
        ]}
        productName="Anonymous Product"
      />,
    );

    const img = screen.getByAltText("Anonymous Product");
    expect(img).toBeInTheDocument();
    expect(img.getAttribute("src")).toBe("/images/placeholders/product-placeholder.webp");
  });

  it("uses getOptimizedUrl prop when provided for positive id", () => {
    const mockGetOptimizedUrl = vi.fn().mockReturnValue("/cdn/optimized-456.webp");

    render(
      <ProductImageCarousel
        images={[{ id: 456, type: "image" }]}
        productName="Performance Hoodie"
        getOptimizedUrl={mockGetOptimizedUrl}
      />,
    );

    expect(mockGetOptimizedUrl).toHaveBeenCalledWith(456);
    const img = screen.getByAltText("Performance Hoodie");
    expect(img.getAttribute("src")).toBe("/cdn/optimized-456.webp");
  });
});
