import type { Accessory, Certificate, Fabric, Fiber, SizeChart } from "@shared/index";
import { useMemo } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { getPropertiesArray } from "@/lib/fiber-utils";

export interface SearchResult {
  id: number | string;
  type: "certificate" | "accessory" | "sizechart" | "fabric" | "fiber";
  title: string;
  subtitle?: string;
  description?: string;
  tags?: string[];
  data: Certificate | Accessory | SizeChart | Fabric | Fiber;
}

export function useResourceSearch(
  searchTerm: string,
  data: {
    certificates: Certificate[];
    accessories: Accessory[];
    sizeCharts: SizeChart[];
    fabrics: Fabric[];
    fibers: Fiber[];
  },
) {
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const searchResults = useMemo(() => {
    if (!debouncedSearchTerm) {
      return [];
    }

    const results: SearchResult[] = [];
    const term = searchTerm.toLowerCase(); // Changed from debouncedSearchTerm

    // Search certificates
    data.certificates.forEach((cert) => {
      if (
        cert.name.toLowerCase().includes(term) ||
        cert.type?.toLowerCase().includes(term) ||
        cert.issuingBody?.toLowerCase().includes(term) ||
        cert.description?.toLowerCase().includes(term)
      ) {
        results.push({
          id: cert.id,
          type: "certificate",
          title: cert.name,
          ...(cert.issuingBody ? { subtitle: cert.issuingBody } : {}),
          ...(cert.description ? { description: cert.description } : {}),
          tags: [cert.type || "Unknown"],
          data: cert,
        });
      }
    });

    // Search accessories
    data.accessories.forEach((acc) => {
      if (
        acc.name.toLowerCase().includes(term) ||
        acc.type?.toLowerCase().includes(term) ||
        acc.category?.toLowerCase().includes(term) ||
        acc.description?.toLowerCase().includes(term)
      ) {
        results.push({
          id: acc.id,
          type: "accessory",
          title: acc.name,
          ...(acc.type ? { subtitle: acc.type } : {}),
          ...(acc.description ? { description: acc.description } : {}),
          tags: [acc.category || "Uncategorized"],
          data: acc,
        });
      }
    });

    // Search size charts
    data.sizeCharts.forEach((chart) => {
      if (
        chart.name.toLowerCase().includes(term) ||
        chart.region?.toLowerCase().includes(term) ||
        chart.category?.toLowerCase().includes(term)
      ) {
        results.push({
          id: chart.id,
          type: "sizechart",
          title: chart.name,
          ...(chart.region ? { subtitle: chart.region } : {}),
          tags: chart.category ? [chart.category] : [],
          data: chart,
        });
      }
    });

    // Search fabrics
    data.fabrics.forEach((fabric) => {
      const searchableContent = [
        fabric.name,
        fabric.weight,
        fabric.weaveType,
        fabric.finishTreatment,
        fabric.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (searchableContent.includes(term)) {
        results.push({
          id: fabric.id,
          type: "fabric",
          title: fabric.name,
          subtitle: `${fabric.weight} GSM`,
          ...(fabric.description ? { description: fabric.description } : {}),
          tags: [fabric.weaveType, fabric.finishTreatment].filter((t): t is string => Boolean(t)),
          data: fabric,
        });
      }
    });

    // Search fibers
    data.fibers.forEach((fiber) => {
      const propertiesArray = getPropertiesArray(fiber.properties);
      const searchableContent = [fiber.name, fiber.type, fiber.description, ...propertiesArray]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (searchableContent.includes(term)) {
        results.push({
          id: fiber.id,
          type: "fiber",
          title: fiber.name,
          subtitle: fiber.type,
          ...(fiber.description ? { description: fiber.description } : {}),
          tags: propertiesArray.slice(0, 3),
          data: fiber,
        });
      }
    });

    return results;
  }, [debouncedSearchTerm, data, searchTerm.toLowerCase]);

  return {
    searchResults,
    isSearching: searchTerm !== debouncedSearchTerm,
  };
}
