import { Decimal } from "decimal.js";
import type {
  DataLabel,
  InstrumentType,
  MarketCheckResult,
  SizeBand,
} from "../types.js";

export interface MethodologyConfig {
  version: string;
  lookbackSessions: number;
  preTipRunUpSessions: number;
  /** Minimum average daily traded value in INR (₹1 Crore = 10,000,000) below which liquidity needs attention */
  lowLiquidityThresholdInr: number;
  /** Volume ratio (tip-day / prior N avg) at or above which volume spike needs attention */
  volumeSpikeRatioThreshold: number;
  /** Absolute 5-session pre-tip percentage move at or above which lateness/run-up needs attention */
  preTipRunUpPercentThreshold: number;
  /** Max calendar days a market-cap or surveillance snapshot may lag before being marked stale */
  maxSnapshotStaleDays: number;
}

export const METHODOLOGY_CONFIG_V1: MethodologyConfig = {
  version: "checks-v1",
  lookbackSessions: 20,
  preTipRunUpSessions: 5,
  lowLiquidityThresholdInr: 50_000_000, // ₹5 Crore average daily traded value (versioned initial calibration)
  volumeSpikeRatioThreshold: 2.5,
  preTipRunUpPercentThreshold: 12,
  maxSnapshotStaleDays: 90,
};

export interface PriceBar {
  trading_date: string; // YYYY-MM-DD
  close: number | string;
  volume: number;
  snapshot_id: string;
  source_name: string;
  data_label: DataLabel;
}

export interface StockInfoSnapshot {
  ticker: string;
  market_cap: number | string | null;
  size_band: SizeBand | null;
  circuit_band: string | null;
  as_of_date: string;
  snapshot_id: string;
  source_name: string;
  data_label: DataLabel;
  classification_version: string;
}

export interface SurveillanceSnapshot {
  ticker: string;
  list_name: string;
  is_active: boolean;
  snapshot_date: string;
  snapshot_id: string;
  source_name: string;
  data_label: DataLabel;
}

function daysBetween(dateA: string, dateB: string): number {
  const msA = Date.parse(`${dateA}T00:00:00Z`);
  const msB = Date.parse(`${dateB}T00:00:00Z`);
  return Math.abs(Math.round((msB - msA) / 86_400_000));
}

function sortBarsAscending(bars: PriceBar[]): PriceBar[] {
  return [...bars].sort((a, b) => a.trading_date.localeCompare(b.trading_date));
}

function couldNotVerify(params: {
  check_id: MarketCheckResult["check_id"];
  label: string;
  method_version: string;
  explanation_key: string;
  explanation: string;
  reason_code: string;
  as_of_date?: string | null;
  source_snapshot_id?: string | null;
  source_name?: string | null;
  data_label?: DataLabel | null;
}): MarketCheckResult {
  return {
    check_id: params.check_id,
    label: params.label,
    status: "COULD_NOT_VERIFY",
    measured_value: null,
    unit: null,
    as_of_date: params.as_of_date ?? null,
    source_snapshot_id: params.source_snapshot_id ?? null,
    source_name: params.source_name ?? null,
    data_label: params.data_label ?? null,
    method_version: params.method_version,
    explanation_key: params.explanation_key,
    explanation: params.explanation,
    reason_code: params.reason_code,
  };
}

