-- StarGraph Intel - Supabase Migration
-- Run this in the Supabase SQL Editor

-- Signal feed cache (full company list snapshots)
CREATE TABLE IF NOT EXISTS sg_feed_cache (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  companies jsonb NOT NULL,
  fetched_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sg_feed_cache_fetched ON sg_feed_cache(fetched_at DESC);

-- Company intel cache (deep analysis per company)
CREATE TABLE IF NOT EXISTS sg_company_intel (
  company text PRIMARY KEY,
  vertical_id text,
  vertical_label text,
  urgency text,
  top_signal text,
  why_stardog text,
  amount text,
  signal_count int DEFAULT 1,
  intel jsonb,
  last_analyzed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Signal timeline (every unique signal per company, deduplicated)
CREATE TABLE IF NOT EXISTS sg_signal_timeline (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company text NOT NULL,
  signal_type text,
  urgency text,
  signal_text text NOT NULL,
  signal_date text,
  first_seen_at timestamptz DEFAULT now(),
  UNIQUE(company, signal_text)
);
CREATE INDEX IF NOT EXISTS idx_sg_timeline_company ON sg_signal_timeline(company, first_seen_at DESC);

-- MEDDPICC deal qualification
CREATE TABLE IF NOT EXISTS sg_meddpicc_deals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_name text NOT NULL,
  account text,
  metrics text DEFAULT '',
  economic_buyer text DEFAULT '',
  decision_criteria text DEFAULT '',
  decision_process text DEFAULT '',
  paper_process text DEFAULT '',
  identify_pain text DEFAULT '',
  champion text DEFAULT '',
  competition text DEFAULT '',
  scores jsonb DEFAULT '{}',
  ai_coaching jsonb DEFAULT '{}',
  overall_score int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Territory plan accounts
CREATE TABLE IF NOT EXISTS sg_territory_accounts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company text NOT NULL,
  vertical text,
  revenue text,
  data_challenge text,
  stardog_fit text,
  entry_strategy text,
  key_personas text,
  est_acv text,
  priority int DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Cleanup function for old feed caches
CREATE OR REPLACE FUNCTION sg_cleanup_old_caches()
RETURNS void AS $$
BEGIN
  DELETE FROM sg_feed_cache WHERE fetched_at < now() - interval '7 days';
END;
$$ LANGUAGE plpgsql;
