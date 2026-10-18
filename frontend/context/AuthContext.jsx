import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getAuthToken, setAuthToken, clearAuthToken } from '../services/api.js';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      if (res.success) {
        setUser(res.user);
      } else {
        clearAuthToken();
        setUser(null);
      }
    } catch {
      clearAuthToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (identifier, password) => {
    const res = await api.login({ identifier, password });
    if (res.token) {
      setAuthToken(res.token);
      setUser(res.user);
    }
  };

  const register = async (payload) => {
    const res = await api.register(payload);
    if (res.token) {
      setAuthToken(res.token);
      setUser(res.user);
    }
  };

  const updateProfile = async (payload) => {
    const res = await api.updateProfile(payload);
    if (res.user) {
      setUser(res.user);
    }
  };

  const logout = () => {
    clearAuthToken();
    setUser(null);
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
