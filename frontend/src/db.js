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
  }
}

export const db = new EbosDatabase();
