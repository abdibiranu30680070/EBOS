// ─────────────────────────────────────────────
// useStockBalances — Live stock calculation
// Aggregates inventoryMovements into product totals
// Returns: { stockBalances: { [productId]: number } }
// ─────────────────────────────────────────────

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db.js';

export function useStockBalances() {
  const stockBalances = useLiveQuery(async () => {
    const movements = await db.inventoryMovements.toArray();
    const balances  = {};

    for (const mv of movements) {
      balances[mv.productId] = (balances[mv.productId] || 0) + mv.quantityDelta;
    }

    return balances;
  }) || {};

  return { stockBalances };
}
