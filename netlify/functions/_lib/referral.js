// Single source of truth for referral crediting logic.
// Imported by complete.js (spend), scratch-card.js (card win), and _lib/draw.js (draw win).
const crypto = require('crypto');
const { sql } = require('./db');

// Short, readable, hard-to-typo code: LATTO-XXXXXX
function generateReferralCode() {
  // Avoid 0/O/1/I to reduce typo collisions when shared verbally.
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(6);
  let code = '';
  for (let i = 0; i < 6; i++) code += alphabet[bytes[i] % alphabet.length];
  return `LATTO-${code}`;
}

async function getConfig(key, fallback) {
  const rows = await sql`SELECT value FROM config WHERE key = ${key}`;
  return rows[0]?.value ?? fallback;
}

// Assigns a unique referral_code to a user that doesn't have one yet.
// Retries on the unlikely UNIQUE collision.
async function ensureReferralCode(uid) {
  const existing = await sql`SELECT referral_code FROM users WHERE uid = ${uid}`;
  if (existing[0]?.referral_code) return existing[0].referral_code;

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateReferralCode();
    try {
      const rows = await sql`
        UPDATE users
        SET referral_code = ${code}
        WHERE uid = ${uid} AND referral_code IS NULL
        RETURNING referral_code
      `;
      if (rows[0]?.referral_code) return rows[0].referral_code;
      // Someone else already set it (race) — re-read.
      const r = await sql`SELECT referral_code FROM users WHERE uid = ${uid}`;
      if (r[0]?.referral_code) return r[0].referral_code;
    } catch (e) {
      if (!/unique/i.test(e.message)) throw e;
      // collision — try a new code
    }
  }
  throw new Error('failed to generate unique referral code after 5 attempts');
}

// Attempts to set referred_by on a NEW user. Idempotent and self-referral-safe.
//   - if user already has referred_by → no-op
//   - if code resolves to the same user → no-op (self-referral)
//   - if code is unknown → no-op
// Returns the resolved referrer uid or null.
async function tryAttachReferrer(uid, code) {
  if (!code) return null;
  const cleaned = String(code).trim().toUpperCase();
  if (!cleaned) return null;

  const existing = await sql`SELECT referred_by FROM users WHERE uid = ${uid}`;
  if (existing[0]?.referred_by) return existing[0].referred_by;

  const ref = await sql`SELECT uid FROM users WHERE referral_code = ${cleaned}`;
  const referrerUid = ref[0]?.uid;
  if (!referrerUid || referrerUid === uid) return null;

  const updated = await sql`
    UPDATE users
    SET referred_by = ${referrerUid}
    WHERE uid = ${uid} AND referred_by IS NULL
    RETURNING referred_by
  `;
  return updated[0]?.referred_by || null;
}

// Credits the referrer of `referredUid` 1% of `basePi` for an event of the given kind.
// No-ops if:
//   - referred user has no referrer
//   - referred user is not yet activated AND lifetime_spend_pi < activation threshold
//   - commission rounds to ~0
//
// Returns { credited, commission, referrerUid } or { credited: false, reason }.
async function creditReferrer({ referredUid, kind, sourceId, basePi, network }) {
  if (!referredUid || !basePi || basePi <= 0) {
    return { credited: false, reason: 'invalid_input' };
  }

  const refUserRows = await sql`
    SELECT referred_by, lifetime_spend_pi, referral_activated
    FROM users WHERE uid = ${referredUid}
  `;
  const refUser = refUserRows[0];
  if (!refUser?.referred_by) return { credited: false, reason: 'no_referrer' };

  // Activation gate: lifetime spend must be at least the threshold (gates BOTH spend and win).
  let activated = refUser.referral_activated;
  if (!activated) {
    const threshold = Number(await getConfig('referral_activation_pi', 10));
    if (Number(refUser.lifetime_spend_pi) < threshold) {
      return { credited: false, reason: 'below_activation_threshold' };
    }
    // Just crossed — flip the flag so subsequent calls skip the comparison.
    await sql`UPDATE users SET referral_activated = TRUE WHERE uid = ${referredUid}`;
    activated = true;
  }

  const rate = Number(await getConfig('referral_commission_rate', 0.01));
  const commission = +(Number(basePi) * rate).toFixed(4);
  if (commission <= 0) return { credited: false, reason: 'rounded_zero' };

  // Audit row first, then balance bump. Both inside one logical operation.
  await sql`
    INSERT INTO referral_events
      (referrer_uid, referred_uid, kind, source_id, base_pi, commission_pi, network)
    VALUES
      (${refUser.referred_by}, ${referredUid}, ${kind}, ${String(sourceId)},
       ${basePi}, ${commission}, ${network})
  `;
  await sql`
    UPDATE users
    SET referral_balance_pi = referral_balance_pi + ${commission}
    WHERE uid = ${refUser.referred_by}
  `;

  return { credited: true, commission, referrerUid: refUser.referred_by };
}

module.exports = {
  generateReferralCode,
  ensureReferralCode,
  tryAttachReferrer,
  creditReferrer,
};
