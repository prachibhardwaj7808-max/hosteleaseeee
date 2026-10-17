import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('hostelease_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('hostelease_token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sync session on mount
  useEffect(() => {
    const verifySession = async () => {
      const storedToken = localStorage.getItem('hostelease_token');
      if (storedToken) {
        try {
          const res = await authAPI.getMe();
          if (res.success && res.user) {
            setUser(res.user);
            localStorage.setItem('hostelease_user', JSON.stringify(res.user));
          }
        } catch (err) {
          console.warn('Session verification failed, logging out:', err.message);
          logout();
        }
      }
      setLoading(false);
    };

    verifySession();

    const handleAuthExpired = () => {
      logout();
    };

    window.addEventListener('hostelease_auth_expired', handleAuthExpired);
    return () => window.removeEventListener('hostelease_auth_expired', handleAuthExpired);
  }, []);

  const login = async (email, password, expectedRole) => {
    setError(null);
    try {
      const res = await authAPI.login({ email, password, expectedRole });
      if (res.success && res.token && res.user) {
        setToken(res.token);
        setUser(res.user);
        localStorage.setItem('hostelease_token', res.token);
        localStorage.setItem('hostelease_user', JSON.stringify(res.user));
        return { success: true, user: res.user };
      }
      return { success: false, message: res.message || 'Login failed.' };
    } catch (err) {
      const msg = err.data?.message || err.message || 'Failed to connect to server.';
      setError(msg);
      return { success: false, message: msg };
    }
  };

  const register = async (studentData) => {
    setError(null);
    try {
      const res = await authAPI.register(studentData);
      if (res.success && res.token && res.user) {
        setToken(res.token);
        setUser(res.user);
        localStorage.setItem('hostelease_token', res.token);
        localStorage.setItem('hostelease_user', JSON.stringify(res.user));
        return { success: true, user: res.user };
      }
      return { success: false, message: res.message || 'Registration failed.' };
    } catch (err) {
      const msg = err.data?.message || err.message || 'Failed to complete registration.';
      setError(msg);
      return { success: false, message: msg };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setError(null);
    localStorage.removeItem('hostelease_token');
    localStorage.removeItem('hostelease_user');
  };

  const refreshUser = async () => {
    try {
      const res = await authAPI.getMe();
      if (res.success && res.user) {
        setUser(res.user);
        localStorage.setItem('hostelease_user', JSON.stringify(res.user));
      }
    } catch (err) {
      console.warn('Failed to refresh user profile:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role || null,
        isAuthenticated: !!token && !!user,
        loading,
        error,
        clearError: () => setError(null),
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