export function computeLiquidityCheck(params: {
  instrumentType: InstrumentType;
  bars: PriceBar[];
  asOfDate: string;
  config?: MethodologyConfig;
}): MarketCheckResult {
  const cfg = params.config ?? METHODOLOGY_CONFIG_V1;
  const methodVersion = `liquidity-${cfg.version}`;

  if (params.instrumentType === "DERIVATIVE") {
    return couldNotVerify({
      check_id: "liquidity",
      label: "Liquidity",
      method_version: methodVersion,
      explanation_key: "liquidity_derivative_inapplicable",
      explanation:
        "Cash-equity traded-value liquidity thresholds do not apply directly to index option contracts.",
      reason_code: "DERIVATIVE_CHECK_INAPPLICABLE",
    });
  }

  const eligible = sortBarsAscending(params.bars).filter(
    (b) => b.trading_date <= params.asOfDate && Number(b.close) > 0 && b.volume > 0
  );

  if (eligible.length < cfg.lookbackSessions) {
    return couldNotVerify({
      check_id: "liquidity",
      label: "Liquidity",
      method_version: methodVersion,
      explanation_key: "liquidity_insufficient_history",
      explanation: `Fewer than ${cfg.lookbackSessions} valid trading sessions with positive close and volume were available as of ${params.asOfDate}.`,
      reason_code: "INSUFFICIENT_HISTORY",
      as_of_date: eligible[eligible.length - 1]?.trading_date ?? null,
      source_snapshot_id: eligible[eligible.length - 1]?.snapshot_id ?? null,
      source_name: eligible[eligible.length - 1]?.source_name ?? null,
      data_label: eligible[eligible.length - 1]?.data_label ?? null,
    });
  }

  const window = eligible.slice(-cfg.lookbackSessions);
  const totalTradedValue = window.reduce(
    (acc, bar) => acc.plus(new Decimal(bar.close).times(bar.volume)),
    new Decimal(0)
  );
  const avgDailyValueInr = totalTradedValue.div(window.length);
  const avgDailyCrores = avgDailyValueInr.div(10_000_000).toDecimalPlaces(2).toNumber();
  const latestBar = window[window.length - 1]!;
  const needsAttention = avgDailyValueInr.lt(cfg.lowLiquidityThresholdInr);

  return {
    check_id: "liquidity",
    label: "Liquidity",
    status: needsAttention ? "NEEDS_ATTENTION" : "WITHIN_NORMAL_RANGE",
    measured_value: avgDailyCrores,
    unit: "INR_Cr_avg_daily_value",
    as_of_date: latestBar.trading_date,
    source_snapshot_id: latestBar.snapshot_id,
    source_name: latestBar.source_name,
    data_label: latestBar.data_label,
    method_version: methodVersion,
    explanation_key: "liquidity_explanation",
    explanation: needsAttention
      ? `Average daily traded value over the prior ${cfg.lookbackSessions} sessions was ₹${avgDailyCrores} Cr, below the ₹${cfg.lowLiquidityThresholdInr / 10_000_000} Cr reference threshold. Thinly traded stocks can be more sensitive to concentrated activity.`
      : `Average daily traded value over the prior ${cfg.lookbackSessions} sessions was ₹${avgDailyCrores} Cr, within the normal reference range.`,
    reason_code: null,
    details: {
      sessions_used: window.length,
      window_start: window[0]!.trading_date,
      window_end: latestBar.trading_date,
    },
  };
}

