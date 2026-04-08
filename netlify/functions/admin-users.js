// GET /.netlify/functions/admin-users?page=1&pageSize=25&q=username
// Paginated user list with optional search across username/email/uid.
const { sql } = require('./_lib/db');
const { ok, fail, wrap } = require('./_lib/response');
const { requireAdmin } = require('./_lib/auth');

exports.handler = wrap(async (event) => {
  if (!requireAdmin(event)) return fail('forbidden', 403);

  const qs = event.queryStringParameters || {};
  const page = Math.max(1, Number(qs.page || 1));
  const pageSize = Math.max(1, Math.min(200, Number(qs.pageSize || 25)));
  const offset = (page - 1) * pageSize;
  const q = (qs.q || '').trim();

  let total, users;
  if (q) {
    const like = `%${q}%`;
    const countRow = await sql`
      SELECT COUNT(*)::int AS total
      FROM users
      WHERE username ILIKE ${like} OR email ILIKE ${like} OR uid ILIKE ${like}
    `;
    total = countRow[0].total;
    users = await sql`
      SELECT uid, username, email, lifetime_spend_pi,
             referral_code, referred_by, referral_balance_pi, referral_activated,
             created_at
      FROM users
      WHERE username ILIKE ${like} OR email ILIKE ${like} OR uid ILIKE ${like}
      ORDER BY created_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `;
  } else {
    const countRow = await sql`SELECT COUNT(*)::int AS total FROM users`;
    total = countRow[0].total;
    users = await sql`
      SELECT uid, username, email, lifetime_spend_pi,
             referral_code, referred_by, referral_balance_pi, referral_activated,
             created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `;
  }

  return ok({
    users,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
});
