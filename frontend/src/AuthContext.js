// ============================================================
//  AuthContext.js
//  Provides login state across the whole app
// ============================================================

import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));
  const [role, setRole]   = useState(() => localStorage.getItem('role') || null);
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);

  const login = (userData, userRole, userToken) => {
    setUser(userData);
    setRole(userRole);
    setToken(userToken);
    localStorage.setItem('user',  JSON.stringify(userData));
    localStorage.setItem('role',  userRole);
    localStorage.setItem('token', userToken);
  };

  const logout = () => {
    setUser(null);
    setRole(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, role, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
