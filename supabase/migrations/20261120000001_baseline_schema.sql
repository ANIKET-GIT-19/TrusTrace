-- Tip Autopsy — Baseline Schema Migration (Task 1.5)
-- Purpose: Establish baseline migration tracking and a server-only readiness table
-- before Phase 2 adds provenance-aware domain tables.
-- Privacy guardrail: No end-user accounts, profiles, portfolios, uploaded media, or pasted tips.

CREATE TABLE IF NOT EXISTS public.schema_metadata (
  id text PRIMARY KEY,
  blueprint_version text NOT NULL,
  applied_at timestamptz NOT NULL DEFAULT now(),
  notes text
);

ALTER TABLE public.schema_metadata ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'schema_metadata'
      AND policyname = 'deny_public_access_schema_metadata'
  ) THEN
    CREATE POLICY "deny_public_access_schema_metadata"
      ON public.schema_metadata
      FOR ALL
      TO anon, authenticated
      USING (false)
      WITH CHECK (false);
  END IF;
END
$$;

INSERT INTO public.schema_metadata (id, blueprint_version, notes)
VALUES (
  'baseline-v1',
  '1.0-mern-supabase',
  'Phase 1 baseline migration for Tip Autopsy (TrustTrace). Zero user persistence.'
)
ON CONFLICT (id) DO NOTHING;
