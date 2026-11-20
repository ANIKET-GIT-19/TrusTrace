export type DataLabel = "REAL" | "SYNTHETIC" | "MIXED";
export type Exchange = "NSE" | "BSE";
export type InstrumentType = "EQUITY" | "DERIVATIVE";
export type SizeBand = "LARGE" | "MID" | "SMALL" | "MICRO";
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

export interface SebiRegisterEntryRecord {
  id: string;
  snapshot_id: string;
  name: string;
  normalized_name: string;
  registration_no: string;
  category: string;
  snapshot_date: string;
}

export interface SebiLookupResult {
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

export type MarketCheckId =
  | "liquidity"
  | "market_cap"
  | "volume_spike"
  | "pre_tip_run_up"
  | "surveillance";

export interface MarketCheckResult {
  check_id: MarketCheckId;
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
  prior: {
    alpha: number;
    beta: number;
  };
  benchmark: string;
  as_of_date: string | null;
  data_label: DataLabel | null;
  method_version: string;
  explanation: string;
}

export interface ReportSection {
  section_id: string;
  title: string;
  template_id: string;
  sentence: string;
  source_snapshot_id: string | null;
  as_of_date: string | null;
  data_label: DataLabel | null;
}

export interface GuardedReportResponse {
  report_version: string;
  guard_status: "PASSED" | "BLOCKED_FALLBACK";
  guard_blocked_reason: string | null;
  information_verdict_title: string;
  sections: ReportSection[];
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
