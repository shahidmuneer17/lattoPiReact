import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthCtx } from '../AuthContext';
import api from '../api';
import ReferralCard from '../components/ReferralCard';

export default function Profile() {
  const { user, setUser, logout } = useAuthCtx();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [stats, setStats] = useState({ tickets: 0, cards: 0, won: 0 });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    setEmail(user.email || '');
    api.me()
      .then((d) => {
        const tickets = d.tickets || [];
        const cards = d.cards || [];
        const won =
          tickets.filter((t) => t.is_winner).length +
          cards.filter((c) => Number(c.reward_pi) > 0).length;
        setStats({ tickets: tickets.length, cards: cards.length, won });
      })
      .catch(() => {});
  }, [user, navigate]);

  if (!user) return null;

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const { user: u } = await api.updateProfile(email);
      setUser(u);
      setMessage('✅ Saved');
    } catch (e) {
      setMessage('❌ ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    logout();
    navigate('/', { replace: true });
  }

  return (
    <section className="mt-4 space-y-5 max-w-md mx-auto">
      {/* Identity card */}
      <div className="glass p-6 text-center relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-pi-purple/30 rounded-full blur-3xl animate-float" />
        <div className="relative">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-pi-purple to-pi-gold flex items-center justify-center text-3xl font-black animate-pulse-glow">
            {user.username?.[0]?.toUpperCase() || 'π'}
          </div>
          <h2 className="mt-3 text-xl font-bold">@{user.username}</h2>
          <p className="text-[11px] opacity-60 mt-1">UID: {user.uid?.slice(0, 12)}…</p>
          <p className="text-[11px] opacity-60">
            Member since {user.created_at?.slice(0, 10)}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="Tickets" value={stats.tickets} />
        <Stat label="Cards" value={stats.cards} />
        <Stat label="Wins" value={stats.won} accent="text-pi-gold" />
      </div>
      <div className="glass p-4 text-center">
        <p className="text-xs opacity-70">Lifetime spend</p>
        <p className="text-2xl font-bold text-pi-gold">{user.lifetime_spend_pi || 0} π</p>
      </div>

      {/* Email — explicitly opt-in */}
      <div className="glass p-5">
        <h3 className="font-semibold">Email notifications</h3>
        <p className="text-xs opacity-70 mt-1">
          Pi Network <b>does not share your email with apps</b>. Add it here if you want us to
          notify you when you win a draw or when a draw fires early. You can clear it anytime.
        </p>
        <input
          type="email"
          inputMode="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mt-3 bg-white/10 border border-white/10 rounded-xl px-4 py-3"
        />
        <button onClick={save} disabled={saving} className="btn-primary w-full mt-3">
          {saving ? 'Saving…' : 'Save email'}
        </button>
        {message && <p className="text-xs mt-2 text-center">{message}</p>}
      </div>

      {/* Referral programme */}
      <ReferralCard />

      {/* Logout */}
      <div className="glass p-5">
        <h3 className="font-semibold">Sign out</h3>
        <p className="text-xs opacity-70 mt-1">
          You'll need to authenticate with the Pi Browser again to play.
        </p>
        <button
          onClick={handleLogout}
          className="w-full mt-3 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 text-red-200 font-semibold py-3 rounded-xl transition"
        >
          Sign out
        </button>
      </div>
    </section>
  );
}

function Stat({ label, value, accent = '' }) {
  return (
    <div className="glass p-3">
      <div className={`text-2xl font-bold ${accent}`}>{value}</div>
      <div className="text-[10px] uppercase opacity-70">{label}</div>
    </div>
  );
}
