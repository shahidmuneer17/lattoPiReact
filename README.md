# LattoPi

Lottery + scratch-card platform for the Pi Network.
**Stack:** React (CRA) · Tailwind · Netlify Functions · Neon (Postgres) · Pi SDK · Maileroo
**Business logic:** 75% platform / 25% prize pool. 100% of Pi flows to the developer-registered Pi Wallet.

## Repo layout

```
lattoPiReact/
  src/                React app (Pi Browser, mobile-first)
    pages/            Home · Dashboard · BuyTicket · Cards · History · Admin
    hooks/useAuth.js  Pi auth + payment flow
    api.js            Fetch wrapper for Netlify Functions
    AuthContext.jsx   Shared auth state
  netlify/functions/
    _lib/             db (Neon), pi, auth, response, mail, draw, schema.sql, migrate.cjs
    login.js                 POST  Pi auth → upsert user
    approve.js               POST  Pi server-side approve
    complete.js              POST  Pi server-side complete + create tickets/cards (idempotent)
    get-user-data.js         GET   user profile + tickets + cards
    scratch-card.js          POST  reveal a card (deterministic)
    draw-status.js           GET   public progressive-bar data
    draw-monthly.js          CRON  monthly draw (scheduled in netlify.toml)
    admin-stats.js           GET   treasury stats (X-Admin-Secret)
    admin-users.js           GET   user list
    admin-trigger-draw.js    POST  manual draw
    admin-config.js          GET/PUT thresholds and prices
  netlify.toml          functions dir + monthly cron
  tailwind.config.js
```

## Setup

1. **Neon** — create a project at neon.tech, copy the pooled connection string.
2. **Pi Developer Portal** — register the app, get `PI_API_KEY`. Add the deployed URL to allowed origins.
3. `cp .env.example .env` and fill in `NEON_DATABASE_URL`, `PI_API_KEY`, `ADMIN_SECRET`, optional `MAILEROO_API_KEY`.
4. `npm install`
5. `npm run db:migrate` — creates/updates the Neon schema (idempotent).
6. `npm start` — runs CRA on http://localhost:3000

For full-stack local dev with the functions running:
```
npm i -g netlify-cli
netlify dev
```

## Deploying to Netlify

1. `netlify init` (or connect the repo in the Netlify dashboard).
2. Set the same env vars (`NEON_DATABASE_URL`, `PI_API_KEY`, `ADMIN_SECRET`, `MAILEROO_API_KEY`) in
   **Site → Environment variables**.
3. Push to your branch — Netlify will build and deploy `build/` and the functions in `netlify/functions/`.
4. The monthly draw cron is registered automatically from `netlify.toml`.
5. Before going to mainnet, switch `Pi.init({ sandbox: false })` in [public/index.html](public/index.html).

## Pi payment flow

```
React  ─ Pi.createPayment ──▶  Pi SDK
                               │ onReadyForServerApproval(paymentId)
                               ▼
                          POST /approve   ──▶ Pi /v2/payments/:id/approve
                               │ onReadyForServerCompletion(paymentId, txid)
                               ▼
                          POST /complete  ──▶ Pi /v2/payments/:id/complete
                                               + Neon insert (tickets|cards)
                                               + threshold check → maybe draw
```

Idempotency: `complete` looks up `payment_id` in tickets/cards before inserting,
so SDK retries can't double-mint.

## Provably-fair

- **Tickets:** at draw time we generate a 32-byte seed, then pick the winner via
  `HMAC-SHA256(seed, sortedTicketIds)`. Both `seed` and `proof_hash` are persisted
  in `draws` so anyone can verify the result.
- **Cards:** the seed is committed at purchase time (random 16 bytes) and hidden
  from the client until the user calls `/scratch-card`. The reward is a deterministic
  function of that seed.

## Next steps

See [NEXT_STEPS.md](NEXT_STEPS.md).
