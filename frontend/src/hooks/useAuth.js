import { useState, useEffect }  from 'react';
import { API_BASE_URL }        from '../lib/constants.js';
import { syncNow }             from '../lib/syncEngine.js';
import { clearDatabaseData }   from '../lib/db.js';

async function hashPassword(password) {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

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
   * Online: calls backend API, caches token + user + hashed password.
   * Clears old business data if switching to a new business ID.
   */
  const handleLogin = async ({ businessId, username, password }) => {
    setAuthError('');
    setSyncMessage(null);

    const hashedInput = await hashPassword(password);

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
        
        // Multi-tenant isolation: Clear local IndexedDB if switching to a different business
        const prevBusinessId = localStorage.getItem('ebos_active_business_id');
        if (prevBusinessId !== data.user.businessId) {
          console.log(`[Auth] New business detected (${data.user.businessId}). Clearing old local data.`);
          await clearDatabaseData();
          localStorage.setItem('ebos_active_business_id', data.user.businessId);
        }

        localStorage.setItem('ebos_token', data.access_token);
        
        // Cache user info and securely cache hashed password for offline fallback
        const cacheData = { ...data.user, offlineHash: hashedInput };
        localStorage.setItem('ebos_user', JSON.stringify(cacheData));
        setUser(data.user);

        // Immediately sync after login to populate local DB with this business's data ONLY
        const syncResult = await syncNow();
        if (syncResult.success) {
          setSyncMessage({ type: 'success', text: 'Logged in! Business data isolated & synced.' });
        }
      } catch (err) {
        setAuthError(err.message || 'Network error. Could not reach auth server.');
      }
    } else {
      // Offline mode: validate against cached session
      const cached = localStorage.getItem('ebos_user');
      if (cached) {
        const cachedUser = JSON.parse(cached);
        // Validates username, businessId AND the hashed password
        if (
          cachedUser.username === username && 
          cachedUser.businessId === businessId && 
          cachedUser.offlineHash === hashedInput
        ) {
          const { offlineHash, ...safeUser } = cachedUser;
          setUser(safeUser);
          setSyncMessage({ type: 'warning', text: 'Offline login. Sync will resume when connected.' });
          return;
        } else {
          setAuthError('Invalid offline credentials.');
          return;
        }
      }
      setAuthError('Offline login requires a prior successful online session on this device.');
    }
  };

  /**
   * Clears all session data and resets user state.
   */
  const handleLogout = async () => {
    localStorage.removeItem('ebos_token');
    localStorage.removeItem('ebos_user');
    localStorage.removeItem('ebos_active_business_id');
    await clearDatabaseData();
    setUser(null);
  };

  return { user, authError, handleLogin, handleLogout };
}
