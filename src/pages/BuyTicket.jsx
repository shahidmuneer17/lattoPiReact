import { useState } from 'react';
import { useAuthCtx } from '../AuthContext';
import useCountdown, { formatDate } from '../hooks/useCountdown';
import ScratchAnimation from '../components/ScratchAnimation';

const QUICK_PICKS = [1, 5, 10, 25, 50, 100];

export default function BuyTicket() {
  const { user, login, pay } = useAuthCtx();
  const [count, setCount] = useState(5);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const cd = useCountdown();

  async function buy() {
    if (!user) return login();
    setBusy(true);
    setMessage(null);
    try {
      const result = await pay({
        amount: count,
        memo: `LattoPi tickets x${count}`,
        metadata: { kind: 'tickets', count },
      });
      setMessage(
        result.draw?.triggered
          ? `🎉 Bought ${count} tickets — and the draw fired! Winner: @${result.draw.winnerUsername}`
          : `✅ Bought ${count} tickets. Good luck on ${formatDate(cd.date)}!`
      );
    } catch (e) {
      setMessage('❌ ' + e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-4 space-y-5 relative">
      <ScratchAnimation visible={busy} />

      {/* Hero */}
      <div className="glass p-5 text-center relative overflow-hidden">
        <div className="absolute -top-6 -right-6 w-32 h-32 bg-pi-gold/20 rounded-full blur-3xl animate-float" />
        <p className="chip bg-pi-gold/20 text-pi-gold inline-block">🎟️ Monthly Draw</p>
        <h1 className="text-3xl font-black mt-2">Win 25 π</h1>
        <p className="text-xs opacity-80 mt-1">Drawn {formatDate(cd.date)} · {cd.days}d {cd.hours}h left</p>
      </div>

      {/* Quick picks */}
      <div className="glass p-5">
        <h2 className="font-semibold text-sm mb-3">Choose your shot at the jackpot</h2>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {QUICK_PICKS.map((n) => (
            <button
              key={n}
              onClick={() => setCount(n)}
              className={`py-3 rounded-xl font-bold transition active:scale-95 ${
                count === n
                  ? 'bg-pi-purple text-white shadow-[0_0_20px_rgba(124,58,237,0.5)]'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              {n} 🎟️
            </button>
          ))}
        </div>

        <label className="block text-xs opacity-70">Or enter a custom amount</label>
        <input
          type="number"
          min="1"
          value={count}
          onChange={(e) => setCount(Math.max(1, Number(e.target.value) || 1))}
          className="w-full mt-1 bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-lg"
        />

        <div className="flex justify-between items-center mt-4 text-sm">
          <span className="opacity-70">You pay</span>
          <span className="font-bold text-pi-gold text-xl">{count} π</span>
        </div>
        <p className="text-[11px] opacity-60 mt-1">
          {count} ticket{count > 1 ? 's' : ''} = {count} chance{count > 1 ? 's' : ''} at 25 π
        </p>

        <button
          onClick={buy}
          disabled={busy}
          className="btn-gold w-full mt-4 animate-pulse-glow"
        >
          {busy ? 'Processing…' : `🚀 Pay ${count} π & Enter Draw`}
        </button>
        {message && <p className="text-sm mt-3 text-center">{message}</p>}
      </div>

      {/* Buy more = win more */}
      <div className="glass p-5">
        <p className="chip bg-fuchsia-500/20 text-fuchsia-200 inline-block">🔥 Pro tip</p>
        <h3 className="font-bold mt-2">More tickets = more chances</h3>
        <p className="text-sm opacity-80 mt-1">
          There's no maximum. Buying 50 tickets gives you 50× the odds vs a single entry.
          The prize is always <b className="text-pi-gold">25 π</b> — but only one ticket wins.
          Make sure it's yours.
        </p>
      </div>
    </section>
  );
}
