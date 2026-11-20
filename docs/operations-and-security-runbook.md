# Tip Autopsy — Production Operations & Security Runbook (Task 3.8)

**Stack:** React + TypeScript + Vite (Netlify) · Node.js 22 + Express + TypeScript (Render) · Supabase PostgreSQL (`TrustTrace` / `vevrmjlokngcknkidmbc`)

---

## 1. Security Checklist

| Control | Implementation & Verification |
|---|---|
| **HTTPS & Security Headers** | Enforced by Netlify (`netlify.toml`: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`) and Render HTTPS + Express `helmet()` + `x-powered-by` disabled. |
| **CORS Restriction** | Express `cors()` allows only explicit `FRONTEND_ORIGINS` (local dev or deployed Netlify origin); wildcard `*` is never used in staging/production. |
| **Secret Isolation** | `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `LLM_API_KEY`, and `SARVAM_API_KEY` live exclusively in backend server-side secrets (Render env vars). CI (`secret-and-guardrail-scan`) fails if any server secret or `.env` file appears in `frontend/src/` or Git. |
| **Supabase RLS Defense-in-Depth** | Every table in `public` (`schema_metadata`, `data_snapshot`, `ingestion_run`, `influencer`, `sebi_register_entry`, `stock`, `price_history`, `stock_info`, `benchmark_history`, `surveillance_entry`, `tip`, `calibration_case`) has `ROW LEVEL SECURITY` enabled with explicit `deny_public_access_*` policies for `anon` and `authenticated`. All client access goes strictly through the Express API so the Output Guard cannot be bypassed via PostgREST. |
| **Media Upload & Privacy** | Multer `memoryStorage()` only; strict JPEG/PNG/WebP/MP4/WebM magic-byte validation (`415` on spoofed files); 8 MB photo / 25 MB video limits; ephemeral buffers zero-filled (`buffer.fill(0)`) in `finally {}`. Zero user accounts, uploaded media storage, or pasted-tip tables. |
| **Log Redaction** | `backend/src/core/logger.ts` redacts `text`, `tip`, `file`, `buffer`, `answers`, `pause_plan`, `prompt`, `authorization`, `token`, `secret`, `apikey`, and JWT values (`[REDACTED]`). |
| **Rate Limits & Timeouts** | Global `/api` rate limit (`120 req/min`) + tighter provider route limit (`40 req/min`) on `/api/tips/parse` and `/api/voice/readout`; `8000ms` bounded timeout on Sarvam TTS. |
| **Third-Party Data Retention** | Do not enable cloud `LLM_PROVIDER` or `SARVAM_API_KEY` in production until zero-training / zero-retention provider terms are confirmed for the target tier. |

---

## 2. Independent Provider Kill-Switches

Core Tip Autopsy workflows run deterministically on preloaded snapshots even when all optional AI/voice integrations are disabled:
- **Disable Cloud Parser/OCR/ASR:** Set `LLM_PROVIDER=disabled` and clear `LLM_API_KEY` in Render → restarts into structured Influencer + Stock + deterministic Claim Ledger fallback automatically.
- **Disable Sarvam Voice Readout:** Clear `SARVAM_API_KEY` in Render → `POST /api/voice/readout` returns `200 { status: "DISABLED" }` and UI shows calm text-first fallback.

---

## 3. Environment Isolation & Backup / Restore

- **Preview vs. Production:** Preview deploys (`render.yaml` staging service + Netlify Deploy Preview) MUST point to a dedicated Supabase branch or staging project, never production credentials.
- **Supabase Backups & Restore:**
  1. Enable daily automated backups (and PITR on Pro tier) in Supabase Dashboard → *Database → Backups*.
  2. Test restoration quarterly to a scratch branch/project and verify row counts on `data_snapshot`, `sebi_register_entry`, and `price_history`, then run `get_advisors(security)` to confirm RLS policies survived restore.

---

## 4. Rollback Procedures

### Application Rollback
- **Frontend (Netlify):** Open Netlify Dashboard → *Deploys* → select the last known-good build → click **Publish deploy**.
- **Backend (Render):** Open Render Dashboard → *Events / Deploys* → select prior healthy commit → click **Rollback to this deploy**, then verify `GET /api/health` returns `status: "ok"`.

### Data Snapshot Rollback
Because snapshots in `public.data_snapshot` are **immutable** (corrections insert a new snapshot UUID and `version` rather than overwriting historical rows):
1. Mark a faulty snapshot `validation_status = 'REJECTED'` via a maintainer SQL migration.
2. Queries automatically fall back to the newest `VALID` snapshot with earlier `as_of_date`, and `SnapshotVersionCache` keys include `snapshot_id`, preventing stale mixed cache hits.
