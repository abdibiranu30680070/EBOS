// ─────────────────────────────────────────────
// EBOS — Sync Engine
// Handles client ↔ server data synchronization
// Push: uploads PENDING local records
// Pull: downloads server changes since watermark
// ─────────────────────────────────────────────

import { db } from './db.js';
import { API_BASE_URL } from './constants.js';

// ─── Auth Header Helper ───────────────────────
function getAuthHeaders() {
  const token = localStorage.getItem('ebos_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Main Sync Function ───────────────────────
export async function syncNow() {
  if (!navigator.onLine) {
    return { success: false, message: 'Device is offline' };
  }
  if (!localStorage.getItem('ebos_token')) {
    return { success: false, message: 'User is not logged in' };
  }

  try {
    console.log('[SyncEngine] Starting sync...');
    await _pushPendingChanges();
    await _pullRemoteChanges();
    console.log('[SyncEngine] Sync complete.');
    return { success: true, message: 'Synchronization completed successfully' };
  } catch (error) {
    console.error('[SyncEngine] Sync failed:', error);
    return { success: false, message: error.message || 'Synchronization failed' };
  }
}

// ─── PUSH: Upload pending local records ───────
async function _pushPendingChanges() {
  const pendingCustomers  = await db.customers.where('syncStatus').equals('PENDING').toArray();
  const pendingOrders     = await db.salesOrders.where('syncStatus').equals('PENDING').toArray();
  const pendingPayments   = await db.customerPayments.where('syncStatus').equals('PENDING').toArray();
  const pendingMovements  = await db.inventoryMovements.where('syncStatus').equals('PENDING').toArray();

  // Enrich orders with their line items
  const ordersWithItems = await Promise.all(
    pendingOrders.map(async (order) => {
      const items = await db.salesOrderItems.where('orderId').equals(order.id).toArray();
      return {
        ...order,
        items: items.map(({ id, productId, quantity, unitPrice, totalPrice }) => ({
          id, productId, quantity, unitPrice, totalPrice,
        })),
      };
    })
  );

  const hasChanges =
    pendingCustomers.length > 0 ||
    ordersWithItems.length > 0 ||
    pendingPayments.length > 0 ||
    pendingMovements.length > 0;

  if (!hasChanges) {
    console.log('[SyncEngine] No pending changes to push.');
    return;
  }

  console.log('[SyncEngine] Pushing local changes...');
  const response = await fetch(`${API_BASE_URL}/api/v1/sync/push`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({
      customers:          pendingCustomers,
      salesOrders:        ordersWithItems,
      customerPayments:   pendingPayments,
      inventoryMovements: pendingMovements,
    }),
  });

  if (!response.ok) throw new Error(`Push failed: HTTP ${response.status}`);

  const result = await response.json();
  if (!result.success || !result.synced) return;

  const { customers: sc, salesOrders: so, inventoryMovements: sm, payments: sp } = result.synced;

  // Mark pushed records as SYNCED in a single transaction
  await db.transaction('rw', [db.customers, db.salesOrders, db.customerPayments, db.inventoryMovements], async () => {
    if (sc?.length) await Promise.all(sc.map(id => db.customers.update(id, { syncStatus: 'SYNCED' })));
    if (so?.length) await Promise.all(so.map(id => db.salesOrders.update(id, { syncStatus: 'SYNCED' })));
    if (sp?.length) await Promise.all(sp.map(id => db.customerPayments.update(id, { syncStatus: 'SYNCED' })));
    if (sm?.length) await Promise.all(sm.map(id => db.inventoryMovements.update(id, { syncStatus: 'SYNCED' })));
  });

  console.log('[SyncEngine] Push complete.');
}

// ─── PULL: Download server changes ───────────
async function _pullRemoteChanges() {
  const meta = await db.syncMetadata.get('lastSyncedAt');
  const lastSyncedAt = meta?.value || '';

  console.log(`[SyncEngine] Pulling changes since: ${lastSyncedAt || 'beginning'}`);

  const response = await fetch(
    `${API_BASE_URL}/api/v1/sync/pull?lastSyncedAt=${encodeURIComponent(lastSyncedAt)}`,
    { method: 'GET', headers: getAuthHeaders() }
  );

  if (!response.ok) throw new Error(`Pull failed: HTTP ${response.status}`);

  const { serverTime, changes } = await response.json();

  await db.transaction(
    'rw',
    [db.products, db.customers, db.inventoryMovements, db.salesOrders, db.salesOrderItems, db.customerPayments, db.syncMetadata],
    async () => {
      // Products
      for (const p of changes.products || []) {
        await db.products.put({ ...p, costPrice: Number(p.costPrice), sellingPrice: Number(p.sellingPrice), minStockLevel: Number(p.minStockLevel) });
      }

      // Customers
      for (const c of changes.customers || []) {
        await db.customers.put({ ...c, creditLimit: Number(c.creditLimit), outstandingBalance: Number(c.outstandingBalance), syncStatus: 'SYNCED' });
      }

      // Inventory movements
      for (const m of changes.inventoryMovements || []) {
        await db.inventoryMovements.put({ ...m, quantityDelta: Number(m.quantityDelta), syncStatus: 'SYNCED' });
      }

      // Sales orders + items
      for (const o of changes.salesOrders || []) {
        await db.salesOrders.put({
          ...o,
          totalAmount: Number(o.totalAmount),
          discountAmount: Number(o.discountAmount),
          paidAmount: Number(o.paidAmount),
          syncStatus: 'SYNCED',
        });
        for (const item of o.items || []) {
          await db.salesOrderItems.put({
            ...item,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            totalPrice: Number(item.totalPrice),
          });
        }
      }

      // Customer payments
      for (const pay of changes.payments || []) {
        await db.customerPayments.put({ ...pay, amount: Number(pay.amount), syncStatus: 'SYNCED' });
      }

      // Update watermark
      await db.syncMetadata.put({ key: 'lastSyncedAt', value: serverTime });
    }
  );

  console.log('[SyncEngine] Pull complete.');
}

// ─── Background Auto-Sync ─────────────────────
let _intervalId = null;

export function startAutoSync(intervalMs = 30000) {
  if (_intervalId) return;
  window.addEventListener('online', _onReconnect);
  _intervalId = setInterval(() => {
    if (navigator.onLine && localStorage.getItem('ebos_token')) {
      console.log('[SyncEngine] Heartbeat sync...');
      syncNow();
    }
  }, intervalMs);
  console.log(`[SyncEngine] Auto-sync started (every ${intervalMs / 1000}s).`);
}

export function stopAutoSync() {
  if (_intervalId) {
    clearInterval(_intervalId);
    _intervalId = null;
  }
  window.removeEventListener('online', _onReconnect);
  console.log('[SyncEngine] Auto-sync stopped.');
}

async function _onReconnect() {
  console.log('[SyncEngine] Network restored — triggering instant sync.');
  await syncNow();
}
