# Tip Autopsy — 60-Second Demo Rehearsal & Release Checklist (Task 3.9)

**Demo Reliability Rule:** The entire 60-second demo runs on preloaded dated snapshots with `LLM_PROVIDER=disabled` and zero fragile live scraping or live third-party dependencies.

---

## 1. 60-Second Demo Arc

| Window | Action on Screen | Key Proof Point to Highlight |
|---|---|---|
| **0:00 – 0:15** | Open `/` (**Hero**: *"Think Before You Trust."* with animated stock wave + 5 creator clips) → click **Analyze a Tip →** → open **New Analysis** and paste Hinglish tip (`Borosil Renewables Ltd` with `Guaranteed 2x in 10 days, last chance! SL PAID`) or click the `Ashish Kyal · Sensex 82900 CE` curated photo chip. | **Claim Ledger** extracts stated fields, highlights hype phrases in original text, flags paywalled **`Not stated (Gated)`** stop-loss (`SL PAID`), and grades sponsorship disclosure transparently. |
| **0:15 – 0:35** | Advance to **Step 3 (SEBI & Checks)** and **Step 4 (Tip Time Machine & Information Verdict)**. Click tip marker **`2026-11-10`** in the chart/accessible list. | Shows dated **SEBI register snapshot** (`Registered` or non-blocking `Not found`), **Pre-Tip Run-Up**, **Volume Spike**, **ASM Stage 1**, exact-date marker filtering, **`Output Guard: Passed`** template verdict (never buy/sell/hold), and verbatim mandatory disclaimer. |
| **0:35 – 0:50** | Optionally click **Listen to Guarded Summary** (Hindi / Kannada / English — gracefully falls back to text if `SARVAM_API_KEY` is unset) → click **Proceed to Pause & Plan** → fill all 3 pre-commitment prompts to unlock `"I'd act on this"`. | Behavioral friction gate cannot be bypassed; zero answers or tips persisted to `localStorage`, `sessionStorage`, logs, or DB. |
| **0:50 – 1:00** | Mention the **3-arm behavioral study protocol** (`docs/behavioral-study-protocol.md`) and **candid failure modes** (`docs/calibration-report.md`: large-cap blind spot, legitimate small-cap false positives, derivative `Could not verify` scope, synthetic demo labels). | Demonstrates scientific honesty: *"We grade the information, not the investment."* |

---

## 2. Pre-Demo Release Verification Checklist

- [ ] **Local startup:** `npm --prefix backend run dev` (`:8000`) and `npm --prefix frontend run dev` (`:5173`) both start cleanly; `GET /api/health` returns `200 ok`.
- [ ] **Provenance visibility:** Every Dashboard benchmark card, Market Check card, SEBI card, Chart header, and Exact-Date Tip card displays an explicit `as-of` date and `Real` / `Synthetic / Demo` / `Mixed (Labelled)` badge.
- [ ] **No mockup or safety violations:** Zero instances of `"Buy"`, `"Sell"`, `"Hold"`, `"Confidence Score"`, `"Past Reports"`, `"Live Market Data"`, or `"Scammer"` in system-authored UI copy.
- [ ] **Derivative scoping verified:** Curated `Sensex 82900 CE` / `Nifty 25500 CE` / `Nifty 25600 CE` samples render `Could not verify` for equity-only checks and label the chart as underlying index context.
- [ ] **Mandatory disclaimer verbatim:** Present on Hero About section, Dashboard shell footer, and every Information Verdict report.
- [ ] **Quality gates green:** Backend lint/typecheck/tests/build + Output Guard adversarial suite (`0` unsafe system outputs) + Frontend lint/typecheck/tests/build + Desktop & Mobile Playwright E2E suite all pass.
