import { Controller, Get, Post, Body, UseGuards, Request, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
// NOTE: don't import generated enum types directly; fall back to runtime values/casts

@Controller('api/v1/sync')
@UseGuards(JwtAuthGuard)
export class SyncController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('pull')
  async pull(@Request() req: any, @Query('lastSyncedAt') lastSyncedAtStr?: string) {
    const { businessId, branchId } = req.user || {};

    if (!businessId) {
      return {
        serverTime: new Date().toISOString(),
        changes: { products: [], customers: [], inventoryMovements: [], salesOrders: [], payments: [], suppliers: [], purchaseOrders: [] }
      };
    }

    // Handle empty or invalid lastSyncedAt
    const lastSyncedAt = lastSyncedAtStr && !isNaN(Date.parse(lastSyncedAtStr)) 
      ? new Date(lastSyncedAtStr) 
      : new Date(0);

    const branchFilter = branchId ? { branchId } : { branch: { businessId } };

    const products = await this.prisma.product.findMany({
      where: {
        businessId,
        updatedAt: { gt: lastSyncedAt },
      },
    }).catch(err => {
      console.warn('[SyncPull] Error fetching products:', err.message);
      return [];
    });

    const customers = await this.prisma.customer.findMany({
      where: {
        businessId,
        updatedAt: { gt: lastSyncedAt },
      },
    }).catch(err => {
      console.warn('[SyncPull] Error fetching customers:', err.message);
      return [];
    });

    const inventoryMovements = await this.prisma.inventoryMovement.findMany({
      where: {
        ...branchFilter,
        createdAt: { gt: lastSyncedAt },
      },
    }).catch(err => {
      console.warn('[SyncPull] Error fetching inventoryMovements:', err.message);
      return [];
    });

    const salesOrders = await this.prisma.salesOrder.findMany({
      where: {
        ...branchFilter,
        updatedAt: { gt: lastSyncedAt },
      },
      include: {
        items: true,
      },
    }).catch(err => {
      console.warn('[SyncPull] Error fetching salesOrders:', err.message);
      return [];
    });

    const payments = await this.prisma.customerPayment.findMany({
      where: {
        businessId,
        createdAt: { gt: lastSyncedAt },
      },
    }).catch(err => {
      console.warn('[SyncPull] Error fetching payments:', err.message);
      return [];
    });

    const suppliers = await this.prisma.supplier.findMany({
      where: {
        businessId,
        updatedAt: { gt: lastSyncedAt },
      },
    }).catch(err => {
      console.warn('[SyncPull] Error fetching suppliers (table may be missing):', err.message);
      return [];
    });

    const purchaseOrders = await this.prisma.purchaseOrder.findMany({
      where: {
        ...branchFilter,
        updatedAt: { gt: lastSyncedAt },
      },
      include: {
        items: true,
      },
    }).catch(err => {
      console.warn('[SyncPull] Error fetching purchaseOrders (table may be missing):', err.message);
      return [];
    });

    return {
      serverTime: new Date().toISOString(),
      changes: {
        products,
        customers,
        inventoryMovements,
        salesOrders,
        payments,
        suppliers,
        purchaseOrders,
      },
    };
  }

  @Post('push')
  async push(@Request() req: any, @Body() body: any) {
    const { businessId, branchId, sub: userId } = req.user;
    const { 
      customers = [], 
      salesOrders = [], 
      inventoryMovements = [], 
      payments = [],
      suppliers = [],
      purchaseOrders = []
    } = body;

    const results = await this.prisma.$transaction(async (tx: any) => {
      const syncedCustomerIds: string[] = [];
      const syncedOrderIds: string[] = [];
      const syncedMovementIds: string[] = [];
      const syncedPaymentIds: string[] = [];
      const syncedSupplierIds: string[] = [];
      const syncedPurchaseOrderIds: string[] = [];

      // Process Suppliers
      for (const supplier of suppliers) {
        await tx.supplier.upsert({
          where: { id: supplier.id },
          update: {
            name: supplier.name,
            phone: supplier.phone || null,
            email: supplier.email || null,
            address: supplier.address || null,
          },
          create: {
            id: supplier.id,
            businessId,
            name: supplier.name,
            phone: supplier.phone || null,
            email: supplier.email || null,
            address: supplier.address || null,
          },
        });
        syncedSupplierIds.push(supplier.id);
      }

      // Process Purchase Orders
      for (const po of purchaseOrders) {
        const existingPo = await tx.purchaseOrder.findUnique({
          where: { id: po.id },
        });

        if (!existingPo) {
          await tx.purchaseOrder.create({
            data: {
              id: po.id,
              branchId,
              supplierId: po.supplierId,
              createdAt: new Date(po.createdAt),
            },
          });

          for (const item of po.items || []) {
            await tx.purchaseOrderItem.create({
              data: {
                id: item.id,
                orderId: po.id,
                productId: item.productId,
              },
            });
          }
        }
        syncedPurchaseOrderIds.push(po.id);
      }

      // Process Customers
      for (const customer of customers) {
        await tx.customer.upsert({
          where: { id: customer.id },
          update: {
            name: customer.name,
            phone: customer.phone,
            creditLimit: customer.creditLimit,
            outstandingBalance: customer.outstandingBalance,
          },
          create: {
            id: customer.id,
            businessId,
            name: customer.name,
            phone: customer.phone,
            creditLimit: customer.creditLimit,
            outstandingBalance: customer.outstandingBalance,
          },
        });
        syncedCustomerIds.push(customer.id);
      }

      // Process Sales Orders
      for (const order of salesOrders) {
        // Check if the order already exists to avoid duplicate logic
        const existingOrder = await tx.salesOrder.findUnique({
          where: { id: order.id },
        });

        if (!existingOrder) {
          // Create new order
          await tx.salesOrder.create({
            data: {
              id: order.id,
              branchId,
              customerId: order.customerId || null,
              userId: userId,
              totalAmount: order.totalAmount,
              discountAmount: order.discountAmount || 0,
              paidAmount: order.paidAmount || 0,
              paymentMode: order.paymentMode as any,
              createdAt: new Date(order.createdAt),
            },
          });

          // Create order items
          for (const item of order.items || []) {
            await tx.salesOrderItem.create({
              data: {
                id: item.id,
                orderId: order.id,
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
              },
            });
          }

          // If credit sale, update customer outstanding balance
          if (order.paymentMode === 'CREDIT' && order.customerId) {
            const creditAmount = Number(order.totalAmount) - Number(order.discountAmount) - Number(order.paidAmount);
            if (creditAmount > 0) {
              await tx.customer.update({
                where: { id: order.customerId },
                data: {
                  outstandingBalance: {
                    increment: creditAmount,
                  },
                },
              });
            }
          }
        }
        syncedOrderIds.push(order.id);
      }

      // Process Payments
      for (const payment of payments) {
        const existingPayment = await tx.customerPayment.findUnique({
          where: { id: payment.id },
        });

        if (!existingPayment) {
          await tx.customerPayment.create({
            data: {
              id: payment.id,
              businessId,
              customerId: payment.customerId,
              amount: payment.amount,
              paymentMode: payment.paymentMode as any,
              referenceNumber: payment.referenceNumber || null,
              createdById: userId,
              createdAt: new Date(payment.createdAt),
            },
          });

          // Deduct from customer's outstanding balance
          await tx.customer.update({
            where: { id: payment.customerId },
            data: {
              outstandingBalance: {
                decrement: payment.amount,
              },
            },
          });
        }
        syncedPaymentIds.push(payment.id);
      }

      // Process Inventory Movements
      for (const movement of inventoryMovements) {
        const existingMovement = await tx.inventoryMovement.findUnique({
          where: { id: movement.id },
        });

        if (!existingMovement) {
          await tx.inventoryMovement.create({
            data: {
              id: movement.id,
              branchId,
              productId: movement.productId,
              quantityDelta: movement.quantityDelta,
              type: movement.type as any,
              referenceId: movement.referenceId || null,
              notes: movement.notes || null,
              createdById: userId,
              createdAt: new Date(movement.createdAt),
            },
          });
        }
        syncedMovementIds.push(movement.id);
      }

      // Add Audit Log
      await tx.auditLog.create({
        data: {
          id: `aud_${Date.now()}`,
          userId,
          action: 'SYNC_PUSH',
          payload: JSON.stringify({
            ordersCount: salesOrders.length,
            movementsCount: inventoryMovements.length,
            paymentsCount: payments.length,
            suppliersCount: suppliers.length,
            poCount: purchaseOrders.length,
          }),
        },
      });

      return {
        customers: syncedCustomerIds,
        salesOrders: syncedOrderIds,
        inventoryMovements: syncedMovementIds,
        payments: syncedPaymentIds,
        suppliers: syncedSupplierIds,
        purchaseOrders: syncedPurchaseOrderIds,
      };
    });

    return {
      success: true,
      synced: results,
      serverTime: new Date().toISOString(),
    };
  }
}
