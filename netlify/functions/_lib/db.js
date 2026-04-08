// Shared Neon (Postgres) client for all Netlify Functions.
// Lazy: we don't call neon() until the first query, so a missing env var
// surfaces as a normal error inside the handler (caught by wrap()) instead of
// crashing the whole Lambda at module-load time.
const { neon } = require('@neondatabase/serverless');

// The Netlify Neon extension exposes the connection string as
// NETLIFY_DATABASE_URL (pooled). Fall back to NEON_DATABASE_URL / DATABASE_URL
// for local dev outside Netlify.
function getConnectionString() {
  return (
    process.env.NETLIFY_DATABASE_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.DATABASE_URL
  );
}

let _client = null;
function getClient() {
  if (_client) return _client;
  const url = getConnectionString();
  if (!url) {
    throw new Error(
      'No database URL set. Expected NETLIFY_DATABASE_URL (Netlify Neon extension) ' +
        'or NEON_DATABASE_URL (local dev). Check Site → Environment variables.'
    );
  }
  _client = neon(url);
  return _client;
}

// Proxy that forwards both tagged-template and direct calls to the real client.
// Lets every call site keep using `await sql\`SELECT ...\`` unchanged.
const sql = (...args) => getClient()(...args);

module.exports = { sql };
