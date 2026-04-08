import { useCallback, useEffect, useState } from 'react';
import api from '../api';

// Pi auth + payment helper hook.
// Persists the access token in localStorage so the user stays signed in.
export default function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // On mount, if we already have a token, fetch the profile.
  useEffect(() => {
    if (!localStorage.getItem('pi_access_token')) return;
    api.me()
      .then((d) => setUser(d.user))
      .catch((e) => {
        console.warn('[auth] stored token rejected:', e.message);
        localStorage.removeItem('pi_access_token');
      });
  }, []);

  const login = useCallback(async () => {
    setError(null);

    const Pi = window.Pi;
    if (!Pi || typeof Pi.authenticate !== 'function') {
      const msg =
        'Pi SDK not available. Open this app inside the Pi Browser app (not Chrome/Safari).';
      console.error('[auth]', msg);
      setError(msg);
      return null;
    }

    setLoading(true);
    try {
      console.log('[auth] calling Pi.authenticate…');

      // Pi.authenticate can hang silently if the app is opened outside the
      // Pi Browser, or if the developer-portal sandbox/mainnet setting doesn't
      // match Pi.init({ sandbox }). Race it against a 30s timeout so the UI
      // doesn't spin forever.
      const auth = await Promise.race([
        Pi.authenticate(['username', 'payments'], onIncompletePayment),
        new Promise((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error(
                  'Pi.authenticate timed out after 30s. ' +
                    'Likely cause: not running inside Pi Browser, or a sandbox/mainnet mismatch ' +
                    'between Pi.init() and your Pi developer-portal app config.'
                )
              ),
            30_000
          )
        ),
      ]);

      console.log('[auth] Pi.authenticate ok:', auth?.user?.username);

      if (!auth?.accessToken) {
        throw new Error('Pi.authenticate returned no accessToken');
      }
      localStorage.setItem('pi_access_token', auth.accessToken);

      console.log('[auth] calling /login…');
      const { user: u } = await api.login(auth.accessToken);
      console.log('[auth] /login ok:', u?.username);

      setUser(u);
      return u;
    } catch (err) {
      console.error('[auth] login error:', err);
      setError(err.message || String(err));
      localStorage.removeItem('pi_access_token');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('pi_access_token');
    setUser(null);
  }, []);

  // Recovery hook for payments interrupted on a previous session.
  async function onIncompletePayment(payment) {
    try {
      if (payment?.identifier && payment?.transaction?.txid) {
        await api.complete(payment.identifier, payment.transaction.txid);
      }
    } catch (e) {
      console.warn('incomplete payment recovery failed', e);
    }
  }

  // Wraps Pi.createPayment with our server-side approve/complete flow.
  // metadata.kind must be 'tickets' or 'cards', metadata.count is the quantity.
  const pay = useCallback(({ amount, memo, metadata }) => {
    return new Promise((resolve, reject) => {
      window.Pi.createPayment(
        { amount, memo, metadata },
        {
          onReadyForServerApproval: async (paymentId) => {
            try { await api.approve(paymentId); } catch (e) { reject(e); }
          },
          onReadyForServerCompletion: async (paymentId, txid) => {
            try { resolve(await api.complete(paymentId, txid)); }
            catch (e) { reject(e); }
          },
          onCancel: () => reject(new Error('cancelled')),
          onError:  (err) => reject(err),
        }
      );
    });
  }, []);

  return { user, loading, error, login, logout, pay };
}
