import Dexie, { type Table } from 'dexie';

// Define TS Interfaces for Frontend Local Database
export interface LocalProduct {
  id: string;
  businessId: string;
  sku: string;
  name: string;
  costPrice: number;
  sellingPrice: number;
  minStockLevel: number;
  unitOfMeasure: string;
  isActive: boolean;
  syncStatus?: 'PENDING' | 'SYNCED' | 'FAILED';
}

export interface LocalCustomer {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  creditLimit: number;
  outstandingBalance: number;
  syncStatus: 'PENDING' | 'SYNCED' | 'FAILED';
  errorMessage?: string;
}

export interface LocalInventoryMovement {
  id: string;
  branchId: string;
  productId: string;
  quantityDelta: number;
  type: 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT' | 'SALE' | 'RETURN';
  referenceId?: string;
  notes?: string;
  createdById?: string;
  createdAt: string;
  syncStatus: 'PENDING' | 'SYNCED' | 'FAILED';
}

export interface LocalSalesOrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface LocalSalesOrder {
  id: string;
  branchId: string;
  customerId: string | null;
  userId: string | null;
  totalAmount: number;
  discountAmount: number;
  paidAmount: number;
  paymentMode: 'CASH' | 'TELEBIRR' | 'CBE_BIRR' | 'BANK_TRANSFER' | 'CREDIT';
  createdAt: string;
  syncStatus: 'PENDING' | 'SYNCED' | 'FAILED';
  items?: LocalSalesOrderItem[]; // Helper for sync payloads
}

export interface LocalCustomerPayment {
  id: string;
  businessId: string;
  customerId: string;
  amount: number;
  paymentMode: 'CASH' | 'TELEBIRR' | 'CBE_BIRR' | 'BANK_TRANSFER' | 'CREDIT';
  referenceNumber?: string;
  createdAt: string;
  syncStatus: 'PENDING' | 'SYNCED' | 'FAILED';
}

export interface LocalBranch {
  id: string;
  businessId: string;
  name: string;
  location?: string;
  isActive: boolean;
  syncStatus?: 'PENDING' | 'SYNCED' | 'FAILED';
}

export interface LocalUser {
  id: string;
  username: string;
  password?: string;
  role: string;
  branchId?: string;
  businessId?: string;
  syncStatus?: 'PENDING' | 'SYNCED' | 'FAILED';
}

export interface LocalSupplier {
  id: string;
  businessId: string;
  name: string;
  phone?: string;
  contactPerson?: string;
  email?: string;
  address?: string;
  isActive?: boolean;
  syncStatus?: 'PENDING' | 'SYNCED' | 'FAILED';
}

export interface LocalPurchaseOrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface LocalPurchaseOrder {
  id: string;
  branchId: string;
  supplierId: string;
  userId?: string;
  totalAmount: number;
  status?: string;
  createdAt: string;
  syncStatus: 'PENDING' | 'SYNCED' | 'FAILED';
  items?: LocalPurchaseOrderItem[];
}

export interface SyncMetadata {
  key: string;
  value: string;
}

class EbosDatabase extends Dexie {
  products!: Table<LocalProduct>;
  customers!: Table<LocalCustomer>;
  inventoryMovements!: Table<LocalInventoryMovement>;
  salesOrders!: Table<LocalSalesOrder>;
  salesOrderItems!: Table<LocalSalesOrderItem>;
  customerPayments!: Table<LocalCustomerPayment>;
  branches!: Table<LocalBranch>;
  users!: Table<LocalUser>;
  suppliers!: Table<LocalSupplier>;
  purchaseOrders!: Table<LocalPurchaseOrder>;
  purchaseOrderItems!: Table<LocalPurchaseOrderItem>;
  syncMetadata!: Table<SyncMetadata>;

  constructor() {
    super('EbosDatabase');
    this.version(1).stores({
      products: 'id, businessId, sku, name',
      customers: 'id, businessId, name, syncStatus',
      inventoryMovements: 'id, branchId, productId, syncStatus, createdAt',
      salesOrders: 'id, branchId, customerId, syncStatus, createdAt',
      salesOrderItems: 'id, orderId, productId',
      customerPayments: 'id, businessId, customerId, syncStatus, createdAt',
      branches: 'id, businessId, name, isActive',
      syncMetadata: 'key',
    });

    this.version(2).stores({
      users: 'id, branchId, role, syncStatus',
      suppliers: 'id, businessId, name, syncStatus',
      purchaseOrders: 'id, branchId, supplierId, syncStatus, createdAt',
      purchaseOrderItems: 'id, orderId, productId',
    });
  }
}

export const db = new EbosDatabase();
