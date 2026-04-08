// Tab-based admin console designed to handle mass transactions:
// every list view is paginated, every data fetch is scoped to one tab,
// and the tab state is held in the URL hash so refresh keeps you put.
//
// Tabs:
//   #dashboard  — treasury + referral + pending counts (snapshot)
//   #wins       — pending card & draw wins, approve/reject
//   #payouts    — pending referral payouts, mark paid/rejected
//   #users      — paginated user search
//
// Replace the secret-based gate with Cognito or magic-link auth before
// going to mainnet (see NEXT_STEPS.md).
import { useEffect, useState, useCallback } from 'react';
import api from '../api';
import Pagination from '../components/Pagination';

const TABS = [
  { key: 'dashboard', label: '📊 Dashboard' },
  { key: 'wins',      label: '🏆 Pending Wins' },
  { key: 'payouts',   label: '💸 Referral Payouts' },
  { key: 'users',     label: '👥 Users' },
];

export default function Admin() {
  const [secret, setSecret] = useState(sessionStorage.getItem('admin_secret') || '');
  const [activeTab, setActiveTab] = useState(
    () => (window.location.hash.replace('#', '') || 'dashboard')
  );
  const [stats, setStats] = useState(null);
  const [loginError, setLoginError] = useState('');

  // Tab persistence in URL hash.
  useEffect(() => {
    window.location.hash = activeTab;
  }, [activeTab]);
  useEffect(() => {
    const onHash = () => setActiveTab(window.location.hash.replace('#', '') || 'dashboard');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Always reload stats when secret is set so the header pills are accurate.
  const reloadStats = useCallback(async () => {
    if (!secret) return;
    try {
      setStats(await api.adminStats(secret));
      setLoginError('');
    } catch (e) {
      setLoginError(e.message);
    }
  }, [secret]);

  useEffect(() => { reloadStats(); }, [reloadStats]);

  function login(e) {
    e.preventDefault();
    sessionStorage.setItem('admin_secret', secret);
    reloadStats();
  }

  if (!stats) {
    return (
      <form onSubmit={login} className="glass max-w-sm mx-auto mt-10 p-6 space-y-3">
        <h2 className="font-semibold">Admin Login</h2>
        <input
          type="password"
          placeholder="ADMIN_SECRET"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3"
        />
        <button className="btn-primary w-full">Continue</button>
        {loginError && <p className="text-xs text-red-300">{loginError}</p>}
      </form>
    );
  }

  return (
    <section className="mt-4 max-w-6xl mx-auto">
      {/* Pending count pills (always visible) */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Pill label="Pending wins"
              value={(stats.pendingCardWins || 0) + (stats.pendingDrawWins || 0)}
              tone="amber" onClick={() => setActiveTab('wins')} />
        <Pill label="Pending payouts" value={stats.referralPendingPayoutsPi?.toFixed(0) + ' π'}
              tone="purple" onClick={() => setActiveTab('payouts')} />
        <Pill label="Users" value={stats.users}
              tone="emerald" onClick={() => setActiveTab('users')} />
      </div>

      {/* Tab nav */}
      <nav className="flex flex-wrap gap-1 mb-4 border-b border-white/10">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition ${
              activeTab === t.key
                ? 'bg-white/10 text-pi-gold border-b-2 border-pi-gold'
                : 'opacity-60 hover:opacity-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {activeTab === 'dashboard' && <DashboardTab stats={stats} secret={secret} onChange={reloadStats} />}
      {activeTab === 'wins'      && <WinsTab     secret={secret} onResolve={reloadStats} />}
      {activeTab === 'payouts'   && <PayoutsTab  secret={secret} onResolve={reloadStats} />}
      {activeTab === 'users'     && <UsersTab    secret={secret} />}
    </section>
  );
}

// ─────────────────────────────────────────────────────────
// Dashboard tab
// ─────────────────────────────────────────────────────────
function DashboardTab({ stats, secret, onChange }) {
  const [drawing, setDrawing] = useState(false);
  const [drawMsg, setDrawMsg] = useState('');

  async function triggerDraw() {
    setDrawing(true);
    try {
      const res = await api.adminDraw(secret);
      setDrawMsg(res.ok ? `Winner: @${res.winnerUsername}` : res.reason);
      onChange();
    } catch (e) {
      setDrawMsg(e.message);
    } finally {
      setDrawing(false);
    }
  }

  return (
    <div className="space-y-6">
      <Section title="Treasury">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Stat label="Total Revenue"    value={`${stats.totalRevenuePi} π`} />
          <Stat label="Platform share"   value={`${stats.platformSharePi} π`} accent="text-emerald-300" />
          <Stat label="Prize pool (legacy 25%)" value={`${stats.prizePoolPi} π`} accent="text-pi-gold" />
          <Stat label="Tickets sold"     value={stats.ticketsSold} />
          <Stat label="Cards sold"       value={stats.cardsSold} />
          <Stat label="Card payouts"     value={`${stats.cardPayoutsPi} π`} accent="text-pi-gold" />
        </div>
      </Section>

      <Section title="Pending verification queue">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Pending card wins"
                value={stats.pendingCardWins ?? 0}
                accent="text-amber-300" />
          <Stat label="Pending card π"
                value={`${(stats.pendingCardWinsPi ?? 0).toFixed(2)} π`}
                accent="text-amber-300" />
          <Stat label="Pending draw wins"
                value={stats.pendingDrawWins ?? 0}
                accent="text-amber-300" />
          <Stat label="Pending draw π"
                value={`${(stats.pendingDrawWinsPi ?? 0).toFixed(0)} π`}
                accent="text-amber-300" />
        </div>
      </Section>

      <Section title="Referral programme">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Active referrers" value={stats.activeReferrers ?? 0} />
          <Stat label="Owed (balances)"  value={`${(stats.referralBalanceOwedPi ?? 0).toFixed(2)} π`} accent="text-pi-gold" />
          <Stat label="Pending payouts"  value={`${(stats.referralPendingPayoutsPi ?? 0).toFixed(2)} π`} accent="text-amber-300" />
          <Stat label="Lifetime paid"    value={`${(stats.referralPaidTotalPi ?? 0).toFixed(2)} π`} accent="text-emerald-300" />
        </div>
      </Section>

      <Section title="Manual draw">
        <p className="text-xs opacity-70 mb-3">
          Bypasses the {(stats.minSalesForDrawPi || 15000)} π minimum-sales guard. Use with care.
        </p>
        <button onClick={triggerDraw} disabled={drawing} className="btn-primary">
          {drawing ? 'Drawing…' : 'Trigger Current Draw'}
        </button>
        {drawMsg && <p className="text-sm mt-3">{drawMsg}</p>}
      </Section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Pending wins tab
// ─────────────────────────────────────────────────────────
function WinsTab({ secret, onResolve }) {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('pending');
  const [kind, setKind] = useState('all');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.adminWins(secret, { page, pageSize: 25, status, kind });
      setData(res);
    } catch (e) {
      setData({ error: e.message });
    }
  }, [secret, page, status, kind]);

  useEffect(() => { load(); }, [load]);

  async function resolve(targetKind, id, newStatus, label) {
    let txid = null;
    let notes = null;
    if (newStatus === 'paid') {
      txid = window.prompt(`Pi A2U txid for ${label}:`);
      if (!txid) return;
    } else {
      notes = window.prompt('Reason for rejection (optional):') || null;
      if (!window.confirm(`Reject ${label}? This cannot be undone.`)) return;
    }
    setBusy(true);
    try {
      await api.adminResolveWin(secret, targetKind, id, newStatus, txid, notes);
      await load();
      onResolve();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (!data) return <div className="opacity-60">Loading…</div>;
  if (data.error) return <div className="text-red-300 text-sm">{data.error}</div>;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Select label="Status" value={status} onChange={(v) => { setStatus(v); setPage(1); }}
          options={[
            { value: 'pending',  label: 'Pending' },
            { value: 'paid',     label: 'Paid' },
            { value: 'rejected', label: 'Rejected' },
            { value: 'all',      label: 'All' },
          ]} />
        <Select label="Kind" value={kind} onChange={(v) => { setKind(v); setPage(1); }}
          options={[
            { value: 'all',  label: 'All' },
            { value: 'card', label: 'Cards' },
            { value: 'draw', label: 'Draws' },
          ]} />
      </div>

      {/* Card wins */}
      {(kind === 'all' || kind === 'card') && (
        <div className="glass p-4 overflow-x-auto">
          <h3 className="font-semibold mb-2">Card wins ({data.cardTotal})</h3>
          {data.cards.length === 0 ? (
            <p className="text-xs opacity-60">No card wins for this filter.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left opacity-70">
                <tr>
                  <th className="py-1">User</th>
                  <th>Reward</th>
                  <th>Status</th>
                  <th>Scratched</th>
                  <th>Network</th>
                  <th>Card ID</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.cards.map((c) => (
                  <tr key={c.card_id} className="border-t border-white/10">
                    <td className="py-2">@{c.username}</td>
                    <td className="font-bold text-pi-gold">{c.reward_pi} π</td>
                    <td><StatusPill status={c.payout_status} /></td>
                    <td className="text-xs">{c.scratched_at?.slice(0, 16).replace('T', ' ')}</td>
                    <td className="text-xs">{c.network}</td>
                    <td className="text-xs font-mono opacity-60">{c.card_id.slice(0, 8)}…</td>
                    <td>
                      {c.payout_status === 'verifying' && (
                        <ActionButtons busy={busy}
                          onPaid={() => resolve('card', c.card_id, 'paid', `${c.reward_pi} π to @${c.username}`)}
                          onReject={() => resolve('card', c.card_id, 'rejected', `${c.reward_pi} π for @${c.username}`)}
                        />
                      )}
                      {c.payout_txid && (
                        <span className="text-[10px] font-mono opacity-60">{c.payout_txid.slice(0, 12)}…</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <Pagination page={page} totalPages={data.totalPages} total={data.cardTotal} onChange={setPage} />
        </div>
      )}

      {/* Draw wins */}
      {(kind === 'all' || kind === 'draw') && (
        <div className="glass p-4 overflow-x-auto">
          <h3 className="font-semibold mb-2">Draw wins ({data.drawTotal})</h3>
          {data.draws.length === 0 ? (
            <p className="text-xs opacity-60">No draw wins for this filter.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left opacity-70">
                <tr>
                  <th className="py-1">Draw</th>
                  <th>Winner</th>
                  <th>Prize</th>
                  <th>Status</th>
                  <th>Executed</th>
                  <th>Network</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.draws.map((d) => (
                  <tr key={d.draw_id} className="border-t border-white/10">
                    <td className="py-2 font-mono">{d.draw_id}</td>
                    <td>@{d.winner_username}</td>
                    <td className="font-bold text-pi-gold">{d.prize_pi} π</td>
                    <td><StatusPill status={d.payout_status} /></td>
                    <td className="text-xs">{d.executed_at?.slice(0, 16).replace('T', ' ')}</td>
                    <td className="text-xs">{d.network}</td>
                    <td>
                      {d.payout_status === 'verifying' && (
                        <ActionButtons busy={busy}
                          onPaid={() => resolve('draw', d.draw_id, 'paid', `${d.prize_pi} π to @${d.winner_username}`)}
                          onReject={() => resolve('draw', d.draw_id, 'rejected', `${d.prize_pi} π for @${d.winner_username}`)}
                        />
                      )}
                      {d.payout_txid && (
                        <span className="text-[10px] font-mono opacity-60">{d.payout_txid.slice(0, 12)}…</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Referral payouts tab
// ─────────────────────────────────────────────────────────
function PayoutsTab({ secret, onResolve }) {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('pending');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.adminPayouts(secret, { page, pageSize: 25, status });
      setData(res);
    } catch (e) {
      setData({ error: e.message });
    }
  }, [secret, page, status]);

  useEffect(() => { load(); }, [load]);

  async function resolve(p, newStatus) {
    let txid = null;
    let notes = null;
    if (newStatus === 'paid') {
      txid = window.prompt(`Pi A2U txid for ${p.amount_pi} π payout to @${p.username}:`);
      if (!txid) return;
    } else {
      notes = window.prompt('Reason for rejection (optional):') || null;
      if (!window.confirm(`Reject and refund ${p.amount_pi} π to @${p.username}?`)) return;
    }
    setBusy(true);
    try {
      await api.adminResolvePayout(secret, p.payout_id, newStatus, txid, notes);
      await load();
      onResolve();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (!data) return <div className="opacity-60">Loading…</div>;
  if (data.error) return <div className="text-red-300 text-sm">{data.error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Select label="Status" value={status} onChange={(v) => { setStatus(v); setPage(1); }}
          options={[
            { value: 'pending',  label: 'Pending' },
            { value: 'paid',     label: 'Paid' },
            { value: 'rejected', label: 'Rejected' },
            { value: 'all',      label: 'All' },
          ]} />
      </div>

      <div className="glass p-4 overflow-x-auto">
        {data.payouts.length === 0 ? (
          <p className="text-xs opacity-60">Nothing to show.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left opacity-70">
              <tr>
                <th className="py-1">User</th>
                <th>Email</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Requested</th>
                <th>Network</th>
                <th>Txid</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.payouts.map((p) => (
                <tr key={p.payout_id} className="border-t border-white/10">
                  <td className="py-2">@{p.username}</td>
                  <td className="text-xs opacity-80">{p.email || '—'}</td>
                  <td className="font-bold text-pi-gold">{p.amount_pi} π</td>
                  <td><StatusPill status={p.status} /></td>
                  <td className="text-xs">{p.requested_at?.slice(0, 16).replace('T', ' ')}</td>
                  <td className="text-xs">{p.network}</td>
                  <td className="text-[10px] font-mono opacity-60">
                    {p.pi_txid ? p.pi_txid.slice(0, 12) + '…' : '—'}
                  </td>
                  <td>
                    {p.status === 'pending' && (
                      <ActionButtons busy={busy}
                        onPaid={() => resolve(p, 'paid')}
                        onReject={() => resolve(p, 'rejected')}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Pagination page={page} totalPages={data.totalPages} total={data.total} onChange={setPage} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Users tab
// ─────────────────────────────────────────────────────────
function UsersTab({ secret }) {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await api.adminUsers(secret, { page, pageSize: 25, q });
      setData(res);
    } catch (e) {
      setData({ error: e.message });
    }
  }, [secret, page, q]);

  useEffect(() => { load(); }, [load]);

  function search(e) {
    e.preventDefault();
    setQ(searchInput);
    setPage(1);
  }

  if (!data) return <div className="opacity-60">Loading…</div>;
  if (data.error) return <div className="text-red-300 text-sm">{data.error}</div>;

  return (
    <div className="space-y-4">
      <form onSubmit={search} className="flex gap-2">
        <input
          type="text"
          placeholder="Search username, email or uid…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="flex-1 bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm"
        />
        <button className="btn-primary text-sm py-2 px-4">Search</button>
        {q && (
          <button
            type="button"
            onClick={() => { setSearchInput(''); setQ(''); setPage(1); }}
            className="px-3 py-2 text-sm bg-white/10 hover:bg-white/20 rounded-lg"
          >
            Clear
          </button>
        )}
      </form>

      <div className="glass p-4 overflow-x-auto">
        {data.users.length === 0 ? (
          <p className="text-xs opacity-60">No users.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left opacity-70">
              <tr>
                <th className="py-1">User</th>
                <th>Email</th>
                <th>Spend</th>
                <th>Ref code</th>
                <th>Ref bal</th>
                <th>Active ref</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {data.users.map((u) => (
                <tr key={u.uid} className="border-t border-white/10">
                  <td className="py-2">@{u.username}</td>
                  <td className="text-xs">{u.email || '—'}</td>
                  <td>{u.lifetime_spend_pi} π</td>
                  <td className="text-xs font-mono">{u.referral_code || '—'}</td>
                  <td className="text-pi-gold">{Number(u.referral_balance_pi || 0).toFixed(2)} π</td>
                  <td className="text-xs">{u.referral_activated ? '✅' : '—'}</td>
                  <td className="text-xs">{u.created_at?.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Pagination page={page} totalPages={data.totalPages} total={data.total} onChange={setPage} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Reusable little bits
// ─────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div>
      <h2 className="text-sm uppercase tracking-widest opacity-70 font-semibold mb-2">{title}</h2>
      {children}
    </div>
  );
}

function Stat({ label, value, accent = '' }) {
  return (
    <div className="glass p-4">
      <p className="text-xs opacity-70">{label}</p>
      <p className={`text-2xl font-bold ${accent}`}>{value}</p>
    </div>
  );
}

const PILL_TONES = {
  amber:   'bg-amber-500/20 text-amber-200 border-amber-400/30',
  purple:  'bg-pi-purple/20 text-purple-200 border-purple-400/30',
  emerald: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30',
};
function Pill({ label, value, tone, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-xl border text-xs font-semibold ${PILL_TONES[tone]} hover:brightness-110 transition`}
    >
      {label}: <b className="text-base">{value}</b>
    </button>
  );
}

const STATUS_PILL = {
  verifying: { label: 'Verifying', cls: 'bg-amber-500/20 text-amber-200' },
  approved:  { label: 'Approved',  cls: 'bg-emerald-500/20 text-emerald-200' },
  paid:      { label: 'Paid',      cls: 'bg-emerald-700/30 text-emerald-200' },
  rejected:  { label: 'Rejected',  cls: 'bg-red-500/20 text-red-200' },
  pending:   { label: 'Pending',   cls: 'bg-amber-500/20 text-amber-200' },
};
function StatusPill({ status }) {
  const meta = STATUS_PILL[status] || { label: status, cls: 'bg-white/10' };
  return (
    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${meta.cls}`}>
      {meta.label}
    </span>
  );
}

function ActionButtons({ busy, onPaid, onReject }) {
  return (
    <span className="space-x-1 whitespace-nowrap">
      <button
        disabled={busy}
        onClick={onPaid}
        className="px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 text-xs disabled:opacity-40"
      >
        ✓ Paid
      </button>
      <button
        disabled={busy}
        onClick={onReject}
        className="px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-200 text-xs disabled:opacity-40"
      >
        ✗ Reject
      </button>
    </span>
  );
}

function Select({ label, value, options, onChange }) {
  return (
    <label className="flex items-center gap-2 text-xs">
      <span className="opacity-70">{label}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-white/10 border border-white/10 rounded-lg px-2 py-1 text-sm"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}
