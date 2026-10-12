// ============================================================
//  UserDashboard.js
// ============================================================

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import API from '../api';

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState('bookings');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await API.get('/user-bookings');
      setBookings(res.data);
    } catch {}
    finally { setLoading(false); }
  };

const handleCancel = async (bookingId, totalTickets) => {
    const input = window.prompt(
      `You have ${totalTickets} ticket(s) booked.\nHow many tickets do you want to cancel? (1 - ${totalTickets})`
    );

    if (input === null) return; // user clicked Cancel on prompt

    const ticketsToCancel = parseInt(input);

    if (isNaN(ticketsToCancel) || ticketsToCancel < 1 || ticketsToCancel > totalTickets) {
      alert(`Please enter a valid number between 1 and ${totalTickets}`);
      return;
    }

    if (!window.confirm(`Are you sure you want to cancel ${ticketsToCancel} ticket(s)?`)) return;

    try {
      const res = await API.put(`/cancel-booking/${bookingId}`, {
        tickets_to_cancel: ticketsToCancel
      });
      alert(res.data.message);
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to cancel booking');
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const upcoming  = bookings.filter(b => new Date(b.event_date) >= new Date() && b.status === 'confirmed');
  const past      = bookings.filter(b => new Date(b.event_date) < new Date()  || b.status === 'cancelled');
  const totalSpent = bookings.filter(b => b.status === 'confirmed').reduce((s, b) => s + parseFloat(b.total_price || 0), 0);

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="dashboard-grid">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{user?.name?.[0]?.toUpperCase()}</div>
          <p className="sidebar-name">{user?.name}</p>
          <p className="sidebar-role">User</p>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{user?.email}</p>
        </div>
        <ul className="sidebar-nav">
          <li>
            <a href="#bookings" className={activeTab === 'bookings' ? 'active' : ''} onClick={() => setActiveTab('bookings')}>
              🎫 My Bookings
            </a>
          </li>
          <li>
            <a href="#history" className={activeTab === 'history' ? 'active' : ''} onClick={() => setActiveTab('history')}>
              📋 History
            </a>
          </li>
          <li>
            <Link to="/">🔍 Browse Events</Link>
          </li>
          <li>
            <a href="#logout" onClick={handleLogout} style={{ color: 'var(--accent-red)' }}>
              🚪 Logout
            </a>
          </li>
        </ul>
      </aside>

      {/* Main Content */}
      <main className="dashboard-content">
        {/* Stats */}
        <div className="stats-grid" style={{ marginBottom: '2rem' }}>
          {[
            { icon: '🎫', label: 'Total Bookings', value: bookings.length },
            { icon: '📅', label: 'Upcoming Events', value: upcoming.length },
            { icon: '💰', label: 'Amount Spent', value: `₹${totalSpent.toLocaleString('en-IN')}` },
            { icon: '✅', label: 'Confirmed', value: bookings.filter(b => b.status === 'confirmed').length },
          ].map(s => (
            <div className="stat-card" key={s.label}>
              <div className="stat-icon">{s.icon}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* My Bookings */}
        {activeTab === 'bookings' && (
          <>
            <div className="page-header">
              <div>
                <h2>My Bookings</h2>
                <p>Your upcoming and confirmed events</p>
              </div>
              <Link to="/" className="btn btn-primary btn-sm">+ Find Events</Link>
            </div>

            {loading ? <div className="spinner" /> :
              upcoming.length === 0 ? (
                <div className="empty-state">
                  <div className="emoji">🎭</div>
                  <h3>No upcoming bookings</h3>
                  <p>Browse events and book your first ticket!</p>
                  <Link to="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>Browse Events</Link>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {upcoming.map(b => (
                     <BookingRow key={b.id} booking={b} formatDate={formatDate} onCancel={handleCancel} />
                    ))}
                </div>
              )
            }
          </>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <>
            <div className="page-header">
              <div>
                <h2>Booking History</h2>
                <p>All your past events</p>
              </div>
            </div>

            {loading ? <div className="spinner" /> :
              past.length === 0 ? (
                <div className="empty-state">
                  <div className="emoji">📋</div>
                  <h3>No history yet</h3>
                  <p>Your attended events will appear here.</p>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Event</th>
                        <th>Date</th>
                        <th>Tickets</th>
                        <th>Paid</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {past.map(b => (
                        <tr key={b.id}>
                          <td>
                            <p style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{b.title}</p>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{b.venue}, {b.city}</p>
                          </td>
                          <td>{formatDate(b.event_date)}</td>
                          <td>{b.tickets_booked}</td>
                          <td>₹{parseFloat(b.total_price || 0).toLocaleString('en-IN')}</td>
                          <td>
                            <span className={`badge ${b.status === 'confirmed' ? 'badge-green' : 'badge-red'}`}>
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            }
          </>
        )}
      </main>
    </div>
  );
}

function BookingRow({ booking, formatDate, onCancel }) {
  const isUpcoming = new Date(booking.event_date) >= new Date();
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1.25rem', display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
      <img
        src={booking.image_url || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=200'}
        alt={booking.title}
        style={{ width: 80, height: 80, borderRadius: 'var(--radius-sm)', objectFit: 'cover', flexShrink: 0 }}
        onError={e => { e.target.src = 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=200'; }}
      />
      <div style={{ flex: 1 }}>
        <h4 style={{ marginBottom: '0.3rem' }}>{booking.title}</h4>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
          📅 {formatDate(booking.event_date)} &nbsp;·&nbsp; 📍 {booking.venue}, {booking.city}
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="badge badge-blue">🎫 {booking.tickets_booked} ticket{booking.tickets_booked > 1 ? 's' : ''}</span>
          <span className="badge badge-amber">₹{parseFloat(booking.total_price || 0).toLocaleString('en-IN')}</span>
          <span className={`badge ${booking.status === 'confirmed' ? 'badge-green' : 'badge-red'}`}>{booking.status}</span>
          {isUpcoming && <span className="badge badge-blue">Upcoming</span>}
          {booking.status === 'confirmed' && isUpcoming && (
          <button
            className="btn btn-danger btn-sm"
            onClick={() => onCancel(booking.id)}
          >
              Cancel
          </button>
               )}
        </div>
      </div>
    </div>
  );
}
