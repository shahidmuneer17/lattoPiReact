import { useEffect, useState, useCallback } from 'react';
import { useAuthCtx } from '../AuthContext';
import useCountdown, { formatDate } from '../hooks/useCountdown';
import api from '../api';
import ScratchAnimation from '../components/ScratchAnimation';
import TicketStub from '../components/TicketStub';

const TICKET_PRICE = 0.5; // must match backend config (ticket_price_pi)
const QUICK_PICKS = [2, 10, 20, 50, 100, 200];

export default function BuyTicket() {
  const { user, login, pay } = useAuthCtx();
  const [count, setCount] = useState(10);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [tickets, setTickets] = useState([]);
  const cd = useCountdown();

  const reload = useCallback(() => {
    if (!user) return;
    api.me().then((d) => setTickets(d.tickets || [])).catch(() => {});
  }, [user]);

  useEffect(() => { reload(); }, [reload]);

  async function buy() {
    if (!user) return login();
    setBusy(true);
    setMessage(null);
    const cost = +(count * TICKET_PRICE).toFixed(4);
    try {
      const result = await pay({
        amount: cost,
        memo: `LattoPi tickets x${count}`,
        metadata: { kind: 'tickets', count },
      });
      setMessage(`✅ Bought ${count} ticket${count > 1 ? 's' : ''}. Good luck on ${formatDate(cd.date)}!`);
      await reload();
      // Scroll the new tickets into view
      setTimeout(() => {
        document.getElementById('active-tickets')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
    } catch (e) {
      setMessage('❌ ' + e.message);
    } finally {
      setBusy(false);
    }
  }

  const cost = +(count * TICKET_PRICE).toFixed(4);
  const activeTickets = tickets.filter((t) => t.status === 'active');

  return (
    <section className="mt-4 space-y-5 relative">
      <ScratchAnimation visible={busy} />

      {/* Hero */}
      <div className="glass p-5 text-center relative overflow-hidden">
        <div className="absolute -top-6 -right-6 w-32 h-32 bg-pi-gold/20 rounded-full blur-3xl animate-float" />
        <p className="chip bg-pi-gold/20 text-pi-gold inline-block">🎟️ Monthly Draw</p>
        <h1 className="text-3xl font-black mt-2">Win 10,000 π</h1>
        <p className="text-xs opacity-80 mt-1">Drawn {formatDate(cd.date)} · {cd.days}d {cd.hours}h left</p>
      </div>

      {/* Quick picks */}
      <div className="glass p-5">
        <h2 className="font-semibold text-sm mb-1">Choose your shot at the jackpot</h2>
        <p className="text-[11px] opacity-60 mb-3">Each ticket costs <b>{TICKET_PRICE} π</b></p>
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

        <label className="block text-xs opacity-70">Or enter a custom number of tickets</label>
        <input
          type="number"
          min="1"
          value={count}
          onChange={(e) => setCount(Math.max(1, Number(e.target.value) || 1))}
          className="w-full mt-1 bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-lg"
        />

        <div className="flex justify-between items-center mt-4 text-sm">
          <span className="opacity-70">{count} ticket{count > 1 ? 's' : ''} × {TICKET_PRICE} π</span>
          <span className="font-bold text-pi-gold text-xl">{cost} π</span>
        </div>
        <p className="text-[11px] opacity-60 mt-1">
          {count} chance{count > 1 ? 's' : ''} at the <b className="text-pi-gold">10,000 π</b> jackpot
        </p>

        <button
          onClick={buy}
          disabled={busy}
          className="btn-gold w-full mt-4 animate-pulse-glow"
        >
          {busy ? 'Processing…' : `🚀 Pay ${cost} π & Enter Draw`}
        </button>
        {message && <p className="text-sm mt-3 text-center">{message}</p>}
      </div>

      {/* Active tickets */}
      {activeTickets.length > 0 && (
        <div id="active-tickets">
          <p className="chip bg-emerald-500/20 text-emerald-200 inline-block mb-3">
            🎟️ {activeTickets.length} active ticket{activeTickets.length > 1 ? 's' : ''}
          </p>
          <div className="space-y-3">
            {activeTickets.map((t, i) => (
              <TicketStub key={t.ticket_id} ticket={t} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Buy more = win more */}
      <div className="glass p-5">
        <p className="chip bg-fuchsia-500/20 text-fuchsia-200 inline-block">🔥 Pro tip</p>
        <h3 className="font-bold mt-2">More tickets = more chances</h3>
        <p className="text-sm opacity-80 mt-1">
          There's no maximum. Buying 100 tickets gives you 100× the odds vs a single entry.
          The prize is always <b className="text-pi-gold">10,000 π</b> — but only one ticket wins.
          Make sure it's yours.
        </p>
      </div>
    </section>
  );
}
