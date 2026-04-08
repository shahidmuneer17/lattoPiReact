// PUT/GET /.netlify/functions/admin-config
// GET  → returns all config rows
// POST/PUT { key, value } → upsert a config row (value can be any JSON)
const { sql } = require('./_lib/db');
const { ok, fail, parse, wrap } = require('./_lib/response');
const { requireAdmin } = require('./_lib/auth');

exports.handler = wrap(async (event) => {
  if (!requireAdmin(event)) return fail('forbidden', 403);

  if (event.httpMethod === 'GET') {
    const rows = await sql`SELECT key, value, updated_at FROM config ORDER BY key`;
    return ok({ config: rows });
  }

  const { key, value } = parse(event);
  if (!key) return fail('key required', 400);
  await sql`
    INSERT INTO config (key, value, updated_at)
    VALUES (${key}, ${JSON.stringify(value)}::jsonb, NOW())
    ON CONFLICT (key) DO UPDATE
      SET value = EXCLUDED.value, updated_at = NOW()
  `;
  return ok({ key, value });
});
