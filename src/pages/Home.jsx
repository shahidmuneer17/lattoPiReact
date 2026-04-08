import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthCtx } from '../AuthContext';

export default function Home() {
  const { login, loading, user, error } = useAuthCtx();
  const navigate = useNavigate();
  const [sdkReady, setSdkReady] = useState(!!window.Pi);

  // Pi SDK is async — poll briefly so the diagnostics line is accurate.
  useEffect(() => {
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
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="glass p-8 w-full max-w-sm text-center">
        <div className="text-3xl font-extrabold mb-2">🎯 LattoPi</div>
        <p className="text-sm opacity-80 mb-6">
          Lottery & scratch cards on the Pi Network. 75% platform / 25% prize pool.
        </p>

        <button onClick={login} disabled={loading} className="btn-primary w-full">
          {loading ? 'Connecting…' : 'Login with Pi'}
        </button>

        {/* Diagnostics — visible without opening devtools */}
        <div className="mt-4 text-[11px] opacity-70 space-y-1">
          <p>
            Pi SDK:{' '}
            <span className={sdkReady ? 'text-emerald-300' : 'text-red-300'}>
              {sdkReady ? 'loaded' : 'not detected'}
            </span>
          </p>
          {!sdkReady && (
            <p className="text-red-300">
              Open this page inside the <b>Pi Browser</b> app, not Chrome/Safari.
            </p>
          )}
        </div>

        {error && (
          <div className="mt-4 text-left text-xs bg-red-500/10 border border-red-400/30 rounded-lg p-3 text-red-200 break-words">
            <p className="font-semibold mb-1">Login failed</p>
            <p>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
