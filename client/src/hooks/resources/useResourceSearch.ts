import { useMemo } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import type { Certificate, Accessory, SizeChart, Fabric, Fiber } from "@shared/schema";

export interface SearchResult {
  id: number | string;
  type: 'certificate' | 'accessory' | 'sizechart' | 'fabric' | 'fiber';
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
  }
) {
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const searchResults = useMemo(() => {
    if (!debouncedSearchTerm) return [];

    const results: SearchResult[] = [];
    const term = debouncedSearchTerm.toLowerCase();

    // Search certificates
    data.certificates.forEach(cert => {
      if (cert.name.toLowerCase().includes(term) ||
          (cert.type && cert.type.toLowerCase().includes(term)) ||
          (cert.issuingBody && cert.issuingBody.toLowerCase().includes(term)) ||
          cert.description?.toLowerCase().includes(term)) {
        results.push({
          id: cert.id,
          type: 'certificate',
          title: cert.name,
          subtitle: cert.issuingBody || undefined,
          description: cert.description || undefined,
          tags: [cert.type || 'Unknown'],
          data: cert
        });
      }
    });

    // Search accessories
    data.accessories.forEach(acc => {
      if (acc.name.toLowerCase().includes(term) ||
          (acc.type && acc.type.toLowerCase().includes(term)) ||
          (acc.category && acc.category.toLowerCase().includes(term)) ||
          acc.description?.toLowerCase().includes(term)) {
        results.push({
          id: acc.id,
          type: 'accessory',
          title: acc.name,
          subtitle: acc.type || undefined,
          description: acc.description || undefined,
          tags: [acc.category || 'Uncategorized'],
          data: acc
        });
      }
    });

    // Search size charts
    data.sizeCharts.forEach(chart => {
      if (chart.name.toLowerCase().includes(term) ||
          (chart.region && chart.region.toLowerCase().includes(term)) ||
          (chart.category && chart.category.toLowerCase().includes(term))) {
        results.push({
          id: chart.id,
          type: 'sizechart',
          title: chart.name,
          subtitle: chart.region || undefined,
          tags: chart.category ? [chart.category] : [],
          data: chart
        });
      }
    });

    // Search fabrics
    data.fabrics.forEach(fabric => {
      const searchableContent = [
        fabric.name,
        fabric.weight,
        fabric.weaveType,
        fabric.finishTreatment,
        fabric.description
      ].filter(Boolean).join(' ').toLowerCase();

      if (searchableContent.includes(term)) {
        results.push({
          id: fabric.id,
          type: 'fabric',
          title: fabric.name,
          subtitle: `${fabric.weight} GSM`,
          description: fabric.description || undefined,
          tags: [fabric.weaveType, fabric.finishTreatment].filter((t): t is string => Boolean(t)),
          data: fabric
        });
      }
    });

    // Search fibers
    data.fibers.forEach(fiber => {
      if (fiber.name.toLowerCase().includes(term) ||
          fiber.type.toLowerCase().includes(term) ||
          fiber.properties?.toLowerCase().includes(term) ||
          fiber.description?.toLowerCase().includes(term)) {
        results.push({
          id: fiber.id,
          type: 'fiber',
          title: fiber.name,
          subtitle: fiber.type,
          description: fiber.description || undefined,
          tags: fiber.properties?.split(',').map((p: string) => p.trim()).slice(0, 3),
          data: fiber
        });
      }
    });

    return results;
  }, [debouncedSearchTerm, data]);

  return {
    searchResults,
    isSearching: searchTerm !== debouncedSearchTerm
  };
}