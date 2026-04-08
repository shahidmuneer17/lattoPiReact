// Force the canonical config defaults to match the current product (prices,
// prize, ratios). Run this once whenever you change a default in schema.sql
// because the schema's INSERT … ON CONFLICT DO NOTHING never overwrites
// pre-existing rows.
//
// Usage: npm run db:reset-config
try { require('dotenv').config(); } catch {}
if (!process.env.NETLIFY_DATABASE_URL && !process.env.NEON_DATABASE_URL) {
  try {
    const envText = require('fs').readFileSync(
      require('path').join(__dirname, '../../../.env'),
      'utf8'
    );
    for (const line of envText.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
    }
  } catch {}
}

const { neon } = require('@neondatabase/serverless');

const CANONICAL = {
  ticket_price_pi:          0.5,
  card_price_pi:            0.5,
  monthly_prize_pi:         10000,
  card_max_payout_ratio:    0.5,
  card_min_reward_pi:       5,
  card_max_reward_pi:       1000,
  min_sales_for_draw_pi:    15000,
  referral_commission_rate: 0.01,
  referral_activation_pi:   10,
  referral_min_payout_pi:   5,
};

(async () => {
  const url =
    process.env.NETLIFY_DATABASE_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.DATABASE_URL;
  if (!url) {
    console.error('NETLIFY_DATABASE_URL or NEON_DATABASE_URL is required');
    process.exit(1);
  }
  const sql = neon(url);

  // Retry helper — Neon's HTTP driver occasionally times out from flaky local
  // networks. Three quick retries with backoff is enough to ride through it.
  async function withRetry(label, fn) {
    let lastErr;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        return await fn();
      } catch (e) {
        lastErr = e;
        const wait = attempt * 800;
        process.stdout.write(`(retry ${attempt}/3 after ${wait}ms) `);
        await new Promise((r) => setTimeout(r, wait));
      }
    }
    console.log('FAIL');
    console.error(`[${label}] ${lastErr?.message || lastErr}`);
    process.exit(1);
  }

  for (const [key, value] of Object.entries(CANONICAL)) {
    process.stdout.write(`▸ ${key.padEnd(28)} = ${String(value).padEnd(8)} … `);
    await withRetry(key, () =>
      sql(
        `INSERT INTO config (key, value, updated_at)
         VALUES ($1, $2::jsonb, NOW())
         ON CONFLICT (key) DO UPDATE
           SET value = EXCLUDED.value, updated_at = NOW()`,
        [key, JSON.stringify(value)]
      )
    );
    console.log('ok');
  }
  console.log('Config reset complete.');
})();
