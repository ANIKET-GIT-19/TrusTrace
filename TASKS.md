# Tip Autopsy — Step-by-Step Implementation Plan

**Document status:** Ready for task-by-task execution after blueprint approval  
**Rule:** Execute exactly one task at a time. Stop for review and explicit approval before starting the next task.

---

## 0. Execution Protocol

1. Read `PRD.md`, `ARCHITECTURE.md`, and `AGENTS.md` before selecting work.
2. Select the first unchecked task whose dependencies are complete.
3. Work only on that task. Do not bundle unrelated cleanup, features, or “quick improvements”.
4. Before editing, state the task ID, intended changes, files expected to change, and acceptance criteria.
5. Implement the task and run only the relevant checks plus any required regression tests.
6. Report changed files, commands run, test results, known limitations, and any deviation from the blueprint.
7. Update this file and the relevant blueprint documents only after the task has been reviewed and accepted.
8. Stop and wait for the user's review. Do not begin the next task until approval is explicit.
9. If a task exposes a product or architecture conflict, stop implementation and propose the smallest decision needed. Do not silently rewrite the requirements.

A checked box means the user has reviewed and accepted the task, not merely that code was written.

## Phase 1 — Setup and Foundation

### 1.1 Confirm the project baseline

- [ ] Review `PRD.md`, `ARCHITECTURE.md`, and this task plan together.
  - [ ] Confirm the MVP boundaries and non-negotiable no-advice rules.
  - [ ] Confirm React/TypeScript, FastAPI, PostgreSQL, Netlify, and Render as the initial stack.
  - [ ] Confirm the zero-login and no-user-data-persistence model.
  - [ ] Record decisions on data source access and initial methodology parameters.
- [ ] Acceptance: the user approves the blueprint and the first implementation task before any application source code is written.

### 1.2 Create the repository scaffold

- [ ] Create the monorepo folders for `frontend/`, `backend/`, and `docs/`.
  - [ ] Add only the minimal package and project manifests needed for the selected stack.
  - [ ] Pin Node.js and Python runtime versions and add dependency lockfiles.
  - [ ] Add `.gitignore` rules for virtual environments, dependencies, build output, local databases, and secrets.
  - [ ] Add `.env.example` containing key names and safe example values only.
- [ ] Acceptance: a clean clone can install dependencies without committing secrets or generated data.

### 1.3 Establish frontend foundation

- [ ] Bootstrap React + TypeScript + Vite.
  - [ ] Enable strict TypeScript checking.
  - [ ] Configure Tailwind and the approved design tokens.
  - [ ] Add routing and the responsive application shell.
  - [ ] Add lint, typecheck, and test scripts.
- [ ] Acceptance: the frontend runs locally, renders an empty Tip Autopsy shell, and passes lint/typecheck/build.

### 1.4 Establish backend foundation

- [ ] Bootstrap FastAPI and Python project tooling.
  - [ ] Add Pydantic settings and environment-based configuration.
  - [ ] Add a health endpoint and consistent API error envelope.
  - [ ] Configure Ruff, mypy, pytest, and test settings.
  - [ ] Add request IDs and safe structured logging with input redaction.
- [ ] Acceptance: the backend starts locally, `/api/health` responds, and baseline tests/lint/type checks pass.

### 1.5 Establish local PostgreSQL and migrations

- [ ] Add a local PostgreSQL service through Docker Compose.
  - [ ] Configure SQLAlchemy database connectivity.
  - [ ] Configure Alembic migrations.
  - [ ] Add a first migration for the empty baseline schema.
  - [ ] Verify a fresh database can be migrated from zero to head.
- [ ] Acceptance: a new developer can start the database and apply migrations using documented commands.

### 1.6 Add quality gates and CI

- [ ] Configure CI for frontend and backend.
  - [ ] Run frontend lint, typecheck, unit tests, and production build.
  - [ ] Run backend Ruff, mypy, and pytest.
  - [ ] Add dependency and secret scanning where supported.
  - [ ] Fail the pipeline on test, lint, or type errors.
- [ ] Acceptance: CI runs on pull requests and reports failures clearly.

### 1.7 Create deployment foundations

- [ ] Connect frontend preview deployment to Netlify.
  - [ ] Configure production build output and public API base URL.
  - [ ] Restrict deployment environment variables to public client values.
- [ ] Connect backend preview deployment to Render.
  - [ ] Configure start command, health check, and secret environment variables.
  - [ ] Provision an isolated staging PostgreSQL database.
- [ ] Acceptance: preview frontend can call the staging backend over HTTPS; production is not modified by this task.

### 1.8 Finalize data-source inventory and methodology plan

