// Full-screen modal for scratching a single card.
//
// States:
//   ready      → big card visual + "Scratch to reveal" button
//   scratching → 2.5s animation, API call kicked off in parallel
//   result     → win amount + party emoji  OR  "Better luck next time"
//
// The API call and the animation race against each other; we wait for the
// SLOWER of the two so the user always sees the full scratching animation
// even if the network is fast, and never sees an empty modal if the network
// is slow.
import { useEffect, useRef, useState } from 'react';
import api from '../api';
import { useTheme } from '../ThemeContext';

const SCRATCH_MS = 2500;

// Theme-aware scratch foil. Dark = gold→silver, Light = rose-gold→pearl.
const FOIL = {
  dark:  { c1: '#f5c518', c2: '#fff8c2', c3: '#c0c0c0', label: 'rgba(0,0,0,0.45)' },
  light: { c1: '#f5c5b8', c2: '#ffffff', c3: '#e8d4c8', label: 'rgba(60,30,40,0.55)' },
};

export default function CardScratchModal({ card, onClose, onResolved }) {
  const { isDark } = useTheme();
  const [phase, setPhase] = useState(card.status === 'scratched' ? 'result' : 'ready');
  const [reward, setReward] = useState(card.reward_pi);
  const [error, setError] = useState(null);
  const canvasRef = useRef(null);

  // ESC closes the modal.
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Canvas-based scratching texture for the animation phase.
  useEffect(() => {
    if (phase !== 'scratching' || !canvasRef.current) return;
    const c = canvasRef.current;
    const ctx = c.getContext('2d');
    c.width = c.offsetWidth;
    c.height = c.offsetHeight;
    // Theme-adaptive foil:
    //   Dark  → Gold → Pearl White → Silver
    //   Light → Rose Gold → Pearl White → Champagne
    const foil = isDark ? FOIL.dark : FOIL.light;
    const grad = ctx.createLinearGradient(0, 0, c.width, c.height);
    grad.addColorStop(0,    foil.c1);
    grad.addColorStop(0.5,  foil.c2);
    grad.addColorStop(1,    foil.c3);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = foil.label;
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SCRATCHING…', c.width / 2, c.height / 2 + 8);

    // Animate progressively erasing the cover.
    ctx.globalCompositeOperation = 'destination-out';
    let start = performance.now();
    let raf;
    function frame(now) {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / SCRATCH_MS);
      // Several "scratch" arcs at random positions, growing over time.
      for (let i = 0; i < 5; i++) {
        const x = (Math.sin(elapsed * 0.01 + i) * 0.5 + 0.5) * c.width;
        const y = (Math.cos(elapsed * 0.013 + i * 1.7) * 0.5 + 0.5) * c.height;
        ctx.beginPath();
        ctx.arc(x, y, 18 + t * 30, 0, Math.PI * 2);
        ctx.fill();
      }
      if (t < 1) raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [phase, isDark]);

  async function startScratch() {
    if (phase !== 'ready') return;
    setPhase('scratching');
    setError(null);

    // Run the API call and the minimum-duration timer in parallel.
    const apiPromise = api.scratch(card.card_id).catch((e) => ({ error: e.message }));
    const minDelay = new Promise((r) => setTimeout(r, SCRATCH_MS));

    const [res] = await Promise.all([apiPromise, minDelay]);
    if (res?.error) {
      setError(res.error);
      setPhase('ready');
      return;
    }
    setReward(Number(res.card.reward_pi));
    setPhase('result');
    onResolved?.(res.card);
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm animate-flip-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-10 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 text-white text-lg flex items-center justify-center"
          aria-label="Close"
        >
          ×
        </button>

        {/* Card body — gradient differs slightly per theme so the bezels match */}
        <div
          className={`rounded-3xl overflow-hidden shadow-2xl animate-gradient bg-gradient-to-br ${
            isDark
              ? 'from-purple-700 via-fuchsia-700 to-amber-500'
              : 'from-rose-200 via-fuchsia-200 to-amber-200'
          }`}
        >
          <div className={`p-5 text-center ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <p className={`chip inline-block mb-2 ${isDark ? 'bg-black/30 text-white' : 'bg-white/60 text-slate-800'}`}>
              ⚡ Scratch Card
            </p>
            <p className="text-[10px] opacity-70 font-mono">#{card.card_id.slice(0, 8)}</p>
          </div>

          {/* Reveal area */}
          <div
            className={`mx-5 mb-5 aspect-[4/3] rounded-2xl border relative overflow-hidden ${
              isDark
                ? 'bg-gradient-to-br from-slate-900 to-purple-900 border-white/20 text-white'
                : 'bg-gradient-to-br from-slate-50 to-rose-50 border-rose-200 text-slate-900'
            }`}
          >
            {/* The reveal underneath the scratch cover */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
              {phase === 'ready' && (
                <>
                  <div className="text-6xl mb-2 animate-float">🎁</div>
                  <p className="text-sm opacity-80">Tap the button below to reveal</p>
                </>
              )}
              {phase === 'scratching' && (
                <>
                  <div className="text-6xl mb-2 animate-float">✨</div>
                  <p className="text-sm opacity-90">Hold tight…</p>
                </>
              )}
              {phase === 'result' && reward > 0 && (
                <>
                  <div className="text-6xl mb-1 animate-float">🎉</div>
                  <p className="text-[10px] uppercase tracking-widest opacity-80">You won</p>
                  <p className="text-5xl font-black animate-shimmer">{reward} π</p>
                  <p className="text-[10px] opacity-70 mt-2">Verifying — see your wallet history</p>
                </>
              )}
              {phase === 'result' && reward === 0 && (
                <>
                  <div className="text-6xl mb-2 grayscale opacity-60">🍀</div>
                  <p className="font-bold text-lg">Better luck next time</p>
                  <p className="text-xs opacity-70 mt-1">Try another card — your win is one tap away.</p>
                </>
              )}
            </div>

            {/* Scratching cover canvas (only mounted during scratching phase) */}
            {phase === 'scratching' && (
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
              />
            )}
          </div>

          {/* Action button */}
          <div className="px-5 pb-5 space-y-2">
            {phase === 'ready' && (
              <button onClick={startScratch} className="btn-gold w-full animate-pulse-glow text-base">
                🎰 Scratch to Reveal
              </button>
            )}
            {phase === 'scratching' && (
              <button disabled className="btn-gold w-full opacity-80">
                Scratching…
              </button>
            )}
            {phase === 'result' && (
              <button onClick={onClose} className="btn-primary w-full">
                Close
              </button>
            )}
            {error && (
              <p className="text-xs text-red-700 dark:text-red-300 text-center">{error}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
