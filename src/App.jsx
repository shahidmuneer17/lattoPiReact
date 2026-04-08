// src/App.jsx
import { BrowserRouter as Router, Routes, Route, NavLink, Link } from 'react-router-dom';
import { AuthProvider, useAuthCtx } from './AuthContext';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import BuyTicket from './pages/BuyTicket';
import Cards from './pages/Cards';
import History from './pages/History';
import Admin from './pages/Admin';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import NotFound from './pages/NotFound';

function Shell({ children }) {
  const { user, logout } = useAuthCtx();
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white">
      <header className="px-5 py-4 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold tracking-wide">
          Latto<span className="text-pi-gold">Pi</span>
        </Link>
        {user && (
          <button onClick={logout} className="text-xs opacity-80 underline">
            @{user.username} · sign out
          </button>
        )}
      </header>

      <main className="flex-1 px-5 pb-32">{children}</main>

      <Footer />

      {user && (
        <nav className="fixed bottom-0 inset-x-0 glass m-3 flex justify-around py-3 text-sm z-30">
          <NavLink to="/dashboard">Home</NavLink>
          <NavLink to="/buy">Tickets</NavLink>
          <NavLink to="/cards">Cards</NavLink>
          <NavLink to="/history">History</NavLink>
        </nav>
      )}
    </div>
  );
}

function Footer() {
  return (
    <footer className="px-5 pb-6 pt-4 text-center text-xs opacity-70 space-y-2 border-t border-white/5">
      <p className="font-semibold">
        Latto<span className="text-pi-gold">Pi</span> · Lottery & instant-win on the Pi Network
      </p>
      <p className="opacity-80">
        Win <b className="text-pi-gold">25 π</b> in this month's draw — provably fair, paid in Pi.
      </p>
      <nav className="flex justify-center gap-4 pt-1">
        <Link to="/privacy" className="hover:text-pi-gold">Privacy</Link>
        <Link to="/terms" className="hover:text-pi-gold">Terms</Link>
        <a href="mailto:support@lattopi.com" className="hover:text-pi-gold">Contact</a>
      </nav>
      <p className="text-[10px] opacity-60 pt-2">
        18+ only · Play responsibly · LattoPi is an independent app on the Pi Network and is not affiliated with Pi Core Team.
      </p>
      <p className="text-[10px] opacity-50">© {new Date().getFullYear()} LattoPi. All rights reserved.</p>
    </footer>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Shell>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/buy" element={<BuyTicket />} />
            <Route path="/cards" element={<Cards />} />
            <Route path="/history" element={<History />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Shell>
      </Router>
    </AuthProvider>
  );
}

export default App;
