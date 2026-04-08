// GET /.netlify/functions/get-user-data
// Auth: Bearer <pi access token>
// Returns the user record + their tickets and cards on the active network.
const { sql } = require('./_lib/db');
const { ok, fail, wrap } = require('./_lib/response');
const { getPiUser } = require('./_lib/auth');
const { currentNetwork } = require('./_lib/network');

exports.handler = wrap(async (event) => {
  const user = await getPiUser(event);
  if (!user) return fail('unauthorized', 401);

  const network = currentNetwork();

  // Hard cap at 10 most recent rows of each type — keeps the per-user payload
  // tiny so the DB never gets hammered when many users hit /me concurrently.
  // The admin endpoints have full pagination if a complete history is needed.
  const HISTORY_LIMIT = 10;

  const [tickets, cards] = await Promise.all([
    sql`SELECT ticket_id, draw_id, number, price_pi, status, is_winner, payout_status,
               expires_at, network, created_at
        FROM tickets
        WHERE uid = ${user.uid} AND network = ${network}
        ORDER BY created_at DESC LIMIT ${HISTORY_LIMIT}`,
    sql`SELECT card_id, status, price_pi, reward_pi, payout_status, payout_txid,
               payout_resolved_at, scratched_at, network, created_at
        FROM cards
        WHERE uid = ${user.uid} AND network = ${network}
        ORDER BY created_at DESC LIMIT ${HISTORY_LIMIT}`,
  ]);

  return ok({ user, tickets, cards, network, historyLimit: HISTORY_LIMIT });
});