export function computeMarketCapCheck(params: {
  instrumentType: InstrumentType;
  stockInfo: StockInfoSnapshot | null;
  asOfDate: string;
  config?: MethodologyConfig;
}): MarketCheckResult {
  const cfg = params.config ?? METHODOLOGY_CONFIG_V1;
  const methodVersion = `market-cap-${cfg.version}`;

  if (params.instrumentType === "DERIVATIVE") {
    return couldNotVerify({
      check_id: "market_cap",
      label: "Market Cap Band",
      method_version: methodVersion,
      explanation_key: "market_cap_derivative_inapplicable",
      explanation:
        "Company market capitalization bands do not apply to index derivative option contracts.",
      reason_code: "DERIVATIVE_CHECK_INAPPLICABLE",
    });
  }

  const info = params.stockInfo;
  if (!info || info.market_cap === null || !info.size_band) {
    return couldNotVerify({
      check_id: "market_cap",
      label: "Market Cap Band",
      method_version: methodVersion,
      explanation_key: "market_cap_missing",
      explanation: "A dated market-cap snapshot and versioned size-band classification were unavailable.",
      reason_code: "MISSING_SNAPSHOT",
    });
  }

  if (daysBetween(info.as_of_date, params.asOfDate) > cfg.maxSnapshotStaleDays) {
    return couldNotVerify({
      check_id: "market_cap",
      label: "Market Cap Band",
      method_version: methodVersion,
      explanation_key: "market_cap_stale",
      explanation: `The latest market-cap snapshot (${info.as_of_date}) is more than ${cfg.maxSnapshotStaleDays} days away from ${params.asOfDate}.`,
      reason_code: "STALE_SNAPSHOT",
      as_of_date: info.as_of_date,
      source_snapshot_id: info.snapshot_id,
      source_name: info.source_name,
      data_label: info.data_label,
    });
  }

  const marketCapCr = new Decimal(info.market_cap).toDecimalPlaces(2).toNumber();
  const needsAttention = info.size_band === "SMALL" || info.size_band === "MICRO";

  return {
    check_id: "market_cap",
    label: "Market Cap Band",
    status: needsAttention ? "NEEDS_ATTENTION" : "WITHIN_NORMAL_RANGE",
    measured_value: info.size_band,
    unit: "size_band",
    as_of_date: info.as_of_date,
    source_snapshot_id: info.snapshot_id,
    source_name: info.source_name,
    data_label: info.data_label,
    method_version: info.classification_version || methodVersion,
    explanation_key: "market_cap_explanation",
    explanation: needsAttention
      ? `Classified as ${info.size_band} cap (₹${marketCapCr.toLocaleString("en-IN")} Cr) as of ${info.as_of_date}. Smaller companies can experience wider swings and may be easier to move.`
      : `Classified as ${info.size_band} cap (₹${marketCapCr.toLocaleString("en-IN")} Cr) as of ${info.as_of_date}, within the larger-cap reference tier.`,
    reason_code: null,
    details: {
      market_cap_inr_cr: marketCapCr,
      classification_version: info.classification_version,
    },
  };
}

