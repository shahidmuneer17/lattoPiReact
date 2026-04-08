import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthCtx } from '../AuthContext';
import useCountdown, { formatDate } from '../hooks/useCountdown';
import api from '../api';

export default function Dashboard() {
  const { user } = useAuthCtx();
  const navigate = useNavigate();
  const [draw, setDraw] = useState(null);
  const cd = useCountdown(draw?.nextDrawAt);

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    api.drawStatus().then(setDraw).catch(() => {});
  }, [user, navigate]);

  return (
    <section className="space-y-6 mt-4">
      {/* ───── Hero: prize + countdown ───── */}
      <div className="relative overflow-hidden rounded-3xl p-6 text-center
                      bg-gradient-to-br from-purple-700 via-fuchsia-700 to-amber-500
                      animate-gradient shadow-2xl">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-yellow-300/20 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-300/20 rounded-full blur-3xl animate-float" />

        <p className="text-xs uppercase tracking-[0.25em] opacity-80">This Month's Jackpot</p>
        <h2 className="mt-2 text-6xl font-black leading-none animate-shimmer">
          {draw?.prizePi?.toLocaleString() || '10,000'} π
        </h2>
        <p className="mt-2 text-sm opacity-90">Guaranteed prize · One lucky winner</p>

        <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/30 backdrop-blur">
          <span className="w-2 h-2 rounded-full bg-pi-gold animate-pulse" />
          <span className="text-xs">Next draw: {formatDate(cd.date)}</span>
        </div>

        <div className="mt-5 grid grid-cols-4 gap-2 max-w-xs mx-auto">
          {[
            ['Days', cd.days],
            ['Hrs',  cd.hours],
            ['Min',  cd.minutes],
            ['Sec',  cd.seconds],
          ].map(([label, value]) => (
            <div key={label} className="bg-black/30 backdrop-blur rounded-xl py-2">
              <div className="text-2xl font-bold tabular-nums">{String(value).padStart(2, '0')}</div>
              <div className="text-[10px] uppercase opacity-70">{label}</div>
            </div>
          ))}
        </div>

        <Link to="/buy" className="mt-6 inline-block btn-gold animate-pulse-glow">
          🎟️ Buy Tickets Now
        </Link>
      </div>

      {/* ───── Draw rules disclosure (no exact threshold revealed) ───── */}
      <div className="glass p-4 text-xs opacity-90 leading-relaxed">
        <p>
          ⏱️ The draw fires <b>once a minimum number of tickets have been sold</b>.
          If we hit that minimum early, the draw happens the <b>very next day</b> and
          all participants are notified by email.
        </p>
        <p className="mt-2">
          If the minimum isn't reached by month-end, your tickets stay valid and
          automatically roll into the next draw — no action needed.
        </p>
      </div>

      {/* ───── Why play hype strip ───── */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="glass p-3">
          <div className="text-xl">💎</div>
          <div className="text-[10px] mt-1 opacity-80">Prize</div>
          <div className="text-sm font-bold text-pi-gold">10,000 π</div>
        </div>
        <div className="glass p-3">
          <div className="text-xl">🎟️</div>
          <div className="text-[10px] mt-1 opacity-80">Per ticket</div>
          <div className="text-sm font-bold">0.5 π</div>
        </div>
        <div className="glass p-3">
          <div className="text-xl">♾️</div>
          <div className="text-[10px] mt-1 opacity-80">Max tickets</div>
          <div className="text-sm font-bold">Unlimited</div>
        </div>
      </div>

      {/* ───── Buy more = win more ───── */}
      <div className="glass p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-pi-gold/10 rounded-full blur-2xl animate-float" />
        <p className="chip bg-pi-gold/20 text-pi-gold inline-block">🔥 Pro tip</p>
        <h3 className="font-bold text-lg mt-2">Buy more, win more</h3>
        <p className="text-sm opacity-80 mt-1">
          Every ticket is one more chance at the <b className="text-pi-gold">10,000 π</b> jackpot.
          Stack 100 tickets, get 100× the odds. There's no limit — go big.
        </p>
        <Link to="/buy" className="btn-primary inline-block mt-3">Stack tickets →</Link>
      </div>

      {/* ───── Cards section teaser ───── */}
      <Link to="/cards" className="block glass p-5 group active:scale-[0.98] transition relative overflow-hidden">
        <div className="absolute -right-6 -top-6 text-7xl opacity-10 group-hover:opacity-20 group-hover:rotate-12 transition">🎰</div>
        <p className="chip bg-fuchsia-500/20 text-fuchsia-200 inline-block">⚡ Instant Win</p>
        <h3 className="font-bold text-lg mt-2">Scratch & Win Cards</h3>
        <p className="text-sm opacity-80 mt-1">
          Don't want to wait for the draw? Scratch a card and win instantly.
          Up to <b className="text-pi-gold">1,000 π per card</b>.
        </p>
        <span className="text-xs text-pi-gold mt-2 inline-block">Open scratch arena →</span>
      </Link>

      {/* ───── Roadmap teaser ───── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass p-4 opacity-60">
          <p className="text-xs">Daily Draw</p>
          <p className="font-semibold mt-1">Coming Soon</p>
        </div>
        <div className="glass p-4 opacity-60">
          <p className="text-xs">Weekly Draw</p>
          <p className="font-semibold mt-1">Coming Soon</p>
        </div>
      </div>
    </section>
  );
}
