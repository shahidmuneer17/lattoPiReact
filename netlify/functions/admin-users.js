// GET /.netlify/functions/admin-users
const { sql } = require('./_lib/db');
const { ok, fail } = require('./_lib/response');
const { requireAdmin } = require('./_lib/auth');

exports.handler = async (event) => {
  if (!requireAdmin(event)) return fail('forbidden', 403);
  const users = await sql`
    SELECT uid, username, email, lifetime_spend_pi, created_at
    FROM users ORDER BY created_at DESC LIMIT 500
  `;
  return ok({ users });
};
