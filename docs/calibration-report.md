# Tip Autopsy — Five-Check Calibration & Performance Report (Task 3.5)

**Status:** Provisional methodology calibration (explicitly labelled synthetic/limited fixture — **not yet production-validated on a full SEBI enforcement archive**)  
**Methodology Version:** `checks-v1` (`N = 20` trading-session lookback, 5-session pre-tip run-up, `lowLiquidityThresholdInr = ₹5 Cr`, `volumeSpikeRatioThreshold = 2.5x`, `preTipRunUpPercentThreshold = ±12%`)

---

## 1. Evaluation Design

The deterministic five-check suite (`Liquidity`, `Market Cap Band`, `Volume Spike`, `Pre-Tip Run-Up`, `Surveillance / Circuit Band`) is evaluated via `backend/src/evaluation/calibration.ts` against a **naive small/micro-cap baseline** (flagging every Small or Micro cap stock regardless of trading anomalies).

- **Reproducible harness:** `runCalibrationComparison()` in `backend/src/evaluation/calibration.ts` (covered by `backend/tests/phase3.test.ts`).
- **Dataset caveat:** The current 15-case calibration fixture (`PROVISIONAL_CALIBRATION_FIXTURE`) is **100% synthetic/provisional** pending formal ingestion of public SEBI Adjudication / Interim Orders into `public.calibration_case` with verified historical NSE/BSE Bhavcopy files. No threshold below is represented as validated beyond this fixture.

---

## 2. Provisional Fixture Results (Synthetic Calibration Set, `n = 15`)

| Rule | TP | FP | TN | FN | Precision (95% Wilson CI) | Recall (95% Wilson CI) | False Positive Rate | F1 |
|---|---:|---:|---:|---:|---|---|---:|---:|
| **5-Check Composite (`≥2 attention` incl. volume/run-up/surveillance)** | 6 | 1 | 7 | 1 | `85.7%` (`48.7%–97.4%`) | `85.7%` (`48.7%–97.4%`) | `12.5%` | `0.857` |
| **Naive Baseline (Flag all Small & Micro caps)** | 6 | 4 | 4 | 1 | `60.0%` (`31.3%–83.2%`) | `85.7%` (`48.7%–97.4%`) | `50.0%` | `0.706` |

> **Honest Uncertainty Note:** Because `n = 15` is small and synthetic, the 95% Wilson confidence intervals are wide (`48.7%–97.4%`). Real-world precision and recall must be re-measured once verified SEBI enforcement orders and real exchange Bhavcopy snapshots are imported.

---

## 3. Documented False Positives & Known Blind Spots

1. **Legitimate Illiquid / Small-Cap Breakouts (False Positives):** Genuine earnings announcements or corporate actions in small/micro-cap equities can trigger volume spikes (`≥2.5x`) and 5-session pre-tip moves (`≥12%`). This is why Tip Autopsy labels checks **`Needs attention`** (never `"Manipulation"` or `"Fraud"`).
2. **Large-Cap Liquid Blind Spot (False Negatives):** Coordinated social promotion targeting liquid large-cap stocks (e.g., `WIPRO`) often produces zero abnormal volume signature or liquidity warning (`enf-large-blindspot`).
3. **Derivatives Scope:** Index option tips (`Sensex 82900 CE`, `Nifty 25500 CE`, `Nifty 25600 CE`) intentionally return **`Could not verify`** (`DERIVATIVE_CHECK_INAPPLICABLE`) rather than applying equity market-cap or ASM/GSM thresholds.

---

## 4. Revision Policy

Any future adjustment to `lookbackSessions`, market-cap band cutoffs, or spike thresholds must increment `METHODOLOGY_CONFIG` (`checks-v2`, etc.) and record the calibration diff, source order list, and confidence intervals in this file.
