import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CustomDropdown } from "@/components/admin/CustomDropdown";

describe("CustomDropdown", () => {
  const options = [
    { value: "1", label: "Option 1" },
    { value: "2", label: "Option 2" },
    { value: "3", label: "Option 3", disabled: true },
  ];

  it("renders correctly with placeholder", () => {
    const onChange = vi.fn();
    render(<CustomDropdown options={options} onChange={onChange} />);
    expect(screen.getByText("Select an option")).toBeDefined();
  });

  it("opens on click and shows options", () => {
    const onChange = vi.fn();
    render(<CustomDropdown options={options} onChange={onChange} />);
    const trigger = screen.getByRole("button");
    fireEvent.click(trigger);

    expect(screen.getByRole("listbox")).toBeDefined();
    expect(screen.getByText("Option 1")).toBeDefined();
    expect(screen.getByText("Option 2")).toBeDefined();
    expect(screen.getByText("Option 3")).toBeDefined();
  });

  it("calls onChange when an option is clicked", () => {
    const onChange = vi.fn();
    render(<CustomDropdown options={options} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByText("Option 1"));

    expect(onChange).toHaveBeenCalledWith("1");
  });

  it("does not call onChange for disabled option", () => {
    const onChange = vi.fn();
    render(<CustomDropdown options={options} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByText("Option 3"));

    expect(onChange).not.toHaveBeenCalled();
  });
});
