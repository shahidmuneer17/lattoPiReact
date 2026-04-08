import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthCtx } from '../AuthContext';
import api from '../api';

export default function Dashboard() {
  const { user } = useAuthCtx();
  const navigate = useNavigate();
  const [status, setStatus] = useState({ totalPi: 0, thresholdPi: 100, ticketsCount: 0 });

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    api.drawStatus().then(setStatus).catch(() => {});
  }, [user, navigate]);

  const pct = Math.min(100, Math.round((status.totalPi / status.thresholdPi) * 100));

  return (
    <section className="space-y-5 mt-4">
      <div className="glass p-5">
        <p className="text-xs uppercase tracking-wider opacity-70">Progressive Threshold</p>
        <div className="flex items-end gap-2 mt-2">
          <span className="text-3xl font-bold">{status.totalPi}</span>
          <span className="opacity-70 mb-1">/ {status.thresholdPi} π</span>
        </div>
        <div className="h-3 mt-3 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-pi-purple to-pi-gold transition-all"
               style={{ width: pct + '%' }} />
        </div>
        <p className="text-xs opacity-60 mt-2">
          Draw triggers automatically when threshold is reached. {status.ticketsCount} tickets in pot.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link to="/buy" className="glass p-4 active:scale-95 transition">
          <p className="text-xs opacity-70">Monthly Draw</p>
          <p className="font-semibold mt-1">Buy Tickets</p>
          <span className="text-xs text-pi-gold">Active</span>
        </Link>
        <Link to="/cards" className="glass p-4 active:scale-95 transition">
          <p className="text-xs opacity-70">Instant Win</p>
          <p className="font-semibold mt-1">Scratch Cards</p>
          <span className="text-xs text-pi-gold">Active</span>
        </Link>
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
