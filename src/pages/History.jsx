import { useEffect, useState } from 'react';
import { useAuthCtx } from '../AuthContext';
import api from '../api';
import TicketStub from '../components/TicketStub';

const PAYOUT_BADGE = {
  verifying: { label: '⏱ Verifying', cls: 'text-amber-300' },
  approved:  { label: '✓ Approved',  cls: 'text-emerald-300' },
  paid:      { label: '✓ Paid',      cls: 'text-emerald-200' },
  rejected:  { label: '✗ Rejected',  cls: 'text-red-300' },
};

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
      <p className="text-[10px] opacity-60 mb-3">
        Showing your <b>latest 10</b> entries. Older history is preserved on chain.
      </p>

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
          {data.cards.map((c) => {
            const won = Number(c.reward_pi) > 0;
            const payout = won ? PAYOUT_BADGE[c.payout_status] : null;
            return (
              <div key={c.card_id} className="glass p-3 flex items-center justify-between text-sm">
                <div className="flex flex-col">
                  <span className="opacity-80">{c.card_id.slice(0, 8)}…</span>
                  {payout && (
                    <span className={`text-[11px] mt-1 ${payout.cls}`}>{payout.label}</span>
                  )}
                </div>
                <div className="text-right">
                  <span className={won ? 'text-pi-gold font-semibold' : 'opacity-70'}>
                    {c.status === 'scratched' ? `${c.reward_pi} π` : 'Unscratched'}
                  </span>
                  {payout?.label === '✓ Paid' && c.payout_txid && (
                    <div className="text-[10px] opacity-60 font-mono mt-1">
                      txid {c.payout_txid.slice(0, 12)}…
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
