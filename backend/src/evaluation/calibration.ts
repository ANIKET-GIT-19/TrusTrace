/**
 * Reproducible Calibration & Baseline Comparison Harness (Task 3.5).
 * Compares the 5-check attention flagger against a naive small/micro-cap-only baseline,
 * reporting precision, recall, F1, Wilson 95% confidence intervals, and false positives.
 */

export interface CalibrationSampleCase {
  id: string;
  label: "ENFORCEMENT_CASE_PATTERN" | "NORMAL_STOCK_COMPARISON";
  size_band: "LARGE" | "MID" | "SMALL" | "MICRO";
  five_check_attention_count: number;
  has_volume_or_runup_or_surveillance: boolean;
  is_synthetic_fixture: boolean;
}

export interface BinaryMetricsWithCI {
  true_positives: number;
  false_positives: number;
  true_negatives: number;
  false_negatives: number;
  precision: number;
  precision_ci_95: [number, number];
  recall: number;
  recall_ci_95: [number, number];
  false_positive_rate: number;
  f1: number;
}

/** Wilson score 95% confidence interval for a binomial proportion. */
export function wilsonInterval95(successes: number, total: number): [number, number] {
  if (total <= 0) return [0, 0];
  const z = 1.959964;
  const p = successes / total;
  const denom = 1 + (z * z) / total;
  const center = (p + (z * z) / (2 * total)) / denom;
  const margin =
    (z * Math.sqrt((p * (1 - p)) / total + (z * z) / (4 * total * total))) / denom;
  return [
    Number(Math.max(0, center - margin).toFixed(4)),
    Number(Math.min(1, center + margin).toFixed(4)),
  ];
}

export function evaluateBinaryPredictions(
  cases: CalibrationSampleCase[],
  predictPositive: (c: CalibrationSampleCase) => boolean
): BinaryMetricsWithCI {
  let tp = 0;
  let fp = 0;
  let tn = 0;
  let fn = 0;

  for (const c of cases) {
    const actualPositive = c.label === "ENFORCEMENT_CASE_PATTERN";
    const predicted = predictPositive(c);
    if (actualPositive && predicted) tp += 1;
    else if (!actualPositive && predicted) fp += 1;
    else if (!actualPositive && !predicted) tn += 1;
    else fn += 1;
  }

  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const fpr = fp + tn > 0 ? fp / (fp + tn) : 0;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  return {
    true_positives: tp,
    false_positives: fp,
    true_negatives: tn,
    false_negatives: fn,
    precision: Number(precision.toFixed(4)),
    precision_ci_95: wilsonInterval95(tp, tp + fp),
    recall: Number(recall.toFixed(4)),
    recall_ci_95: wilsonInterval95(tp, tp + fn),
    false_positive_rate: Number(fpr.toFixed(4)),
    f1: Number(f1.toFixed(4)),
  };
}

/**
 * Illustrative provisional calibration fixture (explicitly labelled synthetic/provisional).
 * Thresholds MUST NOT be claimed as production-validated until run on verified full SEBI orders.
 */
