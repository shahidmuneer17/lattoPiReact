// Single source of truth for which Pi network the backend is operating on.
// Set the PI_NETWORK env var on Netlify ('testnet' or 'mainnet') and flip
// it the moment Pi Core Team approves your app for mainnet.
//
// Until PI_NETWORK is set we default to 'testnet' so we can never accidentally
// stamp records as mainnet on a fresh deploy.
function currentNetwork() {
  const v = (process.env.PI_NETWORK || 'testnet').toLowerCase();
  return v === 'mainnet' ? 'mainnet' : 'testnet';
}

const isMainnet = () => currentNetwork() === 'mainnet';
const isTestnet = () => currentNetwork() === 'testnet';

module.exports = { currentNetwork, isMainnet, isTestnet };
