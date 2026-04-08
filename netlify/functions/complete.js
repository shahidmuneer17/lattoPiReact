// POST /.netlify/functions/complete
// body: { paymentId, txid }
//
// Called by the Pi SDK after the on-chain transaction is submitted. The flow:
//   1. Tell Pi to complete the payment.
//   2. Read payment metadata (kind = 'tickets' | 'cards', count = N).
//   3. CLAIM the payment by inserting a row into processed_payments.
//      The PRIMARY KEY on payment_id makes the claim atomic, so two concurrent
//      /complete calls cannot both create rows. The losing call returns
//      `already_processed` and exits.
//   4. Insert N tickets or N cards (each row shares the same payment_id).
//   5. Update lifetime_spend_pi + credit referrer commission.
//   6. (Tickets only) trigger the threshold-draw check.
const crypto = require('crypto');
const { sql } = require('./_lib/db');
const { ok, fail, parse, wrap } = require('./_lib/response');
const { getPiUser } = require('./_lib/auth');
const { completePayment, getPayment } = require('./_lib/pi');
const { maybeRunThresholdDraw } = require('./_lib/draw');
const { currentNetwork } = require('./_lib/network');
const { creditReferrer } = require('./_lib/referral');

function currentDrawId() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}
function drawExpiryDate(drawId) {
  const [y, m] = drawId.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0, 23, 0, 0));
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

  if (kind !== 'tickets' && kind !== 'cards') {
    return fail('payment metadata.kind must be tickets or cards', 400);
  }

  // 2. Sanity-check the paid amount against the configured price.
  const priceKey = kind === 'tickets' ? 'ticket_price_pi' : 'card_price_pi';
  const unitPrice = Number(await getConfig(priceKey, 0.5));
  const expected = +(unitPrice * count).toFixed(4);
  if (amount + 1e-6 < expected) {
    return fail(
      `payment amount ${amount} π is less than expected ${expected} π for ${count} ${kind}`,
      402
    );
  }

  // 3. Atomically claim this payment. If another concurrent call already claimed
  // it, RETURNING is empty and we short-circuit.
  const claim = await sql`
    INSERT INTO processed_payments (payment_id, uid, kind, count, amount_pi, txid, network)
    VALUES (${paymentId}, ${user.uid}, ${kind}, ${count}, ${amount}, ${txid}, ${network})
    ON CONFLICT (payment_id) DO NOTHING
    RETURNING payment_id
  `;
  if (claim.length === 0) {
    // Already processed by a concurrent call (or a retry). Return what's in the DB.
    if (kind === 'tickets') {
      const existing = await sql`
        SELECT ticket_id, number, draw_id, price_pi, status, expires_at
        FROM tickets WHERE payment_id = ${paymentId}
      `;
      return ok({ status: 'already_processed', kind, network, tickets: existing });
    } else {
      const existing = await sql`
        SELECT card_id, status, price_pi, created_at
        FROM cards WHERE payment_id = ${paymentId}
      `;
      return ok({ status: 'already_processed', kind, network, cards: existing });
    }
  }

  // 4. Insert the rows. We're now the only writer for this payment.
  if (kind === 'tickets') {
    const drawId = currentDrawId();
    const expiry = drawExpiryDate(drawId);
    const inserted = [];
    for (let i = 0; i < count; i++) {
      const rows = await sql`
        INSERT INTO tickets (uid, draw_id, number, price_pi, payment_id, txid, network, expires_at)
        VALUES (${user.uid}, ${drawId}, ${generateTicketNumber()}, ${unitPrice},
                ${paymentId}, ${txid}, ${network}, ${expiry.toISOString()})
        RETURNING ticket_id, number, draw_id, price_pi, status, expires_at
      `;
      inserted.push(rows[0]);
    }
    await sql`UPDATE users SET lifetime_spend_pi = lifetime_spend_pi + ${amount} WHERE uid = ${user.uid}`;

    await creditReferrer({
      referredUid: user.uid,
      kind: 'spend',
      sourceId: paymentId,
      basePi: amount,
      network,
    }).catch((e) => console.error('[complete] referral spend credit failed', e));

    const drawResult = await maybeRunThresholdDraw(drawId).catch((e) => {
      console.error('[complete] threshold draw failed', e);
      return null;
    });

    return ok({ status: 'completed', kind, network, tickets: inserted, draw: drawResult });
  }

  // kind === 'cards'
  const seedBase = crypto.randomBytes(16).toString('hex');
  const inserted = [];
  for (let i = 0; i < count; i++) {
    const rows = await sql`
      INSERT INTO cards (uid, seed, price_pi, payment_id, txid, network)
      VALUES (${user.uid}, ${seedBase + ':' + i}, ${unitPrice}, ${paymentId}, ${txid}, ${network})
      RETURNING card_id, status, price_pi, created_at
    `;
    inserted.push(rows[0]);
  }
  await sql`UPDATE users SET lifetime_spend_pi = lifetime_spend_pi + ${amount} WHERE uid = ${user.uid}`;
  return ok({ status: 'completed', kind, network, cards: inserted });
});
