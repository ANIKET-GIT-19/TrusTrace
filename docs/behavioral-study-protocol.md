# Tip Autopsy — Three-Arm Behavioral Study Protocol & Analysis Plan (Task 3.6)

**Status:** Protocol & reproducible statistical analysis script ready (`backend/src/evaluation/studyAnalysis.ts`); **human participant recruitment and data collection have not yet been executed (zero fabricated study results).**

---

## 1. Study Objective

Evaluate objectively whether Tip Autopsy improves retail investor decision quality on social-media stock tips compared with (A) a plain risk disclaimer and (B) a raw hit-rate creator leaderboard.

## 2. Experimental Design

- **Design:** Three-arm within-subject randomized crossover experiment with counterbalanced arm and tip order (Latin square across 3 blocks).
- **Target Sample:** `N ≥ 40` consenting adult Indian retail-investor/student participants (approx. 18–25 years old).
- **Stimuli:** Approximately `20` dated historical/curated Hinglish stock tips (balanced mix of tips that later collapsed vs. tips that outperformed Nifty 50; every synthetic example clearly tagged after debriefing and recorded in the stimulus manifest).
- **Arms:**
  - **Arm A (Baseline):** Plain Hinglish tip + standard risk disclaimer.
  - **Arm B (Leaderboard):** Plain Hinglish tip + unadjusted creator hit-rate badge (representing influencer ranking tools).
  - **Arm C (Tip Autopsy):** Full Claim Ledger, Hype Detector, SEBI snapshot card, 5 deterministic checks, Tip Time Machine, Guarded Information Verdict, and Pause & Plan 3-question gate.

## 3. Informed Consent & Privacy Separation

- Conducted strictly through a **separately governed, consented research workflow** (never reusing silent product telemetry from the zero-persistence V1 app).
- Consent text discloses: hypothetical-money task only, no investment advice, voluntary withdrawal at any time, anonymized participant IDs (`p_001`...), and retention schedule.

## 4. Primary Quantitative Metrics (Implemented in `backend/src/evaluation/studyAnalysis.ts`)

1. **Collapsed-Tip Action Rate:** Share of tips that later collapsed where the participant chose `"I'd act on this"`, reported with 95% Wilson CI.
2. **Skipped-Successful-Tip Rate:** Share of benchmark-outperforming tips where the participant declined to act (measures over-skepticism / friction cost), reported with 95% Wilson CI.
3. **Confidence Calibration (Brier Score):** Mean squared error between participant's stated probability `p ∈ [0, 1]` that a tip will beat Nifty 50 and binary outcome `y ∈ {0, 1}` (lower is better).
4. **Median Decision Time (ms):** Measures cognitive/behavioral friction introduced by Pause & Plan.

## 5. Honest Reporting Commitment & Limitations

- Null, negative, or inconclusive results between Arms A, B, and C will be reported verbatim alongside 95% confidence intervals.
- **Known Limitations:** Hypothetical-money decisions by students/young retail participants differ from real-money brokerage execution; Pause & Plan friction may attenuate with repeated exposure over time; participant satisfaction scores will never be substituted for objective decision-quality metrics.
