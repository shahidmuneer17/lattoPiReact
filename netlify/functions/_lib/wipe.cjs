// Dangerous: deletes ALL tickets, cards, and draws from the database.
// Useful when going from testnet → mainnet so testnet data doesn't pollute
// the first real draw. Users (and the config table) are preserved.
//
// Usage:   npm run db:wipe
// or pass --network=testnet to only wipe one network's rows:
//          npm run db:wipe -- --network=testnet
try { require('dotenv').config(); } catch {}
if (!process.env.NETLIFY_DATABASE_URL && !process.env.NEON_DATABASE_URL) {
  try {
    const envText = require('fs').readFileSync(
      require('path').join(__dirname, '../../../.env'),
      'utf8'
    );
    for (const line of envText.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
    }
  } catch {}
}

const { neon } = require('@neondatabase/serverless');

(async () => {
  const url =
    process.env.NETLIFY_DATABASE_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.DATABASE_URL;
  if (!url) {
    console.error('NETLIFY_DATABASE_URL or NEON_DATABASE_URL is required');
    process.exit(1);
  }

  // Optional --network=testnet|mainnet filter
  const arg = process.argv.find((a) => a.startsWith('--network='));
  const network = arg ? arg.split('=')[1] : null;

  const sql = neon(url);

  if (network) {
    console.log(`▸ Wiping ${network} rows only…`);
    const d = await sql('DELETE FROM draws   WHERE network = $1', [network]);
    const t = await sql('DELETE FROM tickets WHERE network = $1', [network]);
    const c = await sql('DELETE FROM cards   WHERE network = $1', [network]);
    console.log(`✔ deleted ${d.length || 0} draws, ${t.length || 0} tickets, ${c.length || 0} cards`);
  } else {
    console.log('▸ Wiping ALL tickets, cards, and draws (users + config preserved)…');
    await sql('DELETE FROM draws',   []);
    await sql('DELETE FROM tickets', []);
    await sql('DELETE FROM cards',   []);
    console.log('✔ done');
  }
  console.log('Wipe complete.');
})();
