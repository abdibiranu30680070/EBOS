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
      console.warn('[SyncPull] Error fetching suppliers:', err.message);
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
      console.warn('[SyncPull] Error fetching purchaseOrders:', err.message);
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
    const { businessId, sub: userId } = req.user;
    let { branchId } = req.user;

    // If branchId is missing from JWT, resolve it from the database
    if (!branchId) {
      const branch = await this.prisma.branch.findFirst({
        where: { businessId },
        orderBy: { createdAt: 'asc' },
      });
      branchId = branch?.id || null;
    }

    const {
      products = [],
      customers = [],
      salesOrders = [],
      inventoryMovements = [],
      payments = [],
      suppliers = [],
      purchaseOrders = [],
      branches = [],
      users = []
    } = body;

    const failed: Array<{ id: string; type: string; reason: string; details?: string }> = [];
    let results: any;
    try {
      results = await this.prisma.$transaction(async (tx: any) => {
        const syncedProductIds: string[] = [];
        const syncedCustomerIds: string[] = [];
        const syncedOrderIds: string[] = [];
        const syncedMovementIds: string[] = [];
        const syncedPaymentIds: string[] = [];
        const syncedSupplierIds: string[] = [];
        const syncedPurchaseOrderIds: string[] = [];
        const syncedBranchIds: string[] = [];
        const syncedUserIds: string[] = [];

        const pushFailure = (id: string, type: string, reason: string, details?: string) => {
          failed.push({ id, type, reason, details });
        };

        // Process Products
        for (const product of products) {
          await tx.product.upsert({
            where: { id: product.id },
            update: {
              sku: product.sku,
              name: product.name,
              costPrice: product.costPrice,
              sellingPrice: product.sellingPrice,
              minStockLevel: product.minStockLevel || 0,
              unitOfMeasure: product.unitOfMeasure || 'Pcs',
              isActive: product.isActive !== undefined ? product.isActive : true,
            },
            create: {
              id: product.id,
              businessId,
              sku: product.sku,
              name: product.name,
              costPrice: product.costPrice,
              sellingPrice: product.sellingPrice,
              minStockLevel: product.minStockLevel || 0,
              unitOfMeasure: product.unitOfMeasure || 'Pcs',
              isActive: product.isActive !== undefined ? product.isActive : true,
            },
          });
          syncedProductIds.push(product.id);
        }

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
            let invalidPo = false;

            if (po.supplierId) {
              const supplierExists = await tx.supplier.findUnique({ where: { id: po.supplierId } });
              if (!supplierExists) {
                pushFailure(po.supplierId, 'supplier', 'SUPPLIER_NOT_FOUND', `Supplier ${po.supplierId} is missing. Create it before syncing the purchase order.`);
                invalidPo = true;
              }
            }

            if (!invalidPo) {
              for (const item of po.items || []) {
                if (item.productId) {
                  const productExists = await tx.product.findUnique({ where: { id: item.productId } });
                  if (!productExists) {
                    pushFailure(item.productId, 'product', 'PRODUCT_NOT_FOUND', `Product ${item.productId} is missing. Create it before syncing purchase order lines.`);
                    invalidPo = true;
                    break;
                  }
                }
              }
            }

            if (invalidPo) {
              continue;
            }

            await tx.purchaseOrder.create({
              data: {
                id: po.id,
                branchId,
                supplierId: po.supplierId,
                totalAmount: po.totalAmount ?? 0,
                createdAt: new Date(po.createdAt),
              },
            });

            for (const item of po.items || []) {
              if (!item.productId) continue;
              const productExists = await tx.product.findUnique({ where: { id: item.productId } });
              if (!productExists) {
                continue;
              }

              await tx.purchaseOrderItem.create({
                data: {
                  id: item.id,
                  orderId: po.id,
                  productId: item.productId,
                  quantity: item.quantity ?? 0,
                  unitPrice: item.unitPrice ?? 0,
                  totalPrice: item.totalPrice ?? 0,
                },
              });
            }
          }
          syncedPurchaseOrderIds.push(po.id);
        }

        // Process Customers
        for (const customer of customers) {
          const existingCustomer = await tx.customer.findUnique({ where: { id: customer.id } });
          if (!existingCustomer) {
            pushFailure(customer.id, 'customer', 'CUSTOMER_NOT_FOUND', `Customer ${customer.id} must exist before syncing a customer record.`);
            continue;
          }

          await tx.customer.update({
            where: { id: customer.id },
            data: {
              name: customer.name,
              phone: customer.phone,
              creditLimit: customer.creditLimit,
            },
          });
          syncedCustomerIds.push(customer.id);
        }

        // Process Sales Orders
        for (const order of salesOrders) {
          const existingOrder = await tx.salesOrder.findUnique({
            where: { id: order.id },
          });

          if (!existingOrder) {
            let invalidOrder = false;

            if (order.customerId) {
              const customerExists = await tx.customer.findUnique({ where: { id: order.customerId } });
              if (!customerExists) {
                pushFailure(order.customerId, 'customer', 'CUSTOMER_NOT_FOUND', `Customer ${order.customerId} is missing. Create it before syncing this sale.`);
                invalidOrder = true;
              }
            }

            if (!invalidOrder) {
              for (const item of order.items || []) {
                if (item.productId) {
                  const productExists = await tx.product.findUnique({ where: { id: item.productId } });
                  if (!productExists) {
                    pushFailure(item.productId, 'product', 'PRODUCT_NOT_FOUND', `Product ${item.productId} is missing. Create it before syncing sale items.`);
                    invalidOrder = true;
                    break;
                  }
                }
              }
            }

            if (invalidOrder) {
              continue;
            }

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

            for (const item of order.items || []) {
              if (!item.productId) continue;
              const productExists = await tx.product.findUnique({ where: { id: item.productId } });
              if (!productExists) {
                continue;
              }

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

            // Outstanding balance must be derived, not mutated here.
          }
          syncedOrderIds.push(order.id);
        }

        // Process Payments
        for (const payment of payments) {
          const existingPayment = await tx.customerPayment.findUnique({
            where: { id: payment.id },
          });

          if (!existingPayment) {
            if (payment.customerId) {
              const customerExists = await tx.customer.findUnique({ where: { id: payment.customerId } });
              if (!customerExists) {
                pushFailure(payment.customerId, 'customer', 'CUSTOMER_NOT_FOUND', `Customer ${payment.customerId} is missing. Create it before syncing payment.`);
                continue;
              }
            }

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

          }
          syncedPaymentIds.push(payment.id);
        }

        // Process Inventory Movements
        for (const movement of inventoryMovements) {
          const existingMovement = await tx.inventoryMovement.findUnique({
            where: { id: movement.id },
          });

          if (!existingMovement) {
            if (movement.productId) {
              const productExists = await tx.product.findUnique({ where: { id: movement.productId } });
              if (!productExists) {
                pushFailure(movement.productId, 'product', 'PRODUCT_NOT_FOUND', `Product ${movement.productId} is missing. Create it before syncing stock movement.`);
                continue;
              }
            }

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

        // Process Branches
        for (const branch of branches) {
          await tx.branch.upsert({
            where: { id: branch.id },
            update: {
              name: branch.name,
              location: branch.location || null,
              isActive: branch.isActive !== undefined ? branch.isActive : true,
            },
            create: {
              id: branch.id,
              businessId,
              name: branch.name,
              location: branch.location || null,
              isActive: branch.isActive !== undefined ? branch.isActive : true,
            },
          });
          syncedBranchIds.push(branch.id);
        }

        // Process Users
        for (const user of users) {
          await tx.user.upsert({
            where: { id: user.id },
            update: {
              username: user.username,
              role: user.role,
              branchId: user.branchId || null,
            },
            create: {
              id: user.id,
              username: user.username,
              password: user.password || 'default123',
              role: user.role || 'CASHIER',
              branchId: user.branchId || null,
              businessId: user.businessId || businessId,
            },
          });
          syncedUserIds.push(user.id);
        }

        await tx.auditLog.create({
          data: {
            id: `aud_${Date.now()}`,
            userId,
            action: 'SYNC_PUSH',
            payload: JSON.stringify({
              productsCount: products.length,
              ordersCount: salesOrders.length,
              movementsCount: inventoryMovements.length,
              paymentsCount: payments.length,
              suppliersCount: suppliers.length,
              poCount: purchaseOrders.length,
              branchesCount: branches.length,
              usersCount: users.length,
              failedCount: failed.length,
            }),
          },
        });

        return {
          products: syncedProductIds,
          customers: syncedCustomerIds,
          salesOrders: syncedOrderIds,
          inventoryMovements: syncedMovementIds,
          payments: syncedPaymentIds,
          suppliers: syncedSupplierIds,
          purchaseOrders: syncedPurchaseOrderIds,
          branches: syncedBranchIds,
          users: syncedUserIds,
        };
      });
    } catch (err: any) {
      console.error('[SyncPush] Transaction failed:', err?.message || err);
      throw err;
    }

    return {
      success: true,
      synced: results,
      failed,
      serverTime: new Date().toISOString(),
    };
  }
}
