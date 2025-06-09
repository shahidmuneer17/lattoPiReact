import { useState } from 'react';

export default function useAuth() {
  const [user, setUser] = useState(null);

  const login = async () => {
    const Pi = window.Pi;
    try {
      const scopes = ['username'];
      const auth = await Pi.authenticate(scopes, () => {});
      const response = await fetch('/.netlify/functions/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(auth.user),
      });
      const data = await response.json();
      setUser(data);
      return data;
    } catch (err) {
      console.error("Login error:", err);
      return null;
    }
  };

  return { user, login };
}
