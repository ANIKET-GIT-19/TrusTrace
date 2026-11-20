-- Tip Autopsy — Provenance-Aware Relational Data Model (Task 2.1)
-- Privacy guardrail: ZERO end-user accounts, profiles, portfolios, uploaded media, or pasted-tip tables.
-- Security guardrail: RLS enabled with explicit deny-public policies on every table in public schema.

DO $$ BEGIN
  CREATE TYPE public.data_label_enum AS ENUM ('REAL', 'SYNTHETIC', 'MIXED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.validation_status_enum AS ENUM ('VALID', 'PARTIAL', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.exchange_enum AS ENUM ('NSE', 'BSE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.instrument_type_enum AS ENUM ('EQUITY', 'DERIVATIVE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.size_band_enum AS ENUM ('LARGE', 'MID', 'SMALL', 'MICRO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.disclosure_grade_enum AS ENUM ('CLEAR', 'VAGUE', 'NONE', 'UNKNOWN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.tip_direction_enum AS ENUM ('BULLISH', 'BEARISH', 'NEUTRAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.ingestion_status_enum AS ENUM ('STARTED', 'COMPLETED', 'PARTIAL', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.data_snapshot (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_key text NOT NULL,
  source_name text NOT NULL,
  source_url text,
  as_of_date date NOT NULL,
  retrieved_at timestamptz NOT NULL DEFAULT now(),
  data_label public.data_label_enum NOT NULL,
  version text NOT NULL,
  checksum text NOT NULL,
  row_count integer NOT NULL DEFAULT 0 CHECK (row_count >= 0),
  validation_status public.validation_status_enum NOT NULL,
  notes text,
  CONSTRAINT data_snapshot_unique_version_checksum UNIQUE (dataset_key, version, checksum)
);

CREATE TABLE IF NOT EXISTS public.ingestion_run (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_key text NOT NULL,
  snapshot_id uuid REFERENCES public.data_snapshot(id) ON DELETE SET NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status public.ingestion_status_enum NOT NULL,
  imported_count integer NOT NULL DEFAULT 0 CHECK (imported_count >= 0),
  rejected_count integer NOT NULL DEFAULT 0 CHECK (rejected_count >= 0),
  validation_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_summary text
);

CREATE TABLE IF NOT EXISTS public.influencer (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  handle text,
  aliases text[] NOT NULL DEFAULT '{}'::text[],
  normalized_name text NOT NULL,
  sebi_registration_no text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT influencer_unique_normalized_name UNIQUE (normalized_name)
);

CREATE TABLE IF NOT EXISTS public.sebi_register_entry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id uuid NOT NULL REFERENCES public.data_snapshot(id) ON DELETE RESTRICT,
  name text NOT NULL,
  normalized_name text NOT NULL,
  registration_no text NOT NULL,
  category text NOT NULL,
  snapshot_date date NOT NULL,
  CONSTRAINT sebi_register_entry_unique_snapshot_reg UNIQUE (snapshot_id, registration_no)
);

CREATE TABLE IF NOT EXISTS public.stock (
  ticker text PRIMARY KEY,
  company_name text NOT NULL,
  exchange public.exchange_enum NOT NULL,
  instrument_type public.instrument_type_enum NOT NULL,
  underlying_ticker text,
  circuit_band text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker text NOT NULL REFERENCES public.stock(ticker) ON DELETE RESTRICT,
  trading_date date NOT NULL,
  close numeric(18, 4) NOT NULL CHECK (close > 0),
  volume bigint NOT NULL CHECK (volume >= 0),
  snapshot_id uuid NOT NULL REFERENCES public.data_snapshot(id) ON DELETE RESTRICT,
  CONSTRAINT price_history_unique_ticker_date_snapshot UNIQUE (ticker, trading_date, snapshot_id)
);

CREATE TABLE IF NOT EXISTS public.stock_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker text NOT NULL REFERENCES public.stock(ticker) ON DELETE RESTRICT,
  market_cap numeric(22, 2) CHECK (market_cap IS NULL OR market_cap >= 0),
  size_band public.size_band_enum,
  circuit_band text,
  snapshot_id uuid NOT NULL REFERENCES public.data_snapshot(id) ON DELETE RESTRICT,
  classification_version text NOT NULL,
  CONSTRAINT stock_info_unique_ticker_snapshot UNIQUE (ticker, snapshot_id)
);

CREATE TABLE IF NOT EXISTS public.benchmark_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  benchmark_key text NOT NULL,
  trading_date date NOT NULL,
  close numeric(18, 4) NOT NULL CHECK (close > 0),
  snapshot_id uuid NOT NULL REFERENCES public.data_snapshot(id) ON DELETE RESTRICT,
  CONSTRAINT benchmark_history_unique_key_date_snapshot UNIQUE (benchmark_key, trading_date, snapshot_id)
);

CREATE TABLE IF NOT EXISTS public.surveillance_entry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker text NOT NULL REFERENCES public.stock(ticker) ON DELETE RESTRICT,
  list_name text NOT NULL,
  is_active boolean NOT NULL,
  snapshot_id uuid NOT NULL REFERENCES public.data_snapshot(id) ON DELETE RESTRICT,
  snapshot_date date NOT NULL,
  CONSTRAINT surveillance_entry_unique_ticker_list_snapshot UNIQUE (ticker, list_name, snapshot_id)
);

