// src/App.jsx
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { AuthProvider, useAuthCtx } from './AuthContext';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import BuyTicket from './pages/BuyTicket';
import Cards from './pages/Cards';
import History from './pages/History';
import Admin from './pages/Admin';
import NotFound from './pages/NotFound';

function Shell({ children }) {
  const { user, logout } = useAuthCtx();
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white">
      <header className="px-5 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-wide">
          Latto<span className="text-pi-gold">Pi</span>
        </h1>
        {user && (
          <button onClick={logout} className="text-xs opacity-80 underline">
            @{user.username} · sign out
          </button>
        )}
      </header>
      <main className="px-5 pb-28">{children}</main>
      {user && (
        <nav className="fixed bottom-0 inset-x-0 glass m-3 flex justify-around py-3 text-sm">
          <NavLink to="/dashboard">Home</NavLink>
          <NavLink to="/buy">Tickets</NavLink>
          <NavLink to="/cards">Cards</NavLink>
          <NavLink to="/history">History</NavLink>
        </nav>
      )}
    </div>
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Shell>
      </Router>
    </AuthProvider>
  );
}

export default App;
