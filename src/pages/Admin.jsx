// Lightweight admin console — replace the secret-based gate with Cognito or
// magic-link auth before going live (see NEXT_STEPS.md).
import { useEffect, useState } from 'react';
import api from '../api';

export default function Admin() {
  const [secret, setSecret] = useState(sessionStorage.getItem('admin_secret') || '');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState('');

  async function load(s) {
    try {
      const [st, us] = await Promise.all([api.adminStats(s), api.adminUsers(s)]);
      setStats(st);
      setUsers(us.users || []);
    } catch (e) {
      setMessage(e.message);
    }
  }

  useEffect(() => {
    if (secret) load(secret);
  }, [secret]);

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

      <div className="glass p-4">
        <h3 className="font-semibold mb-2">Manual Draw</h3>
        <button onClick={triggerDraw} className="btn-primary">Trigger Current Draw</button>
        {message && <p className="text-sm mt-2">{message}</p>}
      </div>

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
