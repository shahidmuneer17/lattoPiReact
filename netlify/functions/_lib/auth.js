// Lightweight auth helpers for Netlify Functions.
const { verifyAccessToken } = require('./pi');
const { sql } = require('./db');

// Resolves the Pi user from a Bearer access token, then upserts into Neon.
async function getPiUser(event) {
  const header = event.headers?.authorization || event.headers?.Authorization;
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice(7);
  try {
    const me = await verifyAccessToken(token); // { uid, username, ... }
    const rows = await sql`
      INSERT INTO users (uid, username, updated_at)
      VALUES (${me.uid}, ${me.username}, NOW())
      ON CONFLICT (uid) DO UPDATE SET username = EXCLUDED.username, updated_at = NOW()
      RETURNING uid, username, email, lifetime_spend_pi, created_at
    `;
    return rows[0];
  } catch (e) {
    console.warn('[auth] pi token verify failed:', e.message);
    return null;
  }
}

function requireAdmin(event) {
  const provided = event.headers?.['x-admin-secret'] || event.headers?.['X-Admin-Secret'];
  return provided && provided === process.env.ADMIN_SECRET;
}

module.exports = { getPiUser, requireAdmin };
