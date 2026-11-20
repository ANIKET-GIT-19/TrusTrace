-- Tip Autopsy — Seed Curated Demo Corpus & Snapshots (Task 2.3)
-- Provenance honesty rule: All demo market series & curated tips are explicitly tagged SYNTHETIC / MIXED.

INSERT INTO public.data_snapshot (
  id, dataset_key, source_name, source_url, as_of_date, data_label, version, checksum, row_count, validation_status, notes
) VALUES
  (
    '11111111-1111-4111-8111-111111111101',
    'sebi_register',
    'Curated SEBI Intermediaries Register Demo Snapshot',
    'https://www.sebi.gov.in/',
    '2026-11-18',
    'MIXED',
    'sebi-demo-v1',
    'seed-checksum-sebi-demo-v1',
    2,
    'VALID',
    'Curated demo SEBI entries reconciling photos/ and videos/ creators; replace with full dated SEBI export for production.'
  ),
  (
    '11111111-1111-4111-8111-111111111102',
    'nse_prices',
    'Tip Autopsy Synthetic Demo Equity Series',
    NULL,
    '2026-11-19',
    'SYNTHETIC',
    'prices-demo-v1',
    'seed-checksum-prices-demo-v1',
    147,
    'VALID',
    'Explicitly labelled synthetic demo equity series until verified NSE/BSE Bhavcopy CSVs are imported.'
  ),
  (
    '11111111-1111-4111-8111-111111111103',
    'benchmark_indices',
    'Tip Autopsy Synthetic Demo Benchmarks (NIFTY 50, SENSEX, BANKNIFTY)',
    NULL,
    '2026-11-19',
    'SYNTHETIC',
    'benchmarks-demo-v1',
    'seed-checksum-benchmarks-demo-v1',
    147,
    'VALID',
    'Explicitly labelled synthetic demo index series.'
  ),
  (
    '11111111-1111-4111-8111-111111111104',
    'market_cap',
    'Tip Autopsy Synthetic Demo Market-Cap Snapshot',
    NULL,
    '2026-11-18',
    'SYNTHETIC',
    'market-cap-demo-v1',
    'seed-checksum-market-cap-demo-v1',
    3,
    'VALID',
    'Versioned size bands (amfi-size-band-v1) for demo equities.'
  ),
  (
    '11111111-1111-4111-8111-111111111105',
    'surveillance',
    'Tip Autopsy Synthetic Demo ASM/GSM Snapshot',
    NULL,
    '2026-11-18',
    'SYNTHETIC',
    'surveillance-demo-v1',
    'seed-checksum-surveillance-demo-v1',
    3,
    'VALID',
    'Explicitly labelled synthetic demo surveillance snapshot.'
  ),
  (
    '11111111-1111-4111-8111-111111111106',
    'curated_tip_corpus',
    'Curated Hinglish Media Corpus (photos/ & videos/) + Synthetic Examples',
    NULL,
    '2026-11-19',
    'MIXED',
    'curated-tips-demo-v1',
    'seed-checksum-tips-demo-v1',
    8,
    'VALID',
    'Every tip row carries explicit is_synthetic=true.'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.influencer (id, name, handle, aliases, normalized_name, sebi_registration_no) VALUES
  ('22222222-2222-4222-8222-222222222201', 'Ashish Kyal', '@ashishkyal_demo', ARRAY['Waves Strategy'], 'ashish kyal', NULL),
  ('22222222-2222-4222-8222-222222222202', 'Chinmay Dudhane', '@tradingcafeindia', ARRAY['Trading cafe India', 'Trading Cafe India'], 'chinmay dudhane', 'INH000012948'),
  ('22222222-2222-4222-8222-222222222203', 'Harsh Bhagat', '@harshbhagat_demo', ARRAY['Harsh Bhagat Options'], 'harsh bhagat', NULL),
  ('22222222-2222-4222-8222-222222222204', 'Rakesh Bansal', '@iamrakeshbansal', ARRAY['Dr Rakesh Bansal', 'Rakesh Bansal Ventures'], 'rakesh bansal', 'INH100008984'),
  ('22222222-2222-4222-8222-222222222205', 'Vivek Rana', '@vivekrana_demo', ARRAY[]::text[], 'vivek rana', NULL),
  ('22222222-2222-4222-8222-222222222206', 'Aarav FinNotes (Synthetic Demo)', '@aaravfinnotes_synthetic', ARRAY['Aarav FinNotes'], 'aarav finnotes synthetic demo', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.sebi_register_entry (id, snapshot_id, name, normalized_name, registration_no, category, snapshot_date) VALUES
  ('33333333-3333-4333-8333-333333333301', '11111111-1111-4111-8111-111111111101', 'Chinmay Dudhane', 'chinmay dudhane', 'INH000012948', 'Research Analyst', '2026-11-18'),
  ('33333333-3333-4333-8333-333333333302', '11111111-1111-4111-8111-111111111101', 'Rakesh Bansal', 'rakesh bansal', 'INH100008984', 'Research Analyst', '2026-11-18')
ON CONFLICT (snapshot_id, registration_no) DO NOTHING;

INSERT INTO public.stock (ticker, company_name, exchange, instrument_type, underlying_ticker, circuit_band) VALUES
  ('BORORENEW', 'Borosil Renewables Ltd', 'NSE', 'EQUITY', NULL, '5%'),
  ('SARVESHWAR', 'Sarveshwar Foods Ltd', 'NSE', 'EQUITY', NULL, '5%'),
  ('WIPRO', 'Wipro Limited', 'NSE', 'EQUITY', NULL, '20%'),
  ('SENSEX_82900_CE', 'Sensex 82900 CE', 'BSE', 'DERIVATIVE', 'SENSEX', NULL),
  ('NIFTY_25500_CE', 'Nifty 25500 CE', 'NSE', 'DERIVATIVE', 'NIFTY_50', NULL),
  ('NIFTY_25600_CE', 'Nifty 25600 CE', 'NSE', 'DERIVATIVE', 'NIFTY_50', NULL)
ON CONFLICT (ticker) DO NOTHING;

INSERT INTO public.stock_info (ticker, market_cap, size_band, circuit_band, snapshot_id, classification_version) VALUES
  ('BORORENEW', 7250.00, 'SMALL', '5%', '11111111-1111-4111-8111-111111111104', 'amfi-size-band-v1'),
  ('SARVESHWAR', 940.00, 'MICRO', '5%', '11111111-1111-4111-8111-111111111104', 'amfi-size-band-v1'),
  ('WIPRO', 294500.00, 'LARGE', '20%', '11111111-1111-4111-8111-111111111104', 'amfi-size-band-v1')
ON CONFLICT (ticker, snapshot_id) DO NOTHING;

INSERT INTO public.surveillance_entry (ticker, list_name, is_active, snapshot_id, snapshot_date) VALUES
  ('BORORENEW', 'ASM Stage 1', true, '11111111-1111-4111-8111-111111111105', '2026-11-18'),
  ('SARVESHWAR', 'ASM Stage 4', true, '11111111-1111-4111-8111-111111111105', '2026-11-18'),
  ('WIPRO', 'ASM', false, '11111111-1111-4111-8111-111111111105', '2026-11-18')
ON CONFLICT (ticker, list_name, snapshot_id) DO NOTHING;

-- Seed 49 weekday trading sessions (2026-09-14 to 2026-11-19) reproducibly using generate_series
WITH trading_days AS (
  SELECT d::date AS trading_date, (row_number() OVER (ORDER BY d) - 1) AS i
  FROM generate_series('2026-09-14'::date, '2026-11-19'::date, interval '1 day') AS d
  WHERE extract(isodow FROM d) < 6
)
INSERT INTO public.benchmark_history (benchmark_key, trading_date, close, snapshot_id)
SELECT 'NIFTY_50', trading_date, round((24200 + i * 11.5 + sin(i * 0.45) * 95)::numeric, 2), '11111111-1111-4111-8111-111111111103'::uuid FROM trading_days
UNION ALL
SELECT 'SENSEX', trading_date, round((79500 + i * 36.2 + sin(i * 0.42) * 280)::numeric, 2), '11111111-1111-4111-8111-111111111103'::uuid FROM trading_days
UNION ALL
SELECT 'BANKNIFTY', trading_date, round((52600 + i * 24.8 + cos(i * 0.40) * 210)::numeric, 2), '11111111-1111-4111-8111-111111111103'::uuid FROM trading_days
ON CONFLICT (benchmark_key, trading_date, snapshot_id) DO NOTHING;

WITH trading_days AS (
  SELECT d::date AS trading_date, (row_number() OVER (ORDER BY d) - 1) AS i
  FROM generate_series('2026-09-14'::date, '2026-11-19'::date, interval '1 day') AS d
  WHERE extract(isodow FROM d) < 6
)
INSERT INTO public.price_history (ticker, trading_date, close, volume, snapshot_id)
SELECT
  'BORORENEW',
  trading_date,
  round((CASE WHEN i > 42 THEN (510 + 31.5 + (i - 35) * 14.2) - (i - 42) * 11.5 WHEN i >= 35 THEN 510 + 31.5 + (i - 35) * 14.2 ELSE 510 + i * 0.9 END)::numeric, 2),
  CASE WHEN trading_date = '2026-11-10' THEN 960000 ELSE 185000 + ((i * 7919) % 45000) END,
  '11111111-1111-4111-8111-111111111102'::uuid
FROM trading_days
UNION ALL
SELECT
  'SARVESHWAR',
  trading_date,
  round((CASE WHEN i > 43 THEN (8.4 + 1.48 + (i - 37) * 0.34) - (i - 43) * 0.42 WHEN i >= 37 THEN 8.4 + 1.48 + (i - 37) * 0.34 ELSE 8.4 + i * 0.04 END)::numeric, 2),
  CASE WHEN trading_date = '2026-11-12' THEN 4800000 ELSE 820000 + ((i * 3571) % 160000) END,
  '11111111-1111-4111-8111-111111111102'::uuid
FROM trading_days
UNION ALL
SELECT
  'WIPRO',
  trading_date,
  round((548 + i * 0.65 + sin(i * 0.35) * 6.5)::numeric, 2),
  6400000 + ((i * 12497) % 1100000),
  '11111111-1111-4111-8111-111111111102'::uuid
FROM trading_days
ON CONFLICT (ticker, trading_date, snapshot_id) DO NOTHING;

INSERT INTO public.tip (
  id, influencer_id, ticker, tip_date, text, direction, target_price, deadline, stop_loss, disclosure_grade, source_url, media_asset_path, is_synthetic, snapshot_id
) VALUES
  (
    '44444444-4444-4444-8444-444444444401',
    '22222222-2222-4222-8222-222222222204',
    'BORORENEW',
    '2026-11-10',
    'Borosil Renewables Ltd breakout dikh raha hai — Buy above 615, Target 740 in 15 days. Educational purpose only, SEBI Registered RA INH100008984.',
    'BULLISH',
    740,
    '2026-11-19',
    NULL,
    'CLEAR',
    'https://example.org/tip-autopsy-demo/rakesh-bororenew-2026-11-10',
    '/media/videos/Rakesh_Bansal__Borosil_Renewables_Ltd__Registered.App.mp4',
    true,
    '11111111-1111-4111-8111-111111111106'
  ),
  (
    '44444444-4444-4444-8444-444444444403',
    '22222222-2222-4222-8222-222222222204',
    'SARVESHWAR',
    '2026-11-12',
    'Sarveshwar Foods multibagger potential — Buy around 11.40, Target 16 in 10 days. SL 9.80. Holding disclosure noted, SEBI Reg No INH100008984.',
    'BULLISH',
    16,
    '2026-11-19',
    9.8,
    'CLEAR',
    'https://example.org/tip-autopsy-demo/rakesh-sarveshwar-2026-11-12',
    '/media/videos/Rakesh_Bansal__Sarveshwar_Foods__Registered.App.mp4',
    true,
    '11111111-1111-4111-8111-111111111106'
  ),
  (
    '44444444-4444-4444-8444-444444444404',
    '22222222-2222-4222-8222-222222222205',
    'WIPRO',
    '2026-11-11',
    'Wipro Limited strong setup! Buy now Target 630 in 20 days. Don''t miss out, last chance before rally! Educational purpose only.',
    'BULLISH',
    630,
    '2026-11-19',
    NULL,
    'VAGUE',
    'https://example.org/tip-autopsy-demo/vivek-wipro-2026-11-11',
    '/media/videos/Vivek_Rana__Wipro_Limited__Not_Registered.App.mp4',
    true,
    '11111111-1111-4111-8111-111111111106'
  ),
  (
    '44444444-4444-4444-8444-444444444406',
    '22222222-2222-4222-8222-222222222201',
    'SENSEX_82900_CE',
    '2026-11-10',
    'SENSEX 82900 CE BUY ABOVE 310 TGT 380 / 430 Intraday. SL PAID. Join my Telegram for full levels!',
    'BULLISH',
    380,
    NULL,
    NULL,
    'NONE',
    'https://example.org/tip-autopsy-demo/ashish-sensex-82900-ce',
    '/media/photos/Ashish_Kyal__Sensex_82900_CE__Not_Registered.jpeg',
    true,
    '11111111-1111-4111-8111-111111111106'
  ),
  (
    '44444444-4444-4444-8444-444444444407',
    '22222222-2222-4222-8222-222222222202',
    'NIFTY_25500_CE',
    '2026-11-11',
    'Trading cafe India: NIFTY 25500 CE Buy above 145 Target 190 Intraday. SL- Paid. SEBI Reg No INH000012948.',
    'BULLISH',
    190,
    NULL,
    NULL,
    'CLEAR',
    'https://example.org/tip-autopsy-demo/chinmay-nifty-25500-ce',
    '/media/photos/Chinmay_Dudhane__Nifty_25500_CE__Registered.jpeg',
    true,
    '11111111-1111-4111-8111-111111111106'
  ),
  (
    '44444444-4444-4444-8444-444444444408',
    '22222222-2222-4222-8222-222222222203',
    'NIFTY_25600_CE',
    '2026-11-12',
    'NIFTY 25600 CE Guaranteed jackpot call! Buy 120 Target 210 Intraday. SL. VIP PREMIUM. DM for Account Handling & double money!',
    'BULLISH',
    210,
    NULL,
    NULL,
    'NONE',
    'https://example.org/tip-autopsy-demo/harsh-nifty-25600-ce',
    '/media/photos/Harsh_Bhagat__Nifty_25600_CE__Not_Registered.jpeg',
    true,
    '11111111-1111-4111-8111-111111111106'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.ingestion_run (dataset_key, snapshot_id, finished_at, status, imported_count, rejected_count, validation_summary)
VALUES
  ('curated_demo_seed', '11111111-1111-4111-8111-111111111106', now(), 'COMPLETED', 6, 0, '{"note": "Initial curated demo seed migration applied"}'::jsonb);
