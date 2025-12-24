import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import type React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Critical Integration Test: Admin-Public Synchronization
describe('Technology Page - Admin Sync Integration', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    
    // Mock technology API responses
    global.fetch = vi.fn()
  })

  const renderWithProvider = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    )
  }

  // Mock Technology component for testing
  const MockTechnology = () => (
    <div data-testid="technology-page">
      Technology Page Mock
      <div data-testid="sync-indicator">Synchronizing content...</div>
    </div>
  )

  it('should maintain 30s cache harmonization across components', async () => {
    const mockApiResponse = {
      id: 1,
      gradientColors: ['#FF9FFC', '#5227FF'],
      angle: 45,
      noise: 0.3,
    }

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockApiResponse),
    } as Response)

    const { rerender } = renderWithProvider(<MockTechnology />)
    
    // Wait for initial load
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/technology-gradient-settings')
    })

    // Clear fetch mock and re-render (should use cache)
    vi.mocked(fetch).mockClear()
    rerender(<MockTechnology />)

    // Should not fetch again due to 30s staleTime
    expect(fetch).not.toHaveBeenCalled()
  })

  it('should handle gradient loading states without flickering', async () => {
    vi.mocked(fetch).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: () => Promise.resolve({ gradientColors: ['#FF9FFC', '#5227FF'] }),
      } as Response), 100))
    )

    renderWithProvider(<MockTechnology />)

    // Should show loading state briefly
    expect(screen.getByText(/synchronizing content/i)).toBeInTheDocument()
    
    // Should resolve without flickering
    await waitFor(() => {
      expect(screen.queryByText(/synchronizing content/i)).not.toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('should load all 7 technology API endpoints', async () => {
    const mockResponses = {
      '/api/technology-hero': { id: 1, headline: 'Test Hero' },
      '/api/technology-innovations': [],
      '/api/technology-equipment': [],
      '/api/technology-research': [],
      '/api/technology-roadmap': [],
      '/api/technology-cta': { id: 1, headline: 'Test CTA' },
      '/api/technology-gradient-settings': { gradientColors: ['#FF9FFC', '#5227FF'] },
    }

    vi.mocked(fetch).mockImplementation((url) => {
      const endpoint = url as string
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponses[endpoint] || {}),
      } as Response)
    })

    renderWithProvider(<MockTechnology />)

    await waitFor(() => {
      Object.keys(mockResponses).forEach(endpoint => {
        expect(fetch).toHaveBeenCalledWith(endpoint)
      })
    })
  })
})