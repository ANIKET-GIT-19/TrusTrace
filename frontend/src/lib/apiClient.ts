export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:8000";

export interface HealthResponse {
  status: "ok" | "degraded";
  service: string;
  request_id: string;
  timestamp: string;
  checks: {
    database: "connected" | "not_configured" | "degraded";
    schema_baseline: string | null;
    parser_provider: "configured" | "disabled";
    voice_provider: "configured" | "disabled";
  };
}

export async function fetchApiHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/health`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`);
  }
  return (await response.json()) as HealthResponse;
}
