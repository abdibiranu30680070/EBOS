// ─────────────────────────────────────────────
// useAuth — Login, logout, offline session cache
// Returns: { user, authError, handleLogin, handleLogout }
// ─────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../lib/constants.js';
import { syncNow } from '../lib/syncEngine.js';

export function useAuth({ isOnline, setSyncMessage }) {
  const [user, setUser]           = useState(null);
  const [authError, setAuthError] = useState('');

  // Restore session from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('ebos_user');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        localStorage.removeItem('ebos_user');
      }
    }
  }, []);

  /**
   * Handles login form submission.
   * Online: calls backend API, caches token + user.
   * Offline: checks previously cached credentials.
   */
  const handleLogin = async ({ businessId, username, password }) => {
    setAuthError('');
    setSyncMessage(null);

    if (isOnline) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ businessId, username, password }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || 'Login failed');
        }

        const data = await res.json();
        localStorage.setItem('ebos_token', data.access_token);
        localStorage.setItem('ebos_user', JSON.stringify(data.user));
        setUser(data.user);

        // Immediately sync after login to populate local DB
        const syncResult = await syncNow();
        if (syncResult.success) {
          setSyncMessage({ type: 'success', text: 'Logged in and database synced!' });
        }
      } catch (err) {
        setAuthError(err.message || 'Network error. Could not reach auth server.');
      }
    } else {
      // Offline mode: validate against cached session
      const cached = localStorage.getItem('ebos_user');
      if (cached) {
        const cachedUser = JSON.parse(cached);
        if (cachedUser.username === username && cachedUser.businessId === businessId) {
          setUser(cachedUser);
          setSyncMessage({ type: 'warning', text: 'Offline login. Sync will resume when connected.' });
          return;
        }
      }
      setAuthError('Offline login requires a prior successful online session on this device.');
    }
  };

  /**
   * Clears all session data and resets user state.
   */
  const handleLogout = () => {
    localStorage.removeItem('ebos_token');
    localStorage.removeItem('ebos_user');
    setUser(null);
  };

  return { user, authError, handleLogin, handleLogout };
}
