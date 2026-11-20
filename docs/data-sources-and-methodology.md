# Tip Autopsy — Data-Source Inventory & Methodology Plan

**Document status:** Phase 1 baseline (Task 1.8)  
**Product principle:** *We grade the information, not the investment.*  
**Provenance rule:** Every record must carry a source, `as_of_date`, `snapshot_id`, and explicit `REAL`, `SYNTHETIC`, or `MIXED` label. No data source is treated as production-ready until access and usage terms are reviewed.

---

## 1. Intended Data-Source Inventory

| Dataset Key | Domain & Expected Fields | Intended Source / Provider | Retrieval Method (V1) | Access / Usage Terms Status | Required Label |
|---|---|---|---|---|---|
| `nse_prices` | Equity OHLC/close & daily volume (`ticker`, `trading_date`, `close`, `volume`) | NSE India public historical Bhavcopy / Equity historical CSV archives (or authorized market-data vendor for production) | Manual curated download & idempotent CLI snapshot import (`backend/src/ingestion/`) | **Pending production terms review** — hackathon V1 uses dated historical snapshots with explicit `as_of_date` and source attribution; no live scraping | `REAL` |
| `bse_prices` | BSE-listed equity close & volume fallback (`ticker`, `trading_date`, `close`, `volume`) | BSE India historical Bhavcopy / Scrip archive | Manual curated download & idempotent snapshot import | **Pending production terms review** — dated snapshot only | `REAL` |
| `benchmark_indices` | `NIFTY_50` (required for track-record adjustment), `SENSEX`, `BANKNIFTY` (`benchmark_key`, `trading_date`, `close`) | NSE Indices (`NIFTY 50`, `NIFTY BANK`) & BSE (`SENSEX`) public historical index CSVs | Manual curated snapshot import | **Pending production terms review** — dated snapshot only | `REAL` |
| `market_cap` | Dated market capitalization & size band (`ticker`, `market_cap`, `size_band`, `classification_version`) | AMFI half-yearly market-cap categorization + NSE/BSE equity master snapshot | Manual dated import tied to explicit `classification_version` | **Pending production terms review** — AMFI semi-annual list is public reference data; document effective date | `REAL` |
| `surveillance` | Exchange watchlist membership & circuit bands (`ticker`, `list_name` `ASM`/`GSM`, `is_active`, `circuit_band`, `snapshot_date`) | NSE/BSE public ASM (Additional Surveillance Measure), GSM (Graded Surveillance Measure), and price-band circulars | Manual dated CSV/circular import | **Pending production terms review** — dated snapshot only; missing dates return `COULD_NOT_VERIFY` | `REAL` |
| `sebi_register` | Registered Research Analysts (RA) & Investment Advisers (IA) (`name`, `normalized_name`, `registration_no`, `category`, `snapshot_date`) | SEBI public intermediaries directory (`sebi.gov.in` — Registered Research Analysts / Investment Advisers) | Periodic maintainer export & idempotent snapshot import | **Public regulatory directory** — must display exact `snapshot_date`; `Not found` never implies fraud | `REAL` |
| `enforcement_cases` | Historical pump-and-dump / finfluencer enforcement orders for threshold calibration (`ticker`, `window`, `source_url`, `event_classification`) | Public SEBI Adjudication / Interim / Final Orders (`sebi.gov.in/enforcement/orders`) | Manual curation into `calibration_case` | **Public regulatory orders** — disclose small calibration sample size and confidence intervals | `REAL` |
| `curated_tip_corpus` | Curated Hinglish/English finfluencer media & historical tip examples (`photos/`, `videos/`, hand-authored Hinglish examples) | Curated local repository media (`photos/` & `videos/`) + team-authored Hinglish test cases | Seed loader (`backend/src/ingestion/`) | **Demo / evaluation corpus only** — no live Telegram/WhatsApp/Instagram/YouTube scraping; every row explicitly tagged `is_synthetic` / `MIXED` / `SYNTHETIC` | `MIXED` or `SYNTHETIC` |

---

## 2. Curated Media Corpus Scope (`photos/` & `videos/`)

Filename convention: `<Influencer_Name>__<Stock_Name>__<Registration>`. Filename tags represent **curated corpus metadata only** and are reconciled against dated `sebi_register_entry` snapshots during seed ingestion — never trusted for arbitrary user-uploaded files.

### 2.1 Equity Video Clips (`videos/`)

| Asset | Influencer | Canonical Instrument | `instrument_type` | Expected 5-Check Coverage |
|---|---|---|---|---|
| `videos/Rakesh_Bansal__Borosil_Renewables_Ltd__Registered.App.mp4` | Rakesh Bansal | `BORORENEW` (Borosil Renewables Ltd, NSE/BSE) | `EQUITY` | Full 5-check equity eligibility when dated NSE/BSE price, market-cap, and ASM/GSM snapshots are present; any missing snapshot returns `Could not verify`. |
| `videos/Rakesh_Bansal__Sarveshwar_Foods__Registered.App.mp4` | Rakesh Bansal | `SARVESHWAR` (Sarveshwar Foods Ltd, NSE/BSE) | `EQUITY` | Full 5-check equity eligibility when dated snapshots are present; missing snapshots return `Could not verify`. |
| `videos/Vivek_Rana__Wipro_Limited__Not_Registered.App.mp4` | Vivek Rana | `WIPRO` (Wipro Limited, NSE/BSE) | `EQUITY` | Full 5-check equity eligibility (also serves as a liquid large-cap calibration contrast case where volume-spike blind spots are documented). |

### 2.2 Index Option Screenshots (`photos/`) — Derivative Scoping Rule