export function computeVolumeSpikeCheck(params: {
  instrumentType: InstrumentType;
  bars: PriceBar[];
  tipDate: string;
  config?: MethodologyConfig;
}): MarketCheckResult {
  const cfg = params.config ?? METHODOLOGY_CONFIG_V1;
  const methodVersion = `volume-spike-${cfg.version}`;

  if (params.instrumentType === "DERIVATIVE") {
    return couldNotVerify({
      check_id: "volume_spike",
      label: "Volume Spike",
      method_version: methodVersion,
      explanation_key: "volume_spike_derivative_inapplicable",
      explanation:
        "Cash-equity volume spike baselines are not verified for index option contract strikes without dated option-series snapshots.",
      reason_code: "DERIVATIVE_CHECK_INAPPLICABLE",
    });
  }

  const sorted = sortBarsAscending(params.bars);
  // Find exact tip trading date, or if non-trading day, return COULD_NOT_VERIFY rather than guessing
  const tipIndex = sorted.findIndex((b) => b.trading_date === params.tipDate);
  if (tipIndex === -1) {
    return couldNotVerify({
      check_id: "volume_spike",
      label: "Volume Spike",
      method_version: methodVersion,
      explanation_key: "volume_spike_no_tip_session",
      explanation: `No trading-session volume bar was found on ${params.tipDate} (may be a non-trading day or outside snapshot coverage).`,
      reason_code: "TIP_DATE_NOT_FOUND",
    });
  }

  const tipBar = sorted[tipIndex]!;
  if (tipBar.volume <= 0) {
    return couldNotVerify({
      check_id: "volume_spike",
      label: "Volume Spike",
      method_version: methodVersion,
      explanation_key: "volume_spike_invalid_volume",
      explanation: `Volume on ${params.tipDate} was zero or invalid, so a volume spike ratio could not be computed.`,
      reason_code: "INVALID_VOLUME",
      as_of_date: tipBar.trading_date,
      source_snapshot_id: tipBar.snapshot_id,
      source_name: tipBar.source_name,
      data_label: tipBar.data_label,
    });
  }

  const priorBars = sorted.slice(0, tipIndex).filter((b) => b.volume > 0);
  if (priorBars.length < cfg.lookbackSessions) {
    return couldNotVerify({
      check_id: "volume_spike",
      label: "Volume Spike",
      method_version: methodVersion,
      explanation_key: "volume_spike_insufficient_history",
      explanation: `Fewer than ${cfg.lookbackSessions} prior trading sessions with valid volume existed before ${params.tipDate}.`,
      reason_code: "INSUFFICIENT_HISTORY",
      as_of_date: tipBar.trading_date,
      source_snapshot_id: tipBar.snapshot_id,
      source_name: tipBar.source_name,
      data_label: tipBar.data_label,
    });
  }

  const window = priorBars.slice(-cfg.lookbackSessions);
  const meanVol = window
    .reduce((acc, b) => acc.plus(b.volume), new Decimal(0))
    .div(window.length);

  if (meanVol.lte(0)) {
    return couldNotVerify({
      check_id: "volume_spike",
      label: "Volume Spike",
      method_version: methodVersion,
      explanation_key: "volume_spike_zero_baseline",
      explanation: "Prior-period average volume was zero; ratio is undefined.",
      reason_code: "ZERO_BASELINE",
    });
  }

  const ratio = new Decimal(tipBar.volume).div(meanVol).toDecimalPlaces(2).toNumber();

  // Compute sample standard deviation for z-score when variance > 0
  const variance = window
    .reduce((acc, b) => acc.plus(new Decimal(b.volume).minus(meanVol).pow(2)), new Decimal(0))
    .div(window.length);
  const stdDev = variance.sqrt();
  const zScore = stdDev.gt(0)
    ? new Decimal(tipBar.volume).minus(meanVol).div(stdDev).toDecimalPlaces(2).toNumber()
    : null;

  const needsAttention = ratio >= cfg.volumeSpikeRatioThreshold;

  return {
    check_id: "volume_spike",
    label: "Volume Spike",
    status: needsAttention ? "NEEDS_ATTENTION" : "WITHIN_NORMAL_RANGE",
    measured_value: ratio,
    unit: "x_average_volume",
    as_of_date: tipBar.trading_date,
    source_snapshot_id: tipBar.snapshot_id,
    source_name: tipBar.source_name,
    data_label: tipBar.data_label,
    method_version: methodVersion,
    explanation_key: "volume_spike_explanation",
    explanation: needsAttention
      ? `Trading volume on ${tipBar.trading_date} was ${ratio}x the prior ${cfg.lookbackSessions}-session average (above the ${cfg.volumeSpikeRatioThreshold}x reference threshold).`
      : `Trading volume on ${tipBar.trading_date} was ${ratio}x the prior ${cfg.lookbackSessions}-session average, within the normal reference range.`,
    reason_code: null,
    details: {
      tip_day_volume: tipBar.volume,
      prior_avg_volume: meanVol.toDecimalPlaces(0).toNumber(),
      z_score: zScore,
      sessions_used: window.length,
    },
  };
}

