-- LattoPi Neon (Postgres) schema.
-- Idempotent: safe to re-run via `npm run db:migrate`.

CREATE TABLE IF NOT EXISTS users (
  uid                 TEXT PRIMARY KEY,
  username            TEXT NOT NULL,
  email               TEXT,
  lifetime_spend_pi   NUMERIC(18, 4) NOT NULL DEFAULT 0,
  referral_code       TEXT UNIQUE,
  referred_by         TEXT REFERENCES users(uid),
  referral_balance_pi NUMERIC(18, 4) NOT NULL DEFAULT 0,
  referral_activated  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code       TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by         TEXT REFERENCES users(uid);
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_balance_pi NUMERIC(18, 4) NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_activated  BOOLEAN NOT NULL DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS users_by_referred_by   ON users (referred_by);
CREATE INDEX IF NOT EXISTS users_by_referral_code ON users (referral_code);

CREATE TABLE IF NOT EXISTS tickets (
  ticket_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid         TEXT NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
  draw_id     TEXT NOT NULL,                    -- e.g. "2026-04"
  number      TEXT NOT NULL,                    -- 6-digit display number
  price_pi    NUMERIC(18, 4) NOT NULL,
  status      TEXT NOT NULL DEFAULT 'active',   -- active | past
  is_winner   BOOLEAN NOT NULL DEFAULT FALSE,
  payment_id  TEXT,                             -- Pi paymentId (idempotency)
  txid        TEXT,
  network     TEXT NOT NULL DEFAULT 'testnet',  -- testnet | mainnet
  expires_at  TIMESTAMPTZ,                      -- last day of draw month, 23:00 UTC
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS network    TEXT NOT NULL DEFAULT 'testnet';
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS tickets_by_user ON tickets (uid, created_at DESC);
CREATE INDEX IF NOT EXISTS tickets_by_draw ON tickets (draw_id, status, network);
CREATE UNIQUE INDEX IF NOT EXISTS tickets_payment_unique ON tickets (payment_id) WHERE payment_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS cards (
  card_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid          TEXT NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
  seed         TEXT NOT NULL,
  price_pi     NUMERIC(18, 4) NOT NULL,
  status       TEXT NOT NULL DEFAULT 'unscratched',
  reward_pi    NUMERIC(18, 4),
  payment_id   TEXT,
  txid         TEXT,
  network      TEXT NOT NULL DEFAULT 'testnet',
  scratched_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE cards ADD COLUMN IF NOT EXISTS network TEXT NOT NULL DEFAULT 'testnet';
CREATE INDEX IF NOT EXISTS cards_by_user ON cards (uid, created_at DESC);
CREATE INDEX IF NOT EXISTS cards_by_network ON cards (network, status);
CREATE UNIQUE INDEX IF NOT EXISTS cards_payment_unique ON cards (payment_id) WHERE payment_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS draws (
  draw_id          TEXT PRIMARY KEY,
  executed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  trigger          TEXT NOT NULL,
  total_tickets    INTEGER NOT NULL,
  total_pi         NUMERIC(18, 4) NOT NULL,
  prize_pi         NUMERIC(18, 4) NOT NULL,
  platform_pi      NUMERIC(18, 4) NOT NULL,
  winner_ticket_id UUID REFERENCES tickets(ticket_id),
  winner_uid       TEXT REFERENCES users(uid),
  winner_username  TEXT,
  seed             TEXT NOT NULL,
  proof_hash       TEXT NOT NULL,
  network          TEXT NOT NULL DEFAULT 'testnet'
);
ALTER TABLE draws ADD COLUMN IF NOT EXISTS network TEXT NOT NULL DEFAULT 'testnet';

CREATE TABLE IF NOT EXISTS config (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO config (key, value) VALUES
  ('ticket_price_pi',          '0.5'::jsonb),
  ('card_price_pi',            '0.5'::jsonb),
  ('monthly_prize_pi',         '10000'::jsonb),
  ('card_max_payout_ratio',    '0.5'::jsonb),
  ('card_min_reward_pi',       '5'::jsonb),
  ('card_max_reward_pi',       '1000'::jsonb),
  ('min_sales_for_draw_pi',    '0'::jsonb),
  ('referral_commission_rate', '0.01'::jsonb),
  ('referral_activation_pi',   '10'::jsonb),
  ('referral_min_payout_pi',   '5'::jsonb)
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS referral_events (
  event_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_uid  TEXT NOT NULL REFERENCES users(uid),
  referred_uid  TEXT NOT NULL REFERENCES users(uid),
  kind          TEXT NOT NULL,
  source_id     TEXT NOT NULL,
  base_pi       NUMERIC(18, 4) NOT NULL,
  commission_pi NUMERIC(18, 4) NOT NULL,
  network       TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ref_events_by_referrer ON referral_events (referrer_uid, created_at DESC);
CREATE INDEX IF NOT EXISTS ref_events_by_referred ON referral_events (referred_uid, created_at DESC);

CREATE TABLE IF NOT EXISTS referral_payouts (
  payout_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid          TEXT NOT NULL REFERENCES users(uid),
  amount_pi    NUMERIC(18, 4) NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending',
  pi_txid      TEXT,
  notes        TEXT,
  network      TEXT NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS ref_payouts_by_user   ON referral_payouts (uid, requested_at DESC);
CREATE INDEX IF NOT EXISTS ref_payouts_by_status ON referral_payouts (status, requested_at);
