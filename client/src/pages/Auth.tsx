import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Auth({ onLogin }: { onLogin: () => void }) {
  const [isSignIn, setIsSignIn] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    try {
      await axios.post('/api/signin', Object.fromEntries(data));
      onLogin();
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to sign in');
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    try {
      const res = await axios.post('/api/signup', Object.fromEntries(data));
      setSuccess(res.data.message);
      setIsSignIn(true);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to sign up');
    }
  };

  return (
    <div className="auth-panel card" style={{ marginTop: '40px' }}>
      <h3>🔐 Sign In / Sign Up</h3>
      
      {error && <p style={{ color: 'var(--danger)', marginBottom: '10px' }}>{error}</p>}
      {success && <p style={{ color: 'var(--success)', marginBottom: '10px' }}>{success}</p>}

      <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
        <button 
          className="btn-primary" 
          style={{ opacity: isSignIn ? 1 : 0.7 }}
          onClick={() => { setIsSignIn(true); setError(''); setSuccess(''); }}
        >
          Sign In
        </button>
        <button 
          className="btn-primary" 
          style={{ opacity: !isSignIn ? 1 : 0.7 }}
          onClick={() => { setIsSignIn(false); setError(''); setSuccess(''); }}
        >
          Sign Up
        </button>
      </div>

      {isSignIn ? (
        <form onSubmit={handleSignIn}>
          <input type="email" name="email" placeholder="Email" required />
          <input type="password" name="password" placeholder="Password" required />
          <button className="btn-primary" type="submit">Sign In</button>
        </form>
      ) : (
        <form onSubmit={handleSignUp}>
          <input type="text" name="name" placeholder="Full Name" required />
          <input type="email" name="email" placeholder="Email" required />
          <input type="password" name="password" placeholder="Password" required />
          <input type="text" name="role" placeholder="Designation (e.g., Manager, Analyst)" required />
          <button className="btn-primary" type="submit">Sign Up</button>
        </form>
      )}
    </div>
  );
}
