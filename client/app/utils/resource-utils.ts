// Utility functions for resource pages

export function groupByCategory<T extends { category?: string; type?: string }>(
  items: T[],
  key: "category" | "type" = "category",
): Record<string, T[]> {
  return items.reduce(
    (acc, item) => {
      const groupKey = item[key] || "Other";
      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      acc[groupKey].push(item);
      return acc;
    },
    {} as Record<string, T[]>,
  );
}

export function getResourceStats(resources: {
  certificates: unknown[];
  accessories: unknown[];
  sizeCharts: unknown[];
  fabrics: unknown[];
  fibers: unknown[];
}) {
  return {
    total: Object.values(resources).reduce((sum, arr) => sum + arr.length, 0),
    byType: {
      certificates: resources.certificates.length,
      accessories: resources.accessories.length,
      sizeCharts: resources.sizeCharts.length,
      fabrics: resources.fabrics.length,
      fibers: resources.fibers.length,
    },
  };
}

export function filterByActiveStatus<T extends { active?: boolean }>(
  items: T[],
  activeOnly: boolean = false,
): T[] {
  if (!activeOnly) {
    return items;
  }
  return items.filter((item) => item.active !== false);
}
