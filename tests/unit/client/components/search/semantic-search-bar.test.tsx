import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SemanticSearchBar } from "../../../../../client/app/components/search/SemanticSearchBar.js";

describe("SemanticSearchBar Component", () => {
  it("renders search input and filter chips correctly", () => {
    render(<SemanticSearchBar placeholder="Search test..." />);

    const input = screen.getByRole("textbox", { name: /semantic ai search query/i });
    expect(input).toBeDefined();

    expect(screen.getByRole("button", { name: /all categories/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /garments/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /technical fabrics/i })).toBeDefined();
  });

  it("updates input text on typing", () => {
    render(<SemanticSearchBar />);
    const input = screen.getByRole("textbox", {
      name: /semantic ai search query/i,
    }) as HTMLInputElement;

    fireEvent.change(input, { target: { value: "breathable mesh" } });
    expect(input.value).toBe("breathable mesh");
  });

  it("switches category filter on pill click", () => {
    render(<SemanticSearchBar />);
    const garmentBtn = screen.getByRole("button", { name: /garments/i });

    fireEvent.click(garmentBtn);
    expect(garmentBtn.className).toContain("bg-manufacturing-accent");
  });
});
