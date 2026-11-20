import { wilsonInterval95 } from "./calibration.js";

export type StudyArm = "ARM_A_DISCLAIMER" | "ARM_B_LEADERBOARD" | "ARM_C_TIP_AUTOPSY";

export interface StudyTrialObservation {
  participant_id: string;
  tip_id: string;
  arm: StudyArm;
  /** True if the participant chose "I'd act on this" */
  acted: boolean;
  /** True if the historical tip later collapsed below benchmark threshold */
  tip_collapsed: boolean;
  /** Participant's stated probability [0, 1] that the tip would beat Nifty 50 */
  stated_confidence_prob: number;
  /** True if the historical tip actually beat Nifty 50 */
  actual_beat_benchmark: boolean;
  decision_time_ms: number;
}

export interface ArmSummaryMetrics {
  arm: StudyArm;
  total_trials: number;
  collapsed_tip_action_rate: number;
  collapsed_tip_action_ci_95: [number, number];
  skipped_successful_tip_rate: number;
  skipped_successful_tip_ci_95: [number, number];
  brier_score: number;
  median_decision_time_ms: number;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid]!;
  return (sorted[mid - 1]! + sorted[mid]!) / 2;
}

/**
 * Reproducible analysis pipeline for the 3-arm behavioral decision-quality study (Task 3.6).
 * Reports exact rates, 95% Wilson intervals, Brier score (lower is better calibrated),
 * and median decision time without inflating inconclusive results.
 */
export function analyzeBehavioralStudyTrials(
  observations: StudyTrialObservation[]
): Record<StudyArm, ArmSummaryMetrics> {
  const arms: StudyArm[] = ["ARM_A_DISCLAIMER", "ARM_B_LEADERBOARD", "ARM_C_TIP_AUTOPSY"];
  const output = {} as Record<StudyArm, ArmSummaryMetrics>;

  for (const arm of arms) {
    const subset = observations.filter((o) => o.arm === arm);
    const collapsed = subset.filter((o) => o.tip_collapsed);
    const actedOnCollapsed = collapsed.filter((o) => o.acted).length;

    const successful = subset.filter((o) => o.actual_beat_benchmark);
    const skippedSuccessful = successful.filter((o) => !o.acted).length;

    const brierSum = subset.reduce((acc, o) => {
      const outcome = o.actual_beat_benchmark ? 1 : 0;
      const diff = o.stated_confidence_prob - outcome;
      return acc + diff * diff;
    }, 0);

    output[arm] = {
      arm,
      total_trials: subset.length,
      collapsed_tip_action_rate:
        collapsed.length > 0 ? Number((actedOnCollapsed / collapsed.length).toFixed(4)) : 0,
      collapsed_tip_action_ci_95: wilsonInterval95(actedOnCollapsed, collapsed.length),
      skipped_successful_tip_rate:
        successful.length > 0 ? Number((skippedSuccessful / successful.length).toFixed(4)) : 0,
      skipped_successful_tip_ci_95: wilsonInterval95(skippedSuccessful, successful.length),
      brier_score: subset.length > 0 ? Number((brierSum / subset.length).toFixed(4)) : 0,
      median_decision_time_ms: Math.round(median(subset.map((o) => o.decision_time_ms))),
    };
  }

  return output;
}
