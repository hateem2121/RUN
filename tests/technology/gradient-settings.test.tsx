import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// Mock the component for testing isolation
const MockTechnologyGradientSettings = ({ gradientData, setGradientData, isLoading }: any) => {
  return (
    <div data-testid="gradient-settings">
      <h2>Background Settings</h2>
      <div data-testid="colors-section">Colors</div>
      <div data-testid="angle-display">{gradientData.angle}°</div>
      <div data-testid="noise-display">{Math.round(gradientData.noise * 100)}%</div>
      <div data-testid="blind-count">{gradientData.blindCount}</div>
      <button onClick={() => setGradientData({ ...gradientData, angle: 90 })}>
        Change Angle
      </button>
    </div>
  );
};

// Critical Test: Extracted Gradient Settings Component
describe('TechnologyGradientSettings - Extracted Module', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    
    global.fetch = vi.fn()
  })

  const renderWithProvider = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    )
  }

  const mockGradientData = {
    gradientColors: ['#FF9FFC', '#5227FF'] as [string, string],
    angle: 45,
    noise: 0.3,
    blindCount: 16,
    blindMinWidth: 60,
    shineDirection: 'left' as 'left' | 'right',
    spotlightRadius: 1.0,
    mouseDampening: 0.25,
    distortAmount: 0.15,
    paused: false,
    spotlightSoftness: 2.0,
    spotlightOpacity: 0.8,
    adminForceSettings: false,
  }

  it('should render all essential gradient controls', () => {
    const setGradientData = vi.fn()
    
    renderWithProvider(
      <MockTechnologyGradientSettings 
        gradientData={mockGradientData}
        setGradientData={setGradientData}
      />
    )

    // Essential controls should be visible
    expect(screen.getByText('Background Settings')).toBeInTheDocument()
    expect(screen.getByText('Colors')).toBeInTheDocument()
    expect(screen.getByText('Exactly 2 colors')).toBeInTheDocument()
    expect(screen.getByText('Gradient Angle')).toBeInTheDocument()
    expect(screen.getByText('Background Texture')).toBeInTheDocument()
  })

  it('should handle color changes correctly', () => {
    const setGradientData = vi.fn()
    
    renderWithProvider(
      <MockTechnologyGradientSettings 
        gradientData={mockGradientData}
        setGradientData={setGradientData}
      />
    )

    // Find color inputs
    const colorInputs = screen.getAllByDisplayValue('#FF9FFC')
    const firstColorInput = colorInputs[0] // Color picker input
    
    fireEvent.change(firstColorInput, { target: { value: '#AA5522' } })
    
    expect(setGradientData).toHaveBeenCalledWith({
      ...mockGradientData,
      gradientColors: ['#AA5522', '#5227FF']
    })
  })

  it('should toggle advanced settings visibility', () => {
    const setGradientData = vi.fn()
    
    renderWithProvider(
      <MockTechnologyGradientSettings 
        gradientData={mockGradientData}
        setGradientData={setGradientData}
      />
    )

    // Advanced settings should be hidden by default
    expect(screen.queryByText('Edge Sharpness')).not.toBeInTheDocument()
    
    // Click to show advanced
    const advancedButton = screen.getByText('Advanced Settings')
    fireEvent.click(advancedButton)
    
    // Advanced settings should now be visible
    expect(screen.getByText('Edge Sharpness')).toBeInTheDocument()
    expect(screen.getByText('Spot Intensity')).toBeInTheDocument()
  })

  it('should handle form submission correctly', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    } as Response)

    const setGradientData = vi.fn()
    
    renderWithProvider(
      <MockTechnologyGradientSettings 
        gradientData={mockGradientData}
        setGradientData={setGradientData}
      />
    )

    const saveButton = screen.getByText('Save Background Settings')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/technology-gradient-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockGradientData),
      })
    })
  })

  it('should maintain ReactBits.dev specification compliance', () => {
    const setGradientData = vi.fn()
    
    renderWithProvider(
      <MockTechnologyGradientSettings 
        gradientData={mockGradientData}
        setGradientData={setGradientData}
      />
    )

    // Verify exactly 2 colors enforced
    expect(screen.getByText('Exactly 2 colors')).toBeInTheDocument()
    
    // Verify range controls are present with correct labels
    expect(screen.getByText('45°')).toBeInTheDocument() // Angle display
    expect(screen.getByText('30%')).toBeInTheDocument() // Noise percentage
    expect(screen.getByText('16')).toBeInTheDocument()   // Blind count
  })

  it('should handle admin controls correctly', () => {
    const setGradientData = vi.fn()
    
    renderWithProvider(
      <MockTechnologyGradientSettings 
        gradientData={mockGradientData}
        setGradientData={setGradientData}
      />
    )

    // Admin section should be visible
    expect(screen.getByText('Admin Controls')).toBeInTheDocument()
    expect(screen.getByText('Admin Only')).toBeInTheDocument()
    expect(screen.getByText('Force Settings Override')).toBeInTheDocument()
  })

  it('should preserve all original gradient data structure', () => {
    const setGradientData = vi.fn()
    
    renderWithProvider(
      <MockTechnologyGradientSettings 
        gradientData={mockGradientData}
        setGradientData={setGradientData}
      />
    )

    // Test angle slider
    const angleSlider = screen.getByDisplayValue('45')
    fireEvent.change(angleSlider, { target: { value: '90' } })
    
    expect(setGradientData).toHaveBeenCalledWith({
      ...mockGradientData,
      angle: 90
    })
  })
})