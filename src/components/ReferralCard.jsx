// Self-contained referral card. Loads its own data from /referral-stats so
// the parent (Profile.jsx) doesn't need to know the shape.
import { useEffect, useState, useCallback } from 'react';
import api from '../api';

const KIND_LABEL = {
  spend:    { icon: '🎟️', label: 'Ticket spend' },
  win_card: { icon: '🎰', label: 'Card win'     },
  win_draw: { icon: '🏆', label: 'Draw win'     },
};

export default function ReferralCard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [copyMsg, setCopyMsg] = useState('');

  const load = useCallback(() => {
    api.referralStats()
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (error) {
    return (
      <div className="glass p-5 text-sm text-red-700 dark:text-red-200">
        Failed to load referral info: {error}
      </div>
    );
  }
  if (!data) return <div className="glass p-5 text-sm opacity-60">Loading referral info…</div>;

  const canCashOut = data.balance_pi >= data.min_payout_pi;

  async function copy() {
    try {
      await navigator.clipboard.writeText(data.share_url);
      setCopyMsg('Copied!');
      setTimeout(() => setCopyMsg(''), 1500);
    } catch {
      setCopyMsg('Copy failed');
    }
  }

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'LattoPi — Win 10,000 π',
          text: 'Join me on LattoPi and win up to 10,000 π in the monthly draw!',
          url: data.share_url,
        });
      } catch {}
    } else {
      copy();
    }
  }

  async function cashOut() {
    setBusy(true);
    try {
      await api.referralPayout();
      load();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="glass p-5 space-y-4 relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-pi-gold/20 rounded-full blur-3xl animate-float" />

      <div className="relative">
        <p className="chip bg-pi-gold/20 text-pi-gold inline-block">🎁 Referral programme</p>
        <h3 className="font-bold text-lg mt-2">Earn 1% on every friend you invite</h3>
        <p className="text-xs opacity-80 mt-1">
          Share your link. When a friend joins and spends {data.activation_threshold_pi} π on
          tickets you start earning <b>1%</b> of every ticket they buy and every prize they win —
          forever.
        </p>
      </div>

      {/* Share link — surface-dim adapts to light/dark, no hardcoded black */}
      <div className="relative surface-dim border border-white/10 rounded-xl p-3">
        <p className="text-[10px] uppercase opacity-60">Your share link</p>
        <p className="font-mono text-xs break-all mt-1">{data.share_url}</p>
        <div className="flex gap-2 mt-3">
          <button onClick={copy} className="flex-1 btn-primary text-sm py-2">
            {copyMsg || 'Copy'}
          </button>
          <button onClick={share} className="flex-1 btn-primary text-sm py-2">
            Share
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Friends invited" value={data.stats.total_referrals} />
        <Stat label="Active" value={data.stats.active_referrals} accent="text-emerald-700 dark:text-emerald-300" />
        <Stat label="Lifetime earned" value={`${data.stats.lifetime_earned_pi.toFixed(2)} π`} accent="text-pi-gold" />
        <Stat label="Available now" value={`${data.balance_pi.toFixed(2)} π`} accent="text-pi-gold" />
      </div>

      {/* Cash out */}
      <div>
        <button
          onClick={cashOut}
          disabled={!canCashOut || busy}
          className="btn-gold w-full"
        >
          {busy
            ? 'Processing…'
            : canCashOut
              ? `💸 Cash out ${data.balance_pi.toFixed(2)} π`
              : `Cash out (min ${data.min_payout_pi} π)`}
        </button>
        <p className="text-[10px] opacity-60 mt-2 text-center">
          Cash-outs are processed manually within a few days, paid to your Pi wallet.
        </p>
      </div>

      {/* Recent activity */}
      {data.recent.length > 0 && (
        <div>
          <p className="text-[10px] uppercase opacity-60 mb-2">Recent commissions</p>
          <ul className="space-y-1">
            {data.recent.map((e, i) => {
              const meta = KIND_LABEL[e.kind] || { icon: '✨', label: e.kind };
              return (
                <li key={i} className="flex items-center justify-between text-xs bg-white/5 rounded-lg px-3 py-2">
                  <span className="flex items-center gap-2">
                    <span>{meta.icon}</span>
                    <span className="opacity-80">{meta.label}</span>
                    {e.referred_username && (
                      <span className="opacity-50">@{e.referred_username}</span>
                    )}
                  </span>
                  <span className="font-bold text-pi-gold">+{Number(e.commission_pi).toFixed(2)} π</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent = '' }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
      <div className={`text-xl font-bold ${accent}`}>{value}</div>
      <div className="text-[10px] uppercase opacity-70 mt-1">{label}</div>
    </div>
  );
}
