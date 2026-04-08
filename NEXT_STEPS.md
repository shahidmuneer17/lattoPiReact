# LattoPi — Next Steps

The Mongo + AWS scaffolding has been removed. Everything now runs as **React + Netlify Functions + Neon Postgres**, deployable to Netlify in one shot.

## 0. Bring it up locally
1. `cp .env.example .env` and fill `NEON_DATABASE_URL`, `PI_API_KEY`, `ADMIN_SECRET`.
2. `npm install`
3. `npm run db:migrate` — creates the schema in Neon.
4. `netlify dev` (or `npm start` if you only need the React side).
5. Visit `/admin`, paste your `ADMIN_SECRET`, and you should see the empty treasury view.

## 1. Wire up the Pi Developer Portal
- Register `lattopi.netlify.app` (or your custom domain) in the Pi app's allowed origins.
- Switch [public/index.html](public/index.html) `sandbox: true` → `false` for mainnet release.
- KYC the developer wallet — every payout flows there.

## 2. Backend hardening (in priority order)
- [ ] **Replace `ADMIN_SECRET` gate** in [netlify/functions/_lib/auth.js](netlify/functions/_lib/auth.js) with Netlify Identity or a magic-link login. The shared secret is fine for an MVP, not for prod.
- [ ] **Issue a session JWT after `/login`** instead of re-verifying the Pi access token on every request. KMS-signed or HS256 with a `JWT_SECRET` env var.
- [ ] **Pagination** on `/get-user-data` — currently capped at 200 rows.
- [ ] **CashoutHistory table** + Pi A2U flow (`POST /v2/payments`, approve, submit, complete) for paying winners. Add a `payouts.js` function and an admin "approve payout" button.
- [ ] **Commit-reveal fairness:** today the draw seed is generated *at draw time*. Stronger fairness = publish `SHA256(seed)` when the draw opens (store in `config` or `draws`), reveal `seed` at draw close so users can verify before the result.
- [ ] **Threshold race condition:** [_lib/draw.js](netlify/functions/_lib/draw.js) `executeDraw` already guards on `draws.draw_id` PK, so a duplicate insert will throw — wrap the call in try/catch and treat the unique-violation as "someone else already ran it".
- [ ] **Rate-limit `/login` and `/complete`** (Netlify Edge or a counter in Neon) to stop abuse.
- [ ] **Maileroo template** for winner emails — current HTML is inline and minimal.

## 3. Frontend polish
- [ ] **Real Canvas scratch effect** on cards (currently a click-to-reveal button). Port the Canvas component from any of the open-source scratch libraries; reveal triggers `api.scratch(cardId)` once 50% is cleared.
- [ ] **Skeleton loaders** + error toasts on all pages.
- [ ] **PWA manifest** with Pi-friendly splash icons.
- [ ] **"My Winnings" view** that aggregates won tickets + winning cards into a single feed with a "Cash out" button (calls a future `/cashout` function).
- [ ] **History pagination** once a user crosses ~200 entries.

## 4. Admin upgrades
- [ ] Audit log table — every admin action (`triggerDraw`, `setConfig`) recorded with actor + diff.
- [ ] Treasury reconciliation: compare Neon's computed `platformShare` against the on-chain wallet balance via Pi API.
- [ ] Threshold editor wired to `api.adminSetConfig(secret, 'threshold_pi', 500)` (the function already exists; just needs UI).

## 5. Compliance & ops
- [ ] Confirm lottery legality in your target jurisdictions — this is the real launch blocker, not the code.
- [ ] Pi Network app review submission with mainnet KYC wallet.
- [ ] Privacy policy + terms hosted under `/legal`.
- [ ] Backups: enable Neon point-in-time recovery + scheduled `pg_dump` to S3 / R2.
- [ ] Observability: log shipping from Netlify Functions to a dashboard (Logtail, Better Stack).

## 6. Stretch: daily / weekly draws
Add a `cadence` column to `tickets` and per-cadence `draw_id`s (`daily-2026-04-08`, `weekly-2026-W15`, `monthly-2026-04`). Add separate scheduled functions in `netlify.toml`:
```toml
[functions."draw-daily"]  schedule = "0 23 * * *"
[functions."draw-weekly"] schedule = "0 23 * * SUN"
```

---

### Files most likely to need edits next
- [netlify/functions/_lib/auth.js](netlify/functions/_lib/auth.js) — JWT instead of per-request Pi verify
- [netlify/functions/_lib/draw.js](netlify/functions/_lib/draw.js) — commit-reveal fairness, race-condition catch
- [netlify/functions/complete.js](netlify/functions/complete.js) — emit a payout/cashout queue row for winners
- [src/pages/Cards.jsx](src/pages/Cards.jsx) — real Canvas scratch effect
- [public/index.html](public/index.html) — flip `sandbox: false` for mainnet
