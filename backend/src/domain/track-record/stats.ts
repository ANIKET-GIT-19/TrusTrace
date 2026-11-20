import { Decimal } from "decimal.js";
import type { DataLabel, TipDirection, TrackRecordResult } from "../types.js";

export interface TrackRecordConfig {
  methodVersion: string;
  alphaPrior: number;
  betaPrior: number;
  credibleIntervalLevel: number;
  minimumSamplePolicy: number;
  matchedBaseline: number;
}

export const TRACK_RECORD_CONFIG_V1: TrackRecordConfig = {
  methodVersion: "track-record-v1",
  alphaPrior: 1,
  betaPrior: 1,
  credibleIntervalLevel: 0.95,
  minimumSamplePolicy: 20,
  matchedBaseline: 0.5,
};

export interface HistoricalTipForResolution {
  id: string;
  ticker: string | null;
  tip_date: string;
  deadline: string | null;
  direction: TipDirection | null;
}

export interface DatedCloseBar {
  trading_date: string;
  close: number | string;
}

/**
 * Log-Gamma via Lanczos approximation (double precision, accurate to ~1e-13).
 */
function logGamma(z: number): number {
  const coefficients = [
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];
  if (z < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  }
  const shifted = z - 1;
  let x = 0.99999999999980993;
  for (let i = 0; i < coefficients.length; i++) {
    x += coefficients[i]! / (shifted + i + 1);
  }
  const t = shifted + coefficients.length - 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (shifted + 0.5) * Math.log(t) - t + Math.log(x);
}

/**
 * Continued fraction for regularized incomplete beta I_x(a, b) (Numerical Recipes / Lentz).
 */
function betaContinuedFraction(x: number, a: number, b: number): number {
  const maxIterations = 200;
  const eps = 3e-12;
  const fpMin = 1e-30;

  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < fpMin) d = fpMin;
  d = 1 / d;
  let h = d;

  for (let m = 1; m <= maxIterations; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < fpMin) d = fpMin;
    c = 1 + aa / c;
    if (Math.abs(c) < fpMin) c = fpMin;
    d = 1 / d;
    h *= d * c;

    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < fpMin) d = fpMin;
    c = 1 + aa / c;
    if (Math.abs(c) < fpMin) c = fpMin;
    d = 1 / d;
    const delta = d * c;
    h *= delta;
    if (Math.abs(delta - 1) < eps) break;
  }
  return h;
}

export function betaCdf(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(
    logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x)
  );
  if (x < (a + 1) / (a + b + 2)) {
    return (bt * betaContinuedFraction(x, a, b)) / a;
  }
  return 1 - (bt * betaContinuedFraction(1 - x, b, a)) / b;
}

export function betaQuantile(p: number, a: number, b: number): number {
  if (p <= 0) return 0;
  if (p >= 1) return 1;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 64; i++) {
    const mid = (lo + hi) / 2;
    if (betaCdf(mid, a, b) < p) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return (lo + hi) / 2;
}

/**
 * Finds the first valid close strictly AFTER `tipDate` (next trading session close)
 * and the closing price at `deadline` (exact trading day or nearest prior session strictly after entry),
 * requiring exact date alignment between the stock series and the Nifty 50 benchmark series.
 */
function resolveSingleTipOutcome(
  tip: HistoricalTipForResolution,
  stockSeries: DatedCloseBar[],
  niftySeries: DatedCloseBar[]
): "SUCCESS" | "FAILURE" | "EXCLUDED" {
  if (!tip.ticker || !tip.deadline || !tip.direction || tip.direction === "NEUTRAL") {
    return "EXCLUDED";
  }
  if (tip.deadline <= tip.tip_date) {
    return "EXCLUDED";
  }

  const niftyByDate = new Map<string, Decimal>();
  for (const bar of niftySeries) {
    const close = new Decimal(bar.close);
    if (close.gt(0)) niftyByDate.set(bar.trading_date, close);
  }

  const alignedStockBars = stockSeries
    .filter((b) => new Decimal(b.close).gt(0) && niftyByDate.has(b.trading_date))
    .sort((a, b) => a.trading_date.localeCompare(b.trading_date));

  // Entry: first valid aligned trading session STRICTLY AFTER tip_date
  const entryBar = alignedStockBars.find((b) => b.trading_date > tip.tip_date);
  if (!entryBar || entryBar.trading_date >= tip.deadline) {
    return "EXCLUDED";
  }

  // Exit: latest aligned trading session on or before deadline, strictly after entry
  const exitCandidates = alignedStockBars.filter(
    (b) => b.trading_date > entryBar.trading_date && b.trading_date <= tip.deadline!
  );
  const exitBar = exitCandidates[exitCandidates.length - 1];
  if (!exitBar) {
    return "EXCLUDED";
  }

  const stockEntry = new Decimal(entryBar.close);
  const stockExit = new Decimal(exitBar.close);
  const niftyEntry = niftyByDate.get(entryBar.trading_date)!;
  const niftyExit = niftyByDate.get(exitBar.trading_date)!;

  const stockReturn = stockExit.minus(stockEntry).div(stockEntry);
  const niftyReturn = niftyExit.minus(niftyEntry).div(niftyEntry);
  const directionSign = tip.direction === "BULLISH" ? 1 : -1;
  const directionalExcess = stockReturn.minus(niftyReturn).times(directionSign);

  if (directionalExcess.gt(0)) return "SUCCESS";
  if (directionalExcess.lt(0)) return "FAILURE";
  return "EXCLUDED"; // Exact ties excluded from binary denominator
}

