// ─────────────────────────────────────────────
// EBOS — Sync Engine
// Handles client ↔ server data synchronization
// Push: uploads PENDING local records
// Pull: downloads server changes since watermark
// ─────────────────────────────────────────────

import { db } from './db.js';
import { API_BASE_URL } from './constants.js';
import { Network } from '@capacitor/network';

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
  const pendingProducts   = await db.products.where('syncStatus').equals('PENDING').toArray().catch(() => []);
  const pendingCustomers  = await db.customers.where('syncStatus').equals('PENDING').toArray();
  const pendingOrders     = await db.salesOrders.where('syncStatus').equals('PENDING').toArray();
  const pendingPayments   = await db.customerPayments.where('syncStatus').equals('PENDING').toArray();
  const pendingMovements  = await db.inventoryMovements.where('syncStatus').equals('PENDING').toArray();
  const pendingSuppliers  = await db.suppliers.where('syncStatus').equals('PENDING').toArray().catch(() => []);
  const pendingPOs        = await db.purchaseOrders.where('syncStatus').equals('PENDING').toArray().catch(() => []);

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

  // Enrich POs with their line items
  const posWithItems = await Promise.all(
    pendingPOs.map(async (po) => {
      const items = await db.purchaseOrderItems.where('orderId').equals(po.id).toArray().catch(() => []);
      return {
        ...po,
        items: items.map(({ id, productId }) => ({ id, productId })),
      };
    })
  );

  // Sync pending local users — only push users that have a real password stored
  // and use the real businessId/branchId from the JWT (not hardcoded placeholders)
  const pendingUsers = await db.users.where('syncStatus').equals('PENDING').toArray().catch(() => []);
  if (pendingUsers?.length) {
    // Get the logged-in user's context from their decoded JWT
    const rawToken = localStorage.getItem('ebos_token');
    let jwtPayload = null;
    try {
      jwtPayload = JSON.parse(atob(rawToken.split('.')[1]));
    } catch { /* ignore */ }

    for (const u of pendingUsers) {
      // Skip if no real password is stored — cannot register without one
      if (!u.password || u.password === 'default123') {
        // Mark as SYNCED so we stop retrying with bad data
        await db.users.update(u.id, { syncStatus: 'SYNCED' }).catch(() => {});
        continue;
      }
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({
            username: u.username,
            password: u.password,
            fullName: u.fullName || u.username,
            role: u.role || 'CASHIER',
            businessId: u.businessId || jwtPayload?.businessId,
            branchId: u.branchId || jwtPayload?.branchId || null,
          }),
        });
        if (res.ok || res.status === 400 || res.status === 409 || res.status === 500) {
          await db.users.update(u.id, { syncStatus: 'SYNCED' });
        }
      } catch (err) {
        console.warn('[SyncEngine] Failed to sync user:', u.username, err);
      }
    }
  }

  const hasChanges =
    pendingProducts.length > 0 ||
    pendingCustomers.length > 0 ||
    ordersWithItems.length > 0 ||
    pendingPayments.length > 0 ||
    pendingMovements.length > 0 ||
    pendingSuppliers.length > 0 ||
    posWithItems.length > 0;

  if (!hasChanges) {
    console.log('[SyncEngine] No pending entity changes to push.');
    return;
  }

  const formattedProducts = pendingProducts.map(p => ({
    ...p,
    isActive: p.isActive === 1 || p.isActive === true
  }));

  console.log('[SyncEngine] Pushing local changes...');
  const response = await fetch(`${API_BASE_URL}/api/v1/sync/push`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({
      products:           formattedProducts,
      customers:          pendingCustomers,
      salesOrders:        ordersWithItems,
      payments:           pendingPayments,   // backend expects 'payments' not 'customerPayments'
      inventoryMovements: pendingMovements,
      suppliers:          pendingSuppliers,
      purchaseOrders:     posWithItems,
    }),
  });

  if (!response.ok) throw new Error(`Push failed: HTTP ${response.status}`);

  const result = await response.json();
  if (!result.success || !result.synced) return;

  const { customers: sc, salesOrders: so, inventoryMovements: sm, payments: sp, suppliers: ss, purchaseOrders: spo } = result.synced;

  const failedItems = result.failed || [];
  if (failedItems.length) {
    console.warn('[SyncEngine] Some records were rejected by the server:', failedItems);
  }

  await db.transaction('rw', [
    db.products, db.customers, db.salesOrders, db.customerPayments,
    db.inventoryMovements, db.suppliers, db.purchaseOrders
  ], async () => {
    if (result.synced.products?.length) await Promise.all(result.synced.products.map(id => db.products.update(id, { syncStatus: 'SYNCED' })));
    if (sc?.length) await Promise.all(sc.map(id => db.customers.update(id, { syncStatus: 'SYNCED' })));
    if (so?.length) await Promise.all(so.map(id => db.salesOrders.update(id, { syncStatus: 'SYNCED' })));
    if (sp?.length) await Promise.all(sp.map(id => db.customerPayments.update(id, { syncStatus: 'SYNCED' })));
    if (sm?.length) await Promise.all(sm.map(id => db.inventoryMovements.update(id, { syncStatus: 'SYNCED' })));
    if (ss?.length) await Promise.all(ss.map(id => db.suppliers.update(id, { syncStatus: 'SYNCED' })));
    if (spo?.length) await Promise.all(spo.map(id => db.purchaseOrders.update(id, { syncStatus: 'SYNCED' })));

    if (failedItems.length) {
      await Promise.all(failedItems.map(({ id, type }) => {
        if (type === 'product') return db.products.where('id').equals(id).modify({ syncStatus: 'FAILED' });
        if (type === 'customer') return db.customers.where('id').equals(id).modify({ syncStatus: 'FAILED' });
        if (type === 'supplier') return db.suppliers.where('id').equals(id).modify({ syncStatus: 'FAILED' });
        if (type === 'inventory') return db.inventoryMovements.where('id').equals(id).modify({ syncStatus: 'FAILED' });
        return Promise.resolve();
      }));
    }
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
    [
      db.products, db.customers, db.inventoryMovements, db.salesOrders, 
      db.salesOrderItems, db.customerPayments, db.syncMetadata,
      db.suppliers, db.purchaseOrders, db.purchaseOrderItems
    ],
    async () => {
      // Products
      for (const p of changes.products || []) {
        await db.products.put({
          ...p,
          costPrice: Number(p.costPrice),
          sellingPrice: Number(p.sellingPrice),
          minStockLevel: Number(p.minStockLevel),
          isActive: (p.isActive === true || p.isActive === 1) ? 1 : 0,
          syncStatus: 'SYNCED'
        });
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

      // Suppliers
      for (const s of changes.suppliers || []) {
        await db.suppliers.put({ ...s, syncStatus: 'SYNCED' });
      }

      // Purchase orders + items
      for (const po of changes.purchaseOrders || []) {
        await db.purchaseOrders.put({ ...po, syncStatus: 'SYNCED' });
        for (const item of po.items || []) {
          await db.purchaseOrderItems.put(item);
        }
      }

      // Update watermark
      await db.syncMetadata.put({ key: 'lastSyncedAt', value: serverTime });
    }
  );

  console.log('[SyncEngine] Pull complete.');
}

// ─── Background Auto-Sync ─────────────────────
let _intervalId = null;
let _capNetworkHandle = null;

export function startAutoSync(intervalMs = 30000) {
  if (_intervalId) return;
  
  // Listen to browser online event
  window.addEventListener('online', _onReconnect);

  // Listen to Capacitor native Android network changes
  Network.addListener('networkStatusChange', status => {
    if (status.connected) {
      console.log('[SyncEngine] Native network connected — triggering instant sync.');
      _onReconnect();
    }
  }).then(handle => {
    _capNetworkHandle = handle;
  }).catch(() => {});

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
  if (_capNetworkHandle) {
    _capNetworkHandle.remove();
    _capNetworkHandle = null;
  }
  window.removeEventListener('online', _onReconnect);
  console.log('[SyncEngine] Auto-sync stopped.');
}

async function _onReconnect() {
  console.log('[SyncEngine] Network restored — triggering instant sync.');
  await syncNow();
}
