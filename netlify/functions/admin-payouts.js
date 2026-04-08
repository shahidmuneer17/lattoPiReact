// GET  /.netlify/functions/admin-payouts?page=1&pageSize=25&status=pending
//   status: 'pending' (default) | 'paid' | 'rejected' | 'all'
// POST /.netlify/functions/admin-payouts  body: { payoutId, status, txid?, notes? }
//   status must be 'paid' or 'rejected'. On 'paid' the txid is required.
//   On 'rejected' the user's referral_balance_pi is REFUNDED.
const { sql } = require('./_lib/db');
const { ok, fail, parse, wrap } = require('./_lib/response');
const { requireAdmin } = require('./_lib/auth');

exports.handler = wrap(async (event) => {
  if (!requireAdmin(event)) return fail('forbidden', 403);

  if (event.httpMethod === 'GET') {
    const qs = event.queryStringParameters || {};
    const page = Math.max(1, Number(qs.page || 1));
    const pageSize = Math.max(1, Math.min(200, Number(qs.pageSize || 25)));
    const offset = (page - 1) * pageSize;
    const status = qs.status || 'pending';

    let total, rows;
    if (status === 'all') {
      const c = await sql`SELECT COUNT(*)::int AS total FROM referral_payouts`;
      total = c[0].total;
      rows = await sql`
        SELECT p.payout_id, p.uid, p.amount_pi, p.status, p.pi_txid, p.notes,
               p.requested_at, p.resolved_at, p.network, u.username, u.email
        FROM referral_payouts p
        LEFT JOIN users u USING (uid)
        ORDER BY p.requested_at DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `;
    } else {
      const c = await sql`SELECT COUNT(*)::int AS total FROM referral_payouts WHERE status = ${status}`;
      total = c[0].total;
      // Pending: oldest-first so admins clear the queue head-first.
      // Resolved: newest-first so admins see what just happened.
      if (status === 'pending') {
        rows = await sql`
          SELECT p.payout_id, p.uid, p.amount_pi, p.status, p.pi_txid, p.notes,
                 p.requested_at, p.resolved_at, p.network, u.username, u.email
          FROM referral_payouts p
          LEFT JOIN users u USING (uid)
          WHERE p.status = ${status}
          ORDER BY p.requested_at ASC
          LIMIT ${pageSize} OFFSET ${offset}
        `;
      } else {
        rows = await sql`
          SELECT p.payout_id, p.uid, p.amount_pi, p.status, p.pi_txid, p.notes,
                 p.requested_at, p.resolved_at, p.network, u.username, u.email
          FROM referral_payouts p
          LEFT JOIN users u USING (uid)
          WHERE p.status = ${status}
          ORDER BY p.requested_at DESC
          LIMIT ${pageSize} OFFSET ${offset}
        `;
      }
    }

    return ok({
      payouts: rows,
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      status,
    });
  }

  // POST — resolve a payout.
  const { payoutId, status, txid, notes } = parse(event);
  if (!payoutId) return fail('payoutId required', 400);
  if (status !== 'paid' && status !== 'rejected') {
    return fail("status must be 'paid' or 'rejected'", 400);
  }
  if (status === 'paid' && !txid) return fail('txid required when marking paid', 400);

  const existing = await sql`
    SELECT payout_id, uid, amount_pi, status FROM referral_payouts WHERE payout_id = ${payoutId}
  `;
  const row = existing[0];
  if (!row) return fail('payout not found', 404);
  if (row.status !== 'pending') return fail(`already ${row.status}`, 409);

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

  if (status === 'rejected') {
    await sql`
      UPDATE users
      SET referral_balance_pi = referral_balance_pi + ${row.amount_pi}
      WHERE uid = ${row.uid}
    `;
  }

  return ok({ payout: updated[0] });
});
