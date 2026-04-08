// POST /.netlify/functions/scratch-card
// body: { cardId }
// Auth: Bearer <pi access token>
// Reveals the deterministic reward for a card the caller owns.
const crypto = require('crypto');
const { sql } = require('./_lib/db');
const { ok, fail, parse } = require('./_lib/response');
const { getPiUser } = require('./_lib/auth');

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

exports.handler = async (event) => {
  const user = await getPiUser(event);
  if (!user) return fail('unauthorized', 401);

  const { cardId } = parse(event);
  if (!cardId) return fail('cardId required', 400);

  const rows = await sql`SELECT * FROM cards WHERE card_id = ${cardId}`;
  const card = rows[0];
  if (!card || card.uid !== user.uid) return fail('not found', 404);
  if (card.status === 'scratched') return ok({ card });

  const reward = pickReward(card.seed);
  const updated = await sql`
    UPDATE cards
    SET status = 'scratched', reward_pi = ${reward}, scratched_at = NOW()
    WHERE card_id = ${cardId}
    RETURNING card_id, status, price_pi, reward_pi, scratched_at, created_at
  `;
  return ok({ card: updated[0] });
};
