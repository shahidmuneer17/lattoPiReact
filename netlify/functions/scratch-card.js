// POST /.netlify/functions/scratch-card
// body: { cardId }
// Auth: Bearer <pi access token>
//
// Reveals the deterministic reward for a card the caller owns, then applies
// the "no-loss" guarantee:
//
//   At ANY moment, total card payouts (across the active network) MUST stay
//   below   card_max_payout_ratio × total card sales (across the same network).
//
// If granting this card's candidate reward would push us above that ratio,
// we downgrade the reward to 0. The seed-based selection still happens
// deterministically, so the user's *odds* of winning are honest — but the
// house always keeps a guaranteed margin from card sales.
const crypto = require('crypto');
const { sql } = require('./_lib/db');
const { ok, fail, parse, wrap } = require('./_lib/response');
const { getPiUser } = require('./_lib/auth');
const { currentNetwork } = require('./_lib/network');

// Reward tiers within the configured min/max range. Probabilities sum to 1.
// 88% no-win, 12% win distributed across 4 tiers (5, 25, 100, 1000 π).
const REWARD_TIERS = [
  { reward: 0,    prob: 0.88   },
  { reward: 5,    prob: 0.10   },
  { reward: 25,   prob: 0.015  },
  { reward: 100,  prob: 0.0045 },
  { reward: 1000, prob: 0.0005 },
];

function pickCandidateReward(seed) {
  const r =
    parseInt(crypto.createHash('sha256').update(seed).digest('hex').slice(0, 8), 16) /
    0xffffffff;
  let acc = 0;
  for (const tier of REWARD_TIERS) {
    acc += tier.prob;
    if (r <= acc) return tier.reward;
  }
  return 0;
}

async function getConfig(key, fallback) {
  const rows = await sql`SELECT value FROM config WHERE key = ${key}`;
  return rows[0]?.value ?? fallback;
}

exports.handler = wrap(async (event) => {
  const user = await getPiUser(event);
  if (!user) return fail('unauthorized', 401);

  const { cardId } = parse(event);
  if (!cardId) return fail('cardId required', 400);

  const rows = await sql`SELECT * FROM cards WHERE card_id = ${cardId}`;
  const card = rows[0];
  if (!card || card.uid !== user.uid) return fail('not found', 404);
  if (card.status === 'scratched') return ok({ card });

  const network = currentNetwork();
  const candidate = pickCandidateReward(card.seed);

  // ───── No-loss safety rule ─────
  // Compute total revenue and total payouts for the current network.
  // We INCLUDE this card's price_pi in the revenue (it's already in the table)
  // and EXCLUDE its reward from payouts (it's still null).
  const [{ revenue, payouts }] = await sql`
    SELECT
      COALESCE((SELECT SUM(price_pi)  FROM cards
                WHERE network = ${network}), 0)::float AS revenue,
      COALESCE((SELECT SUM(reward_pi) FROM cards
                WHERE network = ${network} AND status = 'scratched'), 0)::float AS payouts
  `;
  const maxRatio = Number(await getConfig('card_max_payout_ratio', 0.5));
  const payoutCap = revenue * maxRatio;

  // If granting `candidate` would cross the cap, downgrade to 0 (still a win
  // event from the user's POV, but the prize is zero — the house stays solvent).
  let reward = candidate;
  let safetyDowngrade = false;
  if (candidate > 0 && payouts + candidate > payoutCap) {
    reward = 0;
    safetyDowngrade = true;
    console.log(
      `[scratch-card] safety downgrade: candidate=${candidate} payouts=${payouts} ` +
      `revenue=${revenue} cap=${payoutCap} cardId=${cardId}`
    );
  }

  const updated = await sql`
    UPDATE cards
    SET status = 'scratched', reward_pi = ${reward}, scratched_at = NOW()
    WHERE card_id = ${cardId}
    RETURNING card_id, status, price_pi, reward_pi, scratched_at, created_at
  `;
  return ok({ card: updated[0], safetyDowngrade });
});
