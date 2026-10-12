// ============================================================
//  HomePage.js - Event Listing with filters
// ============================================================

import React, { useState, useEffect } from 'react';
import API from '../api';
import EventCard from '../components/EventCard';

const CATEGORIES = ['All', 'Concert', 'Comedy Show', 'Theatre', 'Sports', 'Workshop', 'Other'];

export default function HomePage() {
  const [events, setEvents]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [category, setCategory]   = useState('All');
  const [search, setSearch]       = useState('');

  useEffect(() => {
    fetchEvents();
  }, [category]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = {};
      if (category !== 'All') params.category = category;
      const res = await API.get('/events', { params });
      setEvents(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = events.filter(e =>
    search === '' ||
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* Hero */}
      <div className="hero">
        <div className="container">
          <h1>Discover <span>Unforgettable</span><br />Experiences</h1>
          <p>Book tickets for concerts, comedy shows, theatre plays, sports and more — all in one place.</p>
        </div>
      </div>

      <div className="container">
        {/* Filter Bar */}
        <div className="filter-bar">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`filter-btn ${category === cat ? 'active' : ''}`}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}

          <div className="search-box">
            <span>🔍</span>
            <input
              placeholder="Search events or city..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="loading-page">
            <div className="spinner" />
            <p>Loading events...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="emoji">🎭</div>
            <h3>No Events Found</h3>
            <p>Try a different category or search term.</p>
          </div>
        ) : (
          <>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', paddingTop: '1rem' }}>
              {filtered.length} event{filtered.length !== 1 ? 's' : ''} found
            </p>
            <div className="events-grid">
              {filtered.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
