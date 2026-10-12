// ============================================================
//  OrganizerDashboard.js
// ============================================================

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import API from '../api';

const CATEGORIES = ['Concert', 'Comedy Show', 'Theatre', 'Sports', 'Workshop', 'Other'];

export default function OrganizerDashboard() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('events');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]   = useState({ title: '', description: '', category: 'Concert', venue: '', city: '', event_date: '', event_time: '', total_seats: 100, ticket_price: 0, image_url: '' });
  const [formMsg, setFormMsg] = useState('');
  const [formErr, setFormErr] = useState('');
  const [saving, setSaving]   = useState(false);

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    try {
      const res = await API.get('/organizer-events');
      setEvents(res.data);
    } catch {}
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormMsg(''); setFormErr(''); setSaving(true);
    try {
      await API.post('/create-event', form);
      setFormMsg('Event created successfully!');
      fetchEvents();
      setTimeout(() => { setShowModal(false); setFormMsg(''); setForm({ title: '', description: '', category: 'Concert', venue: '', city: '', event_date: '', event_time: '', total_seats: 100, ticket_price: 0, image_url: '' }); }, 1500);
    } catch (err) {
      setFormErr(err.response?.data?.error || 'Failed to create event');
    } finally { setSaving(false); }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const totalTicketsSold = events.reduce((s, e) => s + Number(e.tickets_sold || 0), 0);
  const totalRevenue     = events.reduce((s, e) => s + Number(e.revenue || 0), 0);
  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="dashboard-grid">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{user?.name?.[0]?.toUpperCase()}</div>
          <p className="sidebar-name">{user?.name}</p>
          <p className="sidebar-role">Organizer</p>
          {user?.organization && <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{user.organization}</p>}
        </div>
        <ul className="sidebar-nav">
          <li><a href="#events"  className={activeTab === 'events'  ? 'active' : ''} onClick={() => setActiveTab('events')}>🎪 My Events</a></li>
          <li><a href="#history" className={activeTab === 'history' ? 'active' : ''} onClick={() => setActiveTab('history')}>📊 Statistics</a></li>
          <li><a href="#logout" onClick={handleLogout} style={{ color: 'var(--accent-red)' }}>🚪 Logout</a></li>
        </ul>
      </aside>

      {/* Main */}
      <main className="dashboard-content">
        {/* Stats */}
        <div className="stats-grid" style={{ marginBottom: '2rem' }}>
          {[
            { icon: '🎪', label: 'Total Events',   value: events.length },
            { icon: '🎫', label: 'Tickets Sold',   value: totalTicketsSold },
            { icon: '💰', label: 'Total Revenue',  value: `₹${totalRevenue.toLocaleString('en-IN')}` },
            { icon: '✅', label: 'Active Events',  value: events.filter(e => e.status === 'active').length },
          ].map(s => (
            <div className="stat-card" key={s.label}>
              <div className="stat-icon">{s.icon}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* My Events Tab */}
        {activeTab === 'events' && (
          <>
            <div className="page-header">
              <div>
                <h2>My Events</h2>
                <p>Events you've created</p>
              </div>
              <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Create Event</button>
            </div>

            {loading ? <div className="spinner" /> : events.length === 0 ? (
              <div className="empty-state">
                <div className="emoji">🎪</div>
                <h3>No events yet</h3>
                <p>Create your first event to get started!</p>
                <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setShowModal(true)}>Create Event</button>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Date</th>
                      <th>Category</th>
                      <th>Seats</th>
                      <th>Sold</th>
                      <th>Revenue</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map(e => (
                      <tr key={e.id}>
                        <td>
                          <p style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{e.title}</p>
                          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{e.city}</p>
                        </td>
                        <td>{formatDate(e.event_date)}</td>
                        <td><span className="badge badge-amber">{e.category}</span></td>
                        <td>{e.available_seats} / {e.total_seats}</td>
                        <td>{e.tickets_sold}</td>
                        <td>₹{Number(e.revenue || 0).toLocaleString('en-IN')}</td>
                        <td><span className={`badge ${e.status === 'active' ? 'badge-green' : 'badge-red'}`}>{e.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Statistics Tab */}
        {activeTab === 'history' && (
          <>
            <div className="page-header">
              <div>
                <h2>Event Statistics</h2>
                <p>Performance overview of your events</p>
              </div>
            </div>
            {events.length === 0 ? (
              <div className="empty-state">
                <div className="emoji">📊</div>
                <h3>No data yet</h3>
                <p>Create events to see statistics here.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {events.map(e => {
                  const sold    = Number(e.tickets_sold || 0);
                  const percent = Math.round((sold / e.total_seats) * 100);
                  return (
                    <div key={e.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <div>
                          <h4 style={{ marginBottom: '0.2rem' }}>{e.title}</h4>
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{formatDate(e.event_date)} · {e.city}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontWeight: 700, color: 'var(--accent-gold)' }}>₹{Number(e.revenue || 0).toLocaleString('en-IN')}</p>
                          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Revenue</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.4rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{sold} / {e.total_seats} tickets sold</span>
                        <span style={{ color: percent > 80 ? 'var(--accent-red)' : 'var(--accent-gold)' }}>{percent}%</span>
                      </div>
                      <div className="seats-bar">
                        <div className={`seats-bar-fill ${percent > 80 ? '' : ''}`} style={{ width: `${percent}%`, background: percent > 80 ? 'var(--accent-gold)' : 'var(--accent-blue)' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* Create Event Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '620px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create New Event</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            {formErr && <div className="alert alert-error">⚠️ {formErr}</div>}
            {formMsg && <div className="alert alert-success">✅ {formMsg}</div>}

            <form onSubmit={handleCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Event Title *</label>
                  <input className="form-control" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Arijit Singh Live" required />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Description</label>
                  <textarea className="form-control" rows="3" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Describe your event..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-control" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input className="form-control" value={form.city} onChange={e => setForm({...form, city: e.target.value})} placeholder="e.g. Mumbai" required />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Venue</label>
                  <input className="form-control" value={form.venue} onChange={e => setForm({...form, venue: e.target.value})} placeholder="e.g. MMRDA Grounds, BKC" />
                </div>
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input className="form-control" type="date" value={form.event_date} onChange={e => setForm({...form, event_date: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Time *</label>
                  <input className="form-control" type="time" value={form.event_time} onChange={e => setForm({...form, event_time: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Total Seats *</label>
                  <input className="form-control" type="number" min="1" value={form.total_seats} onChange={e => setForm({...form, total_seats: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Ticket Price (₹)</label>
                  <input className="form-control" type="number" min="0" value={form.ticket_price} onChange={e => setForm({...form, ticket_price: e.target.value})} placeholder="0 for FREE" />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Image URL</label>
                  <input className="form-control" value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} placeholder="https://..." />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create Event'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
