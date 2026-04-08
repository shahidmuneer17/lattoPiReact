import { useEffect, useState } from 'react';

// Live countdown to a target Date (or ISO string).
// If no target is provided, defaults to the last day of the current month, 23:00 UTC.
export default function useCountdown(target) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const date = target ? new Date(target) : defaultDrawDate();
  const diff = Math.max(0, date.getTime() - now);

  const days    = Math.floor(diff / 86_400_000);
  const hours   = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff %  3_600_000) /    60_000);
  const seconds = Math.floor((diff %     60_000) /      1000);

  return { days, hours, minutes, seconds, date };
}

function defaultDrawDate() {
  const now = new Date();
  let last = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 0, 0));
  if (now.getTime() > last.getTime()) {
    last = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 2, 0, 23, 0, 0));
  }
  return last;
}

export function formatDate(d) {
  return new Date(d).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}
