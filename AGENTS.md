# Tip Autopsy — AI Agent Context and Guardrails

**Purpose:** Give coding agents and human contributors a durable operating contract for implementing Tip Autopsy safely and consistently.  
**Primary rule:** Check `TASKS.md` before starting any new feature or change.

---

## 1. Product Mission

Build Tip Autopsy as an evidence-literacy application for first-time Indian retail investors. It analyzes the information surrounding one stock tip; it does not recommend investments.

The product's governing statement is:

> **We grade the information, not the investment.**

Read `PRD.md` for product behavior and `ARCHITECTURE.md` for implementation decisions. Those documents and the accepted task plan are the source of truth. Do not invent requirements from assumptions or from an LLM's suggestions.

## 2. Mandatory Workflow Before Every Task

1. Open and read `TASKS.md`.
2. Identify the first unchecked task whose dependencies are complete.
3. Read the corresponding sections in `PRD.md` and `ARCHITECTURE.md`.
4. State the task ID, expected files, implementation approach, and acceptance criteria before editing.
5. Implement only that task. Do not bundle unrelated tasks, refactors, dependency upgrades, or visual experiments.
6. Run the relevant tests, lint, type checks, and build checks.
7. Report changed files, commands executed, results, and any known limitation.
8. Stop for the user's review. Never start another task without explicit approval.
9. After approval, update the relevant task checkbox and any affected blueprint document so the external memory remains accurate.

A checkbox is complete only after the user reviews and accepts the result. Do not mark tasks complete merely because an implementation or test run exists.

## 3. Non-Negotiable Product and Safety Rules

### 3.1 Never provide investment advice

- Never tell the user to buy, sell, hold, avoid, or target a stock.
- Never provide a target price, valuation judgment, price prediction, or investment action recommendation in system-authored content.
- Never create an overall trust score, influencer leaderboard, stock verdict, or red/green investment signal.
- The app may show a target price only as an explicitly quoted/extracted claim made by the original tip creator. Label it `Creator's claim`; never present it as an application conclusion.
- Use objective, dated facts and neutral wording.

### 3.2 Deterministic evidence; bounded AI

- AI is allowed only for parsing unstructured Hinglish/English text into the structured Claim Ledger.
- AI must not calculate market checks, decide risk status, resolve creator track records, determine SEBI registration, or generate facts-card narrative.
- Validate every parser response against the backend schema and the original source spans.
- Unsupported, absent, or ambiguous data must remain `Not stated`, `Unclear`, or `Could not verify`.
- Structured influencer + stock lookup must continue to work when the LLM provider is unavailable.
- Facts-card narrative must be built from reviewed templates and backend-verified values only.

### 3.3 Output Guard is mandatory

- Route every system-authored facts-card sentence through the template allowlist and Output Guard.
- Scan for prohibited advice terms and their variants, including `buy`, `sell`, `hold`, `avoid`, `target`, `undervalued`, `overvalued`, `will rise`, and `will fall`.
- Add adversarial tests for paraphrases, conditional recommendations, euphemisms, and Hinglish equivalents.
- If unsafe output is detected, block the candidate and return the fixed safe fallback.
- Never weaken, bypass, or disable the guard to make a demo pass.
- Keep original creator text visibly quoted, escaped, and separate from system-authored language.

### 3.4 Identity and language discipline

- `Not found in SEBI register snapshot` means only that no supported match was found in that dated snapshot. It does not mean fraud, scam, or illegal activity.
- Ambiguous name matching returns `Unclear`; do not overstate fuzzy matches.
- Hype phrases are evidence of language, not proof of manipulation.
- Disclosure grades are evidence classifications, not legal certifications.
- Do not label a person a scammer or fraud.

### 3.5 Data provenance

- Every evidence record must carry a source, as-of date, snapshot identifier, and Real/Synthetic/Mixed label.
- Synthetic demo data must never be shown as real market data.
- Never generate plausible-looking market values to fill a missing dataset.
- Missing, stale, incomplete, or misaligned data must produce `Could not verify` with a clear reason.
- Keep imported snapshots immutable; corrections require a new snapshot/version.
- Do not scrape Telegram, WhatsApp, Instagram, YouTube, or other social platforms.

### 3.6 Privacy

- Version 1 has no end-user login, accounts, profiles, portfolios, or saved analysis history.
- Never persist pasted tip text, Pause & Plan answers, or personal user data.
- Do not log request bodies that contain tip text. Redact user content from exception messages, traces, analytics, and provider errors.
- Do not add session replay or analytics that capture form contents.
- Do not store user text in localStorage or IndexedDB. Keep it in active client memory only and clear it on reset.
- Do not add a database table for users or pasted tips without an explicit, separately reviewed product/privacy change.

## 4. Project Commands

The commands below are the intended interface after the corresponding Phase 1 setup tasks have created the project manifests and local services. Run commands from the specified directories. Do not claim a command is available until its setup task is complete.

### 4.1 Prerequisites

- Node.js 22 or newer and npm.
- Python 3.12 or newer.
- `uv` for Python environment/dependency management.
- Docker Desktop or Docker Engine with Docker Compose.
- Access to the local PostgreSQL service.

### 4.2 First-time setup

```bash
# Frontend dependencies
cd frontend
npm ci

# Backend dependencies
cd ../backend
uv sync

# Start local PostgreSQL from the repository root
cd ..
docker compose up -d db

# Apply database migrations
cd backend
uv run alembic upgrade head
```

### 4.3 Run the app locally

Start the backend in one terminal:

