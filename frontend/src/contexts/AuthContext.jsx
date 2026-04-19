import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService.js';

const AuthContext = createContext(null);

// DB role enum (PASSENGER, ADMIN, SUPER_ADMIN, OPERATOR) → frontend convention
function normalizeRole(role) {
  const map = {
    PASSENGER:   'passenger',
    ADMIN:       'admin',
    SUPER_ADMIN: 'super_admin',
    OPERATOR:    'operator',
  };
  return map[role] || role?.toLowerCase() || 'passenger';
}

function normalizeUser(raw) {
  if (!raw) return null;
  return { ...raw, role: normalizeRole(raw.role) };
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session from localStorage on mount.
    // Also validate against the server if an access token exists.
    const stored = localStorage.getItem('rugendo-user');
    const token  = localStorage.getItem('rugendo-access-token');

    if (stored && token) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('rugendo-user');
      }
    }
    setLoading(false);
  }, []);

  const _persistUser = (raw) => {
    const normalized = normalizeUser(raw);
    setUser(normalized);
    localStorage.setItem('rugendo-user', JSON.stringify(normalized));
    return normalized;
  };

  const login = async ({ identifier, password }) => {
    const data = await authService.login({ identifier, password });
    const normalized = _persistUser(data.user);
    return { ...data, user: normalized };
  };

  const loginWithGoogle = async (credential) => {
    const data = await authService.googleAuth(credential);
    const normalized = _persistUser(data.user);
    return { ...data, user: normalized };
  };

  const register = async (payload) => {
    return authService.register(payload);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const data = await authService.getMe();
      _persistUser(data.user);
    } catch {
      // Token may have expired — let the interceptor handle it
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, logout, register, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
