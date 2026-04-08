// Shared Neon (Postgres) client for all Netlify Functions.
// Uses @neondatabase/serverless which works in Lambda/Edge environments.
const { neon } = require('@neondatabase/serverless');

if (!process.env.NEON_DATABASE_URL && !process.env.DATABASE_URL) {
  console.warn('[db] NEON_DATABASE_URL not set');
}

const sql = neon(process.env.NEON_DATABASE_URL || process.env.DATABASE_URL);

module.exports = { sql };
