import Dexie from 'dexie';

class EbosDatabase extends Dexie {
  constructor() {
    super('EbosDatabase');
    this.version(1).stores({
      products: 'id, businessId, sku, name',
      customers: 'id, businessId, name, syncStatus',
      inventoryMovements: 'id, branchId, productId, syncStatus, createdAt',
      salesOrders: 'id, branchId, customerId, syncStatus, createdAt',
      salesOrderItems: 'id, orderId, productId',
      customerPayments: 'id, businessId, customerId, syncStatus, createdAt',
      syncMetadata: 'key',
    });

    this.version(2).stores({
      products: 'id, businessId, sku, name, isActive, syncStatus',
      customers: 'id, businessId, name, syncStatus',
      inventoryMovements: 'id, branchId, productId, syncStatus, createdAt',
      salesOrders: 'id, branchId, customerId, syncStatus, createdAt',
      salesOrderItems: 'id, orderId, productId',
      customerPayments: 'id, businessId, customerId, syncStatus, createdAt',
      branches: 'id, businessId, name, syncStatus, isActive',
      users: 'id, branchId, role, syncStatus',
      suppliers: 'id, businessId, name, syncStatus',
      purchaseOrders: 'id, branchId, supplierId, syncStatus, createdAt',
      purchaseOrderItems: 'id, orderId, productId',
      syncMetadata: 'key',
    });
  }
}

export const db = new EbosDatabase();
