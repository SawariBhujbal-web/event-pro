// ============================================================
//  Navbar.js
// ============================================================

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Navbar() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const dashboardLink = role === 'organizer' ? '/organizer'
                      : role === 'admin'     ? '/admin'
                      : '/dashboard';

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        Event<span>Pro</span>
      </Link>

      <ul className="navbar-links">
        <li><Link to="/">Events</Link></li>

        {user ? (
          <>
            <li><Link to={dashboardLink}>Dashboard</Link></li>
            <li><Link to="/profile">Profile</Link></li>
            <li>
              <button onClick={handleLogout} className="btn-outline-nav">
                Logout
              </button>
            </li>
          </>
        ) : (
          <>
            <li>
              <Link to="/login" className="btn-outline-nav">Login</Link>
            </li>
            <li>
              <Link to="/register" className="btn btn-primary btn-sm">Sign Up</Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}
