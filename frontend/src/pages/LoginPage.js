// ============================================================
//  LoginPage.js - Unified login for User / Organizer / Admin
// ============================================================

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import API from '../api';

export default function LoginPage() {
  const [role, setRole]       = useState('user');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await API.post('/login', { email, password, role });
      login(res.data.user, res.data.role, res.data.token);

      if (res.data.role === 'admin')     navigate('/admin');
      else if (res.data.role === 'organizer') navigate('/organizer');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>EventPro</h1>
          <p>Your gateway to amazing events</p>
        </div>

        {/* Role Tabs */}
        <div className="auth-tabs">
          {['user', 'organizer', 'admin'].map(r => (
            <button
              key={r}
              className={`auth-tab ${role === r ? 'active' : ''}`}
              onClick={() => { setRole(r); setError(''); }}
            >
              {r === 'user' ? '🙋 User' : r === 'organizer' ? '🎤 Organizer' : '🔑 Admin'}
            </button>
          ))}
        </div>

        {error && <div className="alert alert-error">⚠️ {error}</div>}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              className="form-control"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-control"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
            {loading ? 'Logging in...' : `Login as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
          </button>
        </form>

        {role === 'user' && (
          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--accent-gold)' }}>Sign up</Link>
          </p>
        )}
        {role === 'organizer' && (
          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            New organizer?{' '}
            <Link to="/organizer-register" style={{ color: 'var(--accent-gold)' }}>Register here</Link>
          </p>
        )}
        {role === 'admin' && (
          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Default: admin@eventpro.com / admin123
          </p>
        )}
      </div>
    </div>
  );
}
