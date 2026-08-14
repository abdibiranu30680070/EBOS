// ─────────────────────────────────────────────
// usePendingSync — Live count of unsynced records
// Returns: { pendingCount, hasPending }
// Used by Header to show a badge on the sync button
// ─────────────────────────────────────────────

import { useLiveQuery } from 'dexie-react-hooks';
import { db }           from '../lib/db.js';

export function usePendingSync() {
  const pendingCount = useLiveQuery(async () => {
    const [customers, orders, payments, movements] = await Promise.all([
      db.customers.where('syncStatus').equals('PENDING').count(),
      db.salesOrders.where('syncStatus').equals('PENDING').count(),
      db.customerPayments.where('syncStatus').equals('PENDING').count(),
      db.inventoryMovements.where('syncStatus').equals('PENDING').count(),
    ]);
    return customers + orders + payments + movements;
  }) ?? 0;

  return {
    pendingCount,
    hasPending: pendingCount > 0,
  };
}
