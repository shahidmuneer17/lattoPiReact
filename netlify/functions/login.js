// POST /.netlify/functions/login
// body: { accessToken, email?, referralCode? }
// Verifies the Pi access token, upserts the user in Neon, attaches a referrer
// (if first time + valid code), assigns a referral_code, returns the user row.
const { sql } = require('./_lib/db');
const { ok, fail, parse, wrap } = require('./_lib/response');
const { verifyAccessToken } = require('./_lib/pi');
const { ensureReferralCode, tryAttachReferrer } = require('./_lib/referral');

exports.handler = wrap(async (event) => {
  const { accessToken, email, referralCode } = parse(event);
  if (!accessToken) return fail('accessToken required', 400);

  let me;
  try {
    me = await verifyAccessToken(accessToken);
  } catch {
    return fail('invalid Pi accessToken', 401);
  }

  await sql`
    INSERT INTO users (uid, username, email, updated_at)
    VALUES (${me.uid}, ${me.username}, ${email || null}, NOW())
    ON CONFLICT (uid) DO UPDATE
      SET username = EXCLUDED.username,
          email = COALESCE(EXCLUDED.email, users.email),
          updated_at = NOW()
  `;

  // Attach referrer ONLY if this user has never had one. Self-referral safe.
  if (referralCode) {
    await tryAttachReferrer(me.uid, referralCode);
  }
  // Always make sure the user has their own referral_code.
  await ensureReferralCode(me.uid);

  const rows = await sql`
    SELECT uid, username, email, lifetime_spend_pi,
           referral_code, referred_by, referral_balance_pi, referral_activated,
           created_at
    FROM users WHERE uid = ${me.uid}
  `;
  return ok({ user: rows[0] });
});
