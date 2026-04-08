// GET /.netlify/functions/draw-status
// Public — used by the dashboard to show the draw date and a generic
// "draw fires once minimum tickets sold" message. We DO NOT expose the
// minimum-sales threshold or running pot to clients on purpose.
const { sql } = require('./_lib/db');
const { ok, wrap } = require('./_lib/response');
const { currentDrawId, getConfig } = require('./_lib/draw');
const { currentNetwork } = require('./_lib/network');

exports.handler = wrap(async () => {
  const network = currentNetwork();
  const drawId = currentDrawId();

  // Use the latest expires_at across active tickets as the next draw date —
  // this way it auto-extends when the cron rolls tickets forward.
  const rows = await sql`
    SELECT MAX(expires_at) AS next_draw
    FROM tickets
    WHERE draw_id = ${drawId} AND status = 'active' AND network = ${network}
  `;
  let nextDraw = rows[0]?.next_draw;

  // Fallback if there are no active tickets yet: last day of current month, 23:00 UTC.
  if (!nextDraw) {
    const now = new Date();
    nextDraw = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 0, 0)
    ).toISOString();
  }

  const prizePi = Number(await getConfig('monthly_prize_pi', 10000));

  return ok({
    drawId,
    network,
    prizePi,
    nextDrawAt: nextDraw,
    rule:
      'The monthly draw fires once a minimum number of tickets have been sold. ' +
      'If the minimum is reached early, the draw happens the very next day ' +
      'and we notify all participants by email.',
  });
});
