// POST /.netlify/functions/login
// body: { accessToken, email? }
// Verifies the Pi access token, upserts the user in Neon, returns the row.
const { sql } = require('./_lib/db');
const { ok, fail, parse } = require('./_lib/response');
const { verifyAccessToken } = require('./_lib/pi');

exports.handler = async (event) => {
  const { accessToken, email } = parse(event);
  if (!accessToken) return fail('accessToken required', 400);

  let me;
  try {
    me = await verifyAccessToken(accessToken);
  } catch {
    return fail('invalid Pi accessToken', 401);
  }

  const rows = await sql`
    INSERT INTO users (uid, username, email, updated_at)
    VALUES (${me.uid}, ${me.username}, ${email || null}, NOW())
    ON CONFLICT (uid) DO UPDATE
      SET username = EXCLUDED.username,
          email = COALESCE(EXCLUDED.email, users.email),
          updated_at = NOW()
    RETURNING uid, username, email, lifetime_spend_pi, created_at
  `;
  return ok({ user: rows[0] });
};
