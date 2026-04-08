// Shared draw logic — used by complete.js (threshold), draw-monthly (cron),
// and admin-trigger-draw (manual).
const crypto = require('crypto');
const { sql } = require('./db');
const { sendMail } = require('./mail');

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
  // Re-entrancy guard: don't double-execute the same draw.
  const existing = await sql`SELECT draw_id FROM draws WHERE draw_id = ${drawId}`;
  if (existing.length) return { ok: false, reason: 'already_executed', drawId };

  const tickets = await sql`
    SELECT ticket_id, uid, username, price_pi
    FROM tickets t
    LEFT JOIN users u USING (uid)
    WHERE draw_id = ${drawId} AND status = 'active'
  `;
  if (!tickets.length) return { ok: false, reason: 'no_tickets', drawId };

  const ratio = Number(await getConfig('prize_pool_ratio', 0.25));
  const totalPi = tickets.reduce((s, t) => s + Number(t.price_pi || 0), 0);
  const prizePi = +(totalPi * ratio).toFixed(4);
  const platformPi = +(totalPi - prizePi).toFixed(4);

  const seed = crypto.randomBytes(32).toString('hex');
  const { winner, hash } = pickWinner(seed, tickets);

  await sql`
    INSERT INTO draws (draw_id, trigger, total_tickets, total_pi, prize_pi, platform_pi,
                       winner_ticket_id, winner_uid, winner_username, seed, proof_hash)
    VALUES (${drawId}, ${trigger}, ${tickets.length}, ${totalPi}, ${prizePi}, ${platformPi},
            ${winner.ticket_id}, ${winner.uid}, ${winner.username}, ${seed}, ${hash})
  `;

  await sql`
    UPDATE tickets
    SET status = 'past',
        is_winner = (ticket_id = ${winner.ticket_id})
    WHERE draw_id = ${drawId} AND status = 'active'
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
    totalTickets: tickets.length,
    totalPi,
    prizePi,
    platformPi,
    winnerUid: winner.uid,
    winnerUsername: winner.username,
    proofHash: hash,
  };
}

// Called from complete.js after a ticket purchase.
async function maybeRunThresholdDraw(drawId) {
  const threshold = Number(await getConfig('threshold_pi', 100));
  const rows = await sql`
    SELECT COALESCE(SUM(price_pi), 0)::float AS total
    FROM tickets WHERE draw_id = ${drawId} AND status = 'active'
  `;
  const total = Number(rows[0]?.total || 0);
  if (total < threshold) return { triggered: false, total, threshold };
  const result = await executeDraw(drawId, 'threshold');
  return { triggered: true, ...result };
}

module.exports = { executeDraw, maybeRunThresholdDraw, currentDrawId, getConfig };
