import { useCallback, useEffect, useState } from 'react';
import api from '../api';

// Pi auth + payment helper hook.
// Persists the access token in localStorage so the user stays signed in.
export default function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // On mount, if we already have a token, fetch the profile.
  useEffect(() => {
    if (!localStorage.getItem('pi_access_token')) return;
    api.me().then((d) => setUser(d.user)).catch(() => {
      localStorage.removeItem('pi_access_token');
    });
  }, []);

  const login = useCallback(async () => {
    const Pi = window.Pi;
    if (!Pi) {
      alert('Open this app inside the Pi Browser.');
      return null;
    }
    setLoading(true);
    try {
      const scopes = ['username', 'payments'];
      const auth = await Pi.authenticate(scopes, onIncompletePayment);
      localStorage.setItem('pi_access_token', auth.accessToken);
      const { user: u } = await api.login(auth.accessToken);
      setUser(u);
      return u;
    } catch (err) {
      console.error('Login error:', err);
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

  return { user, loading, login, logout, pay };
}