- [ ] Document intended NSE/BSE, SEBI, enforcement-order, and tip-corpus inputs.
  - [ ] Record source URL/provider, retrieval method, access date, usage terms, and expected fields.
  - [ ] Confirm whether historical price, volume, market cap, circuit-band, and ASM/GSM snapshots are available.
  - [ ] Define the hand-labelled Hinglish evaluation corpus plan.
  - [ ] Define how synthetic records will be labelled and separated from real data.
- [ ] Acceptance: no data source is treated as production-ready until access and usage terms are reviewed and its provenance metadata is defined.

### 1.9 Establish the visual foundation

- [ ] Implement the responsive color, typography, spacing, and status-token system from `PRD.md`.
  - [ ] Build accessible buttons, inputs, cards, badges, alerts, and progress indicators.
  - [ ] Confirm there is no stock-level red/green verdict treatment.
  - [ ] Verify layout at narrow mobile, tablet, and desktop widths.
- [ ] Acceptance: the application shell matches the approved visual direction and passes basic keyboard/contrast review.

## Phase 2 — Core Product Loop

### 2.1 Implement the provenance-aware data model

- [ ] Add SQLAlchemy models and Alembic migrations for `data_snapshot`, `influencer`, `sebi_register_entry`, `stock`, `price_history`, `stock_info`, `benchmark_history`, `surveillance_entry`, and `tip`.
  - [ ] Add foreign keys, unique constraints, indexes, enums, and explicit data labels.
  - [ ] Add ingestion-run audit fields/table.
  - [ ] Preserve immutable snapshot references and dates.
  - [ ] Confirm no user profile, portfolio, pasted-tip history, or personal-data table exists.
- [ ] Acceptance: schema migrations pass on a fresh database and constraints prevent ambiguous provenance records.

### 2.2 Build snapshot ingestion and validation

- [ ] Implement repeatable loaders for approved market, Nifty 50 benchmark, SEBI, surveillance, market-cap, and tip datasets.
  - [ ] Validate schema, ticker/date formats, duplicates, and numeric values.
  - [ ] Record checksum, source, retrieved time, as-of date, dataset version, and Real/Synthetic/Mixed label.
  - [ ] Reject or quarantine malformed rows and produce an import summary.
  - [ ] Make imports idempotent without overwriting prior snapshots.
- [ ] Acceptance: a sample real snapshot and a synthetic tip dataset can be loaded and queried with correct provenance labels.

### 2.3 Seed the demo corpus

- [ ] Prepare a small curated creator, stock, and historical-tip dataset.
  - [ ] Include hand-authored Hinglish examples for missing stop-loss, urgency/hype, vague disclosure, and clear disclosure.
  - [ ] Include real historical market snapshots only when their source and date are verified.
  - [ ] Mark every synthetic tip at row level and expose that label in API responses.
  - [ ] Add data coverage notes and known gaps.
- [ ] Acceptance: demo data is reproducible, clearly labelled, and contains no synthetic market values represented as real.

### 2.4 Implement the five deterministic market checks

- [ ] Build pure calculation modules for liquidity, market-cap band, volume spike, pre-tip run-up, and surveillance/circuit band.
  - [ ] Keep formulas separate from API routes.
  - [ ] Add configurable lookback and versioned threshold configuration.
  - [ ] Calibrate thresholds against enforcement cases and a normal-stock comparison set.
  - [ ] Return `Within normal range`, `Needs attention`, or `Could not verify` with values, dates, sources, and method versions.
  - [ ] Add tests for missing data, stale snapshots, non-trading days, zero/invalid volume, and insufficient history.
- [ ] Acceptance: each check is deterministic, reproducible from a snapshot ID, and never invents a value when source data is missing.

### 2.5 Implement benchmark-adjusted creator statistics

- [ ] Build the historical tip-resolution and Beta-Binomial module.
  - [ ] Align stock and Nifty 50 returns over each tip's stated horizon, using the first valid market close strictly after the publication date (or the next trading session when only a date is known).
  - [ ] Apply direction-adjusted excess return consistently.
  - [ ] Define handling for ties, missing deadlines, and incomplete market history.
  - [ ] Implement the versioned prior, credible interval, matched baseline, and provisional minimum-sample policy.
  - [ ] Return interval, sample counts, benchmark definition, and `Not enough tips to judge` state.
- [ ] Acceptance: unit tests cover wins, losses, ties, insufficient samples, and benchmark alignment; no raw creator accuracy leaderboard is exposed.

### 2.6 Implement template report builder and Output Guard

- [ ] Create an allowlist of reviewed evidence-only sentence templates.
  - [ ] Build facts-card sections from backend-verified values and source references.
  - [ ] Add deterministic prohibited-language checks and semantic/adversarial test cases.
  - [ ] Add a fixed safe fallback for blocked output.
  - [ ] Add the mandatory disclaimer verbatim to all report responses.
  - [ ] Ensure quoted creator text is escaped and labelled separately from system narrative.
