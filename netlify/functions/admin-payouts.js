// GET  /.netlify/functions/admin-payouts        → list pending + recently resolved payouts
// POST /.netlify/functions/admin-payouts        body: { payoutId, status, txid?, notes? }
//   status must be 'paid' or 'rejected'. On 'paid' the txid is required.
//   On 'rejected' the user's referral_balance_pi is REFUNDED so they can try again.
const { sql } = require('./_lib/db');
const { ok, fail, parse, wrap } = require('./_lib/response');
const { requireAdmin } = require('./_lib/auth');

exports.handler = wrap(async (event) => {
  if (!requireAdmin(event)) return fail('forbidden', 403);

  if (event.httpMethod === 'GET') {
    const pending = await sql`
      SELECT p.payout_id, p.uid, p.amount_pi, p.status, p.requested_at, p.network,
             u.username, u.email
      FROM referral_payouts p
      LEFT JOIN users u USING (uid)
      WHERE p.status = 'pending'
      ORDER BY p.requested_at ASC
    `;
    const recent = await sql`
      SELECT p.payout_id, p.uid, p.amount_pi, p.status, p.pi_txid, p.notes,
             p.requested_at, p.resolved_at, p.network, u.username
      FROM referral_payouts p
      LEFT JOIN users u USING (uid)
      WHERE p.status <> 'pending'
      ORDER BY p.resolved_at DESC NULLS LAST
      LIMIT 50
    `;
    return ok({ pending, recent });
  }

  // POST — resolve a payout.
  const { payoutId, status, txid, notes } = parse(event);
  if (!payoutId) return fail('payoutId required', 400);
  if (status !== 'paid' && status !== 'rejected') {
    return fail("status must be 'paid' or 'rejected'", 400);
  }
  if (status === 'paid' && !txid) {
    return fail('txid required when marking paid', 400);
  }

  const existing = await sql`
    SELECT payout_id, uid, amount_pi, status FROM referral_payouts WHERE payout_id = ${payoutId}
  `;
  const row = existing[0];
  if (!row) return fail('payout not found', 404);
  if (row.status !== 'pending') return fail(`already ${row.status}`, 409);

  // Mark resolved.
  const updated = await sql`
    UPDATE referral_payouts
    SET status      = ${status},
        pi_txid     = ${txid || null},
        notes       = ${notes || null},
        resolved_at = NOW()
    WHERE payout_id = ${payoutId} AND status = 'pending'
    RETURNING payout_id, status, pi_txid, resolved_at
  `;
  if (updated.length === 0) return fail('race condition, retry', 409);

  // On rejection, refund the balance so the user can try again.
  if (status === 'rejected') {
    await sql`
      UPDATE users
      SET referral_balance_pi = referral_balance_pi + ${row.amount_pi}
      WHERE uid = ${row.uid}
    `;
  }

  return ok({ payout: updated[0] });
});
