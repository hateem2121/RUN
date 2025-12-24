/**
 * PHASE 2: TECHNOLOGY MODERNIZATION
 *
 * Feature Flag Hook for Safe Component Switching
 *
 * Provides runtime component selection with instant rollback capability
 * Prevents deployment-based rollbacks by enabling runtime switching
 */

import { useEffect, useState } from "react";

// Development-only logging
const warnLog = (message: string, ...args: any[]) => {
	if (import.meta.env.DEV) {
	}
};

const errorLog = (message: string, ...args: any[]) => {
	if (import.meta.env.DEV) {
	}
};

interface TechnologyFeatureFlags {
	useLegacyTechnologyManagement: boolean;
	useModularTechnologyComponents: boolean;
	enableTechnologyCacheOptimization: boolean;
	useSimplifiedCaching: boolean;
	enableTechnologyBatchAPI: boolean;
	enableTechnologyDebugMode: boolean;
	enablePerformanceMetrics: boolean;
}

export function useTechnologyFeatureFlags(): TechnologyFeatureFlags {
	const [flags, setFlags] = useState<TechnologyFeatureFlags>({
		// MODULAR COMPONENTS NOW ENABLED: Using extracted components
		useLegacyTechnologyManagement: false,
		useModularTechnologyComponents: true,
		enableTechnologyCacheOptimization: true,
		useSimplifiedCaching: false,
		enableTechnologyBatchAPI: false,
		enableTechnologyDebugMode: process.env.NODE_ENV === "development",
		enablePerformanceMetrics: true,
	});

	useEffect(() => {
		// Fetch current feature flags from server
		const fetchFlags = async () => {
			try {
				const response = await fetch("/api/feature-flags");
				if (response.ok) {
					const data = await response.json();
					if (data.success) {
						setFlags(data.data);
					}
				}
			} catch (error) {
				warnLog("[FeatureFlags] Failed to fetch flags, using defaults");
			}
		};

		fetchFlags();
	}, []);

	return flags;
}

/**
 * Emergency rollback function for client-side safety
 */
export async function emergencyTechnologyRollback(): Promise<boolean> {
	try {
		const response = await fetch("/api/feature-flags/emergency-rollback", {
			method: "POST",
		});

		if (response.ok) {
			// Reload page to apply rollback immediately
			window.location.reload();
			return true;
		}
		return false;
	} catch (error) {
		errorLog("[Emergency] Rollback failed:", error);
		return false;
	}
}
