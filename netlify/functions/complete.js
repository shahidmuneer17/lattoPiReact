// POST /.netlify/functions/complete
// body: { paymentId, txid }
// Called by the Pi SDK after the on-chain transaction is submitted.
// We:
//   1. Tell Pi to complete the payment.
//   2. Read the payment metadata to know what was bought (tickets vs cards).
//   3. Create the matching rows in Neon (idempotent on payment_id).
//   4. After ticket purchases, check the threshold and trigger a draw if hit.
const crypto = require('crypto');
const { sql } = require('./_lib/db');
const { ok, fail, parse } = require('./_lib/response');
const { getPiUser } = require('./_lib/auth');
const { completePayment, getPayment } = require('./_lib/pi');
const { maybeRunThresholdDraw } = require('./_lib/draw');

const REWARDS = [
  { reward: 0,    prob: 0.70  },
  { reward: 0.5,  prob: 0.20  },
  { reward: 1,    prob: 0.07  },
  { reward: 2,    prob: 0.025 },
  { reward: 5,    prob: 0.004 },
  { reward: 25,   prob: 0.001 },
];
function pickReward(seed) {
  const r =
    parseInt(crypto.createHash('sha256').update(seed).digest('hex').slice(0, 8), 16) /
    0xffffffff;
  let acc = 0;
  for (const tier of REWARDS) {
    acc += tier.prob;
    if (r <= acc) return tier.reward;
  }
  return 0;
}

function currentDrawId() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}
function generateTicketNumber() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

exports.handler = async (event) => {
  const user = await getPiUser(event);
  if (!user) return fail('unauthorized', 401);

  const { paymentId, txid } = parse(event);
  if (!paymentId || !txid) return fail('paymentId and txid required', 400);

  // 1. Complete the payment with Pi.
  let payment;
  try {
    await completePayment(paymentId, txid);
    payment = await getPayment(paymentId);
  } catch (e) {
    return fail('pi completion failed: ' + e.message, 502);
  }

  const meta = payment?.metadata || {};
  const kind = meta.kind;            // 'tickets' | 'cards'
  const count = Math.max(1, Math.min(100, Number(meta.count || 1)));
  const amount = Number(payment.amount || 0);

  // 2. Idempotency check — if we've already processed this paymentId, return what we have.
  if (kind === 'tickets') {
    const existing = await sql`SELECT ticket_id FROM tickets WHERE payment_id = ${paymentId}`;
    if (existing.length) return ok({ status: 'already_processed', count: existing.length });
  } else if (kind === 'cards') {
    const existing = await sql`SELECT card_id FROM cards WHERE payment_id = ${paymentId}`;
    if (existing.length) return ok({ status: 'already_processed', count: existing.length });
  } else {
    return fail('payment metadata.kind missing', 400);
  }

  // 3. Create rows.
  if (kind === 'tickets') {
    const drawId = currentDrawId();
    const pricePi = +(amount / count).toFixed(4);
    const inserted = [];
    for (let i = 0; i < count; i++) {
      const rows = await sql`
        INSERT INTO tickets (uid, draw_id, number, price_pi, payment_id, txid)
        VALUES (${user.uid}, ${drawId}, ${generateTicketNumber()}, ${pricePi}, ${paymentId}, ${txid})
        RETURNING ticket_id, number, draw_id, price_pi, status
      `;
      inserted.push(rows[0]);
    }
    await sql`UPDATE users SET lifetime_spend_pi = lifetime_spend_pi + ${amount} WHERE uid = ${user.uid}`;

    // Threshold check — fire-and-forget within the same invocation.
    const drawResult = await maybeRunThresholdDraw(drawId).catch((e) => {
      console.error('[complete] threshold draw failed', e);
      return null;
    });

    return ok({ status: 'completed', kind, tickets: inserted, draw: drawResult });
  }

  // kind === 'cards'
  const pricePi = +(amount / count).toFixed(4);
  const seedBase = crypto.randomBytes(16).toString('hex');
  const inserted = [];
  for (let i = 0; i < count; i++) {
    const rows = await sql`
      INSERT INTO cards (uid, seed, price_pi, payment_id, txid)
      VALUES (${user.uid}, ${seedBase + ':' + i}, ${pricePi}, ${paymentId}, ${txid})
      RETURNING card_id, status, price_pi, created_at
    `;
    inserted.push(rows[0]);
  }
  await sql`UPDATE users SET lifetime_spend_pi = lifetime_spend_pi + ${amount} WHERE uid = ${user.uid}`;
  return ok({ status: 'completed', kind, cards: inserted });
};

exports._internal = { pickReward, REWARDS };
