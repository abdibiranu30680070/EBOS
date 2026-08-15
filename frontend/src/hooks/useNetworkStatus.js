// ─────────────────────────────────────────────
// useNetworkStatus — Native & Web network tracking
// Returns: { isOnline: boolean }
// ─────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { Network }             from '@capacitor/network';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    let networkListener = null;

    // Initialize with Capacitor native network check
    Network.getStatus().then(status => {
      setIsOnline(status.connected);
    }).catch(() => {
      setIsOnline(navigator.onLine);
    });

    // Listen to native network state changes (WiFi / Cellular / Offline)
    Network.addListener('networkStatusChange', status => {
      setIsOnline(status.connected);
    }).then(handle => {
      networkListener = handle;
    }).catch(() => {});

    // Fallback browser window events
    const onOnline  = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);

    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
      if (networkListener) networkListener.remove();
      window.removeEventListener('online',  onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  return { isOnline };
}
