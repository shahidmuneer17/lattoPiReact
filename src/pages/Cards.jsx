import { useEffect, useState, useCallback } from 'react';
import { useAuthCtx } from '../AuthContext';
import api from '../api';

const QUICK_PICKS = [1, 3, 5, 10];

export default function Cards() {
  const { user, login, pay } = useAuthCtx();
  const [count, setCount] = useState(3);
  const [busy, setBusy] = useState(false);
  const [cards, setCards] = useState([]);
  const [popup, setPopup] = useState(null); // { reward }

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
    if (res.card.reward_pi > 0) {
      setPopup({ reward: res.card.reward_pi });
      setTimeout(() => setPopup(null), 3500);
    }
  }

  const unscratched = cards.filter((c) => c.status === 'unscratched');
  const scratched = cards.filter((c) => c.status === 'scratched');

  return (
    <section className="mt-4 space-y-5 relative">
      {/* Win popup */}
      {popup && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm pointer-events-none">
          <div className="text-center animate-flip-in">
            <div className="text-6xl mb-2 animate-float">🎉</div>
            <p className="text-xs uppercase tracking-widest opacity-80">You won</p>
            <p className="text-7xl font-black animate-shimmer">{popup.reward} π</p>
          </div>
        </div>
      )}

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl p-6 text-center
                      bg-gradient-to-br from-fuchsia-700 via-purple-700 to-amber-500
                      animate-gradient shadow-2xl">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-yellow-300/20 rounded-full blur-3xl animate-float" />
        <p className="chip bg-black/30 inline-block">⚡ INSTANT WIN</p>
        <h1 className="text-3xl font-black mt-2">Scratch Cards</h1>
        <p className="text-sm opacity-90 mt-1">Reveal up to <b className="text-pi-gold">25 π</b> per card. Right now.</p>
      </div>

      {/* Buy panel */}
      <div className="glass p-5">
        <h2 className="font-semibold text-sm mb-3">How many cards?</h2>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {QUICK_PICKS.map((n) => (
            <button
              key={n}
              onClick={() => setCount(n)}
              className={`py-3 rounded-xl font-bold transition active:scale-95 ${
                count === n
                  ? 'bg-fuchsia-600 text-white shadow-[0_0_20px_rgba(217,70,239,0.5)]'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              {n}×
            </button>
          ))}
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="opacity-70">You pay</span>
          <span className="font-bold text-pi-gold text-xl">{count} π</span>
        </div>
        <button
          onClick={buy}
          disabled={busy}
          className="btn-gold w-full mt-4 animate-pulse-glow"
        >
          {busy ? 'Processing…' : `🎰 Pay ${count} π & Reveal`}
        </button>
      </div>

      {/* Unscratched arena */}
      {unscratched.length > 0 && (
        <div>
          <p className="chip bg-pi-gold/20 text-pi-gold inline-block mb-3">⚡ {unscratched.length} ready to scratch</p>
          <div className="grid grid-cols-2 gap-3">
            {unscratched.map((c, i) => (
              <button
                key={c.card_id}
                onClick={() => reveal(c)}
                style={{ animationDelay: `${i * 60}ms` }}
                className="aspect-square rounded-2xl relative overflow-hidden group active:scale-95 transition animate-flip-in"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-fuchsia-600 to-amber-500 animate-gradient" />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-4xl mb-1 animate-float">🎁</div>
                  <span className="font-bold tracking-wider text-sm">SCRATCH</span>
                  <span className="text-[10px] opacity-80 mt-1">tap to reveal</span>
                </div>
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Scratched history */}
      {scratched.length > 0 && (
        <div>
          <p className="chip bg-white/10 inline-block mb-3">🎟️ {scratched.length} revealed</p>
          <div className="grid grid-cols-2 gap-3">
            {scratched.map((c) => (
              <div
                key={c.card_id}
                className={`aspect-square rounded-2xl flex flex-col items-center justify-center relative overflow-hidden ${
                  c.reward_pi > 0
                    ? 'bg-gradient-to-br from-yellow-500/30 to-amber-600/30 border border-pi-gold/40'
                    : 'bg-white/5 border border-white/10'
                }`}
              >
                {c.reward_pi > 0 && (
                  <div className="absolute -top-4 -right-4 w-16 h-16 bg-pi-gold/20 rounded-full blur-2xl" />
                )}
                <span className="text-[10px] uppercase opacity-70">
                  {c.reward_pi > 0 ? 'You won' : 'No win'}
                </span>
                <span className={`text-2xl font-black ${c.reward_pi > 0 ? 'text-pi-gold' : 'opacity-50'}`}>
                  {c.reward_pi > 0 ? `${c.reward_pi} π` : '0 π'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {cards.length === 0 && (
        <div className="glass p-6 text-center opacity-80">
          <div className="text-4xl mb-2 animate-float">🎁</div>
          <p className="text-sm">No cards yet. Buy your first one above and reveal instantly!</p>
        </div>
      )}
    </section>
  );
}
