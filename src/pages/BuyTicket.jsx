import { useState } from 'react';
import { useAuthCtx } from '../AuthContext';
import ScratchAnimation from '../components/ScratchAnimation';

export default function BuyTicket() {
  const { user, login, pay } = useAuthCtx();
  const [count, setCount] = useState(1);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  async function buy() {
    if (!user) return login();
    setBusy(true);
    setMessage(null);
    try {
      const result = await pay({
        amount: count, // 1 π per ticket
        memo: `LattoPi tickets x${count}`,
        metadata: { kind: 'tickets', count },
      });
      setMessage(
        result.draw?.triggered
          ? `Bought ${count} tickets — draw fired! Winner: @${result.draw.winnerUsername}`
          : `Bought ${count} tickets for draw ${result.tickets?.[0]?.draw_id || ''}`
      );
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-4 space-y-4 relative">
      <ScratchAnimation visible={busy} />
      <div className="glass p-5">
        <h2 className="font-semibold text-lg">Buy Lottery Tickets 🎫</h2>
        <p className="text-xs opacity-70 mt-1">1 π per ticket. Numbers auto-generated.</p>
        <label className="block mt-4 text-xs opacity-70">Number of tickets</label>
        <input
          type="number"
          min="1"
          max="100"
          value={count}
          onChange={(e) => setCount(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
          className="w-full mt-1 bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-lg"
        />
        <button onClick={buy} disabled={busy} className="btn-primary w-full mt-4">
          {busy ? 'Processing…' : `Pay ${count} π`}
        </button>
        {message && <p className="text-sm mt-3 opacity-90">{message}</p>}
      </div>
    </section>
  );
}
