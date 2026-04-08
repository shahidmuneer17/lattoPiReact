import { useCallback, useEffect, useState } from 'react';
import api from '../api';

// Pi auth + payment helper hook.
// Persists the access token in localStorage so the user stays signed in.
export default function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // On mount: capture ?ref=CODE from the URL into localStorage so it survives
  // the Pi authenticate redirect, then re-hydrate any existing session.
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref');
      if (ref) {
        localStorage.setItem('lattopi_ref', ref.trim().toUpperCase());
        // Strip the param so the URL stays clean.
        params.delete('ref');
        const qs = params.toString();
        const newUrl =
          window.location.pathname + (qs ? '?' + qs : '') + window.location.hash;
        window.history.replaceState({}, '', newUrl);
      }
    } catch {}

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
      const referralCode = localStorage.getItem('lattopi_ref') || undefined;
      const { user: u } = await api.login(auth.accessToken, undefined, referralCode);
      console.log('[auth] /login ok:', u?.username);
      // Clear the stored code so it isn't reapplied on a future re-login.
      if (referralCode) localStorage.removeItem('lattopi_ref');

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
  //
  // IMPORTANT: the `payments` scope granted by Pi.authenticate lives in the
  // in-memory SDK session, NOT in localStorage. After a page refresh the access
  // token is still cached in localStorage (so our backend /me calls work), but
  // the SDK has no payments scope and createPayment will hang.
  //
  // We fix this by always calling Pi.authenticate(['username','payments'], ...)
  // immediately before createPayment. The Pi SDK caches the scope grant on the
  // user side, so after the very first approval this re-auth is silent — the
  // user does not see a second dialog.
  //
  // metadata.kind must be 'tickets' or 'cards', metadata.count is the quantity.
  const pay = useCallback(async ({ amount, memo, metadata }) => {
    const Pi = window.Pi;
    if (!Pi) throw new Error('Pi SDK not available — open inside Pi Browser');

    // 1. Refresh the SDK session so the payments scope is attached.
    try {
      const auth = await Pi.authenticate(['username', 'payments'], onIncompletePayment);
      if (auth?.accessToken) {
        localStorage.setItem('pi_access_token', auth.accessToken);
      }
    } catch (e) {
      throw new Error('Pi re-authentication required for payment: ' + (e?.message || e));
    }

    // 2. Now createPayment has the scope it needs.
    return new Promise((resolve, reject) => {
      Pi.createPayment(
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

  return { user, setUser, loading, error, login, logout, pay };
}
