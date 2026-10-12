// ============================================================
//  EventDetailPage.js
// ============================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import API from '../api';

function StarRating({ rating, onRate }) {
  const [hover, setHover] = useState(0);
  if (!onRate) {
    return (
      <span className="star-rating">
        {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
      </span>
    );
  }
  return (
    <div className="star-rating input-rating" style={{ display: 'flex', gap: '4px' }}>
      {[1,2,3,4,5].map(n => (
        <span
          key={n}
          style={{ color: n <= (hover || rating) ? 'var(--accent-gold)' : 'var(--text-muted)' }}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onRate(n)}
        >★</span>
      ))}
    </div>
  );
}

export default function EventDetailPage() {
  const { id }      = useParams();
  const { user, role } = useAuth();
  const navigate    = useNavigate();

  const [event, setEvent]     = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const [tickets, setTickets]   = useState(1);
  const [bookMsg, setBookMsg]   = useState('');
  const [bookErr, setBookErr]   = useState('');
  const [booking, setBooking]   = useState(false);

  const [waitMsg, setWaitMsg]   = useState('');
  const [waitErr, setWaitErr]   = useState('');

  const [rating, setRating]   = useState(0);
  const [comment, setComment] = useState('');
  const [reviewMsg, setReviewMsg] = useState('');
  const [reviewErr, setReviewErr] = useState('');

  useEffect(() => {
    fetchEvent();
    fetchReviews();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const res = await API.get(`/events/${id}`);
      setEvent(res.data);
    } catch { navigate('/'); }
    finally { setLoading(false); }
  };

  const fetchReviews = async () => {
    try {
      const res = await API.get(`/reviews/${id}`);
      setReviews(res.data);
    } catch {}
  };

  const handleBook = async () => {
    if (!user) { navigate('/login'); return; }
    setBookMsg(''); setBookErr(''); setBooking(true);
    try {
      const res = await API.post('/book-ticket', { event_id: id, tickets_booked: tickets });
      setBookMsg(res.data.message);
      fetchEvent();
    } catch (err) {
      setBookErr(err.response?.data?.error || 'Booking failed');
    } finally { setBooking(false); }
  };

  const handleWaitlist = async () => {
    if (!user) { navigate('/login'); return; }
    setWaitMsg(''); setWaitErr('');
    try {
      const res = await API.post('/join-waitlist', { event_id: id, tickets_requested: tickets });
      setWaitMsg(res.data.message);
    } catch (err) {
      setWaitErr(err.response?.data?.error || 'Failed to join waitlist');
    }
  };

  const handleReview = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    setReviewMsg(''); setReviewErr('');
    if (!rating) { setReviewErr('Please select a rating'); return; }
    try {
      await API.post('/add-review', { event_id: id, rating, comment });
      setReviewMsg('Review submitted successfully!');
      setRating(0); setComment('');
      fetchReviews();
    } catch (err) {
      setReviewErr(err.response?.data?.error || 'Failed to submit review');
    }
  };

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;
  if (!event)  return null;

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const formatTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hour = parseInt(h);
    return `${hour > 12 ? hour - 12 : hour}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  const isFull = event.available_seats === 0;
  const price  = Number(event.ticket_price);

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>

      {/* Hero Image */}
      <div className="event-detail-hero">
        <img
          src={event.image_url || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1200'}
          alt={event.title}
          onError={e => { e.target.src = 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1200'; }}
        />
        <div className="event-detail-hero-overlay">
          <span className="badge badge-amber" style={{ width: 'fit-content', marginBottom: '0.5rem' }}>
            {event.category}
          </span>
          <h1>{event.title}</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            By {event.organizer_name} {event.organization ? `· ${event.organization}` : ''}
          </p>
        </div>
      </div>

      <div className="event-info-grid">
        {/* Left: Info + Reviews */}
        <div>
          {/* Event Details */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.75rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '1.25rem' }}>Event Details</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
              {[
                { icon: '📅', label: 'Date',  value: formatDate(event.event_date) },
                { icon: '⏰', label: 'Time',  value: formatTime(event.event_time) },
                { icon: '📍', label: 'Venue', value: `${event.venue}, ${event.city}` },
                { icon: '💺', label: 'Seats', value: `${event.available_seats} / ${event.total_seats} available` },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.15rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</p>
                    <p style={{ fontSize: '0.9rem', fontWeight: '500' }}>{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '0.75rem', fontSize: '1.1rem' }}>About this Event</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>{event.description}</p>
          </div>

          {/* Reviews Section */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)' }}>Reviews</h2>
              {avgRating && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ color: 'var(--accent-gold)', fontSize: '1.1rem' }}>★</span>
                  <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>{avgRating}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>({reviews.length})</span>
                </div>
              )}
            </div>

            {/* Add Review Form */}
            {role === 'user' && (
              <form onSubmit={handleReview} style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.5rem' }}>
                <h4 style={{ marginBottom: '0.75rem', fontSize: '0.95rem' }}>Write a Review</h4>
                {reviewErr && <div className="alert alert-error" style={{ marginBottom: '0.75rem' }}>⚠️ {reviewErr}</div>}
                {reviewMsg && <div className="alert alert-success" style={{ marginBottom: '0.75rem' }}>✅ {reviewMsg}</div>}
                <div style={{ marginBottom: '0.75rem' }}>
                  <label className="form-label">Your Rating</label>
                  <StarRating rating={rating} onRate={setRating} />
                </div>
                <div className="form-group">
                  <label className="form-label">Comment</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Share your experience..."
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-sm">Submit Review</button>
              </form>
            )}

            {/* Reviews List */}
            {reviews.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <div className="emoji">💬</div>
                <p>No reviews yet. Be the first to review!</p>
              </div>
            ) : (
              reviews.map(r => (
                <div key={r.id} className="review-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <p className="review-author">{r.user_name}</p>
                    <StarRating rating={r.rating} />
                  </div>
                  <p className="review-date">{new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  {r.comment && <p className="review-text">{r.comment}</p>}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Booking Card */}
        <div className="booking-card">
          <div style={{ marginBottom: '1.25rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Ticket Price</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--accent-gold)' }}>
              {price > 0 ? `₹${price.toLocaleString('en-IN')}` : 'FREE'}
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>per ticket</p>
          </div>

          {bookMsg && <div className="alert alert-success">✅ {bookMsg}</div>}
          {bookErr && <div className="alert alert-error">⚠️ {bookErr}</div>}

          {isFull ? (
            <div>
              <div className="waitlist-badge" style={{ marginBottom: '1rem', display: 'block' }}>
                🔴 This event is sold out
              </div>
              {waitMsg && <div className="alert alert-success">✅ {waitMsg}</div>}
              {waitErr && <div className="alert alert-error">⚠️ {waitErr}</div>}
              <div className="form-group">
                <label className="form-label">Tickets Requested</label>
                <input type="number" className="form-control" min="1" max="10" value={tickets} onChange={e => setTickets(Number(e.target.value))} />
              </div>
              <button className="btn btn-danger" style={{ width: '100%' }} onClick={handleWaitlist}>
                Join Waiting List
              </button>
            </div>
          ) : (
            <div>
              <div className="form-group">
                <label className="form-label">Number of Tickets</label>
                <input
                  type="number" className="form-control"
                  min="1" max={Math.min(10, event.available_seats)}
                  value={tickets}
                  onChange={e => setTickets(Number(e.target.value))}
                />
              </div>
              {price > 0 && (
                <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Total</span>
                  <span style={{ fontWeight: '700', color: 'var(--accent-gold)' }}>₹{(price * tickets).toLocaleString('en-IN')}</span>
                </div>
              )}
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleBook} disabled={booking}>
                {booking ? 'Booking...' : (role === 'user' || !user) ? 'Book Now' : 'Login as User to Book'}
              </button>
              <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                {event.available_seats} seats remaining
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
