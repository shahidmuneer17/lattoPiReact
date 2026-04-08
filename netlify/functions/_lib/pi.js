// Pi Network Platform API helpers (server-side).
// Uses native fetch (Node 18+ on Netlify Functions).
const PI_BASE = 'https://api.minepi.com';

async function piPost(path, body) {
  const res = await fetch(`${PI_BASE}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Key ${process.env.PI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `pi ${path} ${res.status}`);
  return data;
}

async function piGet(path) {
  const res = await fetch(`${PI_BASE}${path}`, {
    headers: { Authorization: `Key ${process.env.PI_API_KEY}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `pi ${path} ${res.status}`);
  return data;
}

async function verifyAccessToken(accessToken) {
  const res = await fetch(`${PI_BASE}/v2/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('invalid Pi access token');
  return res.json(); // { uid, username, ... }
}

const approvePayment  = (id)       => piPost(`/v2/payments/${id}/approve`);
const completePayment = (id, txid) => piPost(`/v2/payments/${id}/complete`, { txid });
const getPayment      = (id)       => piGet (`/v2/payments/${id}`);

module.exports = { verifyAccessToken, approvePayment, completePayment, getPayment };
