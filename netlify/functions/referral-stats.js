// GET /.netlify/functions/referral-stats
// Auth: Bearer <pi access token>
// Returns the caller's referral code, share URL, balance, stats, and recent activity.
const { sql } = require('./_lib/db');
const { ok, fail, wrap } = require('./_lib/response');
const { getPiUser } = require('./_lib/auth');
const { ensureReferralCode } = require('./_lib/referral');

async function getConfig(key, fallback) {
  const rows = await sql`SELECT value FROM config WHERE key = ${key}`;
  return rows[0]?.value ?? fallback;
}

const SHARE_BASE = 'https://lattopi.com';

exports.handler = wrap(async (event) => {
  const user = await getPiUser(event);
  if (!user) return fail('unauthorized', 401);

  // Make sure they have a code (in case they were created before the referral feature shipped).
  const code = await ensureReferralCode(user.uid);

  const fresh = await sql`
    SELECT referral_balance_pi, referral_activated, lifetime_spend_pi
    FROM users WHERE uid = ${user.uid}
  `;
  const me = fresh[0] || {};

  const [{ total_referrals }] = await sql`
    SELECT COUNT(*)::int AS total_referrals
    FROM users WHERE referred_by = ${user.uid}
  `;
  const [{ active_referrals }] = await sql`
    SELECT COUNT(*)::int AS active_referrals
    FROM users WHERE referred_by = ${user.uid} AND referral_activated = TRUE
  `;
  const [{ lifetime_earned }] = await sql`
    SELECT COALESCE(SUM(commission_pi), 0)::float AS lifetime_earned
    FROM referral_events WHERE referrer_uid = ${user.uid}
  `;

  const recent = await sql`
    SELECT e.kind, e.base_pi, e.commission_pi, e.created_at, u.username AS referred_username
    FROM referral_events e
    LEFT JOIN users u ON u.uid = e.referred_uid
    WHERE e.referrer_uid = ${user.uid}
    ORDER BY e.created_at DESC
    LIMIT 10
  `;

  const minPayout = Number(await getConfig('referral_min_payout_pi', 5));
  const activationPi = Number(await getConfig('referral_activation_pi', 10));
  const rate = Number(await getConfig('referral_commission_rate', 0.01));

  return ok({
    code,
    share_url: `${SHARE_BASE}/?ref=${code}`,
    balance_pi: Number(me.referral_balance_pi || 0),
    activated: !!me.referral_activated,
    lifetime_spend_pi: Number(me.lifetime_spend_pi || 0),
    activation_threshold_pi: activationPi,
    commission_rate: rate,
    min_payout_pi: minPayout,
    stats: {
      total_referrals,
      active_referrals,
      lifetime_earned_pi: lifetime_earned,
    },
    recent,
  });
});
