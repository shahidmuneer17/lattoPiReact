import { useState } from 'react';
import { Link } from 'react-router-dom';
import ScratchAnimation from '../components/ScratchAnimation';

export default function BuyTicket({ user }) {
  const [win, setWin] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleBuy = async () => {
    setLoading(true);
    const response = await fetch('/.netlify/functions/complete', {
      method: 'POST',
      body: JSON.stringify({
        uid: user.uid,
        username: user.username,
        paymentId: 'demo', // Replace with real ID
        txid: 'demo-txid',
      }),
    });
    const data = await response.json();
    setTimeout(() => {
      setWin(data.win);
      setLoading(false);
    }, 2000); // simulate scratching delay
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:hidden relative overflow-hidden">
      <ScratchAnimation visible={loading} />

      <h1 className="text-xl font-bold mb-4">Buy Scratch Ticket 🎫</h1>

      <button
        onClick={handleBuy}
        className="w-full py-3 mb-4 rounded-full bg-pink-600 hover:bg-pink-700 text-white font-semibold"
        disabled={loading}
      >
        {loading ? 'Scratching...' : 'Pay 0.5 π and Scratch'}
      </button>

      {win !== null && (
        <div className="bg-green-700 p-4 rounded text-center text-xl font-bold animate-bounce">
          🎉 You won {win} π!
        </div>
      )}

      <Link to="/dashboard">
        <p className="mt-4 text-center text-sm text-pink-400 underline">
          ← Back to Dashboard
        </p>
      </Link>
    </div>
  );
}
