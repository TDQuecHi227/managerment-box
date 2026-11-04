import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('boxchat_user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('boxchat_token') || null;
  });

  const [loading, setLoading] = useState(true);

  // Sync token to API requests
  const apiFetch = async (url, options = {}) => {
    const headers = options.headers ? { ...options.headers } : {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    // Only set Content-Type to json if body is not FormData
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(url, { ...options, headers });
    if (res.status === 401) {
      logout();
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }
    return res;
  };

  const login = async (username, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Đăng nhập không thành công');
    }

    localStorage.setItem('boxchat_token', data.token);
    localStorage.setItem('boxchat_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('boxchat_token');
    localStorage.removeItem('boxchat_user');
    setToken(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    if (!token) return;
    try {
      const res = await apiFetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem('boxchat_user', JSON.stringify(data.user));
      }
    } catch (e) {
      console.error('Failed to refresh profile', e);
    }
  };

  useEffect(() => {
    if (token) {
      refreshProfile().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refreshProfile, apiFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