export function computePreTipRunUpCheck(params: {
  instrumentType: InstrumentType;
  bars: PriceBar[];
  tipDate: string;
  config?: MethodologyConfig;
}): MarketCheckResult {
  const cfg = params.config ?? METHODOLOGY_CONFIG_V1;
  const methodVersion = `pre-tip-runup-${cfg.version}`;

  if (params.instrumentType === "DERIVATIVE") {
    return couldNotVerify({
      check_id: "pre_tip_run_up",
      label: "Pre-Tip Run-Up (5 Sessions)",
      method_version: methodVersion,
      explanation_key: "pre_tip_run_up_derivative_inapplicable",
      explanation:
        "Five-session equity pre-tip run-up does not apply directly to short-dated option strikes without contract OHLC history.",
      reason_code: "DERIVATIVE_CHECK_INAPPLICABLE",
    });
  }

  const priorBars = sortBarsAscending(params.bars).filter(
    (b) => b.trading_date < params.tipDate && Number(b.close) > 0
  );

  // Need at least (preTipRunUpSessions + 1) sessions before tipDate to measure 5-session return
  // from close[t-6] to close[t-1] (the 5 trading sessions immediately preceding the tip)
  const required = cfg.preTipRunUpSessions + 1;
  if (priorBars.length < required) {
    return couldNotVerify({
      check_id: "pre_tip_run_up",
      label: "Pre-Tip Run-Up (5 Sessions)",
      method_version: methodVersion,
      explanation_key: "pre_tip_run_up_insufficient_history",
      explanation: `At least ${required} valid trading sessions prior to ${params.tipDate} are required to measure the 5-session pre-tip move.`,
      reason_code: "INSUFFICIENT_HISTORY",
    });
  }

  const endBar = priorBars[priorBars.length - 1]!;
  const startBar = priorBars[priorBars.length - required]!;
  const startClose = new Decimal(startBar.close);
  const endClose = new Decimal(endBar.close);

  const pctChange = endClose.minus(startClose).div(startClose).times(100).toDecimalPlaces(2).toNumber();
  const needsAttention = Math.abs(pctChange) >= cfg.preTipRunUpPercentThreshold;

  return {
    check_id: "pre_tip_run_up",
    label: "Pre-Tip Run-Up (5 Sessions)",
    status: needsAttention ? "NEEDS_ATTENTION" : "WITHIN_NORMAL_RANGE",
    measured_value: pctChange,
    unit: "percent",
    as_of_date: endBar.trading_date,
    source_snapshot_id: endBar.snapshot_id,
    source_name: endBar.source_name,
    data_label: endBar.data_label,
    method_version: methodVersion,
    explanation_key: "pre_tip_run_up_explanation",
    explanation: needsAttention
      ? `Price moved ${pctChange >= 0 ? "+" : ""}${pctChange}% between ${startBar.trading_date} and ${endBar.trading_date} (the 5 sessions before the tip), exceeding the ±${cfg.preTipRunUpPercentThreshold}% reference threshold.`
      : `Price moved ${pctChange >= 0 ? "+" : ""}${pctChange}% between ${startBar.trading_date} and ${endBar.trading_date}, within the normal 5-session pre-tip range.`,
    reason_code: null,
    details: {
      window_start: startBar.trading_date,
      window_end: endBar.trading_date,
      start_close: startClose.toNumber(),
      end_close: endClose.toNumber(),
    },
  };
}

