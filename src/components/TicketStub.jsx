// Stylised ticket-stub UI used wherever we render a single lottery ticket.
// Two halves separated by a perforated edge with notch cut-outs, gradient
// background, monospace ticket number, draw label and expiry date.

function formatExpiry(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const PAYOUT_BADGE = {
  verifying: { label: 'VERIFYING', cls: 'bg-amber-500 text-slate-900' },
  approved:  { label: 'APPROVED',  cls: 'bg-emerald-500 text-slate-900' },
  paid:      { label: 'PAID',      cls: 'bg-emerald-700 text-white' },
  rejected:  { label: 'REJECTED',  cls: 'bg-red-600 text-white' },
};

export default function TicketStub({ ticket, index = 0 }) {
  const won = ticket.is_winner;
  const past = ticket.status === 'past';
  const payout = won ? PAYOUT_BADGE[ticket.payout_status] : null;
  return (
    <div
      style={{ animationDelay: `${index * 50}ms` }}
      className={`relative animate-flip-in rounded-2xl overflow-hidden text-slate-900
                  ${won
                    ? 'bg-gradient-to-r from-yellow-300 via-pi-gold to-amber-400 shadow-[0_0_30px_rgba(245,197,24,0.5)]'
                    : past
                      ? 'bg-gradient-to-r from-slate-300 to-slate-400 opacity-80'
                      : 'bg-gradient-to-r from-fuchsia-300 via-pi-gold to-amber-300'}`}
    >
      {/* Notches forming the perforated edge between left/right halves.
          surface-page-bg matches the page backdrop in both themes so the
          notches look like real cut-outs in the ticket. */}
      <div className="absolute top-1/2 -translate-y-1/2 left-[68%] w-3 h-3 rounded-full surface-page-bg" />
      <div className="absolute top-0 left-[68%] -translate-x-1/2 w-3 h-1.5 rounded-b-full surface-page-bg" />
      <div className="absolute bottom-0 left-[68%] -translate-x-1/2 w-3 h-1.5 rounded-t-full surface-page-bg" />

      <div className="flex">
        {/* ── Left half: ticket info ── */}
        <div className="flex-1 p-4 pr-6">
          <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest opacity-80">
            <span>LattoPi · Lottery</span>
            <span className="flex gap-1">
              {won && <span className="bg-slate-900 text-pi-gold px-1.5 py-0.5 rounded">WINNER</span>}
              {payout && <span className={`px-1.5 py-0.5 rounded ${payout.cls}`}>{payout.label}</span>}
              {!won && past && <span className="bg-slate-900/60 text-white px-1.5 py-0.5 rounded">PAST</span>}
            </span>
          </div>

          <div className="mt-2 font-mono text-2xl font-black tracking-wider">
            #{ticket.number}
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <div className="opacity-60">Draw</div>
              <div className="font-bold">{ticket.draw_id}</div>
            </div>
            <div>
              <div className="opacity-60">{past ? 'Drawn' : 'Expires'}</div>
              <div className="font-bold">{formatExpiry(ticket.expires_at)}</div>
            </div>
          </div>
        </div>

        {/* ── Right half (stub): price + chance ── */}
        <div className="w-[32%] border-l-2 border-dashed border-slate-900/40 p-3 flex flex-col items-center justify-center text-center">
          <div className="text-[9px] uppercase opacity-70 font-bold">Stake</div>
          <div className="text-lg font-black leading-none">{Number(ticket.price_pi)} π</div>
          <div className="text-[9px] uppercase opacity-70 font-bold mt-2">Prize pool</div>
          <div className="text-sm font-black leading-none text-slate-900">10,000 π</div>
        </div>
      </div>
    </div>
  );
}
