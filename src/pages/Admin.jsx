// Lightweight admin console — replace the secret-based gate with Cognito or
// magic-link auth before going live (see NEXT_STEPS.md).
import { useEffect, useState, useCallback } from 'react';
import api from '../api';

export default function Admin() {
  const [secret, setSecret] = useState(sessionStorage.getItem('admin_secret') || '');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [payouts, setPayouts] = useState({ pending: [], recent: [] });
  const [message, setMessage] = useState('');

  const load = useCallback(async (s) => {
    try {
      const [st, us, po] = await Promise.all([
        api.adminStats(s),
        api.adminUsers(s),
        api.adminPayouts(s),
      ]);
      setStats(st);
      setUsers(us.users || []);
      setPayouts(po);
    } catch (e) {
      setMessage(e.message);
    }
  }, []);

  useEffect(() => {
    if (secret) load(secret);
  }, [secret, load]);

  function submit(e) {
    e.preventDefault();
    sessionStorage.setItem('admin_secret', secret);
    load(secret);
  }

  async function triggerDraw() {
    try {
      const res = await api.adminDraw(secret);
      setMessage(res.ok ? `Winner: @${res.winnerUsername}` : res.reason);
      load(secret);
    } catch (e) {
      setMessage(e.message);
    }
  }

  async function resolvePayout(p, status) {
    let txid = null;
    let notes = null;
    if (status === 'paid') {
      txid = window.prompt(`Enter Pi txid for ${p.amount_pi} π payout to @${p.username}:`);
      if (!txid) return;
    } else {
      notes = window.prompt('Reason for rejection (optional):') || null;
      if (!window.confirm(`Reject and refund ${p.amount_pi} π to @${p.username}?`)) return;
    }
    try {
      await api.adminResolvePayout(secret, p.payout_id, status, txid, notes);
      load(secret);
    } catch (e) {
      alert(e.message);
    }
  }

  if (!stats) {
    return (
      <form onSubmit={submit} className="glass max-w-sm mx-auto mt-10 p-6 space-y-3">
        <h2 className="font-semibold">Admin Login</h2>
        <input
          type="password"
          placeholder="ADMIN_SECRET"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3"
        />
        <button className="btn-primary w-full">Continue</button>
        {message && <p className="text-xs text-red-300">{message}</p>}
      </form>
    );
  }

  return (
    <section className="mt-4 space-y-4">
      <h2 className="text-xl font-bold">Treasury</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Stat label="Total Revenue" value={`${stats.totalRevenuePi} π`} />
        <Stat label="Platform (75%)" value={`${stats.platformSharePi} π`} accent="text-emerald-300" />
        <Stat label="Prize Pool (25%)" value={`${stats.prizePoolPi} π`} accent="text-pi-gold" />
        <Stat label="Users" value={stats.users} />
        <Stat label="Tickets sold" value={stats.ticketsSold} />
        <Stat label="Cards sold" value={stats.cardsSold} />
      </div>

      <h2 className="text-xl font-bold mt-6">Referral programme</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Active referrers" value={stats.activeReferrers ?? 0} />
        <Stat label="Owed (balances)" value={`${(stats.referralBalanceOwedPi ?? 0).toFixed(2)} π`} accent="text-pi-gold" />
        <Stat label="Pending payouts" value={`${(stats.referralPendingPayoutsPi ?? 0).toFixed(2)} π`} accent="text-amber-300" />
        <Stat label="Lifetime paid" value={`${(stats.referralPaidTotalPi ?? 0).toFixed(2)} π`} accent="text-emerald-300" />
      </div>

      <div className="glass p-4">
        <h3 className="font-semibold mb-2">Manual Draw</h3>
        <button onClick={triggerDraw} className="btn-primary">Trigger Current Draw</button>
        {message && <p className="text-sm mt-2">{message}</p>}
      </div>

      <div className="glass p-4 overflow-x-auto">
        <h3 className="font-semibold mb-2">
          Pending payouts ({payouts.pending.length})
        </h3>
        {payouts.pending.length === 0 ? (
          <p className="text-xs opacity-60">Nothing pending.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left opacity-70">
              <tr><th>User</th><th>Email</th><th>Amount</th><th>Requested</th><th>Network</th><th></th></tr>
            </thead>
            <tbody>
              {payouts.pending.map((p) => (
                <tr key={p.payout_id} className="border-t border-white/10">
                  <td className="py-2">@{p.username}</td>
                  <td className="text-xs opacity-80">{p.email || '—'}</td>
                  <td className="font-bold text-pi-gold">{p.amount_pi} π</td>
                  <td className="text-xs">{p.requested_at?.slice(0, 10)}</td>
                  <td className="text-xs">{p.network}</td>
                  <td className="space-x-1">
                    <button
                      onClick={() => resolvePayout(p, 'paid')}
                      className="px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 text-xs"
                    >
                      Mark paid
                    </button>
                    <button
                      onClick={() => resolvePayout(p, 'rejected')}
                      className="px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-200 text-xs"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {payouts.recent.length > 0 && (
        <div className="glass p-4 overflow-x-auto">
          <h3 className="font-semibold mb-2">Recently resolved payouts</h3>
          <table className="w-full text-sm">
            <thead className="text-left opacity-70">
              <tr><th>User</th><th>Amount</th><th>Status</th><th>txid</th><th>Resolved</th></tr>
            </thead>
            <tbody>
              {payouts.recent.map((p) => (
                <tr key={p.payout_id} className="border-t border-white/10">
                  <td className="py-2">@{p.username}</td>
                  <td>{p.amount_pi} π</td>
                  <td>
                    <span className={p.status === 'paid' ? 'text-emerald-300' : 'text-red-300'}>
                      {p.status}
                    </span>
                  </td>
                  <td className="text-xs font-mono opacity-80">{p.pi_txid?.slice(0, 16) || '—'}</td>
                  <td className="text-xs">{p.resolved_at?.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="glass p-4 overflow-x-auto">
        <h3 className="font-semibold mb-2">Users ({users.length})</h3>
        <table className="w-full text-sm">
          <thead className="text-left opacity-70">
            <tr><th>Pi user</th><th>Email</th><th>Spend</th><th>Joined</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.uid} className="border-t border-white/10">
                <td className="py-2">@{u.username}</td>
                <td>{u.email || '—'}</td>
                <td>{u.lifetime_spend_pi} π</td>
                <td>{u.created_at?.slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
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
