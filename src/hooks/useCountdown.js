import { useEffect, useState } from 'react';

// Returns the next monthly draw date (last day of the current month, 23:00 UTC)
// and a live-updating countdown { days, hours, minutes, seconds, date }.
export default function useCountdown() {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const target = nextDrawDate();
  const diff = Math.max(0, target.getTime() - now);

  const days    = Math.floor(diff / 86_400_000);
  const hours   = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff %  3_600_000) /    60_000);
  const seconds = Math.floor((diff %     60_000) /      1000);

  return { days, hours, minutes, seconds, date: target };
}

function nextDrawDate() {
  const now = new Date();
  // Last day of current month at 23:00 UTC. If we've already passed it,
  // jump to the last day of next month.
  let year = now.getUTCFullYear();
  let month = now.getUTCMonth();
  let last = new Date(Date.UTC(year, month + 1, 0, 23, 0, 0));
  if (now.getTime() > last.getTime()) {
    last = new Date(Date.UTC(year, month + 2, 0, 23, 0, 0));
  }
  return last;
}

export function formatDate(d) {
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}
