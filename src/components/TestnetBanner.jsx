// Sticky banner that warns users when they're playing against Pi testnet
// instead of mainnet. Disappears automatically once the backend's PI_NETWORK
// env var is flipped to 'mainnet'.
import { useEffect, useState } from 'react';
import api from '../api';

export default function TestnetBanner() {
  const [network, setNetwork] = useState(null);

  useEffect(() => {
    api.network()
      .then((d) => setNetwork(d.network))
      .catch(() => setNetwork('unknown'));
  }, []);

  // Sandbox mode (sandbox.lattopi.com) → also show as testnet
  const sdkSandbox =
    typeof window !== 'undefined' && window.__LATTOPI_SANDBOX__ === true;
  const isTestnet = sdkSandbox || network === 'testnet' || network === 'unknown';

  if (network === null || !isTestnet) return null;

  return (
    <div className="sticky top-0 z-40 w-full bg-amber-500/90 text-slate-900 text-center text-xs font-semibold py-2 px-3 shadow-md backdrop-blur">
      🧪 <b>TESTNET</b> · You're playing against the Pi <b>test network</b>.
      Payments are <u>not real Pi</u> and tickets/cards purchased now will not
      carry over to mainnet launch.
    </div>
  );
}
