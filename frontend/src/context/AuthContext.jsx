import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const u = sessionStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  });

  const [superadminUser, setSuperadminUser] = useState(() => {
    try {
      const sa = sessionStorage.getItem('superadmin_user');
      return sa ? JSON.parse(sa) : null;
    } catch {
      return null;
    }
  });

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return sessionStorage.getItem('isLoggedIn') === 'true';
  });

  const loginUser = (userData) => {
    sessionStorage.setItem('user', JSON.stringify(userData));
    sessionStorage.setItem('isLoggedIn', 'true');
    setUser(userData);
    setIsLoggedIn(true);
  };

  const loginSuperadmin = (saData) => {
    sessionStorage.setItem('superadmin_user', JSON.stringify(saData));
    setSuperadminUser(saData);
  };

  const logout = () => {
    sessionStorage.clear();
    localStorage.clear();
    setUser(null);
    setSuperadminUser(null);
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ user, superadminUser, isLoggedIn, loginUser, loginSuperadmin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
