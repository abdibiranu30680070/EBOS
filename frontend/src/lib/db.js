// ─────────────────────────────────────────────
// EBOS — Dexie IndexedDB Schema
// Offline-first local database definition
// All tables use 'id' as primary key
// ─────────────────────────────────────────────

import Dexie from 'dexie';

class EbosDatabase extends Dexie {
  constructor() {
    super('EbosDatabase');

    this.version(1).stores({
      products: 'id, businessId, sku, name, isActive',
      customers: 'id, businessId, name, syncStatus',
      inventoryMovements: 'id, branchId, productId, syncStatus, createdAt',
      salesOrders: 'id, branchId, customerId, syncStatus, createdAt',
      salesOrderItems: 'id, orderId, productId',
      customerPayments: 'id, businessId, customerId, syncStatus, createdAt',
      syncMetadata: 'key',
    });

    this.version(2).stores({
      users: 'id, branchId, role, syncStatus',
      suppliers: 'id, businessId, name, syncStatus',
      purchaseOrders: 'id, branchId, supplierId, syncStatus, createdAt',
      purchaseOrderItems: 'id, orderId, productId',
      branches: 'id, businessId, name, isActive',
    });
  }
}

export const db = new EbosDatabase();

export async function clearDatabaseData() {
  console.log('[DB] Clearing local IndexedDB storage for business data isolation...');
  await Promise.all([
    db.products.clear(),
    db.customers.clear(),
    db.inventoryMovements.clear(),
    db.salesOrders.clear(),
    db.salesOrderItems.clear(),
    db.customerPayments.clear(),
    db.suppliers.clear(),
    db.purchaseOrders.clear(),
    db.purchaseOrderItems.clear(),
    db.syncMetadata.clear(),
  ]);
}
