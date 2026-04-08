// Scheduled by netlify.toml — runs every day at 23:00 UTC.
// Logic:
//   1. If we're on the last day of the month AND minimum sales met → run the draw.
//   2. Else if minimum sales already met (any day) → run the draw "early"
//      and notify all participants by email that the draw fired.
//   3. Else if we're on the last day and min NOT met → extend every active
//      ticket's expires_at by 1 day so they roll into the next attempt.
//   4. Otherwise → no-op.
const { sql } = require('./_lib/db');
const { ok, wrap } = require('./_lib/response');
const { executeDraw, currentDrawId, getConfig } = require('./_lib/draw');
const { sendMail } = require('./_lib/mail');
const { currentNetwork } = require('./_lib/network');

function isLastDayOfMonth(d = new Date()) {
  const next = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1));
  return next.getUTCMonth() !== d.getUTCMonth();
}

exports.handler = wrap(async () => {
  const network = currentNetwork();
  const drawId = currentDrawId();
  const minSales = Number(await getConfig('min_sales_for_draw_pi', 0));
  const lastDay = isLastDayOfMonth();

  // Tally current pot for the active draw on this network.
  const [{ total }] = await sql`
    SELECT COALESCE(SUM(price_pi), 0)::float AS total
    FROM tickets
    WHERE draw_id = ${drawId} AND status = 'active' AND network = ${network}
  `;
  const minMet = total >= minSales;

  // ──── Path A: minimum already met → run the draw immediately ────
  if (minMet) {
    const result = await executeDraw(drawId, lastDay ? 'monthly' : 'early');

    // If the draw fired early (before the scheduled month-end), notify
    // every participant who has an email on file.
    if (result.ok && !lastDay) {
      const participants = await sql`
        SELECT DISTINCT u.email, u.username
        FROM tickets t
        JOIN users u USING (uid)
        WHERE t.draw_id = ${drawId} AND t.network = ${network} AND u.email IS NOT NULL
      `;
      await Promise.allSettled(
        participants.map((p) =>
          sendMail(
            p.email,
            `LattoPi ${drawId} draw is happening tomorrow!`,
            `<p>Hi @${p.username},</p>
             <p>Great news — the LattoPi <b>${drawId}</b> draw has reached its minimum and the
             winner will be announced very soon. Open the app to see if you won!</p>`
          ).catch(() => null)
        )
      );
      result.notified = participants.length;
    }
    return ok(result);
  }

  // ──── Path B: last day, but min NOT met → roll tickets forward 1 day ────
  if (lastDay) {
    const rolled = await sql`
      UPDATE tickets
      SET expires_at = expires_at + INTERVAL '1 day'
      WHERE draw_id = ${drawId} AND status = 'active' AND network = ${network}
      RETURNING ticket_id
    `;
    return ok({
      ok: false,
      reason: 'rolled_forward',
      drawId,
      network,
      totalPi: total,
      minSalesPi: minSales,
      ticketsRolled: rolled.length,
    });
  }

  // ──── Path C: nothing to do today ────
  return ok({
    ok: false,
    reason: 'waiting',
    drawId,
    network,
    totalPi: total,
    minSalesPi: minSales,
  });
});
