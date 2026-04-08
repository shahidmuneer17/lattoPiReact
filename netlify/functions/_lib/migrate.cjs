// One-shot migration runner: `npm run db:migrate`
// Loads .env, splits schema.sql on ';', runs each statement against Neon.
try { require('dotenv').config(); } catch { /* dotenv optional */ }
// Fallback: parse a .env file in the project root if dotenv isn't installed.
if (!process.env.NEON_DATABASE_URL && !process.env.DATABASE_URL) {
  try {
    const envText = require('fs').readFileSync(require('path').join(__dirname, '../../../.env'), 'utf8');
    for (const line of envText.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
    }
  } catch {}
}
const fs = require('fs');
const path = require('path');
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
  // HTTP-based client — no WebSocket polyfill needed.
  // Calling as `sql(query, params)` runs a single statement.
  const sql = neon(url);
  const file = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  // Strip `-- line comments` first so the splitter doesn't treat a comment-only
  // chunk as "skippable" and accidentally drop the CREATE TABLE that follows it.
  const cleaned = file
    .split('\n')
    .map((line) => line.replace(/--.*$/, ''))
    .join('\n');
  const stmts = cleaned
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of stmts) {
    process.stdout.write('▸ ' + stmt.split('\n')[0].slice(0, 80) + '… ');
    try {
      await sql(stmt, []);
      console.log('ok');
    } catch (e) {
      console.log('FAIL');
      console.error(e.message);
      process.exit(1);
    }
  }
  console.log('Migration complete.');
})();
