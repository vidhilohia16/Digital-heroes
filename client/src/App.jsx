import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { Heart, Award, Shield, User, LogOut, LogIn, Menu, X, Coins, Sparkles } from 'lucide-react';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Charities from './pages/Charities';
import Admin from './pages/Admin';
import Auth from './pages/Auth';

export const AuthContext = createContext(null);

export const BACKEND_URL = 'http://localhost:5000';

function AppContent() {
  const { user, logout } = useContext(AuthContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Floating background blobs that move slowly
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div className="bg-ambient-glow">
        <div className="bg-glow-1"></div>
        <div className="bg-glow-2"></div>
        <div className="bg-glow-3"></div>
      </div>

      {/* Floating Header */}
      <header className="glass-panel" style={{
        position: 'sticky',
        top: '20px',
        margin: '0 20px',
        zIndex: 100,
        borderRadius: '50px',
        padding: '12px 30px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: '20px',
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        boxShadow: '0 8px 32px 0 rgba(46, 125, 50, 0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <div style={{
            background: 'var(--color-charity-gradient)',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(255, 51, 102, 0.4)'
          }}>
            <Heart size={20} color="#fff" fill="#fff" />
          </div>
          <div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>
              DIGITAL<span className="gradient-text-reward">HEROES</span>
            </span>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginTop: '-2px', textTransform: 'uppercase' }}>
              Charity & Rewards
            </div>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '30px' }} className="desktop-nav">
          <Link to="/" style={{
            color: location.pathname === '/' ? 'var(--color-charity)' : 'var(--text-primary)',
            textDecoration: 'none',
            fontWeight: 500,
            fontSize: '0.95rem',
            transition: 'var(--transition-smooth)'
          }}>Concept</Link>
          <Link to="/charities" style={{
            color: location.pathname === '/charities' ? 'var(--color-charity)' : 'var(--text-primary)',
            textDecoration: 'none',
            fontWeight: 500,
            fontSize: '0.95rem',
            transition: 'var(--transition-smooth)'
          }}>Explore Charities</Link>
          {user && user.role !== 'admin' && (
            <Link to="/dashboard" style={{
              color: location.pathname === '/dashboard' ? 'var(--color-charity)' : 'var(--text-primary)',
              textDecoration: 'none',
              fontWeight: 500,
              fontSize: '0.95rem',
              transition: 'var(--transition-smooth)'
            }}>My Dashboard</Link>
          )}
          {user && user.role === 'admin' && (
            <Link to="/admin" style={{
              color: location.pathname === '/admin' ? 'var(--color-charity)' : 'var(--text-primary)',
              textDecoration: 'none',
              fontWeight: 500,
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'var(--transition-smooth)'
            }}>
              <Shield size={16} /> Admin Console
            </Link>
          )}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }} className="user-profile-widget">
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user.full_name}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-charity)', textTransform: 'uppercase', fontWeight: 700 }}>
                  {user.subscription_status === 'active' ? 'Hero Member' : 'Inactive Member'}
                </span>
              </div>
              <button onClick={logout} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                <LogOut size={16} /> Logout
              </button>
            </div>
          ) : (
            <Link to="/auth" className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.85rem' }}>
              <LogIn size={16} /> Support a Charity
            </Link>
          )}

          {/* Mobile Menu Icon */}
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'none'
            }}
            className="mobile-menu-btn"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Nav Overlay */}
      {menuOpen && (
        <div className="glass-panel" style={{
          position: 'fixed',
          top: '90px',
          left: '20px',
          right: '20px',
          zIndex: 99,
          borderRadius: '24px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          boxShadow: '0 8px 32px 0 rgba(46, 125, 50, 0.1)'
        }}>
          <Link to="/" onClick={() => setMenuOpen(false)} style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '1.1rem', fontWeight: 600 }}>Concept</Link>
          <Link to="/charities" onClick={() => setMenuOpen(false)} style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '1.1rem', fontWeight: 600 }}>Explore Charities</Link>
          {user && user.role !== 'admin' && <Link to="/dashboard" onClick={() => setMenuOpen(false)} style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '1.1rem', fontWeight: 600 }}>My Dashboard</Link>}
          {user && user.role === 'admin' && (
            <Link to="/admin" onClick={() => setMenuOpen(false)} style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
              <Shield size={18} color="var(--color-charity)" /> Admin Console
            </Link>
          )}
        </div>
      )}

      {/* Main Pages Container */}
      <main style={{ flex: 1, padding: '20px', maxWidth: '1200px', width: '100%', margin: '0 auto', zIndex: 10 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/charities" element={<Charities />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/auth" element={<Auth />} />
        </Routes>
      </main>

      {/* Responsive Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-color)',
        padding: '30px 20px',
        marginTop: '60px',
        textAlign: 'center',
        zIndex: 5,
        backgroundColor: 'rgba(255, 255, 255, 0.8)'
      }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          © {new Date().getFullYear()} Digital Heroes Platform. Transforming golf performance into emotional charity support.
        </p>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-charity)', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
          <Sparkles size={12} /> Play with Heart. Win for the Cause. <Sparkles size={12} />
        </p>
      </footer>

      {/* Injecting Mobile Styles directly into DOM */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
          .user-profile-widget {
            display: none !important;
          }
          .mobile-menu-btn {
            display: block !important;
          }
        }
        @media (max-width: 600px) {
          header.glass-panel {
            margin: 10px 10px 0 10px !important;
            padding: 10px 16px !important;
          }
          header span {
            font-size: 1.1rem !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('dh_token') || '');
  const [loading, setLoading] = useState(true);

  // Sync token loading
  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          // invalid token
          localStorage.removeItem('dh_token');
          setToken('');
          setUser(null);
        }
      } catch (err) {
        console.error('Failed to restore login session:', err);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to login');
    }

    const data = await res.json();
    localStorage.setItem('dh_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('dh_token');
    setToken('');
    setUser(null);
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (e) {
      console.error('Failed to refresh user:', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, refreshUser, setUser }}>
      <Router>
        {loading ? (
          <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-main)',
            gap: '15px'
          }}>
            <div style={{
              width: '50px',
              height: '50px',
              border: '3px solid rgba(255, 51, 102, 0.1)',
              borderTop: '3px solid var(--color-charity)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', letterSpacing: '0.1em' }}>CONNECTING HEROES...</span>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : (
          <AppContent />
        )}
      </Router>
    </AuthContext.Provider>
  );
}
