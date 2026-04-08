import { useEffect, useState } from 'react';
import { useAuthCtx } from '../AuthContext';
import api from '../api';
import TicketStub from '../components/TicketStub';

export default function History() {
  const { user } = useAuthCtx();
  const [tab, setTab] = useState('tickets');
  const [data, setData] = useState({ tickets: [], cards: [] });

  useEffect(() => {
    if (!user) return;
    api.me().then((d) => setData({ tickets: d.tickets || [], cards: d.cards || [] })).catch(() => {});
  }, [user]);

  return (
    <section className="mt-4">
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setTab('tickets')}
          className={`px-4 py-2 rounded-xl text-sm ${tab === 'tickets' ? 'bg-pi-purple' : 'bg-white/10'}`}
        >
          Tickets
        </button>
        <button
          onClick={() => setTab('cards')}
          className={`px-4 py-2 rounded-xl text-sm ${tab === 'cards' ? 'bg-pi-purple' : 'bg-white/10'}`}
        >
          Cards
        </button>
      </div>

      {tab === 'tickets' ? (
        <div className="space-y-3">
          {data.tickets.length === 0 && <p className="opacity-60 text-sm">No tickets yet.</p>}
          {data.tickets.map((t, i) => (
            <TicketStub key={t.ticket_id} ticket={t} index={i} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {data.cards.length === 0 && <p className="opacity-60 text-sm">No cards yet.</p>}
          {data.cards.map((c) => (
            <div key={c.card_id} className="glass p-3 flex justify-between text-sm">
              <span>{c.card_id.slice(0, 8)}…</span>
              <span className={c.reward_pi > 0 ? 'text-pi-gold font-semibold' : 'opacity-70'}>
                {c.status === 'scratched' ? `${c.reward_pi} π` : 'Unscratched'}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
