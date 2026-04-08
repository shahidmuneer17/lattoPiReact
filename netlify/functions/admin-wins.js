// GET  /.netlify/functions/admin-wins?status=pending&kind=card&page=1&pageSize=25
//   status: 'pending' (default — all 'verifying') | 'paid' | 'rejected' | 'all'
//   kind:   'card' | 'draw' | 'all' (default 'all')
//
// POST /.netlify/functions/admin-wins
//   body: { kind: 'card' | 'draw', id, status, txid?, notes? }
//
// Approving a card sets payout_status='paid' on the card row.
// Approving a draw does the same on the draws row AND mirrors the status onto
// the winning ticket so the user-facing history reflects the change instantly.
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
    const kind = qs.kind || 'all';

    // Map "pending" → 'verifying' for SQL.
    const dbStatus = status === 'pending' ? 'verifying' : status;
    const wantCards = kind === 'all' || kind === 'card';
    const wantDraws = kind === 'all' || kind === 'draw';

    let cards = [];
    let cardTotal = 0;
    if (wantCards) {
      if (dbStatus === 'all') {
        const c = await sql`SELECT COUNT(*)::int AS total FROM cards WHERE payout_status <> 'none'`;
        cardTotal = c[0].total;
        cards = await sql`
          SELECT c.card_id, c.uid, c.reward_pi, c.payout_status, c.payout_txid,
                 c.payout_resolved_at, c.scratched_at, c.network, u.username, u.email
          FROM cards c
          LEFT JOIN users u USING (uid)
          WHERE c.payout_status <> 'none'
          ORDER BY c.scratched_at DESC
          LIMIT ${pageSize} OFFSET ${offset}
        `;
      } else {
        const c = await sql`SELECT COUNT(*)::int AS total FROM cards WHERE payout_status = ${dbStatus}`;
        cardTotal = c[0].total;
        cards = await sql`
          SELECT c.card_id, c.uid, c.reward_pi, c.payout_status, c.payout_txid,
                 c.payout_resolved_at, c.scratched_at, c.network, u.username, u.email
          FROM cards c
          LEFT JOIN users u USING (uid)
          WHERE c.payout_status = ${dbStatus}
          ORDER BY c.scratched_at DESC
          LIMIT ${pageSize} OFFSET ${offset}
        `;
      }
    }

    let draws = [];
    let drawTotal = 0;
    if (wantDraws) {
      if (dbStatus === 'all') {
        const d = await sql`SELECT COUNT(*)::int AS total FROM draws`;
        drawTotal = d[0].total;
        draws = await sql`
          SELECT d.draw_id, d.winner_uid, d.winner_username, d.winner_ticket_id,
                 d.prize_pi, d.payout_status, d.payout_txid, d.payout_resolved_at,
                 d.executed_at, d.network, u.email
          FROM draws d
          LEFT JOIN users u ON u.uid = d.winner_uid
          ORDER BY d.executed_at DESC
          LIMIT ${pageSize} OFFSET ${offset}
        `;
      } else {
        const d = await sql`SELECT COUNT(*)::int AS total FROM draws WHERE payout_status = ${dbStatus}`;
        drawTotal = d[0].total;
        draws = await sql`
          SELECT d.draw_id, d.winner_uid, d.winner_username, d.winner_ticket_id,
                 d.prize_pi, d.payout_status, d.payout_txid, d.payout_resolved_at,
                 d.executed_at, d.network, u.email
          FROM draws d
          LEFT JOIN users u ON u.uid = d.winner_uid
          WHERE d.payout_status = ${dbStatus}
          ORDER BY d.executed_at DESC
          LIMIT ${pageSize} OFFSET ${offset}
        `;
      }
    }

    return ok({
      cards,
      draws,
      cardTotal,
      drawTotal,
      page,
      pageSize,
      status,
      kind,
      totalPages: Math.max(1, Math.ceil(Math.max(cardTotal, drawTotal) / pageSize)),
    });
  }

  // POST — resolve.
  const { kind, id, status, txid, notes } = parse(event);
  if (kind !== 'card' && kind !== 'draw') return fail("kind must be 'card' or 'draw'", 400);
  if (!id) return fail('id required', 400);
  if (status !== 'paid' && status !== 'rejected') {
    return fail("status must be 'paid' or 'rejected'", 400);
  }
  if (status === 'paid' && !txid) return fail('txid required when marking paid', 400);

  if (kind === 'card') {
    const updated = await sql`
      UPDATE cards
      SET payout_status      = ${status},
          payout_txid        = ${txid || null},
          payout_notes       = ${notes || null},
          payout_resolved_at = NOW()
      WHERE card_id = ${id} AND payout_status = 'verifying'
      RETURNING card_id, payout_status, payout_txid, payout_resolved_at
    `;
    if (updated.length === 0) return fail('card not pending or not found', 409);
    return ok({ card: updated[0] });
  }

  // kind === 'draw'
  const updatedDraw = await sql`
    UPDATE draws
    SET payout_status      = ${status},
        payout_txid        = ${txid || null},
        payout_notes       = ${notes || null},
        payout_resolved_at = NOW()
    WHERE draw_id = ${id} AND payout_status = 'verifying'
    RETURNING draw_id, winner_ticket_id, payout_status, payout_txid, payout_resolved_at
  `;
  if (updatedDraw.length === 0) return fail('draw not pending or not found', 409);

  if (updatedDraw[0].winner_ticket_id) {
    await sql`
      UPDATE tickets
      SET payout_status = ${status}
      WHERE ticket_id = ${updatedDraw[0].winner_ticket_id}
    `;
  }

  return ok({ draw: updatedDraw[0] });
});
