// ============================================================
//  EventCard.js
// ============================================================

import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function EventCard({ event }) {
  const navigate = useNavigate();

  const seatsPercent = Math.round((event.available_seats / event.total_seats) * 100);
  const isLow        = seatsPercent < 20;
  const isFull       = event.available_seats === 0;

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h);
    return `${hour > 12 ? hour - 12 : hour}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  return (
    <div className="card event-card" onClick={() => navigate(`/events/${event.id}`)}>
      <div className="event-card-image">
        <img
          src={event.image_url || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800'}
          alt={event.title}
          onError={e => { e.target.src = 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800'; }}
        />
        <span className="event-card-badge">{event.category}</span>
        <span className="event-card-price">
          {event.ticket_price > 0 ? `₹${Number(event.ticket_price).toLocaleString('en-IN')}` : 'FREE'}
        </span>
      </div>

      <div className="card-body">
        <h3 className="card-title">{event.title}</h3>
        <p className="card-text" style={{ marginBottom: '0.75rem' }}>
          {event.description?.slice(0, 90)}...
        </p>

        <div className="event-meta">
          <span className="event-meta-item">
            <span className="icon">📅</span>
            {formatDate(event.event_date)}
          </span>
          <span className="event-meta-item">
            <span className="icon">⏰</span>
            {formatTime(event.event_time)}
          </span>
          <span className="event-meta-item">
            <span className="icon">📍</span>
            {event.city}
          </span>
        </div>

        {/* Seats bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginTop: '0.5rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>
            {isFull ? '🔴 Sold Out' : `${event.available_seats} seats left`}
          </span>
          <span style={{ color: isLow ? 'var(--accent-red)' : 'var(--text-muted)' }}>
            {seatsPercent}%
          </span>
        </div>
        <div className="seats-bar">
          <div
            className={`seats-bar-fill ${isLow ? 'low' : ''}`}
            style={{ width: `${seatsPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
