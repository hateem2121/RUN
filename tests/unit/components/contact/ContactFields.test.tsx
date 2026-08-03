import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ContactFields } from "../../../../client/app/components/contact/ContactFields";

describe("ContactFields", () => {
  const mockCountryOptions = [
    { name: "United States", code: "US", phone: "1", region: "Americas" },
    { name: "United Kingdom", code: "GB", phone: "44", region: "Europe" },
  ];
  const mockPlatformOptions = ["WhatsApp", "Skype", "Other"];

  const defaultProps = {
    isPending: false,
    countryOptions: mockCountryOptions as any,
    selectedCountry: mockCountryOptions[0] as any,
    onCountryChange: vi.fn(),
    platformOptions: mockPlatformOptions,
    selectedPlatform: "WhatsApp",
    onPlatformChange: vi.fn(),
  };

  it("renders correctly with given props", () => {
    render(<ContactFields {...defaultProps} />);
    expect(screen.getByTestId("input-first-name")).toBeTruthy();
    expect(screen.getByTestId("input-last-name")).toBeTruthy();
    expect(screen.getByTestId("input-email")).toBeTruthy();
    expect(screen.getByTestId("textarea-message")).toBeTruthy();
  });

  it("shows other platform input when 'Other' is selected", () => {
    render(<ContactFields {...defaultProps} selectedPlatform="Other" />);
    expect(screen.getByTestId("input-other-platform")).toBeTruthy();
  });

  it("disables fields when isPending is true", () => {
    render(<ContactFields {...defaultProps} isPending={true} />);
    const firstNameInput = screen.getByTestId("input-first-name") as HTMLInputElement;
    expect(firstNameInput.disabled).toBe(true);
  });
});
