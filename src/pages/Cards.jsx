import { useEffect, useState, useCallback } from 'react';
import { useAuthCtx } from '../AuthContext';
import api from '../api';

export default function Cards() {
  const { user, login, pay } = useAuthCtx();
  const [count, setCount] = useState(1);
  const [busy, setBusy] = useState(false);
  const [cards, setCards] = useState([]);

  const reload = useCallback(() => {
    if (!user) return;
    api.me().then((d) => setCards(d.cards || [])).catch(() => {});
  }, [user]);

  useEffect(() => { reload(); }, [reload]);

  async function buy() {
    if (!user) return login();
    setBusy(true);
    try {
      await pay({
        amount: count,
        memo: `LattoPi scratch cards x${count}`,
        metadata: { kind: 'cards', count },
      });
      await reload();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function reveal(card) {
    const res = await api.scratch(card.card_id);
    setCards((cs) => cs.map((c) => (c.card_id === card.card_id ? res.card : c)));
  }

  return (
    <section className="mt-4 space-y-4">
      <div className="glass p-5">
        <h2 className="font-semibold text-lg">Scratch Cards</h2>
        <p className="text-xs opacity-70 mt-1">1 π per card. Buy 1–10 at a time.</p>
        <input
          type="number"
          min="1"
          max="10"
          value={count}
          onChange={(e) => setCount(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
          className="w-full mt-3 bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-lg"
        />
        <button onClick={buy} disabled={busy} className="btn-primary w-full mt-3">
          {busy ? 'Processing…' : `Buy for ${count} π`}
        </button>
      </div>

      {cards.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {cards.map((c) => (
            <div key={c.card_id} className="glass p-3 text-center">
              {c.status === 'unscratched' ? (
                <button
                  onClick={() => reveal(c)}
                  className="aspect-square w-full rounded-xl bg-pi-purple flex items-center justify-center font-bold text-pi-gold"
                >
                  SCRATCH
                </button>
              ) : (
                <div className="aspect-square w-full rounded-xl bg-white/10 flex flex-col items-center justify-center">
                  <span className="text-xs opacity-70">Reward</span>
                  <span className="text-2xl font-bold text-pi-gold">{c.reward_pi} π</span>
                </div>
              )}
              <p className="text-xs mt-2 opacity-60">{c.card_id.slice(0, 8)}…</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
