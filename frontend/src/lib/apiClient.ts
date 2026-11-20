import type {
  BenchmarkSummary,
  ChecksResponse,
  ClaimLedger,
  CoordinatedDemoSignalResponse,
  DemoCaseMeta,
  ExactDateTip,
  GuardedReportResponse,
  ParseResponse,
  PricesResponse,
  SebiLookupResponse,
  StockLookupItem,
  SupportedVoiceLanguage,
  TipMarkerItem,
  VoiceReadoutResponse,
} from "../types/api";

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

async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    let message = `API request failed (${response.status})`;
    try {
      const errBody = (await response.json()) as { error?: { message?: string } };
      if (errBody?.error?.message) message = errBody.error.message;
    } catch {
      // Keep default safe message
    }
    throw new Error(message);
  }
  return (await response.json()) as T;
}

export function fetchApiHealth(): Promise<HealthResponse> {
  return apiJson<HealthResponse>("/api/health");
}

export function parseTip(params: {
  text?: string;
  influencer_name?: string;
  stock_name?: string;
  demo_case_id?: string;
  file?: File | null;
}): Promise<ParseResponse> {
  if (params.file) {
    const form = new FormData();
    form.append("file", params.file);
    if (params.text) form.append("text", params.text);
    if (params.influencer_name) form.append("influencer_name", params.influencer_name);
    if (params.stock_name) form.append("stock_name", params.stock_name);
    if (params.demo_case_id) form.append("demo_case_id", params.demo_case_id);
    return apiJson<ParseResponse>("/api/tips/parse", {
      method: "POST",
      body: form,
    });
  }

  return apiJson<ParseResponse>("/api/tips/parse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: params.text ?? "",
      influencer_name: params.influencer_name ?? "",
      stock_name: params.stock_name ?? "",
      demo_case_id: params.demo_case_id,
    }),
  });
}

export function lookupInfluencer(query: string): Promise<SebiLookupResponse> {
  return apiJson<SebiLookupResponse>(`/api/influencers/lookup?q=${encodeURIComponent(query)}`);
}

export async function lookupStocks(query: string): Promise<StockLookupItem[]> {
  const res = await apiJson<{ items: StockLookupItem[] }>(
    `/api/stocks/lookup?q=${encodeURIComponent(query)}`
  );
  return res.items;
}

export function fetchStockPrices(
  ticker: string,
  from?: string,
  to?: string
): Promise<PricesResponse> {
  const qs = new URLSearchParams();
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  const query = qs.toString();
  return apiJson<PricesResponse>(
    `/api/stocks/${encodeURIComponent(ticker)}/prices${query ? `?${query}` : ""}`
  );
}

export async function fetchTipMarkers(
  influencerId: string,
  ticker: string
): Promise<TipMarkerItem[]> {
  const res = await apiJson<{ markers: TipMarkerItem[] }>(
    `/api/influencers/${encodeURIComponent(influencerId)}/tips?ticker=${encodeURIComponent(ticker)}`
  );
  return res.markers;
}

export async function fetchExactDateTips(
  influencerId: string,
  ticker: string,
  date: string
): Promise<ExactDateTip[]> {
  const res = await apiJson<{ tips: ExactDateTip[] }>(
    `/api/influencers/${encodeURIComponent(influencerId)}/tips?ticker=${encodeURIComponent(ticker)}&date=${encodeURIComponent(date)}`
  );
  return res.tips;
}

export function fetchStockChecks(params: {
  ticker: string;
  asOf?: string;
  tipDate?: string;
  influencerId?: string | null;
}): Promise<ChecksResponse> {
  const qs = new URLSearchParams();
  if (params.asOf) qs.set("asOf", params.asOf);
  if (params.tipDate) qs.set("tipDate", params.tipDate);
  if (params.influencerId) qs.set("influencerId", params.influencerId);
  return apiJson<ChecksResponse>(
    `/api/stocks/${encodeURIComponent(params.ticker)}/checks?${qs.toString()}`
  );
}

export function buildGuardedReport(params: {
  ticker: string;
  tip_date: string;
  as_of_date?: string;
  influencer_id?: string | null;
  influencer_name?: string | null;
  original_text?: string | null;
  claims?: ClaimLedger;
}): Promise<GuardedReportResponse> {
  return apiJson<GuardedReportResponse>("/api/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
}

export async function fetchBenchmarks(): Promise<BenchmarkSummary[]> {
  const res = await apiJson<{ benchmarks: BenchmarkSummary[] }>("/api/meta/benchmarks");
  return res.benchmarks;
}

export async function fetchDemoCases(): Promise<DemoCaseMeta[]> {
  const res = await apiJson<{ items: DemoCaseMeta[] }>("/api/meta/demo-cases");
  return res.items;
}

export function requestVoiceReadout(params: {
  guarded_text: string;
  language: SupportedVoiceLanguage;
}): Promise<VoiceReadoutResponse> {
  return apiJson<VoiceReadoutResponse>("/api/voice/readout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
}

export function fetchCoordinatedDemoSignal(
  ticker: string
): Promise<CoordinatedDemoSignalResponse> {
  return apiJson<CoordinatedDemoSignalResponse>(
    `/api/meta/coordinated-demo?ticker=${encodeURIComponent(ticker)}`
  );
}
