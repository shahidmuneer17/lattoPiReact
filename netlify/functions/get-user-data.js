// GET /.netlify/functions/get-user-data
// Auth: Bearer <pi access token>
// Returns the user record + their tickets and cards.
const { sql } = require('./_lib/db');
const { ok, fail, wrap } = require('./_lib/response');
const { getPiUser } = require('./_lib/auth');

exports.handler = wrap(async (event) => {
  const user = await getPiUser(event);
  if (!user) return fail('unauthorized', 401);

  const [tickets, cards] = await Promise.all([
    sql`SELECT ticket_id, draw_id, number, price_pi, status, is_winner, created_at
        FROM tickets WHERE uid = ${user.uid} ORDER BY created_at DESC LIMIT 200`,
    sql`SELECT card_id, status, price_pi, reward_pi, scratched_at, created_at
        FROM cards   WHERE uid = ${user.uid} ORDER BY created_at DESC LIMIT 200`,
  ]);

  return ok({ user, tickets, cards });
});
