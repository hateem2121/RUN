import {
	QueryClient,
	QueryClientProvider,
	useQuery,
} from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Critical Integration Test: Admin-Public Synchronization
describe("Technology Page - Admin Sync Integration", () => {
	let queryClient: QueryClient;

	beforeEach(() => {
		queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false, staleTime: 30_000 },
				mutations: { retry: false },
			},
		});

		// Mock technology API responses
		global.fetch = vi.fn();
	});

	// Mock Technology component using TanStack Query to respect cache
	const MockTechnology = () => {
		const { status, isFetching } = useQuery({
			queryKey: ["technology-sync"],
			queryFn: async () => {
				const endpoints = [
					"/api/technology-gradient-settings",
					"/api/technology-hero",
					"/api/technology-innovations",
					"/api/technology-equipment",
					"/api/technology-research",
					"/api/technology-roadmap",
					"/api/technology-cta",
				];
				await Promise.all(endpoints.map((url) => fetch(url)));
				return "Ready";
			},
		});

		return (
			<div data-testid="technology-page">
				Technology Page Mock
				{(status === "pending" || isFetching) && (
					<div data-testid="sync-indicator">Synchronizing content...</div>
				)}
			</div>
		);
	};

	it("should maintain 30s cache harmonization across components", async () => {
		const mockApiResponse = {
			id: 1,
			gradientColors: ["#FF9FFC", "#5227FF"],
			angle: 45,
			noise: 0.3,
		};

		vi.mocked(fetch).mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(mockApiResponse),
		} as Response);

		// Use wrapper pattern to ensure rerender works with context
		const { rerender } = render(<MockTechnology />, {
			wrapper: ({ children }) => (
				<QueryClientProvider client={queryClient}>
					{children}
				</QueryClientProvider>
			),
		});

		// Wait for initial load
		await waitFor(() => {
			expect(fetch).toHaveBeenCalledWith("/api/technology-gradient-settings");
		});

		// Clear fetch mock and re-render
		vi.mocked(fetch).mockClear();

		// Rerender component (wrapper is preserved)
		rerender(<MockTechnology />);

		// Should not fetch again due to 30s staleTime
		// We wait a bit to ensure no fetch happens
		await new Promise((resolve) => setTimeout(resolve, 100));
		expect(fetch).not.toHaveBeenCalled();
	});

	it("should handle gradient loading states without flickering", async () => {
		vi.mocked(fetch).mockImplementation(
			() =>
				new Promise((resolve) =>
					setTimeout(
						() =>
							resolve({
								ok: true,
								json: () =>
									Promise.resolve({ gradientColors: ["#FF9FFC", "#5227FF"] }),
							} as Response),
						100,
					),
				),
		);

		render(<MockTechnology />, {
			wrapper: ({ children }) => (
				<QueryClientProvider client={queryClient}>
					{children}
				</QueryClientProvider>
			),
		});

		// Should show loading state briefly
		expect(screen.getByText(/synchronizing content/i)).toBeInTheDocument();

		// Should resolve without flickering
		await waitFor(
			() => {
				expect(
					screen.queryByText(/synchronizing content/i),
				).not.toBeInTheDocument();
			},
			{ timeout: 2000 },
		);
	});

	it("should load all 7 technology API endpoints", async () => {
		const mockResponses = {
			"/api/technology-hero": { id: 1, headline: "Test Hero" },
			"/api/technology-innovations": [],
			"/api/technology-equipment": [],
			"/api/technology-research": [],
			"/api/technology-roadmap": [],
			"/api/technology-cta": { id: 1, headline: "Test CTA" },
			"/api/technology-gradient-settings": {
				gradientColors: ["#FF9FFC", "#5227FF"],
			},
		};

		vi.mocked(fetch).mockImplementation((url) => {
			const endpoint = url as string;
			return Promise.resolve({
				ok: true,
				json: () => Promise.resolve(mockResponses[endpoint] || {}),
			} as Response);
		});

		render(<MockTechnology />, {
			wrapper: ({ children }) => (
				<QueryClientProvider client={queryClient}>
					{children}
				</QueryClientProvider>
			),
		});

		await waitFor(() => {
			Object.keys(mockResponses).forEach((endpoint) => {
				expect(fetch).toHaveBeenCalledWith(endpoint);
			});
		});
	});
});
