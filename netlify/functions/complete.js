// POST /.netlify/functions/complete
// body: { paymentId, txid }
// Called by the Pi SDK after the on-chain transaction is submitted.
//   1. Tell Pi to complete the payment.
//   2. Read the payment metadata to know what was bought (tickets vs cards).
//   3. Create the matching rows in Neon (idempotent on payment_id).
//   4. After ticket purchases, fire the threshold-draw check.
const crypto = require('crypto');
const { sql } = require('./_lib/db');
const { ok, fail, parse, wrap } = require('./_lib/response');
const { getPiUser } = require('./_lib/auth');
const { completePayment, getPayment } = require('./_lib/pi');
const { maybeRunThresholdDraw } = require('./_lib/draw');
const { currentNetwork } = require('./_lib/network');

function currentDrawId() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}
// Last day of the draw's calendar month at 23:00 UTC — used as the ticket expiry.
function drawExpiryDate(drawId) {
  const [y, m] = drawId.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0, 23, 0, 0)); // day 0 of next month = last day of month
}
function generateTicketNumber() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function getConfig(key, fallback) {
  const rows = await sql`SELECT value FROM config WHERE key = ${key}`;
  return rows[0]?.value ?? fallback;
}

exports.handler = wrap(async (event) => {
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
  const kind = meta.kind;
  const count = Math.max(1, Math.min(1000, Number(meta.count || 1)));
  const amount = Number(payment.amount || 0);
  const network = currentNetwork();

  // 2. Idempotency check.
  if (kind === 'tickets') {
    const existing = await sql`SELECT ticket_id FROM tickets WHERE payment_id = ${paymentId}`;
    if (existing.length) return ok({ status: 'already_processed', count: existing.length });
  } else if (kind === 'cards') {
    const existing = await sql`SELECT card_id FROM cards WHERE payment_id = ${paymentId}`;
    if (existing.length) return ok({ status: 'already_processed', count: existing.length });
  } else {
    return fail('payment metadata.kind missing', 400);
  }

  // 3. Insert rows.
  if (kind === 'tickets') {
    const ticketPrice = Number(await getConfig('ticket_price_pi', 0.5));
    // Sanity check: paid amount should match price × count
    if (amount + 1e-6 < ticketPrice * count) {
      return fail(
        `payment amount ${amount} π is less than expected ${ticketPrice * count} π`,
        402
      );
    }

    const drawId = currentDrawId();
    const expiry = drawExpiryDate(drawId);
    const inserted = [];
    for (let i = 0; i < count; i++) {
      const rows = await sql`
        INSERT INTO tickets (uid, draw_id, number, price_pi, payment_id, txid, network, expires_at)
        VALUES (${user.uid}, ${drawId}, ${generateTicketNumber()}, ${ticketPrice},
                ${paymentId}, ${txid}, ${network}, ${expiry.toISOString()})
        RETURNING ticket_id, number, draw_id, price_pi, status, expires_at
      `;
      inserted.push(rows[0]);
    }
    await sql`UPDATE users SET lifetime_spend_pi = lifetime_spend_pi + ${amount} WHERE uid = ${user.uid}`;

    const drawResult = await maybeRunThresholdDraw(drawId).catch((e) => {
      console.error('[complete] threshold draw failed', e);
      return null;
    });

    return ok({ status: 'completed', kind, network, tickets: inserted, draw: drawResult });
  }

  // kind === 'cards'
  const cardPrice = Number(await getConfig('card_price_pi', 0.5));
  if (amount + 1e-6 < cardPrice * count) {
    return fail(
      `payment amount ${amount} π is less than expected ${cardPrice * count} π`,
      402
    );
  }

  const seedBase = crypto.randomBytes(16).toString('hex');
  const inserted = [];
  for (let i = 0; i < count; i++) {
    const rows = await sql`
      INSERT INTO cards (uid, seed, price_pi, payment_id, txid, network)
      VALUES (${user.uid}, ${seedBase + ':' + i}, ${cardPrice}, ${paymentId}, ${txid}, ${network})
      RETURNING card_id, status, price_pi, created_at
    `;
    inserted.push(rows[0]);
  }
  await sql`UPDATE users SET lifetime_spend_pi = lifetime_spend_pi + ${amount} WHERE uid = ${user.uid}`;
  return ok({ status: 'completed', kind, network, cards: inserted });
});
