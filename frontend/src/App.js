// ============================================================
//  App.js - Main Router
// ============================================================

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import './styles/global.css';

// Components
import Navbar from './components/Navbar';

// Pages
import HomePage              from './pages/HomePage';
import LoginPage             from './pages/LoginPage';
import RegisterPage          from './pages/RegisterPage';
import OrganizerRegisterPage from './pages/OrganizerRegisterPage';
import EventDetailPage       from './pages/EventDetailPage';
import UserDashboard         from './pages/UserDashboard';
import OrganizerDashboard    from './pages/OrganizerDashboard';
import AdminDashboard        from './pages/AdminDashboard';
import ProfilePage           from './pages/ProfilePage';

// ========================
//  Protected Route Helper
// ========================
function ProtectedRoute({ children, allowedRole }) {
  const { user, role } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRole && role !== allowedRole) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/"                   element={<HomePage />} />
        <Route path="/login"              element={<LoginPage />} />
        <Route path="/register"           element={<RegisterPage />} />
        <Route path="/organizer-register" element={<OrganizerRegisterPage />} />
        <Route path="/events/:id"         element={<EventDetailPage />} />

        <Route path="/dashboard" element={
          <ProtectedRoute allowedRole="user"><UserDashboard /></ProtectedRoute>
        } />
        <Route path="/organizer" element={
          <ProtectedRoute allowedRole="organizer"><OrganizerDashboard /></ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>
        } />

        <Route path="/profile" element={
          <ProtectedRoute><ProfilePage /></ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
