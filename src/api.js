// Thin fetch wrapper for the Netlify Functions API.
// Sends the stored Pi access token as Authorization: Bearer <token>.
const BASE = '/.netlify/functions';

function token() {
  return localStorage.getItem('pi_access_token');
}

async function request(path, { method = 'GET', body, headers = {} } = {}) {
  const finalHeaders = { 'Content-Type': 'application/json', ...headers };
  const t = token();
  if (t && !finalHeaders.Authorization) finalHeaders.Authorization = `Bearer ${t}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: finalHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

const adminHeaders = (secret) => ({ 'X-Admin-Secret': secret });

export const api = {
  login:     (accessToken, email, referralCode) =>
    request('/login', { method: 'POST', body: { accessToken, email, referralCode } }),
  approve:   (paymentId)          => request('/approve',  { method: 'POST', body: { paymentId } }),
  complete:  (paymentId, txid)    => request('/complete', { method: 'POST', body: { paymentId, txid } }),
  me:        ()                   => request('/get-user-data'),
  scratch:   (cardId)             => request('/scratch-card', { method: 'POST', body: { cardId } }),
  drawStatus:()                   => request('/draw-status'),
  network:   ()                   => request('/network-info'),
  updateProfile: (email)          => request('/update-profile', { method: 'POST', body: { email } }),

  // referral
  referralStats: ()               => request('/referral-stats'),
  referralPayout: ()              => request('/referral-payout-request', { method: 'POST', body: {} }),

  // admin
  adminStats: (secret)         => request('/admin-stats',        { headers: adminHeaders(secret) }),
  adminDraw:  (secret)         => request('/admin-trigger-draw', { method: 'POST', headers: adminHeaders(secret), body: {} }),
  adminConfig:(secret)         => request('/admin-config',       { headers: adminHeaders(secret) }),
  adminSetConfig: (secret, key, value) =>
    request('/admin-config', { method: 'POST', headers: adminHeaders(secret), body: { key, value } }),

  // paginated lists
  adminUsers: (secret, { page = 1, pageSize = 25, q = '' } = {}) =>
    request(`/admin-users?page=${page}&pageSize=${pageSize}&q=${encodeURIComponent(q)}`,
      { headers: adminHeaders(secret) }),
  adminPayouts: (secret, { page = 1, pageSize = 25, status = 'pending' } = {}) =>
    request(`/admin-payouts?page=${page}&pageSize=${pageSize}&status=${status}`,
      { headers: adminHeaders(secret) }),
  adminWins: (secret, { page = 1, pageSize = 25, status = 'pending', kind = 'all' } = {}) =>
    request(`/admin-wins?page=${page}&pageSize=${pageSize}&status=${status}&kind=${kind}`,
      { headers: adminHeaders(secret) }),

  adminResolvePayout: (secret, payoutId, status, txid, notes) =>
    request('/admin-payouts', {
      method: 'POST',
      headers: adminHeaders(secret),
      body: { payoutId, status, txid, notes },
    }),
  adminResolveWin: (secret, kind, id, status, txid, notes) =>
    request('/admin-wins', {
      method: 'POST',
      headers: adminHeaders(secret),
      body: { kind, id, status, txid, notes },
    }),
};

export default api;
