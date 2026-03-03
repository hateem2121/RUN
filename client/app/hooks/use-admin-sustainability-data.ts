import type {
  Certificate,
  SustainabilityGoal,
  SustainabilityInitiative,
  SustainabilityMetric,
  UnifiedSustainability,
} from "@shared/index";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

interface BatchData {
  hero: UnifiedSustainability | null;
  metrics: SustainabilityMetric[];
  initiatives: SustainabilityInitiative[];
  goals: SustainabilityGoal[];
  certificates: Certificate[];
}

interface PaginationState {
  metricsPage: number;
  setMetricsPage: (page: number) => void;
  initiativesPage: number;
  setInitiativesPage: (page: number) => void;
  goalsPage: number;
  setGoalsPage: (page: number) => void;
}

interface UseAdminSustainabilityDataReturn {
  batchData: BatchData | undefined;
  isLoading: boolean;
  unifiedData: UnifiedSustainability | null;
  metrics: SustainabilityMetric[];
  initiatives: SustainabilityInitiative[];
  goals: SustainabilityGoal[];
  availableCertificates: Certificate[];
  paginatedMetrics: SustainabilityMetric[];
  paginatedInitiatives: SustainabilityInitiative[];
  paginatedGoals: SustainabilityGoal[];
  metricsTotalPages: number;
  initiativesTotalPages: number;
  goalsTotalPages: number;
  pagination: PaginationState;
}

const ITEMS_PER_PAGE = 10;

function paginateArray<T>(array: T[], page: number, perPage: number): T[] {
  const startIndex = (page - 1) * perPage;
  const endIndex = startIndex + perPage;
  return array.slice(startIndex, endIndex);
}

function getTotalPages(totalItems: number, perPage: number): number {
  return Math.ceil(totalItems / perPage);
}

export function useAdminSustainabilityData(): UseAdminSustainabilityDataReturn {
  const [metricsPage, setMetricsPage] = useState(1);
  const [initiativesPage, setInitiativesPage] = useState(1);
  const [goalsPage, setGoalsPage] = useState(1);

  // OPTIMIZED: Single batch query replaces 5 individual queries to reduce NEON active time
  const { data: batchData, isLoading } = useQuery<BatchData>({
    queryKey: ["/api/sustainability/batch"],
  });

  // Destructure batch data
  const unifiedData = batchData?.hero || null;
  const metrics = batchData?.metrics || [];
  const initiatives = batchData?.initiatives || [];
  const goals = batchData?.goals || [];
  const availableCertificates = batchData?.certificates || [];

  // Calculate paginated data
  const paginatedMetrics = useMemo(
    () => paginateArray(metrics, metricsPage, ITEMS_PER_PAGE),
    [metrics, metricsPage],
  );

  const paginatedInitiatives = useMemo(
    () => paginateArray(initiatives, initiativesPage, ITEMS_PER_PAGE),
    [initiatives, initiativesPage],
  );

  const paginatedGoals = useMemo(
    () => paginateArray(goals, goalsPage, ITEMS_PER_PAGE),
    [goals, goalsPage],
  );

  const metricsTotalPages = useMemo(
    () => getTotalPages(metrics.length, ITEMS_PER_PAGE),
    [metrics.length],
  );

  const initiativesTotalPages = useMemo(
    () => getTotalPages(initiatives.length, ITEMS_PER_PAGE),
    [initiatives.length],
  );

  const goalsTotalPages = useMemo(
    () => getTotalPages(goals.length, ITEMS_PER_PAGE),
    [goals.length],
  );

  // Clamp page numbers when data changes to prevent empty pages
  useEffect(() => {
    if (metricsPage > metricsTotalPages && metricsTotalPages > 0) {
      setMetricsPage(metricsTotalPages);
    }
  }, [metricsPage, metricsTotalPages]);

  useEffect(() => {
    if (initiativesPage > initiativesTotalPages && initiativesTotalPages > 0) {
      setInitiativesPage(initiativesTotalPages);
    }
  }, [initiativesPage, initiativesTotalPages]);

  useEffect(() => {
    if (goalsPage > goalsTotalPages && goalsTotalPages > 0) {
      setGoalsPage(goalsTotalPages);
    }
  }, [goalsPage, goalsTotalPages]);

  return {
    batchData,
    isLoading,
    unifiedData,
    metrics,
    initiatives,
    goals,
    availableCertificates,
    paginatedMetrics,
    paginatedInitiatives,
    paginatedGoals,
    metricsTotalPages,
    initiativesTotalPages,
    goalsTotalPages,
    pagination: {
      metricsPage,
      setMetricsPage,
      initiativesPage,
      setInitiativesPage,
      goalsPage,
      setGoalsPage,
    },
  };
}
