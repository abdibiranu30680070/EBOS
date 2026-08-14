// ─────────────────────────────────────────────
// useSync — Manual & auto background sync
// Returns: { syncing, syncMessage, triggerSync, clearSyncMessage }
// ─────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { syncNow, startAutoSync, stopAutoSync } from '../lib/syncEngine.js';

export function useSync() {
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);

  // Start background heartbeat on mount
  useEffect(() => {
    startAutoSync(20000);
    return () => stopAutoSync();
  }, []);

  /**
   * Manually trigger a sync cycle.
   * Sets syncing state and updates syncMessage with result.
   */
  const triggerSync = async () => {
    setSyncing(true);
    setSyncMessage(null);
    const result = await syncNow();
    setSyncing(false);
    setSyncMessage(
      result.success
        ? { type: 'success', text: result.message }
        : { type: 'danger',  text: result.message }
    );
  };

  const clearSyncMessage = () => setSyncMessage(null);

  return { syncing, syncMessage, triggerSync, clearSyncMessage, setSyncMessage };
}
