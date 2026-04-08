// POST /.netlify/functions/referral-payout-request
// Auth: Bearer <pi access token>
//
// Atomically:
//   1. Read the user's current referral_balance_pi.
//   2. Reject if below the configured minimum payout threshold.
//   3. Insert a referral_payouts row in 'pending' status.
//   4. Zero the user's referral_balance_pi.
//
// Steps 3 and 4 are wrapped in a check that the balance hasn't changed
// between read and update — preventing double-claim races without needing
// SELECT FOR UPDATE on the serverless HTTP driver.
const { sql } = require('./_lib/db');
const { ok, fail, wrap } = require('./_lib/response');
const { getPiUser } = require('./_lib/auth');
const { currentNetwork } = require('./_lib/network');

async function getConfig(key, fallback) {
  const rows = await sql`SELECT value FROM config WHERE key = ${key}`;
  return rows[0]?.value ?? fallback;
}

exports.handler = wrap(async (event) => {
  const user = await getPiUser(event);
  if (!user) return fail('unauthorized', 401);

  const network = currentNetwork();
  const minPayout = Number(await getConfig('referral_min_payout_pi', 5));

  const before = await sql`
    SELECT referral_balance_pi FROM users WHERE uid = ${user.uid}
  `;
  const balance = Number(before[0]?.referral_balance_pi || 0);

  if (balance < minPayout) {
    return fail(`minimum payout is ${minPayout} π (you have ${balance} π)`, 400);
  }

  // Race-safe zero: only flip if the balance is still what we just read.
  const drained = await sql`
    UPDATE users
    SET referral_balance_pi = 0
    WHERE uid = ${user.uid} AND referral_balance_pi = ${balance}
    RETURNING referral_balance_pi
  `;
  if (drained.length === 0) {
    return fail('balance changed mid-request, please retry', 409);
  }

  const inserted = await sql`
    INSERT INTO referral_payouts (uid, amount_pi, status, network)
    VALUES (${user.uid}, ${balance}, 'pending', ${network})
    RETURNING payout_id, amount_pi, status, requested_at
  `;

  return ok({ payout: inserted[0] });
});
