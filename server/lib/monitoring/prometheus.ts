import client from "prom-client";

// Create a Registry to register methods
export const register = new client.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: "rest-express",
});

// Enable the collection of default metrics
client.collectDefaultMetrics({ register });

// Define custom metrics
export const httpRequestDurationMicroseconds = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.1, 0.5, 1, 1.5, 2, 5],
  registers: [register],
});

export const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

export const dbPoolStatus = new client.Gauge({
  name: "db_pool_status",
  help: "Database pool status",
  labelNames: ["state"], // idle, waiting, total
  registers: [register],
});

export const cacheHitsTotal = new client.Counter({
  name: "cache_hits_total",
  help: "Total number of cache hits",
  labelNames: ["cache_type"],
  registers: [register],
});

export const cacheMissesTotal = new client.Counter({
  name: "cache_misses_total",
  help: "Total number of cache misses",
  labelNames: ["cache_type"],
  registers: [register],
});

// Circuit Breaker Metrics
export const circuitBreakerState = new client.Gauge({
  name: "circuit_breaker_state",
  help: "Circuit breaker state (0=closed, 1=half_open, 2=open)",
  labelNames: ["service"],
  registers: [register],
});

export const circuitBreakerFailures = new client.Gauge({
  name: "circuit_breaker_failures",
  help: "Number of failures tracked by the circuit breaker",
  labelNames: ["service"],
  registers: [register],
});

/**
 * Update circuit breaker metrics
 * Call this periodically or when circuit state changes
 */
export function updateCircuitBreakerMetrics(
  service: string,
  state: "CLOSED" | "HALF_OPEN" | "OPEN",
  failures: number
): void {
  const stateValue = { CLOSED: 0, HALF_OPEN: 1, OPEN: 2 }[state] ?? -1;
  circuitBreakerState.labels(service).set(stateValue);
  circuitBreakerFailures.labels(service).set(failures);
}
