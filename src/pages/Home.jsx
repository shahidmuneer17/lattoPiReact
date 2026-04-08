import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthCtx } from '../AuthContext';
import useCountdown, { formatDate } from '../hooks/useCountdown';

export default function Home() {
  const { login, loading, user, error } = useAuthCtx();
  const navigate = useNavigate();
  const cd = useCountdown();
  const [sdkReady, setSdkReady] = useState(!!window.Pi);
  const [pendingRef, setPendingRef] = useState(null);

  useEffect(() => {
    setPendingRef(localStorage.getItem('lattopi_ref'));
    if (sdkReady) return;
    const id = setInterval(() => {
      if (window.Pi) { setSdkReady(true); clearInterval(id); }
    }, 250);
    return () => clearInterval(id);
  }, [sdkReady]);

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  return (
    <div className="space-y-8 mt-2 pb-8">
      {/* ───── Hero ───── */}
      <div className="relative overflow-hidden rounded-3xl p-7 text-center
                      bg-gradient-to-br from-purple-700 via-fuchsia-700 to-amber-500
                      animate-gradient shadow-2xl">
        <div className="absolute -top-12 -right-12 w-44 h-44 bg-yellow-300/20 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-12 -left-12 w-44 h-44 bg-purple-300/20 rounded-full blur-3xl animate-float" />

        <div className="text-5xl mb-2 animate-float">🎯</div>
        <h1 className="text-4xl font-black tracking-tight">LattoPi</h1>
        <p className="mt-1 text-sm opacity-90">The Pi Network's lottery & instant-win platform</p>

        <div className="mt-6">
          <p className="text-xs uppercase tracking-[0.25em] opacity-80">Win this month</p>
          <div className="text-6xl font-black animate-shimmer leading-none">10,000 π</div>
          <p className="mt-2 text-xs opacity-90">Drawn {formatDate(cd.date)}</p>
        </div>

        <button
          onClick={login}
          disabled={loading || !sdkReady}
          className="mt-6 w-full btn-gold animate-pulse-glow text-base"
        >
          {loading ? 'Connecting…' : '🚀 Login with Pi & Play'}
        </button>

        {/* SDK status */}
        <div className="mt-3 text-[11px] opacity-80">
          Pi SDK:{' '}
          <span className={sdkReady ? 'text-emerald-300' : 'text-red-300'}>
            {sdkReady ? 'ready' : 'not detected'}
          </span>
          {!sdkReady && (
            <p className="mt-1 text-red-200">
              Open this in the <b>Pi Browser</b> app to play.
            </p>
          )}
        </div>

        {pendingRef && (
          <div className="mt-4 text-xs bg-emerald-500/10 border border-emerald-400/30 rounded-lg p-3 text-emerald-200">
            🎁 You've been invited by a friend! Sign in and play — once you've spent
            10 π on tickets your friend earns 1% on every future ticket and win.
          </div>
        )}

        {error && (
          <div className="mt-4 text-left text-xs bg-red-500/10 border border-red-400/30 rounded-lg p-3 text-red-200 break-words">
            <p className="font-semibold mb-1">Login failed</p>
            <p>{error}</p>
          </div>
        )}
      </div>

      {/* ───── Why play ───── */}
      <div>
        <h2 className="text-center text-lg font-bold mb-3">Why LattoPi?</h2>
        <div className="grid grid-cols-2 gap-3">
          <Feature emoji="💎" title="Real Pi prize" body="Win up to 10,000 π straight to your wallet." />
          <Feature emoji="⚡" title="Instant cards"  body="Don't want to wait? Scratch a card and win on the spot." />
          <Feature emoji="🎯" title="Provably fair" body="Every draw is cryptographically verifiable. No tricks." />
          <Feature emoji="♾️" title="No limits"     body="Buy 1 ticket or 1,000 — more entries, more chances." />
        </div>
      </div>

      {/* ───── How it works ───── */}
      <div className="glass p-5">
        <h2 className="text-lg font-bold mb-3">How it works</h2>
        <ol className="space-y-3 text-sm">
          <Step n="1" title="Login with Pi"   body="Authenticate with your Pi Browser account in one tap." />
          <Step n="2" title="Buy tickets"     body="Each ticket is just 0.5 π. Stack as many as you want — there's no cap." />
          <Step n="3" title="Wait for the draw" body="The draw fires once a minimum number of tickets are sold — sometimes earlier than the month-end. We'll email everyone." />
          <Step n="4" title="Or scratch & win" body="Skip the wait — open instant cards for on-the-spot rewards." />
        </ol>
      </div>

      {/* ───── Big CTA ───── */}
      <div className="glass p-5 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-pi-purple/20 via-transparent to-pi-gold/20 animate-gradient" />
        <div className="relative">
          <p className="text-xs uppercase tracking-widest opacity-70">Buy more, win more</p>
          <p className="mt-2 font-bold text-lg">More tickets = more chances at 10,000 π.</p>
          <p className="text-xs opacity-80 mt-1">No max. No catch. Just more shots at the prize.</p>
          <button
            onClick={login}
            disabled={loading || !sdkReady}
            className="mt-4 btn-gold inline-block"
          >
            {loading ? 'Connecting…' : 'Get Started →'}
          </button>
        </div>
      </div>

      {/* ───── Referral programme ───── */}
      <div className="relative overflow-hidden rounded-3xl p-6
                      bg-gradient-to-br from-emerald-700 via-fuchsia-700 to-amber-500
                      animate-gradient shadow-2xl">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-yellow-300/20 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-300/20 rounded-full blur-3xl animate-float" />

        <div className="relative">
          <div className="flex items-center gap-2">
            <span className="chip bg-black/30">🎁 Referral Programme</span>
            <span className="chip bg-pi-gold/30 text-pi-gold">Earn forever</span>
          </div>
          <h2 className="mt-3 text-2xl font-black leading-tight">
            Invite a friend.<br />
            Earn <span className="text-pi-gold animate-shimmer">1% forever</span>.
          </h2>
          <p className="mt-3 text-sm opacity-90 leading-relaxed">
            Share your unique link. When your friend signs up and starts playing, you earn:
          </p>

          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="bg-black/30 backdrop-blur rounded-xl p-3">
              <div className="text-2xl">🎟️</div>
              <p className="text-[10px] uppercase opacity-70 mt-1">Ticket spend</p>
              <p className="text-sm font-bold">1% of every ticket</p>
            </div>
            <div className="bg-black/30 backdrop-blur rounded-xl p-3">
              <div className="text-2xl">🏆</div>
              <p className="text-[10px] uppercase opacity-70 mt-1">When they win</p>
              <p className="text-sm font-bold">1% of every prize</p>
            </div>
          </div>

          <div className="mt-4 bg-black/30 backdrop-blur rounded-xl p-3 text-xs opacity-90 leading-relaxed">
            ⚡ Activated once your friend has spent <b className="text-pi-gold">10 π on tickets</b>.
            Earnings accumulate in your wallet — cash out anytime.
          </div>

          <button
            onClick={login}
            disabled={loading || !sdkReady}
            className="mt-5 w-full btn-gold animate-pulse-glow"
          >
            {loading ? 'Connecting…' : '🎁 Login & Get Your Link'}
          </button>
        </div>
      </div>

      {/* ───── How referrals work mini-flow ───── */}
      <div className="glass p-5">
        <h2 className="text-lg font-bold mb-3">How referrals work</h2>
        <ol className="space-y-3 text-sm">
          <Step n="1" title="Get your link" body="Sign in once and grab your unique LATTO-XXXXXX share link from the Profile page." />
          <Step n="2" title="Share with friends" body="Send it on Pi chat, WhatsApp, X, anywhere. Anyone joining via your link is tagged as your referral forever." />
          <Step n="3" title="They play, you earn" body="Once they spend 10 π on tickets, you start earning 1% on every ticket they buy AND 1% on every prize they win — automatically." />
          <Step n="4" title="Cash out in Pi" body="When your balance reaches the minimum, hit Cash Out and we'll send the Pi straight to your wallet." />
        </ol>
      </div>
    </div>
  );
}

function Feature({ emoji, title, body }) {
  return (
    <div className="glass p-4 animate-flip-in">
      <div className="text-2xl">{emoji}</div>
      <p className="font-semibold text-sm mt-1">{title}</p>
      <p className="text-xs opacity-80 mt-1 leading-snug">{body}</p>
    </div>
  );
}

function Step({ n, title, body }) {
  return (
    <li className="flex gap-3">
      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-pi-purple/30 border border-pi-purple flex items-center justify-center text-xs font-bold">
        {n}
      </span>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-xs opacity-80">{body}</p>
      </div>
    </li>
  );
}
