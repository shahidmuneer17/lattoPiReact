// POST /.netlify/functions/update-profile
// body: { email }
// Auth: Bearer <pi access token>
// Updates the user's editable profile fields. Currently only email.
const { sql } = require('./_lib/db');
const { ok, fail, parse, wrap } = require('./_lib/response');
const { getPiUser } = require('./_lib/auth');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.handler = wrap(async (event) => {
  const user = await getPiUser(event);
  if (!user) return fail('unauthorized', 401);

  const { email } = parse(event);
  // Allow clearing the email by sending null/empty.
  let normalised = null;
  if (email && email.trim()) {
    normalised = email.trim().toLowerCase();
    if (!EMAIL_RE.test(normalised)) return fail('invalid email format', 400);
  }

  const rows = await sql`
    UPDATE users
    SET email = ${normalised}, updated_at = NOW()
    WHERE uid = ${user.uid}
    RETURNING uid, username, email, lifetime_spend_pi, created_at
  `;
  return ok({ user: rows[0] });
});
