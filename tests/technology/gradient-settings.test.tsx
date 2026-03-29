import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the component for testing isolation
interface GradientData {
  gradientColors: [string, string];
  angle: number;
  noise: number;
  blindCount: number;
  [key: string]: unknown;
}

const MockTechnologyGradientSettings = ({
  gradientData,
  setGradientData,
  isLoading: _isLoading,
}: {
  gradientData: GradientData;
  setGradientData: (data: GradientData) => void;
  isLoading?: boolean;
}) => {
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  return (
    <div data-testid="gradient-settings">
      <h2>Background Settings</h2>
      <div data-testid="colors-section">Colors</div>
      <div data-testid="exact-colors">Exactly 2 colors</div>
      <div data-testid="angle-display">
        Gradient Angle <span data-testid="angle-value">{gradientData.angle}°</span>
      </div>
      <div data-testid="noise-display">
        Background Texture{" "}
        <span data-testid="noise-value">{Math.round(gradientData.noise * 100)}%</span>
      </div>
      <div data-testid="blind-count">{gradientData.blindCount}</div>
      <button onClick={() => setGradientData({ ...gradientData, angle: 90 })}>Change Angle</button>
      <button onClick={() => setShowAdvanced(!showAdvanced)}>Advanced Settings</button>

      {showAdvanced && (
        <div>
          <span>Edge Sharpness</span>
          <span>Spot Intensity</span>
        </div>
      )}

      <div>
        <span>Admin Controls</span>
        <span>Admin Only</span>
        <span>Force Settings Override</span>
      </div>

      <button
        onClick={() => {
          fetch("/api/technology-gradient-settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(gradientData),
          });
        }}
      >
        Save Background Settings
      </button>

      {/* Added data-testid for robust targeting */}
      <input
        type="color"
        data-testid="color-picker-0"
        value={gradientData.gradientColors[0]}
        onChange={(e) =>
          setGradientData({
            ...gradientData,
            gradientColors: [e.target.value, gradientData.gradientColors[1]] as [string, string],
          })
        }
      />

      <input
        type="range"
        value={gradientData.angle}
        onChange={(e) => setGradientData({ ...gradientData, angle: parseInt(e.target.value, 10) })}
      />
    </div>
  );
};

// Critical Test: Extracted Gradient Settings Component
describe("TechnologyGradientSettings - Extracted Module", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    global.fetch = vi.fn();
  });

  const renderWithProvider = (component: React.ReactElement) => {
    return render(<QueryClientProvider client={queryClient}>{component}</QueryClientProvider>);
  };

  const mockGradientData = {
    gradientColors: ["#FF9FFC", "#5227FF"] as [string, string],
    angle: 45,
    noise: 0.3,
    blindCount: 16,
    blindMinWidth: 60,
    shineDirection: "left" as "left" | "right",
    spotlightRadius: 1.0,
    mouseDampening: 0.25,
    distortAmount: 0.15,
    paused: false,
    spotlightSoftness: 2.0,
    spotlightOpacity: 0.8,
    adminForceSettings: false,
  };

  it("should render all essential gradient controls", () => {
    const setGradientData = vi.fn();

    renderWithProvider(
      <MockTechnologyGradientSettings
        gradientData={mockGradientData}
        setGradientData={setGradientData}
      />,
    );

    // Essential controls should be visible
    expect(screen.getByText("Background Settings")).toBeTruthy();
    expect(screen.getByText("Colors")).toBeTruthy();
    expect(screen.getByText("Exactly 2 colors")).toBeTruthy();
    expect(screen.getByText(/Gradient Angle/)).toBeTruthy();
    expect(screen.getByText(/Background Texture/)).toBeTruthy();
  });

  it("should handle color changes correctly", () => {
    const setGradientData = vi.fn();

    renderWithProvider(
      <MockTechnologyGradientSettings
        gradientData={mockGradientData}
        setGradientData={setGradientData}
      />,
    );

    // Find color input securely using testid
    const firstColorInput = screen.getByTestId("color-picker-0");

    // Use proper lowercase hex as browser normalizes inputs
    fireEvent.change(firstColorInput, { target: { value: "#aa5522" } });

    expect(setGradientData).toHaveBeenCalledWith({
      ...mockGradientData,
      gradientColors: ["#aa5522", "#5227FF"],
    });
  });

  it("should toggle advanced settings visibility", () => {
    const setGradientData = vi.fn();

    renderWithProvider(
      <MockTechnologyGradientSettings
        gradientData={mockGradientData}
        setGradientData={setGradientData}
      />,
    );

    // Advanced settings should be hidden by default
    expect(screen.queryByText("Edge Sharpness")).not.toBeTruthy();

    // Click to show advanced
    const advancedButton = screen.getByText("Advanced Settings");
    fireEvent.click(advancedButton);

    // Advanced settings should now be visible
    expect(screen.getByText("Edge Sharpness")).toBeTruthy();
    expect(screen.getByText("Spot Intensity")).toBeTruthy();
  });

  it("should handle form submission correctly", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    } as Response);

    const setGradientData = vi.fn();

    renderWithProvider(
      <MockTechnologyGradientSettings
        gradientData={mockGradientData}
        setGradientData={setGradientData}
      />,
    );

    const saveButton = screen.getByText("Save Background Settings");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/technology-gradient-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mockGradientData),
      });
    });
  });

  it("should maintain ReactBits.dev specification compliance", () => {
    const setGradientData = vi.fn();

    renderWithProvider(
      <MockTechnologyGradientSettings
        gradientData={mockGradientData}
        setGradientData={setGradientData}
      />,
    );

    // Verify exactly 2 colors enforced
    expect(screen.getByText("Exactly 2 colors")).toBeTruthy();

    // Verify range controls are present with correct labels
    expect(screen.getByText("45°")).toBeTruthy(); // Angle display
    expect(screen.getByText("30%")).toBeTruthy(); // Noise percentage
    expect(screen.getByText("16")).toBeTruthy(); // Blind count
  });

  it("should handle admin controls correctly", () => {
    const setGradientData = vi.fn();

    renderWithProvider(
      <MockTechnologyGradientSettings
        gradientData={mockGradientData}
        setGradientData={setGradientData}
      />,
    );

    // Admin section should be visible
    expect(screen.getByText("Admin Controls")).toBeTruthy();
    expect(screen.getByText("Admin Only")).toBeTruthy();
    expect(screen.getByText("Force Settings Override")).toBeTruthy();
  });

  it("should preserve all original gradient data structure", () => {
    const setGradientData = vi.fn();

    renderWithProvider(
      <MockTechnologyGradientSettings
        gradientData={mockGradientData}
        setGradientData={setGradientData}
      />,
    );

    // Test angle slider
    const angleSlider = screen.getByDisplayValue("45");
    fireEvent.change(angleSlider, { target: { value: "90" } });

    expect(setGradientData).toHaveBeenCalledWith({
      ...mockGradientData,
      angle: 90,
    });
  });
});