- [ ] Acceptance: all report paths pass through the guard and the test suite produces zero system-authored advice outputs.

### 2.7 Expose the core REST API

- [ ] Implement the check, prices, tip-marker, report, snapshot metadata, and health endpoints.
  - [ ] Define Pydantic request/response contracts and stable error codes.
  - [ ] Include source snapshot IDs, as-of dates, data labels, and methodology versions.
  - [ ] Add integration tests against PostgreSQL fixtures.
  - [ ] Confirm handlers contain no duplicated market formulas.
- [ ] Acceptance: API consumers can retrieve chart data, exact-date tip details, market checks, creator interval, and a guarded facts card.

### 2.8 Build the Tip Time Machine and evidence UI

- [ ] Build price/volume chart with date range controls and tappable tip markers.
  - [ ] Add Real/Synthetic labels to markers and selected tip details.
  - [ ] Implement exact-date marker selection behavior.
  - [ ] Add an accessible list alternative for chart markers.
  - [ ] Show loading, no-data, stale-data, and partial-data states.
- [ ] Acceptance: marker selection returns only the correct creator-stock-date tip records, and chart provenance is visible.

### 2.9 Build the Claim Ledger parser and structured fallback

- [ ] Implement the bounded parser adapter and Claim Ledger response contract.
  - [ ] Parse stock, direction, target price, deadline, and stop-loss only.
  - [ ] Validate source spans against the original text.
  - [ ] Render `Not stated` for missing fields and `Unclear` for ambiguous extraction.
  - [ ] Add manual correction and structured influencer/stock lookup fallback.
  - [ ] Add provider timeout, invalid JSON, and unavailable-provider handling.
- [ ] Acceptance: parser failure never blocks structured lookup; no hallucinated or unsupported field is presented as verified.

### 2.10 Implement Hype Detector and Disclosure Grade

- [ ] Add versioned Hinglish/English phrase dictionaries and disclosure rules.
  - [ ] Highlight exact phrase spans in the original text.
  - [ ] Show evidence supporting Clear/Vague/None grades.
  - [ ] Benchmark against the plain `#ad` baseline.
  - [ ] Add `Unclear`/unknown handling for ambiguous or insufficient source text.
- [ ] Acceptance: flags describe text evidence only and do not label a person or security as fraudulent.

### 2.11 Implement SEBI register identity lookup

- [ ] Add deterministic snapshot matching and neutral result rendering.
  - [ ] Support exact registration-number matches and conservative name matches.
  - [ ] Return `Registered`, `Not found`, or `Unclear` with snapshot date.
  - [ ] Prevent ambiguous fuzzy matches from being presented as verified identities.
  - [ ] Ensure a missing match does not block the rest of the autopsy.
- [ ] Acceptance: lookup behavior is explainable, dated, neutral, and non-blocking.

### 2.12 Build the facts card and five-step journey

- [ ] Connect the dual-mode input, Claim Ledger, identity evidence, market checks, chart, and guarded facts card.
  - [ ] Add progress navigation and return-to-evidence behavior.
  - [ ] Show every check's measured value, status, source, as-of date, and explanation.
  - [ ] Show creator credible interval or `Not enough tips to judge`.
  - [ ] Display the mandatory disclaimer on every facts card.
- [ ] Acceptance: a user can complete the full analysis from either input mode using preloaded snapshots.

### 2.13 Implement Pause & Plan

- [ ] Add the three pre-commitment questions before the `I'd act on this` path.
  - [ ] Require all three responses before proceeding through that path.
  - [ ] Keep answers in client memory only.
  - [ ] Add reset and back navigation without persisting answers.
  - [ ] Avoid any automated position sizing, exit recommendation, or trade instruction.
- [ ] Acceptance: the gate cannot be bypassed through the normal UI and no answers are stored by the backend.

### 2.14 Complete core end-to-end and safety verification

- [ ] Add Playwright flows for pasted input and structured fallback.
  - [ ] Verify not-found SEBI result continues through the full analysis.
  - [ ] Verify unknown market data renders `Could not verify`.
  - [ ] Verify exact-date chart marker behavior.
  - [ ] Verify report disclaimer and Output Guard behavior.
  - [ ] Verify no user text or Pause & Plan answers are persisted to browser storage or backend logs.
- [ ] Acceptance: all MVP core paths pass on desktop and mobile emulation; failures are documented, not hidden.

## Phase 3 — Polish, Evaluation, and Release Readiness

### 3.1 Responsive, accessible, and interaction polish

- [ ] Review mobile layouts, touch targets, keyboard navigation, focus states, labels, contrast, and reduced motion.
  - [ ] Add accessible chart summaries and marker list controls.
  - [ ] Improve empty, stale, loading, and failure states.
  - [ ] Remove unnecessary motion and trading-terminal visual cues.