export const PROVISIONAL_CALIBRATION_FIXTURE: CalibrationSampleCase[] = [
  // Enforcement-style micro/small-cap pump patterns
  { id: "enf-1", label: "ENFORCEMENT_CASE_PATTERN", size_band: "MICRO", five_check_attention_count: 5, has_volume_or_runup_or_surveillance: true, is_synthetic_fixture: true },
  { id: "enf-2", label: "ENFORCEMENT_CASE_PATTERN", size_band: "MICRO", five_check_attention_count: 4, has_volume_or_runup_or_surveillance: true, is_synthetic_fixture: true },
  { id: "enf-3", label: "ENFORCEMENT_CASE_PATTERN", size_band: "SMALL", five_check_attention_count: 4, has_volume_or_runup_or_surveillance: true, is_synthetic_fixture: true },
  { id: "enf-4", label: "ENFORCEMENT_CASE_PATTERN", size_band: "SMALL", five_check_attention_count: 3, has_volume_or_runup_or_surveillance: true, is_synthetic_fixture: true },
  { id: "enf-5", label: "ENFORCEMENT_CASE_PATTERN", size_band: "MICRO", five_check_attention_count: 4, has_volume_or_runup_or_surveillance: true, is_synthetic_fixture: true },
  { id: "enf-6", label: "ENFORCEMENT_CASE_PATTERN", size_band: "SMALL", five_check_attention_count: 3, has_volume_or_runup_or_surveillance: true, is_synthetic_fixture: true },
  // Known large-cap blind spot (enforcement-style coordinated promo in liquid large cap without volume spike)
  { id: "enf-large-blindspot", label: "ENFORCEMENT_CASE_PATTERN", size_band: "LARGE", five_check_attention_count: 0, has_volume_or_runup_or_surveillance: false, is_synthetic_fixture: true },
  // Normal comparison stocks (mix of large, mid, and legitimate small-caps without manipulation)
  { id: "norm-large-1", label: "NORMAL_STOCK_COMPARISON", size_band: "LARGE", five_check_attention_count: 0, has_volume_or_runup_or_surveillance: false, is_synthetic_fixture: true },
  { id: "norm-large-2", label: "NORMAL_STOCK_COMPARISON", size_band: "LARGE", five_check_attention_count: 0, has_volume_or_runup_or_surveillance: false, is_synthetic_fixture: true },
  { id: "norm-mid-1", label: "NORMAL_STOCK_COMPARISON", size_band: "MID", five_check_attention_count: 0, has_volume_or_runup_or_surveillance: false, is_synthetic_fixture: true },
  { id: "norm-mid-2", label: "NORMAL_STOCK_COMPARISON", size_band: "MID", five_check_attention_count: 1, has_volume_or_runup_or_surveillance: true, is_synthetic_fixture: true },
  { id: "norm-small-calm-1", label: "NORMAL_STOCK_COMPARISON", size_band: "SMALL", five_check_attention_count: 1, has_volume_or_runup_or_surveillance: false, is_synthetic_fixture: true },
  { id: "norm-small-calm-2", label: "NORMAL_STOCK_COMPARISON", size_band: "SMALL", five_check_attention_count: 1, has_volume_or_runup_or_surveillance: false, is_synthetic_fixture: true },
  { id: "norm-small-earnings-fp", label: "NORMAL_STOCK_COMPARISON", size_band: "SMALL", five_check_attention_count: 3, has_volume_or_runup_or_surveillance: true, is_synthetic_fixture: true },
  { id: "norm-micro-calm-1", label: "NORMAL_STOCK_COMPARISON", size_band: "MICRO", five_check_attention_count: 2, has_volume_or_runup_or_surveillance: false, is_synthetic_fixture: true },
];

export function runCalibrationComparison(cases = PROVISIONAL_CALIBRATION_FIXTURE) {
  const fiveCheckRule = evaluateBinaryPredictions(
    cases,
    (c) => c.five_check_attention_count >= 2 && c.has_volume_or_runup_or_surveillance
  );
  const naiveSmallCapBaseline = evaluateBinaryPredictions(
    cases,
    (c) => c.size_band === "SMALL" || c.size_band === "MICRO"
  );
  return {
    sample_size: cases.length,
    is_provisional_synthetic_fixture: cases.every((c) => c.is_synthetic_fixture),
    five_check_composite: fiveCheckRule,
    naive_small_cap_baseline: naiveSmallCapBaseline,
    known_blind_spots: [
      "Large-cap liquid stocks may not trigger volume-spike or liquidity flags even during coordinated social promotion.",
      "Legitimate small/micro-cap earnings breakouts can trigger false positives on volume spike + pre-tip run-up.",
    ],
  };
}
