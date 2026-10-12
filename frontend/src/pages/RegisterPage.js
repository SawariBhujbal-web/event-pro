// ============================================================
//  RegisterPage.js - User Registration
// ============================================================

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api';

export default function RegisterPage() {
  const [form, setForm]     = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await API.post('/register', { name: form.name, email: form.email, phone: form.phone, password: form.password });
      setSuccess('Account created! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>EventPro</h1>
          <p>Create your account</p>
        </div>

        {error   && <div className="alert alert-error">⚠️ {error}</div>}
        {success && <div className="alert alert-success">✅ {success}</div>}

        <form onSubmit={handleSubmit}>
          {[
            { label: 'Full Name',   name: 'name',    type: 'text',     placeholder: 'Your Name' },
            { label: 'Email',       name: 'email',   type: 'email',    placeholder: 'you@example.com' },
            { label: 'Phone',       name: 'phone',   type: 'tel',      placeholder: '9876543210' },
            { label: 'Password',    name: 'password',type: 'password', placeholder: '••••••••' },
            { label: 'Confirm Password', name: 'confirm', type: 'password', placeholder: '••••••••' },
          ].map(f => (
            <div className="form-group" key={f.name}>
              <label className="form-label">{f.label}</label>
              <input
                className="form-control"
                type={f.type}
                name={f.name}
                placeholder={f.placeholder}
                value={form[f.name]}
                onChange={handleChange}
                required={f.name !== 'phone'}
              />
            </div>
          ))}

          <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent-gold)' }}>Login</Link>
        </p>
      </div>
    </div>
  );
}
