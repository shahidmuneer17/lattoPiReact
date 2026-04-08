// GET /.netlify/functions/admin-stats
// Header: X-Admin-Secret
const { sql } = require('./_lib/db');
const { ok, fail, wrap } = require('./_lib/response');
const { requireAdmin } = require('./_lib/auth');
const { getConfig } = require('./_lib/draw');

exports.handler = wrap(async (event) => {
  if (!requireAdmin(event)) return fail('forbidden', 403);

  const [{ users }] = await sql`SELECT COUNT(*)::int AS users FROM users`;
  const [{ tickets_sold, ticket_revenue }] = await sql`
    SELECT COUNT(*)::int AS tickets_sold,
           COALESCE(SUM(price_pi), 0)::float AS ticket_revenue
    FROM tickets`;
  const [{ cards_sold, card_revenue, card_payouts }] = await sql`
    SELECT COUNT(*)::int AS cards_sold,
           COALESCE(SUM(price_pi), 0)::float AS card_revenue,
           COALESCE(SUM(reward_pi), 0)::float AS card_payouts
    FROM cards`;

  // Treasury (75/25 split kept for legacy admin reference, hidden from clients)
  const ratio = Number(await getConfig('prize_pool_ratio', 0.25));
  const totalRevenue = ticket_revenue + card_revenue;
  const prizePool = +(totalRevenue * ratio).toFixed(4);
  const platformShare = +(totalRevenue - prizePool).toFixed(4);

  // Referral programme stats
  const [{ referral_balance_owed }] = await sql`
    SELECT COALESCE(SUM(referral_balance_pi), 0)::float AS referral_balance_owed FROM users
  `;
  const [{ referral_pending }] = await sql`
    SELECT COALESCE(SUM(amount_pi), 0)::float AS referral_pending
    FROM referral_payouts WHERE status = 'pending'
  `;
  const [{ referral_paid }] = await sql`
    SELECT COALESCE(SUM(amount_pi), 0)::float AS referral_paid
    FROM referral_payouts WHERE status = 'paid'
  `;
  const [{ active_referrers }] = await sql`
    SELECT COUNT(*)::int AS active_referrers
    FROM users WHERE referral_activated = TRUE AND referred_by IS NOT NULL
  `;

  return ok({
    users,
    ticketsSold: tickets_sold,
    cardsSold: cards_sold,
    totalRevenuePi: totalRevenue,
    prizePoolPi: prizePool,
    platformSharePi: platformShare,
    cardPayoutsPi: card_payouts,
    referralBalanceOwedPi: referral_balance_owed,
    referralPendingPayoutsPi: referral_pending,
    referralPaidTotalPi: referral_paid,
    activeReferrers: active_referrers,
  });
});
