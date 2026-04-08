// GET /.netlify/functions/network-info
// Public — used by the frontend banner to know whether we're in testnet or mainnet
// without needing a build-time env var.
const { ok, wrap } = require('./_lib/response');
const { currentNetwork } = require('./_lib/network');

exports.handler = wrap(async () => {
  return ok({ network: currentNetwork() });
});