```bash
cd backend
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Start the frontend in a second terminal:

```bash
cd frontend
npm run dev
```

The Vite development server should call the local API through the configured public API base URL. Never put backend secrets in Vite variables.

### 4.4 Test and quality commands

Frontend:

```bash
cd frontend
npm run lint
npm run typecheck
npm run test -- --run
npm run build
npm run test:e2e
```

Backend:

```bash
cd backend
uv run ruff check .
uv run ruff format --check .
uv run mypy app
uv run pytest
```

Database migrations:

```bash
cd backend
uv run alembic upgrade head
uv run alembic current
```

When an individual test fails, reproduce and fix the smallest relevant issue. Do not skip or delete a meaningful test just to make CI green.

## 5. Code Style and Engineering Standards

### 5.1 TypeScript and React

- Keep TypeScript strict; avoid `any`. Use `unknown` and narrow types when external data is uncertain.
- Keep UI components small and focused. Put business calculations in the backend domain layer.
- Use TanStack Query for API/server state and React Context + `useReducer` for transient multi-step workflow state.
- Do not persist pasted text or Pause & Plan answers in browser storage.
- Keep API response types aligned with backend Pydantic models. Do not duplicate or reinterpret financial formulas in the browser.
- Prefer semantic HTML, accessible names, visible focus states, keyboard interaction, and reduced-motion support.
- Keep status text explicit; color alone must never carry the meaning.

### 5.2 Python and FastAPI

- Use type annotations for public functions, Pydantic models for API boundaries, and small domain services for calculations.
- Keep route handlers thin. Do not put market formulas, threshold decisions, Beta-Binomial logic, or template content directly in route modules.
- Use SQLAlchemy parameterized expressions and explicit transactions.
- Keep date and timezone handling explicit. Use `Decimal`-appropriate representations for persisted financial values.
- Raise typed domain errors and map them to stable API error codes. Do not leak stack traces or database details.
- Keep threshold configuration and methodology versions explicit and testable.

### 5.3 Naming and structure

- Use descriptive domain names such as `volume_spike`, `pre_tip_run_up`, `sebi_register_entry`, and `not_enough_tips_to_judge`.
- Prefer explicit status enums over ambiguous booleans.
- Use ISO date formats in API responses and include units for numeric values.
- Add comments for non-obvious methodology decisions, not for code that is already self-explanatory.
- Avoid premature abstractions, microservices, event buses, and infrastructure that is not needed for Version 1.

## 6. Error Handling and Resilience

- Every API error must use the agreed error envelope with a stable code, safe message, request ID, and retryable flag.
- Distinguish missing data from system failure. Missing source evidence is a `Could not verify` result, not an internal-server error.
- Distinguish parser unavailability from an empty Claim Ledger. Offer structured lookup/manual correction when parsing fails.
- Use bounded timeouts and retries for external providers. Never block the entire app on voice or LLM availability.
- Never silently replace failed real data with synthetic data.
- Log operational metadata and request IDs, not user text, secrets, prompts, or personal information.

## 7. UI and Content Guardrails

- Follow the approved design direction in `PRD.md`: calm, editorial, mobile-first, evidence-led.
- Do not add trading-terminal visual cues, countdown pressure, confetti, gamified accuracy scores, or buy/avoid colors.
- Put snapshot date and Real/Synthetic label adjacent to the evidence they qualify.
- Show `Not stated`, `Unclear`, `Not enough tips to judge`, and `Could not verify` as explicit text states.
- Keep creator quotes visually separate from the application's own narrative.
- Preserve the mandatory report disclaimer exactly:

  > This report describes historical facts and risk factors around a tip. It is not investment advice or SEBI-registered research. The decision is yours.

- Do not change this disclaimer without product/legal review.

## 8. Security and Secrets

- Store all private keys and database credentials in backend/provider secret stores.
- Never commit `.env`, access tokens, private keys, database dumps containing sensitive data, or production exports.
- Restrict CORS to the expected frontend origins.
- Validate and size-limit untrusted inputs; escape rendered source text; allow only safe `http`/`https` source links.
- Do not fetch arbitrary URLs submitted in pasted tips.
- Keep the parser and voice provider calls server-side.
- Review dependency changes and provider data-retention settings before enabling a third-party service.

## 9. Documentation and External Memory Rules

`PRD.md`, `ARCHITECTURE.md`, `TASKS.md`, and `AGENTS.md` are the project's external memory. Update them as part of accepted work.

- Before a new feature: check `TASKS.md` and select one task only.
- If behavior changes: update `PRD.md` and its acceptance criteria.
- If stack, schema, API, state, or security decisions change: update `ARCHITECTURE.md`.
- If sequencing or acceptance criteria change: update `TASKS.md` after user approval.
- If commands, coding rules, safety boundaries, or agent workflow change: update `AGENTS.md`.
- Record methodology changes with version, rationale, source, and impact. Do not silently change thresholds or statistical assumptions.
- Do not add unresolved questions as fake completed decisions. Present the decision to the user and wait for approval.
- Keep documentation concise enough to use, but complete enough that a fresh agent can resume without relying on old chat context.

## 10. Definition of Done for Every Task

A task is ready for review only when:
- Its acceptance criteria are met.
- Relevant tests pass and lint/type checks are clean.
- No unrelated task has been bundled into the change.
- No secrets, user text, or personal data have been committed or logged.
- Data provenance and uncertainty are preserved.
- Product safety rules and Output Guard behavior remain intact.
- Documentation updates are prepared where the task changes behavior or architecture.
- The agent reports exactly what changed, what was tested, what remains uncertain, and any known limitation.

**Stop after presenting the review summary. Wait for explicit user approval before moving to the next task.**
