import client from "prom-client";
import { register } from "./prometheus.js";

// Business Metrics - Key Performance Indicators (KPIs)

export const bizOrderPlacedTotal = new client.Counter({
	name: "biz_order_placed_total",
	help: "Total number of orders placed",
	labelNames: ["status", "currency"], // e.g. status=success|failed
	registers: [register],
});

export const bizCartAddTotal = new client.Counter({
	name: "biz_cart_add_total",
	help: "Total number of items added to cart",
	labelNames: ["product_category"],
	registers: [register],
});

export const bizSearchZeroResultsTotal = new client.Counter({
	name: "biz_search_zero_results_total",
	help: "Total number of searches returning zero results",
	labelNames: ["context"], // e.g. global_search, category_filter
	registers: [register],
});

export const bizPaymentFailureTotal = new client.Counter({
	name: "biz_payment_failure_total",
	help: "Total number of payment failures",
	labelNames: ["provider", "reason"],
	registers: [register],
});

// Helper to track business events cleanly in controllers
type BusinessEventType =
	| "order_placed"
	| "cart_add"
	| "search_zero_results"
	| "payment_failure";

export function trackBusinessEvent(
	event: BusinessEventType,
	labels: Record<string, string | number> = {},
) {
	try {
		// Convert all labels to strings for Prometheus
		const safeLabels: Record<string, string> = {};
		for (const [key, value] of Object.entries(labels)) {
			safeLabels[key] = String(value);
		}

		switch (event) {
			case "order_placed":
				bizOrderPlacedTotal.inc(safeLabels);
				break;
			case "cart_add":
				bizCartAddTotal.inc(safeLabels);
				break;
			case "search_zero_results":
				bizSearchZeroResultsTotal.inc(safeLabels);
				break;
			case "payment_failure":
				bizPaymentFailureTotal.inc(safeLabels);
				break;
		}
	} catch (error) {}
}
