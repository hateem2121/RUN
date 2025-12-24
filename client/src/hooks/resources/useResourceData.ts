import type {
	Accessory,
	Certificate,
	Fabric,
	Fiber,
	SizeChart,
} from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

export type ResourceType =
	| "certificate"
	| "accessory"
	| "sizechart"
	| "fabric"
	| "fiber";

export function useResourceData(type: ResourceType | "all") {
	const { data: certificates = [], isLoading: certificatesLoading } = useQuery<
		Certificate[]
	>({
		queryKey: ["/api/certificates"],
		enabled: type === "all" || type === "certificate",
	});

	const { data: accessories = [], isLoading: accessoriesLoading } = useQuery<
		Accessory[]
	>({
		queryKey: ["/api/accessories"],
		enabled: type === "all" || type === "accessory",
	});

	const { data: sizeCharts = [], isLoading: sizeChartsLoading } = useQuery<
		SizeChart[]
	>({
		queryKey: ["/api/size-charts"],
		enabled: type === "all" || type === "sizechart",
	});

	const { data: fabrics = [], isLoading: fabricsLoading } = useQuery<Fabric[]>({
		queryKey: ["/api/fabrics"],
		enabled: type === "all" || type === "fabric",
	});

	const { data: fibers = [], isLoading: fibersLoading } = useQuery<Fiber[]>({
		queryKey: ["/api/fibers"],
		enabled: type === "all" || type === "fiber",
	});

	const isLoading =
		type === "all"
			? certificatesLoading ||
				accessoriesLoading ||
				sizeChartsLoading ||
				fabricsLoading ||
				fibersLoading
			: (type === "certificate" && certificatesLoading) ||
				(type === "accessory" && accessoriesLoading) ||
				(type === "sizechart" && sizeChartsLoading) ||
				(type === "fabric" && fabricsLoading) ||
				(type === "fiber" && fibersLoading);

	return {
		certificates: Array.isArray(certificates) ? certificates : [],
		accessories: Array.isArray(accessories) ? accessories : [],
		sizeCharts: Array.isArray(sizeCharts) ? sizeCharts : [],
		fabrics: Array.isArray(fabrics) ? fabrics : [],
		fibers: Array.isArray(fibers) ? fibers : [],
		isLoading,
	};
}
