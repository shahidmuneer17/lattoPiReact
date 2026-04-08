// Shared draw logic — used by complete.js (threshold), draw-monthly (cron),
// and admin-trigger-draw (manual).
const crypto = require('crypto');
const { sql } = require('./db');
const { sendMail } = require('./mail');
const { currentNetwork } = require('./network');

async function getConfig(key, fallback) {
  const rows = await sql`SELECT value FROM config WHERE key = ${key}`;
  return rows[0]?.value ?? fallback;
}

function currentDrawId() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

// Provably-fair: HMAC over the draw seed and a sorted list of ticket IDs.
function pickWinner(seed, tickets) {
  const sorted = [...tickets].sort((a, b) =>
    a.ticket_id < b.ticket_id ? -1 : 1
  );
  const hash = crypto
    .createHmac('sha256', seed)
    .update(sorted.map((t) => t.ticket_id).join('|'))
    .digest('hex');
  const idx = parseInt(hash.slice(0, 12), 16) % sorted.length;
  return { winner: sorted[idx], hash };
}

async function executeDraw(drawId, trigger = 'manual') {
  const network = currentNetwork();

  // Re-entrancy guard.
  const existing = await sql`SELECT draw_id FROM draws WHERE draw_id = ${drawId}`;
  if (existing.length) return { ok: false, reason: 'already_executed', drawId };

  // Only consider tickets purchased on the SAME network as the draw.
  const tickets = await sql`
    SELECT t.ticket_id, t.uid, u.username, t.price_pi
    FROM tickets t
    LEFT JOIN users u USING (uid)
    WHERE t.draw_id = ${drawId}
      AND t.status  = 'active'
      AND t.network = ${network}
  `;
  if (!tickets.length) return { ok: false, reason: 'no_tickets', drawId, network };

  const totalPi = tickets.reduce((s, t) => s + Number(t.price_pi || 0), 0);

  // Optional min-sales guard so the platform never runs a draw at a loss.
  const minSales = Number(await getConfig('min_sales_for_draw_pi', 0));
  if (totalPi < minSales) {
    return {
      ok: false,
      reason: 'below_min_sales',
      drawId,
      network,
      totalPi,
      minSales,
    };
  }

  // Fixed monthly prize from config (default 10,000 π).
  const prizePi = Number(await getConfig('monthly_prize_pi', 10000));
  const platformPi = +(totalPi - prizePi).toFixed(4);

  const seed = crypto.randomBytes(32).toString('hex');
  const { winner, hash } = pickWinner(seed, tickets);

  await sql`
    INSERT INTO draws (draw_id, trigger, total_tickets, total_pi, prize_pi, platform_pi,
                       winner_ticket_id, winner_uid, winner_username, seed, proof_hash, network)
    VALUES (${drawId}, ${trigger}, ${tickets.length}, ${totalPi}, ${prizePi}, ${platformPi},
            ${winner.ticket_id}, ${winner.uid}, ${winner.username}, ${seed}, ${hash}, ${network})
  `;

  await sql`
    UPDATE tickets
    SET status = 'past',
        is_winner = (ticket_id = ${winner.ticket_id})
    WHERE draw_id = ${drawId} AND status = 'active' AND network = ${network}
  `;

  // Notify winner if we have an email on file.
  try {
    const u = await sql`SELECT email FROM users WHERE uid = ${winner.uid}`;
    if (u[0]?.email) {
      await sendMail(
        u[0].email,
        `You won the LattoPi ${drawId} draw!`,
        `<p>Congratulations @${winner.username} — your ticket <b>${winner.ticket_id}</b> won <b>${prizePi} π</b>.</p>`
      );
    }
  } catch (e) {
    console.warn('[draw] mail failed', e.message);
  }

  return {
    ok: true,
    drawId,
    network,
    totalTickets: tickets.length,
    totalPi,
    prizePi,
    platformPi,
    winnerUid: winner.uid,
    winnerUsername: winner.username,
    proofHash: hash,
  };
}

// We no longer auto-trigger a draw on every ticket purchase. The monthly cron
// in netlify.toml is the only thing that fires draws automatically. The admin
// can still trigger one manually via /admin → "Trigger Current Draw".
// Kept as a no-op so existing call sites in complete.js don't break.
async function maybeRunThresholdDraw() {
  return { triggered: false, reason: 'monthly_cron_only' };
}

module.exports = { executeDraw, maybeRunThresholdDraw, currentDrawId, getConfig };
