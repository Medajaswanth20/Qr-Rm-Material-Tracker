import { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Package, BarChart3, Settings, LogOut, FileText } from 'lucide-react';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import Machines from './pages/Machines';

// Setup axios defaults for cookies
axios.defaults.withCredentials = true;

const Sidebar = ({ onLogout }: { onLogout: () => void }) => {
  const location = useLocation();

  return (
    <div className="sidebar">
      <h2><Package size={24} /> Dashboard</h2>
      
      <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
         <FileText size={18} /> Raw material
      </Link>
      <Link to="/reports" className={location.pathname === '/reports' ? 'active' : ''}>
         <BarChart3 size={18} /> Reports
      </Link>
      <Link to="/machines" className={location.pathname.startsWith('/machines') ? 'active' : ''}>
         <Settings size={18} /> Machines
      </Link>
      
      {location.pathname.startsWith('/machines') && (
        <Link to="/machines?selected=CMC" style={{ paddingLeft: '2rem' }}>
          .Cnc
        </Link>
      )}

      <button onClick={onLogout} style={{ marginTop: '20px' }}>
        <LogOut size={18} /> Logout
      </button>

      <div style={{ position: 'absolute', bottom: '20px', left: '1.25rem', color: '#9ca3af', fontSize: '0.85rem', fontWeight: 500 }}>
        v 0.0.1
      </div>
    </div>
  );
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check session on load
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

  if (isAuthenticated === null) return <div>Loading...</div>;

  if (!isAuthenticated) {
    return (
      <div className="app-layout">
        <Auth onLogin={() => setIsAuthenticated(true)} />
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar onLogout={handleLogout} />
      <div className="content-area">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/machines" element={<Machines />} />
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </div>
    </div>
  );
}
