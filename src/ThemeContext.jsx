// Centralised dark/light theme provider.
//
// - Default: dark (matches the existing design).
// - Stored in localStorage.lattopi_theme so refreshes preserve the choice.
// - Initial value picked on first run from system preference if nothing is stored.
// - Drives the `dark` class on <html> which Tailwind reads (darkMode: 'class').
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

function detectInitial() {
  try {
    const stored = localStorage.getItem('lattopi_theme');
    if (stored === 'dark' || stored === 'light') return stored;
    if (window.matchMedia?.('(prefers-color-scheme: light)').matches) return 'light';
  } catch {}
  return 'dark';
}

function applyToDOM(theme) {
  const root = document.documentElement;
  if (theme === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
  // Help mobile chrome/safari render the right status bar.
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#0f0a1f' : '#f5f3ff');
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const initial = detectInitial();
    applyToDOM(initial);
    return initial;
  });

  // Reapply on every change so the rest of the app reads from localStorage if needed.
  useEffect(() => {
    applyToDOM(theme);
    try { localStorage.setItem('lattopi_theme', theme); } catch {}
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