export function computeCreatorTrackRecord(params: {
  creatorId: string | null;
  creatorName: string | null;
  tips: HistoricalTipForResolution[];
  pricesByTicker: Record<string, DatedCloseBar[]>;
  niftySeries: DatedCloseBar[];
  asOfDate: string | null;
  dataLabel: DataLabel | null;
  config?: TrackRecordConfig;
}): TrackRecordResult {
  const cfg = params.config ?? TRACK_RECORD_CONFIG_V1;
  let successes = 0;
  let failures = 0;
  let excluded = 0;

  for (const tip of params.tips) {
    const stockSeries = tip.ticker ? (params.pricesByTicker[tip.ticker] ?? []) : [];
    const outcome = resolveSingleTipOutcome(tip, stockSeries, params.niftySeries);
    if (outcome === "SUCCESS") successes += 1;
    else if (outcome === "FAILURE") failures += 1;
    else excluded += 1;
  }

  const resolvedCount = successes + failures;
  const alphaPost = cfg.alphaPrior + successes;
  const betaPost = cfg.betaPrior + failures;
  const tail = (1 - cfg.credibleIntervalLevel) / 2;

  const lower = Number(betaQuantile(tail, alphaPost, betaPost).toFixed(4));
  const upper = Number(betaQuantile(1 - tail, alphaPost, betaPost).toFixed(4));
  const posteriorMean = Number((alphaPost / (alphaPost + betaPost)).toFixed(4));
  const clearsBaseline = lower > cfg.matchedBaseline;

  if (resolvedCount < cfg.minimumSamplePolicy) {
    return {
      status: "NOT_ENOUGH_TIPS_TO_JUDGE",
      creator_id: params.creatorId,
      creator_name: params.creatorName,
      resolved_count: resolvedCount,
      success_count: successes,
      failure_count: failures,
      excluded_count: excluded,
      minimum_sample_policy: cfg.minimumSamplePolicy,
      credible_interval_level: cfg.credibleIntervalLevel,
      credible_interval: resolvedCount > 0 ? { lower, upper, posterior_mean: posteriorMean } : null,
      matched_baseline: cfg.matchedBaseline,
      clears_baseline: false,
      prior: { alpha: cfg.alphaPrior, beta: cfg.betaPrior },
      benchmark: "NIFTY_50",
      as_of_date: params.asOfDate,
      data_label: params.dataLabel,
      method_version: cfg.methodVersion,
      explanation: `Not enough tips to judge: ${resolvedCount} resolved historical tips were available (${excluded} excluded/unresolved), below the provisional ${cfg.minimumSamplePolicy}-tip minimum policy.`,
    };
  }

  const lowerPct = Math.round(lower * 100);
  const upperPct = Math.round(upper * 100);
  const baselinePct = Math.round(cfg.matchedBaseline * 100);

  return {
    status: clearsBaseline ? "INTERVAL_AVAILABLE" : "NOT_ENOUGH_TIPS_TO_JUDGE",
    creator_id: params.creatorId,
    creator_name: params.creatorName,
    resolved_count: resolvedCount,
    success_count: successes,
    failure_count: failures,
    excluded_count: excluded,
    minimum_sample_policy: cfg.minimumSamplePolicy,
    credible_interval_level: cfg.credibleIntervalLevel,
    credible_interval: { lower, upper, posterior_mean: posteriorMean },
    matched_baseline: cfg.matchedBaseline,
    clears_baseline: clearsBaseline,
    prior: { alpha: cfg.alphaPrior, beta: cfg.betaPrior },
    benchmark: "NIFTY_50",
    as_of_date: params.asOfDate,
    data_label: params.dataLabel,
    method_version: cfg.methodVersion,
    explanation: clearsBaseline
      ? `Across ${resolvedCount} resolved historical tips benchmarked against NIFTY 50, the 95% Beta-Binomial credible interval is ${lowerPct}% to ${upperPct}% (${excluded} excluded/unresolved). Past benchmark-adjusted outcomes do not predict future returns.`
      : `Across ${resolvedCount} resolved historical tips benchmarked against NIFTY 50, the 95% credible interval (${lowerPct}% to ${upperPct}%) does not clear the ${baselinePct}% matched baseline — not enough evidence to judge.`,
  };
}
