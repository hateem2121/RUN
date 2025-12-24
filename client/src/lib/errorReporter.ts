interface ClientError {
  message: string;
  stack?: string;
  componentStack?: string;
  level: "error" | "warn" | "info";
  context?: Record<string, unknown>;
}

export async function reportClientError(error: ClientError): Promise<void> {
  try {
    const response = await fetch("/api/logs/error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...error,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      // Don't log recursively if the reporting itself fails
      console.warn("Client error report failed with status:", response.status);
    }
  } catch (err) {
    // Fail silently - don't block user experience or cause infinite loops
    console.error("Failed to report error to server:", err);
  }
}
