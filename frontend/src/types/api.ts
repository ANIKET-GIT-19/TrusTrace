export type DataLabel = "REAL" | "SYNTHETIC" | "MIXED";
export type InstrumentType = "EQUITY" | "DERIVATIVE";
export type DisclosureGrade = "CLEAR" | "VAGUE" | "NONE" | "UNKNOWN";
export type TipDirection = "BULLISH" | "BEARISH" | "NEUTRAL";
export type CheckStatus = "WITHIN_NORMAL_RANGE" | "NEEDS_ATTENTION" | "COULD_NOT_VERIFY";
export type SebiLookupStatus = "REGISTERED" | "NOT_FOUND" | "UNCLEAR";

export interface SourceSpan {
  start: number;
  end: number;
  text: string;
}

export interface ClaimField<T = string | number | null> {
  value: T;
  status: "EXTRACTED" | "NOT_STATED" | "UNCLEAR";
  gated?: boolean;
  note?: string;
  evidence: SourceSpan | null;
}

export interface ClaimLedger {
  stock: ClaimField<string | null>;
  direction: ClaimField<TipDirection | null>;
  target_price: ClaimField<number | null>;
  deadline: ClaimField<string | null>;
  stop_loss: ClaimField<number | null>;
}

export interface HypeFlag {
  phrase: string;
  start: number;
  end: number;
  rule_id: string;
  category: "CERTAINTY" | "URGENCY" | "PROMOTIONAL" | "RETURN_PROMISE";
}

export interface DisclosureGradeResult {
  grade: DisclosureGrade;
  evidence: SourceSpan[];
  method_version: string;
  plain_ad_baseline_matched: boolean;
  explanation: string;
}

export interface ParseResponse {
  request_id: string;
  schema_version: string;
  extracted_text: string;
  media_intake: {
    received: boolean;
    kind: "PHOTO" | "VIDEO" | null;
    detected_mime: string | null;
    byte_length: number;
    persisted: false;
    extraction_mode: "TEXT_ONLY" | "CURATED_DEMO_TRANSCRIPT" | "PROVIDER_UNAVAILABLE_FALLBACK";
    notice: string | null;
  };
  claims: ClaimLedger;
  hype_flags: HypeFlag[];
  hype_dictionary_version: string;
  disclosure_grade: DisclosureGradeResult;
  parser: {
    status: "COMPLETED" | "FALLBACK_STRUCTURED_ONLY";
    version: string;
    note: string | null;
  };
}

export interface SebiLookupResponse {
  request_id: string;
  influencer_id: string | null;
  query: string;
  status: SebiLookupStatus;
  matched_name: string | null;
  registration_no: string | null;
  category: string | null;
  snapshot_id: string | null;
  snapshot_date: string | null;
  data_label: DataLabel | null;
  explanation: string;
  candidates_considered: number;
}

export interface StockLookupItem {
  ticker: string;
  company_name: string;
  exchange: "NSE" | "BSE";
  instrument_type: InstrumentType;
  underlying_ticker: string | null;
  has_price_history: boolean;
  latest_price_date: string | null;
}

export interface PricesResponse {
  request_id: string;
  ticker: string;
  company_name: string;
  instrument_type: InstrumentType;
  series_scope: "SECURITY" | "UNDERLYING_INDEX";
  underlying_ticker: string | null;
  as_of_date: string | null;
  source_snapshot_id: string | null;
  source_name: string | null;
  data_label: DataLabel | null;
  series: Array<{
    trading_date: string;
    close: number;
    volume: number | null;
  }>;
}

export interface TipMarkerItem {
  tip_date: string;
  count: number;
  has_synthetic: boolean;
  data_label: DataLabel;
}

export interface ExactDateTip {
  id: string;
  influencer_id: string;
  ticker: string;
  tip_date: string;
  text: string;
  direction: TipDirection | null;
  target_price: number | null;
  deadline: string | null;
  stop_loss: number | null;
  disclosure_grade: DisclosureGrade;
  source_url: string | null;
  is_synthetic: boolean;
  data_label: DataLabel;
  snapshot_id: string;
}

export interface MarketCheckResult {
  check_id: "liquidity" | "market_cap" | "volume_spike" | "pre_tip_run_up" | "surveillance";
  label: string;
  status: CheckStatus;
  measured_value: number | string | null;
  unit: string | null;
  as_of_date: string | null;
  source_snapshot_id: string | null;
  source_name: string | null;
  data_label: DataLabel | null;
  method_version: string;
  explanation_key: string;
  explanation: string;
  reason_code: string | null;
  details?: Record<string, string | number | boolean | null>;
}

export interface TrackRecordResult {
  status: "INTERVAL_AVAILABLE" | "NOT_ENOUGH_TIPS_TO_JUDGE";
  creator_id: string | null;
  creator_name: string | null;
  resolved_count: number;
  success_count: number;
  failure_count: number;
  excluded_count: number;
  minimum_sample_policy: number;
  credible_interval_level: number;
  credible_interval: {
    lower: number;
    upper: number;
    posterior_mean: number;
  } | null;
  matched_baseline: number;
  clears_baseline: boolean;
  prior: { alpha: number; beta: number };
  benchmark: string;
  as_of_date: string | null;
  data_label: DataLabel | null;
  method_version: string;
  explanation: string;
}

export interface ChecksResponse {
  request_id: string;
  ticker: string;
  company_name: string;
  instrument_type: InstrumentType;
  underlying_ticker: string | null;
  as_of_date: string;
  tip_date: string;
  methodology_version: string;
  checks: MarketCheckResult[];
  track_record: TrackRecordResult;
}

export interface GuardedReportResponse {
  request_id: string;
  report_version: string;
  guard_status: "PASSED" | "BLOCKED_FALLBACK";
  guard_blocked_reason: string | null;
  information_verdict_title: string;
  sections: Array<{
    section_id: string;
    title: string;
    template_id: string;
    sentence: string;
    source_snapshot_id: string | null;
    as_of_date: string | null;
    data_label: DataLabel | null;
  }>;
  creator_quoted_claim: {
    label: "Creator's claim";
    quoted_text: string | null;
    target_price_claimed: number | null;
    disclaimer: string;
  };
  provenance_summary: {
    snapshot_ids: string[];
    as_of_dates: string[];
    data_labels: DataLabel[];
  };
  mandatory_disclaimer: string;
}

export interface BenchmarkSummary {
  key: "NIFTY_50" | "SENSEX" | "BANKNIFTY";
  label: string;
  status: "AVAILABLE" | "COULD_NOT_VERIFY";
  close: number | null;
  change: number | null;
  change_percent: number | null;
  as_of_date: string | null;
  data_label: DataLabel | null;
  source_name: string | null;
  sparkline: Array<{ date: string; close: number }>;
}

export interface DemoCaseMeta {
  id: string;
  influencer_id: string;
  influencer_name: string;
  alias: string | null;
  ticker: string;
  instrument_name: string;
  instrument_type: InstrumentType;
  underlying_ticker: string | null;
  media_type: "PHOTO" | "VIDEO";
  media_path: string;
  tip_date: string;
  sample_text: string;
  sebi_expected_status: "REGISTERED" | "NOT_FOUND";
  data_label: DataLabel;
  coverage_note: string;
}
