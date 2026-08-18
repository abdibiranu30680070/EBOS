import { db } from './db';
import { API_BASE_URL } from './lib/constants.js';

// Helper to get Authorization headers
function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('ebos_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export async function syncNow(): Promise<{ success: boolean; message: string }> {
  const token = localStorage.getItem('ebos_token');
  if (!token) {
    return { success: false, message: 'User is not logged in' };
  }

  // If offline, skip sync but don't fail - operations are already queued locally
  if (!navigator.onLine) {
    console.log('Device offline - skipping sync, data is queued locally');
    return { success: true, message: 'Offline - data queued for later sync' };
  }

  try {
    console.log('Starting synchronization syncNow()...');

    // ==========================================
    // 1. PUSH STEP (Upload Local Pending Changes)
    // ==========================================
    const pendingProducts = await db.products.where('syncStatus').equals('PENDING').toArray().catch(() => []);
    const pendingCustomers = await db.customers.where('syncStatus').equals('PENDING').toArray();
    const pendingOrders = await db.salesOrders.where('syncStatus').equals('PENDING').toArray();
    const pendingPayments = await db.customerPayments.where('syncStatus').equals('PENDING').toArray();
    const pendingMovements = await db.inventoryMovements.where('syncStatus').equals('PENDING').toArray();
    const pendingSuppliers = await db.suppliers.where('syncStatus').equals('PENDING').toArray().catch(() => []);
    const pendingPurchaseOrders = await db.purchaseOrders.where('syncStatus').equals('PENDING').toArray().catch(() => []);
    const pendingBranches = db.branches ? await db.branches.where('syncStatus').equals('PENDING').toArray() : [];
    const pendingUsers = db.users ? await db.users.where('syncStatus').equals('PENDING').toArray() : [];

    console.log('Pending counts:', {
      products: pendingProducts.length,
      customers: pendingCustomers.length,
      orders: pendingOrders.length,
      payments: pendingPayments.length,
      movements: pendingMovements.length,
      suppliers: pendingSuppliers.length,
      purchaseOrders: pendingPurchaseOrders.length,
      branches: pendingBranches.length,
      users: pendingUsers.length
    });

    // Also check total counts in local DB
    const totalCustomers = await db.customers.count();
    const totalOrders = await db.salesOrders.count();
    const totalProducts = await db.products.count();
    console.log('Total local DB counts:', { customers: totalCustomers, orders: totalOrders, products: totalProducts });

    // Enrich orders with their items
    const ordersWithItems = [];
    for (const order of pendingOrders) {
      const items = await db.salesOrderItems.where('orderId').equals(order.id).toArray();
      ordersWithItems.push({
        ...order,
        items: items.map(it => ({
          id: it.id,
          productId: it.productId,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          totalPrice: it.totalPrice
        }))
      });
    }

    const purchaseOrdersWithItems = [] as any[];
    for (const po of pendingPurchaseOrders) {
      const items = await db.purchaseOrderItems.where('orderId').equals(po.id).toArray().catch(() => []);
      purchaseOrdersWithItems.push({
        ...po,
        items: items.map((it: any) => ({
          id: it.id,
          productId: it.productId,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          totalPrice: it.totalPrice,
        })),
      });
    }

    if (
      pendingProducts.length > 0 ||
      pendingCustomers.length > 0 ||
      ordersWithItems.length > 0 ||
      pendingPayments.length > 0 ||
      pendingMovements.length > 0 ||
      pendingSuppliers.length > 0 ||
      purchaseOrdersWithItems.length > 0 ||
      pendingBranches.length > 0 ||
      pendingUsers.length > 0
    ) {
      console.log('Pushing local modifications to server...');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      };
      const pushResponse = await fetch(`${API_BASE_URL}/api/v1/sync/push`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          products: pendingProducts,
          customers: pendingCustomers,
          salesOrders: ordersWithItems,
          payments: pendingPayments,
          inventoryMovements: pendingMovements,
          suppliers: pendingSuppliers,
          purchaseOrders: purchaseOrdersWithItems,
          branches: pendingBranches,
          users: pendingUsers
        })
      });

      if (!pushResponse.ok) {
        throw new Error(`Sync Push failed with status ${pushResponse.status}`);
      }

      const pushResult = await pushResponse.json();
      console.log('Push response:', pushResult);
      if (pushResult.success && pushResult.synced) {
        const { products: syncedProducts, customers: syncedCusts, salesOrders: syncedOrders, inventoryMovements: syncedMvs, payments: syncedPmts, suppliers: syncedSuppliers, purchaseOrders: syncedPurchaseOrders, branches: syncedBranches, users: syncedUsers } = pushResult.synced;
        console.log('Synced IDs:', { syncedProducts, syncedCusts, syncedOrders, syncedMvs, syncedPmts, syncedSuppliers, syncedPurchaseOrders, syncedBranches, syncedUsers });

        // Mark pushed records as SYNCED
        await db.transaction('rw', [db.products, db.customers, db.salesOrders, db.customerPayments, db.inventoryMovements, db.suppliers, db.purchaseOrders, db.branches, db.users], async () => {
          if (syncedProducts.length > 0) {
            await Promise.all(syncedProducts.map((id: string) => db.products.update(id, { syncStatus: 'SYNCED' })));
          }
          if (syncedCusts.length > 0) {
            await Promise.all(syncedCusts.map((id: string) => db.customers.update(id, { syncStatus: 'SYNCED' })));
          }
          if (syncedOrders.length > 0) {
            await Promise.all(syncedOrders.map((id: string) => db.salesOrders.update(id, { syncStatus: 'SYNCED' })));
          }
          if (syncedPmts.length > 0) {
            await Promise.all(syncedPmts.map((id: string) => db.customerPayments.update(id, { syncStatus: 'SYNCED' })));
          }
          if (syncedMvs.length > 0) {
            await Promise.all(syncedMvs.map((id: string) => db.inventoryMovements.update(id, { syncStatus: 'SYNCED' })));
          }
          if (syncedSuppliers.length > 0) {
            await Promise.all(syncedSuppliers.map((id: string) => db.suppliers.update(id, { syncStatus: 'SYNCED' })));
          }
          if (syncedPurchaseOrders.length > 0) {
            await Promise.all(syncedPurchaseOrders.map((id: string) => db.purchaseOrders.update(id, { syncStatus: 'SYNCED' })));
          }
          if (syncedBranches.length > 0) {
            await Promise.all(syncedBranches.map((id: string) => db.branches.update(id, { syncStatus: 'SYNCED' })));
          }
          if (syncedUsers.length > 0) {
            await Promise.all(syncedUsers.map((id: string) => db.users.update(id, { syncStatus: 'SYNCED' })));
          }
        });
        console.log('Successfully pushed local changes.');
      } else {
        console.error('Push failed or no synced data returned:', pushResult);
      }
    }

    // ==========================================
    // 2. PULL STEP (Download remote updates)
    // ==========================================
    const lastSyncMeta = await db.syncMetadata.get('lastSyncedAt');
    const lastSyncedAt = lastSyncMeta ? lastSyncMeta.value : '';

    console.log(`Pulling updates since: ${lastSyncedAt || 'the beginning'}`);
    const pullResponse = await fetch(`${API_BASE_URL}/api/v1/sync/pull?lastSyncedAt=${encodeURIComponent(lastSyncedAt)}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!pullResponse.ok) {
      throw new Error(`Sync Pull failed with status ${pullResponse.status}`);
    }

    const pullResult = await pullResponse.json();
    const { serverTime, changes } = pullResult;

    // Apply downloaded updates to the local database in a transaction
    const pullTables = [db.products, db.customers, db.inventoryMovements, db.salesOrders, db.salesOrderItems, db.customerPayments, db.suppliers, db.purchaseOrders, db.purchaseOrderItems, db.syncMetadata];
    if (db.branches) pullTables.push(db.branches);
    if (db.users) pullTables.push(db.users);

    await db.transaction(
      'rw',
      pullTables,
      async () => {
        // Save Products
        for (const product of changes.products || []) {
          await db.products.put({
            id: product.id,
            businessId: product.businessId,
            sku: product.sku,
            name: product.name,
            costPrice: Number(product.costPrice),
            sellingPrice: Number(product.sellingPrice),
            minStockLevel: Number(product.minStockLevel),
            unitOfMeasure: product.unitOfMeasure,
            isActive: product.isActive
          });
        }

        // Save Customers
        for (const customer of changes.customers || []) {
          await db.customers.put({
            id: customer.id,
            businessId: customer.businessId,
            name: customer.name,
            phone: customer.phone,
            creditLimit: Number(customer.creditLimit),
            outstandingBalance: Number(customer.outstandingBalance),
            syncStatus: 'SYNCED'
          });
        }

        // Save Suppliers
        for (const supplier of changes.suppliers || []) {
          await db.suppliers.put({
            id: supplier.id,
            businessId: supplier.businessId,
            name: supplier.name,
            phone: supplier.phone,
            contactPerson: supplier.contactPerson,
            email: supplier.email,
            address: supplier.address,
            isActive: supplier.isActive,
            syncStatus: 'SYNCED'
          });
        }

        // Save Purchase Orders & items
        for (const po of changes.purchaseOrders || []) {
          await db.purchaseOrders.put({
            id: po.id,
            branchId: po.branchId,
            supplierId: po.supplierId,
            userId: po.userId,
            totalAmount: Number(po.totalAmount),
            status: po.status,
            createdAt: po.createdAt,
            syncStatus: 'SYNCED'
          });

          for (const item of po.items || []) {
            await db.purchaseOrderItems.put({
              id: item.id,
              orderId: item.orderId,
              productId: item.productId,
              quantity: Number(item.quantity),
              unitPrice: Number(item.unitPrice),
              totalPrice: Number(item.totalPrice)
            });
          }
        }

        // Save inventory movements (only if they don't already exist locally to prevent duplication)
        for (const movement of changes.inventoryMovements || []) {
          await db.inventoryMovements.put({
            id: movement.id,
            branchId: movement.branchId,
            productId: movement.productId,
            quantityDelta: Number(movement.quantityDelta),
            type: movement.type,
            referenceId: movement.referenceId,
            notes: movement.notes,
            createdById: movement.createdById,
            createdAt: movement.createdAt,
            syncStatus: 'SYNCED'
          });
        }

        // Save sales orders & items
        for (const order of changes.salesOrders || []) {
          await db.salesOrders.put({
            id: order.id,
            branchId: order.branchId,
            customerId: order.customerId,
            userId: order.userId,
            totalAmount: Number(order.totalAmount),
            discountAmount: Number(order.discountAmount),
            paidAmount: Number(order.paidAmount),
            paymentMode: order.paymentMode,
            createdAt: order.createdAt,
            syncStatus: 'SYNCED'
          });

          for (const item of order.items || []) {
            await db.salesOrderItems.put({
              id: item.id,
              orderId: item.orderId,
              productId: item.productId,
              quantity: Number(item.quantity),
              unitPrice: Number(item.unitPrice),
              totalPrice: Number(item.totalPrice)
            });
          }
        }

        // Save customer payments
        for (const payment of changes.payments || []) {
          await db.customerPayments.put({
            id: payment.id,
            businessId: payment.businessId,
            customerId: payment.customerId,
            amount: Number(payment.amount),
            paymentMode: payment.paymentMode,
            referenceNumber: payment.referenceNumber,
            createdAt: payment.createdAt,
            syncStatus: 'SYNCED'
          });
        }

        // Save branches
        for (const branch of changes.branches || []) {
          await db.branches.put({
            id: branch.id,
            businessId: branch.businessId,
            name: branch.name,
            location: branch.location || null,
            isActive: branch.isActive,
            syncStatus: 'SYNCED'
          });
        }

        // Save users
        for (const user of changes.users || []) {
          await db.users.put({
            id: user.id,
            username: user.username,
            password: user.password || null,
            role: user.role,
            branchId: user.branchId || null,
            businessId: user.businessId || null,
            syncStatus: 'SYNCED'
          });
        }

        // Update watermark
        await db.syncMetadata.put({ key: 'lastSyncedAt', value: serverTime });
      }
    );

    console.log('Sync complete.');
    return { success: true, message: 'Synchronization completed successfully' };
  } catch (error: any) {
    console.error('Synchronization failed:', error);
    return { success: false, message: error.message || 'Synchronization failed' };
  }
}

// Background auto sync configuration
let syncIntervalId: any = null;

export function startAutoSync(intervalMs = 30000) {
  if (syncIntervalId) return;

  // Add event listener for online state transition
  window.addEventListener('online', triggerSyncOnReconnect);

  // Periodic heartbeat loop
  syncIntervalId = setInterval(async () => {
    if (navigator.onLine && localStorage.getItem('ebos_token')) {
      console.log('Background heartbeat sync triggered...');
      await syncNow();
    }
  }, intervalMs);
}

export function stopAutoSync() {
  if (syncIntervalId) {
    clearInterval(syncIntervalId);
    syncIntervalId = null;
  }
  window.removeEventListener('online', triggerSyncOnReconnect);
}

async function triggerSyncOnReconnect() {
  console.log('Network online detected! Triggering instant sync...');
  await syncNow();
}
