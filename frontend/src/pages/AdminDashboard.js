// ============================================================
//  AdminDashboard.js
// ============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import API from '../api';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats]         = useState(null);
  const [users, setUsers]         = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [events, setEvents]         = useState([]);
  const [loading, setLoading]       = useState(false);

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => {
    if (activeTab === 'users')      fetchUsers();
    if (activeTab === 'organizers') fetchOrganizers();
    if (activeTab === 'events')     fetchEvents();
  }, [activeTab]);

  const fetchStats      = async () => { try { const r = await API.get('/admin/stats');      setStats(r.data); } catch {} };
  const fetchUsers      = async () => { setLoading(true); try { const r = await API.get('/admin/users');      setUsers(r.data); } catch {} finally { setLoading(false); } };
  const fetchOrganizers = async () => { setLoading(true); try { const r = await API.get('/admin/organizers'); setOrganizers(r.data); } catch {} finally { setLoading(false); } };
  const fetchEvents     = async () => { setLoading(true); try { const r = await API.get('/admin/events');     setEvents(r.data); } catch {} finally { setLoading(false); } };

  const handleDelete = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await API.delete(`/events/${eventId}`);
      setEvents(prev => prev.filter(e => e.id !== eventId));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete event');
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };
  const formatDate   = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const tabs = [
    { id: 'overview',    label: '📊 Overview' },
    { id: 'events',      label: '🎪 Events' },
    { id: 'users',       label: '👥 Users' },
    { id: 'organizers',  label: '🎤 Organizers' },
  ];

  return (
    <div className="dashboard-grid">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-user">
          <div className="sidebar-avatar" style={{ background: 'linear-gradient(135deg, #e05c5c, #e8890a)' }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <p className="sidebar-name">{user?.name}</p>
          <p className="sidebar-role" style={{ color: 'var(--accent-red)' }}>Admin</p>
        </div>
        <ul className="sidebar-nav">
          {tabs.map(t => (
            <li key={t.id}>
              <a href={`#${t.id}`} className={activeTab === t.id ? 'active' : ''} onClick={() => setActiveTab(t.id)}>
                {t.label}
              </a>
            </li>
          ))}
          <li>
            <a href="#logout" onClick={handleLogout} style={{ color: 'var(--accent-red)' }}>🚪 Logout</a>
          </li>
        </ul>
      </aside>

      {/* Main */}
      <main className="dashboard-content">

        {/* Overview */}
        {activeTab === 'overview' && (
          <>
            <div className="page-header">
              <div><h2>Admin Overview</h2><p>System-wide statistics</p></div>
            </div>
            {stats && (
              <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
                {[
                  { icon: '👥', label: 'Total Users',      value: stats.total_users },
                  { icon: '🎤', label: 'Organizers',        value: stats.total_organizers },
                  { icon: '🎪', label: 'Active Events',     value: stats.total_events },
                  { icon: '🎫', label: 'Total Bookings',    value: stats.total_bookings },
                  { icon: '💰', label: 'Total Revenue',     value: `₹${Number(stats.total_revenue).toLocaleString('en-IN')}` },
                ].map(s => (
                  <div className="stat-card" key={s.label}>
                    <div className="stat-icon">{s.icon}</div>
                    <div className="stat-value">{s.value}</div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '2rem', marginTop: '1rem' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '1rem' }}>Quick Actions</h3>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {tabs.slice(1).map(t => (
                  <button key={t.id} className="btn btn-secondary" onClick={() => setActiveTab(t.id)}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Events */}
        {activeTab === 'events' && (
          <>
            <div className="page-header">
              <div><h2>All Events</h2><p>Manage all events on the platform</p></div>
            </div>
            {loading ? <div className="spinner" /> : events.length === 0 ? (
              <div className="empty-state"><div className="emoji">🎪</div><h3>No events found</h3></div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Organizer</th>
                      <th>Date</th>
                      <th>Category</th>
                      <th>Seats</th>
                      <th>Price</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map(e => (
                      <tr key={e.id}>
                        <td>
                          <p style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{e.title}</p>
                          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{e.city}</p>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>{e.organizer_name}</td>
                        <td>{formatDate(e.event_date)}</td>
                        <td><span className="badge badge-amber">{e.category}</span></td>
                        <td>{e.available_seats}/{e.total_seats}</td>
                        <td>₹{Number(e.ticket_price).toLocaleString('en-IN')}</td>
                        <td><span className={`badge ${e.status === 'active' ? 'badge-green' : 'badge-red'}`}>{e.status}</span></td>
                        <td>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(e.id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Users */}
        {activeTab === 'users' && (
          <>
            <div className="page-header">
              <div><h2>All Users</h2><p>Registered user accounts</p></div>
              <span className="badge badge-blue">{users.length} users</span>
            </div>
            {loading ? <div className="spinner" /> : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr><th>#</th><th>Name</th><th>Email</th><th>Phone</th><th>Joined</th></tr>
                  </thead>
                  <tbody>
                    {users.map((u, i) => (
                      <tr key={u.id}>
                        <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                        <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{u.name}</td>
                        <td>{u.email}</td>
                        <td>{u.phone || '—'}</td>
                        <td>{formatDate(u.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Organizers */}
        {activeTab === 'organizers' && (
          <>
            <div className="page-header">
              <div><h2>All Organizers</h2><p>Registered organizer accounts</p></div>
              <span className="badge badge-amber">{organizers.length} organizers</span>
            </div>
            {loading ? <div className="spinner" /> : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr><th>#</th><th>Name</th><th>Email</th><th>Organization</th><th>Phone</th><th>Joined</th></tr>
                  </thead>
                  <tbody>
                    {organizers.map((o, i) => (
                      <tr key={o.id}>
                        <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                        <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{o.name}</td>
                        <td>{o.email}</td>
                        <td>{o.organization || '—'}</td>
                        <td>{o.phone || '—'}</td>
                        <td>{formatDate(o.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

      </main>
    </div>
  );
}
