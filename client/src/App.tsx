import { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Package2, BarChart3, LogOut, FileStack, Lock, Unlock, LayoutDashboard, PackageCheck, ChevronDown, ChevronRight } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import RawMaterial from './pages/RawMaterial';
import Reports from './pages/Reports';
import FinishedGoods from './pages/FinishedGoods';

axios.defaults.withCredentials = true;

const NavLink = ({ to, icon: Icon, label, exact = false }: { to: string; icon: any; label: string; exact?: boolean }) => {
  const location = useLocation();
  const isActive = exact ? location.pathname === to : location.pathname.startsWith(to);
  return (
    <Link to={to} className={isActive ? 'active' : ''}>
      <Icon size={17} style={{ minWidth: '17px' }} />
      <span className="hideable-text">{label}</span>
    </Link>
  );
};

const Sidebar = ({ onLogout }: { onLogout: () => void }) => {
  const location = useLocation();
  const [isLocked, setIsLocked] = useState(false);
  const [isFinalExpanded, setIsFinalExpanded] = useState(location.pathname.startsWith('/finished-goods'));

  return (
    <div className={`sidebar ${isLocked ? 'locked' : ''}`}>
      {/* Logo */}
      <h2 style={{ justifyContent: 'space-between', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          <div style={{
            width: 30, height: 30, background: 'linear-gradient(135deg, #6366f1, #818cf8)',
            borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <Package2 size={16} color="#fff" />
          </div>
          <span className="hideable-text" style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.01em' }}>
            RM Tracker
          </span>
        </div>
        <div
          onClick={() => setIsLocked(!isLocked)}
          className="lock-btn hideable-text"
          style={{ cursor: 'pointer', display: 'flex', padding: '0.2rem' }}
          title={isLocked ? 'Unlock Sidebar' : 'Lock Sidebar'}
        >
          {isLocked ? <Lock size={14} /> : <Unlock size={14} />}
        </div>
      </h2>

      {/* Analytics */}
      <div className="sidebar-section-label hideable-text">Analytics</div>
      <NavLink to="/" icon={LayoutDashboard} label="Dashboard" exact />
      <NavLink to="/reports" icon={BarChart3} label="Reports" />

      {/* Inventory */}
      <div className="sidebar-section-label hideable-text">Inventory</div>
      <NavLink to="/raw-materials" icon={FileStack} label="Raw Materials" />

      {/* Production */}
      <div className="sidebar-section-label hideable-text">Production</div>
      <Link
        to="/finished-goods"
        className={location.pathname.startsWith('/finished-goods') ? 'active' : ''}
        onClick={() => setIsFinalExpanded(!isFinalExpanded)}
        style={{ justifyContent: 'space-between' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <PackageCheck size={17} style={{ minWidth: '17px' }} />
          <span className="hideable-text">Final Product</span>
        </div>
        <span className="hideable-text" style={{ display: 'flex', opacity: 0.5 }}>
          {isFinalExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
      </Link>
      {isFinalExpanded && (
        <Link to="/finished-goods" style={{ paddingLeft: '2.6rem', fontSize: '0.82rem', opacity: 0.75 }}>
          <span className="hideable-text">Finished Goods</span>
        </Link>
      )}

      {/* Logout */}
      <button
        onClick={onLogout}
        style={{ marginTop: 'auto', position: 'absolute', bottom: '1.5rem', left: '0.65rem', right: '0.65rem', width: 'auto', color: '#ef4444' }}
      >
        <LogOut size={17} style={{ minWidth: '17px' }} />
        <span className="hideable-text">Logout</span>
      </button>

      <div className="version-info" style={{ position: 'absolute', bottom: '0.5rem', left: '1rem', color: '#374151', fontSize: '0.7rem' }}>
        v 0.1.0
      </div>
    </div>
  );
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/api/me')
      .then(() => setIsAuthenticated(true))
      .catch(() => setIsAuthenticated(false));
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post('/api/logout');
      setIsAuthenticated(false);
      navigate('/auth');
    } catch (e) { }
  };

  if (isAuthenticated === null) return (
    <div style={{ minHeight: '100vh', background: '#0f1117', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #1e2635', borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f1117', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Auth onLogin={() => setIsAuthenticated(true)} />
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#161b27', color: '#e2e8f0', border: '1px solid #1e2635', borderRadius: '10px', fontSize: '0.875rem' },
          success: { iconTheme: { primary: '#10b981', secondary: '#161b27' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#161b27' } },
        }}
      />
      <Sidebar onLogout={handleLogout} />
      <div className="content-area">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/raw-materials" element={<RawMaterial />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/finished-goods" element={<FinishedGoods />} />
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </div>
    </div>
  );
}