CREATE TABLE IF NOT EXISTS public.tip (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id uuid REFERENCES public.influencer(id) ON DELETE SET NULL,
  ticker text REFERENCES public.stock(ticker) ON DELETE SET NULL,
  tip_date date NOT NULL,
  text text NOT NULL,
  direction public.tip_direction_enum,
  target_price numeric(18, 4) CHECK (target_price IS NULL OR target_price > 0),
  deadline date,
  stop_loss numeric(18, 4) CHECK (stop_loss IS NULL OR stop_loss > 0),
  extracted_claim_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  disclosure_grade public.disclosure_grade_enum NOT NULL,
  source_url text,
  media_asset_path text,
  is_synthetic boolean NOT NULL,
  snapshot_id uuid NOT NULL REFERENCES public.data_snapshot(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.calibration_case (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_ref text NOT NULL UNIQUE,
  ticker text REFERENCES public.stock(ticker) ON DELETE SET NULL,
  event_date date NOT NULL,
  window_start date NOT NULL,
  window_end date NOT NULL,
  event_classification text NOT NULL,
  source_url text NOT NULL,
  dataset_version text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Performance and FK indexes
CREATE INDEX IF NOT EXISTS idx_data_snapshot_key_date ON public.data_snapshot (dataset_key, as_of_date DESC);
CREATE INDEX IF NOT EXISTS idx_ingestion_run_snapshot_id ON public.ingestion_run (snapshot_id);
CREATE INDEX IF NOT EXISTS idx_sebi_register_normalized_name ON public.sebi_register_entry (normalized_name);
CREATE INDEX IF NOT EXISTS idx_sebi_register_registration_no ON public.sebi_register_entry (registration_no);
CREATE INDEX IF NOT EXISTS idx_price_history_ticker_date ON public.price_history (ticker, trading_date);
CREATE INDEX IF NOT EXISTS idx_price_history_snapshot_id ON public.price_history (snapshot_id);
CREATE INDEX IF NOT EXISTS idx_stock_info_snapshot_id ON public.stock_info (snapshot_id);
CREATE INDEX IF NOT EXISTS idx_benchmark_history_key_date ON public.benchmark_history (benchmark_key, trading_date);
CREATE INDEX IF NOT EXISTS idx_benchmark_history_snapshot_id ON public.benchmark_history (snapshot_id);
CREATE INDEX IF NOT EXISTS idx_surveillance_entry_ticker_date ON public.surveillance_entry (ticker, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_surveillance_entry_snapshot_id ON public.surveillance_entry (snapshot_id);
CREATE INDEX IF NOT EXISTS idx_tip_influencer_ticker_date ON public.tip (influencer_id, ticker, tip_date);
CREATE INDEX IF NOT EXISTS idx_tip_ticker ON public.tip (ticker);
CREATE INDEX IF NOT EXISTS idx_tip_snapshot_id ON public.tip (snapshot_id);
CREATE INDEX IF NOT EXISTS idx_calibration_case_ticker ON public.calibration_case (ticker);

-- Enable RLS and apply explicit server-only deny-public policies on all tables
DO $$
DECLARE
  tbl text;
  pol text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'data_snapshot',
    'ingestion_run',
    'influencer',
    'sebi_register_entry',
    'stock',
    'price_history',
    'stock_info',
    'benchmark_history',
    'surveillance_entry',
    'tip',
    'calibration_case'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
    pol := 'deny_public_access_' || tbl;
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = tbl AND policyname = pol
    ) THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR ALL TO anon, authenticated USING (false) WITH CHECK (false)',
        pol,
        tbl
      );
    END IF;
  END LOOP;
END
$$;
