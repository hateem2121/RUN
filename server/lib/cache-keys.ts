/**
 * CACHE KEYS - DEPENDENCY-FREE MODULE
 * Centralized cache key builders and invalidation patterns
 *
 * PHASE 4: Extracted to separate file to eliminate circular dependencies
 * - cache-keys.ts (this file) - NO dependencies
 * - cache-strategies.ts imports this
 * - cache-warmup-registry.ts imports this
 * - No circular dependency chain!
 */

// Cache key builders for consistent naming
export const CacheKeys = {
	homepage: {
		batch: () => "homepage:batch",
		hero: () => "homepage:hero",
		slogans: () => "homepage:slogans",
		sections: () => "homepage:sections",
		processCards: () => "homepage:process_cards",
		sustainability: () => "homepage:sustainability",
		featuredProducts: () => "homepage:featured_products",
	},

	media: {
		asset: (id: number) => `media:asset:${id}`,
		batch: (ids: number[]) => `media:batch:${ids.sort().join(",")}`,
		paginated: (limit: number, offset: number) =>
			`media:assets:${limit}:${offset}`,
		variants: (id: number, options: string) =>
			`media:variants:${id}:${options}`,
	},

	products: {
		list: (filters?: string) => `products:list${filters ? `:${filters}` : ""}`,
		summary: (limit: number, offset: number) =>
			`products:summary:${limit}:${offset}`,
		item: (id: number) => `products:item:${id}`,
		related: (id: number) => `products:related:${id}`,
		categories: () => "products:categories",
		totalCount: () => "products:total_count",
	},

	navigation: {
		items: () => "navigation:items",
		settings: () => "navigation:settings",
	},

	about: {
		batch: () => "about:batch",
		hero: () => "about:hero",
		timeline: () => "about:timeline",
		locations: () => "about:locations",
		sections: () => "about:sections",
		statistics: () => "about:statistics",
		teamMessage: () => "about:team_message",
	},

	sustainability: {
		batch: () => "sustainability:batch",
		hero: () => "sustainability:hero",
		metrics: () => "sustainability:metrics",
		fabrics: () => "sustainability:fabrics",
		unified: () => "sustainability:unified",
	},

	manufacturing: {
		batch: () => "manufacturing:batch",
		hero: () => "manufacturing:hero",
		processes: () => "manufacturing:processes",
	},

	technology: {
		batch: () => "technology:batch",
		hero: () => "technology:hero",
		innovations: () => "technology:innovations",
		gradientSettings: () => "technology:gradient_settings",
	},

	contact: {
		configuration: () => "contact:configuration",
		inquiries: () => "contact:inquiries",
	},

	footer: {
		config: () => "footer:config",
	},

	inquiries: {
		list: (
			page?: number,
			limit?: number,
			status?: string,
			source?: string,
			search?: string,
		) => {
			const params: string[] = [];
			if (page !== undefined) params.push(`page=${page}`);
			if (limit !== undefined) params.push(`limit=${limit}`);
			if (status !== undefined && status !== "")
				params.push(`status=${status}`);
			if (source !== undefined && source !== "")
				params.push(`source=${source}`);
			if (search !== undefined && search !== "")
				params.push(`search=${search}`);
			return `inquiries:list${params.length > 0 ? `:${params.join(":")}` : ""}`;
		},
		detail: (id: number) => `inquiries:detail:${id}`,
		stats: () => "inquiries:stats",
	},

	fabrics: {
		list: () => "fabrics:list",
		item: (id: number) => `fabrics:item:${id}`,
	},

	fibers: {
		list: () => "fibers:list",
		item: (id: number) => `fibers:item:${id}`,
	},

	certificates: {
		list: () => "certificates:list",
		item: (id: number) => `certificates:item:${id}`,
	},

	sizeCharts: {
		list: () => "size_charts:list",
		item: (id: number) => `size_charts:item:${id}`,
	},

	accessories: {
		list: () => "accessories:list",
		item: (id: number) => `accessories:item:${id}`,
	},

	computed: {
		query: (hash: string) => `computed:query:${hash}`,
		batch: (type: string, hash: string) => `computed:batch:${type}:${hash}`,
	},
};

// Cache invalidation patterns - proper regex for reliable matching
export const InvalidationPatterns = {
	homepage: "^homepage:.*",
	media: "^media:.*",
	products: "^products:.*",
	navigation: "^navigation:.*",
	about: "^about:.*",
	sustainability: "^sustainability:.*",
	manufacturing: "^manufacturing:.*",
	technology: "^technology:.*",
	contact: "^contact:.*",
	inquiries: "^inquiries:.*",
	fabrics: "^fabrics:.*",
	fibers: "^fibers:.*",
	certificates: "^certificates:.*",
	sizeCharts: "^size_charts:.*",
	accessories: "^accessories:.*",
	computed: "^computed:.*",
};