| Asset | Influencer (Aliases) | Canonical Instrument | `instrument_type` | `underlying_ticker` | Expected 5-Check Scoping |
|---|---|---|---|---|---|
| `photos/Ashish_Kyal__Sensex_82900_CE__Not_Registered.jpeg` | Ashish Kyal | `SENSEX_82900_CE` | `DERIVATIVE` | `SENSEX` | Equity-only checks (`market_cap`, `surveillance` ASM/GSM, equity `liquidity`/`volume_spike`/`pre_tip_run_up` when contract history is absent) MUST return `Could not verify` with explicit reason `DERIVATIVE_CHECK_INAPPLICABLE`. Claim Ledger flags `SL PAID` as `Not stated` (paywalled/gated). |
| `photos/Chinmay_Dudhane__Nifty_25500_CE__Registered.jpeg` | Chinmay Dudhane (alias: `Trading cafe India`) | `NIFTY_25500_CE` | `DERIVATIVE` | `NIFTY_50` | Equity-only checks return `Could not verify` (`DERIVATIVE_CHECK_INAPPLICABLE`). Claim Ledger flags `SL- Paid` as `Not stated` (gated). |
| `photos/Harsh_Bhagat__Nifty_25600_CE__Not_Registered.jpeg` | Harsh Bhagat | `NIFTY_25600_CE` | `DERIVATIVE` | `NIFTY_50` | Equity-only checks return `Could not verify` (`DERIVATIVE_CHECK_INAPPLICABLE`). Claim Ledger flags `SL. VIP PREMIUM` as `Not stated` (gated) and highlights promotional/account-handling language in Hype Detector. |

Underlying index context (`SENSEX` / `NIFTY_50`) may be shown in the Tip Time Machine with an explicit label stating that the chart shows the **underlying index**, not the option contract premium.

---

## 3. Hand-Labelled Hinglish Evaluation Corpus Plan

To evaluate Claim Ledger extraction, Hype Detection, and Disclosure Grading objectively (Tasks `2.9`, `2.10`, `3.5`):
- **Target size:** Approximately **100 hand-labelled Hinglish/English posts** combining team-authored Hinglish examples and the 6 curated `photos/` and `videos/` corpus items.
- **Required labelled scenarios:**
  - Missing stop-loss and paywalled/gated stop-loss (`SL PAID`, `SL- Paid`, `SL. VIP PREMIUM`).
  - Urgency/certainty hype phrases (`guaranteed`, `10x multibagger`, `last chance`, `double money`, `pakka`, `join my Telegram`).
  - Clear sponsorship disclosure (`Clear disclosure`), ambiguous hints (`Vague`), absent disclosure (`None`), and short/ambiguous snippets (`Unclear`).
  - Sarcasm, emoji-coded tickers, and ambiguous deadlines (`"next week"`, `"soon"` -> `Unclear`).
- **Baselines & Metrics:**
  - Compare bounded LLM/OCR/ASR Claim Ledger extraction against a deterministic regex/keyword baseline (measuring field-level precision, recall, and exact source-span match rate).
  - Benchmark Disclosure Grade rules against a plain `#ad` keyword baseline.

---

## 4. Synthetic vs. Real Data Separation Policy

1. **Snapshot-level provenance (`data_snapshot.data_label`):** Every imported dataset snapshot is tagged `REAL`, `SYNTHETIC`, or `MIXED` with `source_name`, `source_url`, `as_of_date`, `retrieved_at`, `version`, and `checksum`.
2. **Row-level tip labeling (`tip.is_synthetic`):** Non-nullable boolean explicitly set on every `tip` row and returned in every API response (`data_label`).
3. **Zero synthetic market-price substitution:** Synthetic market prices, volumes, market caps, or surveillance entries must **never** be injected to fill missing real market snapshots. Missing real market data produces `Could not verify`.
4. **Immutable snapshots:** Corrections create a new `data_snapshot` UUID and `version` rather than mutating prior historical rows.

---

## 5. Initial Versioned Methodology Parameters (Subject to Task 2.4 / 3.5 Calibration)

All parameters live in versioned backend configuration (`methodology_version`) and are returned with every API response:

- **Liquidity (`liquidity-v1`):** Average daily traded value (`close * volume`) over `N = 20` valid prior trading sessions. Thresholds calibrated in Task `2.4` / `3.5` against enforcement cases and liquid comparison equities.
- **Market Cap (`market-cap-v1`):** Versioned Large / Mid / Small / Micro band boundaries tied to documented effective date (e.g., AMFI semi-annual classification or INR Crore cutoffs documented in config).
- **Volume Spike (`volume-spike-v1`):** Tip-date volume ratio vs. prior `N = 20` valid sessions (and z-score where sample variance is non-zero). Zero/missing volume returns `Could not verify`.
- **Pre-Tip Run-Up (`pre-tip-runup-v1`):** Percentage close-to-close move across the **5 valid trading sessions immediately preceding** the tip date. Fewer than 5 prior sessions returns `Could not verify`.
- **Surveillance / Circuit Band (`surveillance-v1`):** Dated ASM/GSM watchlist lookup + circuit-band snapshot for the queried date. Uncovered date or derivative contract returns `Could not verify`.
- **Creator Track Record (`track-record-v1`):**
  - Entry close: first valid trading session strictly after publication date (next trading session when only date is known).
  - Outcome: `directional_excess_return = direction_sign * (security_return - nifty_50_return)`; exact ties excluded and counted separately.
  - Posterior: `Beta(alpha_prior + successes, beta_prior + failures)` with versioned prior (initial default `alpha_prior = 1`, `beta_prior = 1`, 95% equal-tailed credible interval).
  - Minimum sample floor: provisional `20` resolved tips (`Not enough tips to judge` if `< 20` or if interval does not clear matched baseline).
