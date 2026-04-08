import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthCtx } from '../AuthContext';

export default function Home() {
  const { login, loading, user } = useAuthCtx();
  const navigate = useNavigate();

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
        <button
          onClick={login}
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? 'Connecting…' : 'Login with Pi'}
        </button>
      </div>
    </div>
  );
}