- [ ] Acceptance: no horizontal overflow on supported mobile widths and all primary interactions are keyboard-accessible.

### 3.2 Performance and resilience

- [ ] Measure API response time and client bundle size on the demo dataset.
  - [ ] Cache immutable snapshot queries using snapshot/version-aware keys.
  - [ ] Add provider timeouts, bounded retries, and rate limits.
  - [ ] Confirm parser/voice provider outages do not block structured lookup or facts based on local data.
- [ ] Acceptance: the primary demo path completes using local snapshots even when optional providers are unavailable.

### 3.3 Optional voice readout

- [ ] Integrate Sarvam voice only after the text facts card and guard are stable.
  - [ ] Generate speech only from already-guarded text.
  - [ ] Support Hindi, Kannada, and English where provider capabilities permit.
  - [ ] Add disabled/unavailable state and text-first fallback.
- [ ] Acceptance: voice output cannot introduce new facts or advice and failure does not affect core flow.

### 3.4 Optional coordinated-promotion demo signal

- [ ] Add a clearly labelled synthetic coordinated-promotion example only if time permits.
  - [ ] Keep the feature separate from the five core deterministic checks.
  - [ ] Explain which inputs are synthetic and what the signal cannot establish.
  - [ ] Do not call a creator fraudulent or infer coordination from a single phrase.
- [ ] Acceptance: the demo label and limitations are visible; it is not presented as a production manipulation detector.

### 3.5 Calibrate and report model/check performance

- [ ] Evaluate five-check calibration against historical enforcement cases and normal stocks.
  - [ ] Compare with a naive baseline such as flagging all small-cap stocks.
  - [ ] Report precision, recall, confidence intervals, false positives, and known blind spots.
  - [ ] Revisit lookback, market-cap boundaries, and thresholds with versioned methodology changes.
- [ ] Acceptance: no threshold is described as validated unless the evaluation evidence supports it.

### 3.6 Run the three-arm behavioral study

- [ ] Prepare the study protocol, consent language, task order, and analysis plan.
  - [ ] Recruit at least 40 participants.
  - [ ] Use approximately 20 historical tips with clearly identified synthetic examples where applicable.
  - [ ] Compare Arm A baseline, Arm B leaderboard, and Arm C Tip Autopsy.
  - [ ] Measure collapsed-tip action rate, skipped-successful-tip rate, Brier score, and decision time.
  - [ ] Report inconclusive or negative results and study limitations.
- [ ] Acceptance: the result is reproducible and no claim of decision improvement exceeds the collected evidence.

### 3.7 Complete Output Guard adversarial test campaign

- [ ] Expand test cases for direct instructions, euphemisms, conditional recommendations, Hindi/Hinglish advice terms, and target-price leakage.
  - [ ] Test all system-authored report templates and fallback paths.
  - [ ] Ensure raw creator quotes stay visually and semantically separate.
  - [ ] Block release if any system-authored advice output is found.
- [ ] Acceptance: zero advice outputs in the release test suite; failures are fixed and re-tested.

### 3.8 Production operations and security review

- [ ] Review CORS, HTTPS, secrets, provider retention settings, rate limits, dependency risks, and logging redaction.
  - [ ] Verify database backup and restore.
  - [ ] Verify preview and production isolation.
  - [ ] Test application behavior with LLM and voice integrations disabled.
  - [ ] Document deployment rollback and data snapshot rollback procedures.
- [ ] Acceptance: security checklist and operational runbook are approved before production launch.

### 3.9 Demo rehearsal and release checklist

- [ ] Rehearse the 60-second demo arc.
  - [ ] 0:00–0:15: paste a Hinglish tip and show the Claim Ledger/missing stop-loss/hype phrases.
  - [ ] 0:15–0:35: show SEBI snapshot state, pre-tip run-up, volume spike, chart marker, and Output Guard stress test.
  - [ ] 0:35–0:50: complete Pause & Plan and play an optional short voice readout.
  - [ ] 0:50–1:00: show the three-arm experiment comparison and candid failure modes.
  - [ ] Confirm every screen shows the correct as-of date and Real/Synthetic status.
- [ ] Acceptance: the live demo works from preloaded snapshots without relying on a fragile live API and the limitations are stated honestly.

## Backlog / Deferred Beyond MVP

- [ ] Screenshot/OCR and WhatsApp share-to-app input, subject to privacy and platform-policy review.
- [ ] Persistent user accounts or saved analyses (not permitted without a separate product/privacy review).
- [ ] Real-time social-platform ingestion or scraping (excluded from the product direction).
- [ ] Broker integration, trading, portfolio tracking, and buy/sell/hold recommendations (excluded from the product direction).
