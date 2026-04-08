// GET /.netlify/functions/draw-status
// Public — returns the running total for the current draw and the threshold,
// so the dashboard can render the progressive bar.
const { sql } = require('./_lib/db');
const { ok } = require('./_lib/response');
const { currentDrawId, getConfig } = require('./_lib/draw');

exports.handler = async () => {
  const drawId = currentDrawId();
  const [{ total, count }] = await sql`
    SELECT COALESCE(SUM(price_pi), 0)::float AS total,
           COUNT(*)::int AS count
    FROM tickets WHERE draw_id = ${drawId} AND status = 'active'
  `;
  const threshold = Number(await getConfig('threshold_pi', 100));
  return ok({ drawId, totalPi: total, ticketsCount: count, thresholdPi: threshold });
};