export function computeSurveillanceCheck(params: {
  instrumentType: InstrumentType;
  surveillanceEntries: SurveillanceSnapshot[];
  circuitBand: string | null;
  asOfDate: string;
  config?: MethodologyConfig;
}): MarketCheckResult {
  const cfg = params.config ?? METHODOLOGY_CONFIG_V1;
  const methodVersion = `surveillance-${cfg.version}`;

  if (params.instrumentType === "DERIVATIVE") {
    return couldNotVerify({
      check_id: "surveillance",
      label: "Surveillance & Circuit Band",
      method_version: methodVersion,
      explanation_key: "surveillance_derivative_inapplicable",
      explanation:
        "Cash-equity ASM/GSM watchlists and equity circuit bands do not apply to index option contracts.",
      reason_code: "DERIVATIVE_CHECK_INAPPLICABLE",
    });
  }

  if (params.surveillanceEntries.length === 0) {
    return couldNotVerify({
      check_id: "surveillance",
      label: "Surveillance & Circuit Band",
      method_version: methodVersion,
      explanation_key: "surveillance_missing_snapshot",
      explanation: `No dated exchange ASM/GSM surveillance snapshot covered ${params.asOfDate}.`,
      reason_code: "MISSING_SNAPSHOT",
    });
  }

  const eligible = [...params.surveillanceEntries]
    .filter((entry) => entry.snapshot_date <= params.asOfDate)
    .sort((a, b) => b.snapshot_date.localeCompare(a.snapshot_date));

  const latest = eligible[0];
  if (!latest) {
    return couldNotVerify({
      check_id: "surveillance",
      label: "Surveillance & Circuit Band",
      method_version: methodVersion,
      explanation_key: "surveillance_no_prior_snapshot",
      explanation: `No exchange surveillance snapshot on or before ${params.asOfDate} was available.`,
      reason_code: "MISSING_SNAPSHOT",
    });
  }

  if (daysBetween(latest.snapshot_date, params.asOfDate) > cfg.maxSnapshotStaleDays) {
    return couldNotVerify({
      check_id: "surveillance",
      label: "Surveillance & Circuit Band",
      method_version: methodVersion,
      explanation_key: "surveillance_stale_snapshot",
      explanation: `The available surveillance snapshot (${latest.snapshot_date}) is stale relative to ${params.asOfDate}.`,
      reason_code: "STALE_SNAPSHOT",
      as_of_date: latest.snapshot_date,
      source_snapshot_id: latest.snapshot_id,
      source_name: latest.source_name,
      data_label: latest.data_label,
    });
  }

  const latestDate = latest.snapshot_date;
  const activeLists = eligible
    .filter((entry) => entry.snapshot_date === latestDate && entry.is_active)
    .map((entry) => entry.list_name);

  const tightCircuit = params.circuitBand === "2%" || params.circuitBand === "5%";
  const needsAttention = activeLists.length > 0 || tightCircuit;

  const summaryValue =
    activeLists.length > 0
      ? `${activeLists.join(", ")}${params.circuitBand ? ` · ${params.circuitBand} band` : ""}`
      : `Not listed${params.circuitBand ? ` · ${params.circuitBand} band` : ""}`;

  return {
    check_id: "surveillance",
    label: "Surveillance & Circuit Band",
    status: needsAttention ? "NEEDS_ATTENTION" : "WITHIN_NORMAL_RANGE",
    measured_value: summaryValue,
    unit: "surveillance_status",
    as_of_date: latestDate,
    source_snapshot_id: latest.snapshot_id,
    source_name: latest.source_name,
    data_label: latest.data_label,
    method_version: methodVersion,
    explanation_key: "surveillance_explanation",
    explanation:
      activeLists.length > 0
        ? `Listed on exchange surveillance (${activeLists.join(", ")}) in the snapshot dated ${latestDate}${params.circuitBand ? ` with a ${params.circuitBand} circuit band` : ""}.`
        : tightCircuit
          ? `Not on an active ASM/GSM list as of ${latestDate}, but subject to a narrow ${params.circuitBand} price circuit band.`
          : `Not listed on active ASM/GSM surveillance lists in the snapshot dated ${latestDate}${params.circuitBand ? ` (${params.circuitBand} circuit band)` : ""}.`,
    reason_code: null,
    details: {
      active_lists: activeLists.join(", ") || "None",
      circuit_band: params.circuitBand,
    },
  };
}

export function computeAllMarketChecks(params: {
  instrumentType: InstrumentType;
  bars: PriceBar[];
  stockInfo: StockInfoSnapshot | null;
  surveillanceEntries: SurveillanceSnapshot[];
  circuitBand: string | null;
  asOfDate: string;
  tipDate: string;
  config?: MethodologyConfig;
}): MarketCheckResult[] {
  return [
    computeLiquidityCheck({
      instrumentType: params.instrumentType,
      bars: params.bars,
      asOfDate: params.asOfDate,
      config: params.config,
    }),
    computeMarketCapCheck({
      instrumentType: params.instrumentType,
      stockInfo: params.stockInfo,
      asOfDate: params.asOfDate,
      config: params.config,
    }),
    computeVolumeSpikeCheck({
      instrumentType: params.instrumentType,
      bars: params.bars,
      tipDate: params.tipDate,
      config: params.config,
    }),
    computePreTipRunUpCheck({
      instrumentType: params.instrumentType,
      bars: params.bars,
      tipDate: params.tipDate,
      config: params.config,
    }),
    computeSurveillanceCheck({
      instrumentType: params.instrumentType,
      surveillanceEntries: params.surveillanceEntries,
      circuitBand: params.circuitBand,
      asOfDate: params.asOfDate,
      config: params.config,
    }),
  ];
}
