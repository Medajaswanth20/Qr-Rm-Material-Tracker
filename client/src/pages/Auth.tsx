import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Package2, Mail, Lock, User, Briefcase, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';

export default function Auth({ onLogin }: { onLogin: () => void }) {
  const [isSignIn, setIsSignIn] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true); setError('');
    const data = new FormData(e.currentTarget);
    try {
      await axios.post('/api/signin', Object.fromEntries(data));
      onLogin();
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to sign in');
    } finally { setLoading(false); }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true); setError('');
    const data = new FormData(e.currentTarget);
    try {
      const res = await axios.post('/api/signup', Object.fromEntries(data));
      setSuccess(res.data.message);
      setIsSignIn(true);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to sign up');
    } finally { setLoading(false); }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.7rem 0.875rem 0.7rem 2.5rem',
    background: '#0f1117', border: '1px solid #1e2635', borderRadius: '9px',
    color: '#e2e8f0', fontSize: '0.875rem', outline: 'none',
    transition: 'border-color 0.18s, box-shadow 0.18s', marginBottom: 0,
  };
  const iconStyle: React.CSSProperties = {
    position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)',
    color: '#374151', pointerEvents: 'none',
  };

  return (
    <div style={{ width: '100%', maxWidth: '24rem', animation: 'fadeInUp 0.4s ease' }}>
      <style>{`@keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }`}</style>

      {/* Logo */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem', gap: '0.75rem' }}>
        <div style={{
          width: 52, height: 52, background: 'linear-gradient(135deg, #6366f1, #818cf8)',
          borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 28px rgba(99,102,241,0.35)',
        }}>
          <Package2 size={26} color="#fff" />
        </div>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>RM Tracker</h1>
          <p style={{ fontSize: '0.8rem', color: '#374151', marginTop: '0.2rem' }}>Raw Material Management System</p>
        </div>
      </div>

      {/* Card */}
      <div style={{ background: '#161b27', border: '1px solid #1e2635', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #1e2635' }}>
          {(['Sign In', 'Sign Up'] as const).map((label, i) => {
            const active = isSignIn ? i === 0 : i === 1;
            return (
              <button
                key={label}
                onClick={() => { setIsSignIn(i === 0); setError(''); setSuccess(''); }}
                style={{
                  flex: 1, padding: '0.875rem', border: 'none', cursor: 'pointer',
                  background: active ? 'transparent' : '#0f1117',
                  color: active ? '#818cf8' : '#374151',
                  fontWeight: active ? 700 : 500,
                  fontSize: '0.875rem',
                  borderBottom: active ? '2px solid #6366f1' : '2px solid transparent',
                  transition: 'color 0.2s, background 0.2s',
                  marginBottom: active ? -1 : 0,
                }}
              >{label}</button>
            );
          })}
        </div>

        <div style={{ padding: '1.75rem' }}>
          {/* Alerts */}
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '0.65rem 0.875rem', marginBottom: '1.1rem', fontSize: '0.82rem', color: '#f87171' }}>
              <AlertCircle size={14} style={{ flexShrink: 0 }} /> {error}
            </div>
          )}
          {success && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', padding: '0.65rem 0.875rem', marginBottom: '1.1rem', fontSize: '0.82rem', color: '#34d399' }}>
              <CheckCircle size={14} style={{ flexShrink: 0 }} /> {success}
            </div>
          )}

          {isSignIn ? (
            <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={iconStyle} />
                  <input type="email" name="email" placeholder="you@example.com" required style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.14)'; }}
                    onBlur={e => { e.target.style.borderColor = '#1e2635'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={iconStyle} />
                  <input type="password" name="password" placeholder="••••••••" required style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.14)'; }}
                    onBlur={e => { e.target.style.borderColor = '#1e2635'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '0.75rem', marginTop: '0.25rem' }}>
                {loading ? 'Signing in...' : <><span>Sign In</span><ArrowRight size={15} /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {[
                { label: 'Full Name', name: 'name', type: 'text', placeholder: 'John Doe', icon: User },
                { label: 'Email', name: 'email', type: 'email', placeholder: 'you@example.com', icon: Mail },
                { label: 'Password', name: 'password', type: 'password', placeholder: '••••••••', icon: Lock },
                { label: 'Designation', name: 'role', type: 'text', placeholder: 'e.g., Manager, Analyst', icon: Briefcase },
              ].map(({ label, name, type, placeholder, icon: Icon }) => (
                <div key={name}>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>{label}</label>
                  <div style={{ position: 'relative' }}>
                    <Icon size={15} style={iconStyle} />
                    <input type={type} name={name} placeholder={placeholder} required style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.14)'; }}
                      onBlur={e => { e.target.style.borderColor = '#1e2635'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                </div>
              ))}
              <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '0.75rem', marginTop: '0.25rem' }}>
                {loading ? 'Creating account...' : <><span>Create Account</span><ArrowRight size={15} /></>}
              </button>
            </form>
          )}
        </div>
      </div>

      <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.75rem', color: '#374151' }}>
        Autocrat Engineers • Warehouse Management System
      </p>
    </div>
  );
}
