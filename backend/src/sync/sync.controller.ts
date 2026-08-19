import { Controller, Get, Post, Body, UseGuards, Request, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import * as bcrypt from 'bcryptjs';

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
        changes: { products: [], customers: [], inventoryMovements: [], salesOrders: [], payments: [], suppliers: [], purchaseOrders: [], branches: [], users: [] }
      };
    }

    const lastSyncedAt = lastSyncedAtStr && !isNaN(Date.parse(lastSyncedAtStr)) 
      ? new Date(lastSyncedAtStr) 
      : new Date(0);

    const branchFilter = branchId ? { branchId } : { branch: { businessId } };

    const products = await this.prisma.product.findMany({
      where: { businessId, updatedAt: { gt: lastSyncedAt } },
    }).catch(err => {
      console.warn('[SyncPull] Error fetching products:', err.message);
      return [];
    });

    const customers = await this.prisma.customer.findMany({
      where: { businessId, updatedAt: { gt: lastSyncedAt } },
    }).catch(err => {
      console.warn('[SyncPull] Error fetching customers:', err.message);
      return [];
    });

    const inventoryMovements = await this.prisma.inventoryMovement.findMany({
      where: { ...branchFilter, createdAt: { gt: lastSyncedAt } },
    }).catch(err => {
      console.warn('[SyncPull] Error fetching inventoryMovements:', err.message);
      return [];
    });

    const salesOrders = await this.prisma.salesOrder.findMany({
      where: { ...branchFilter, updatedAt: { gt: lastSyncedAt } },
      include: { items: true },
    }).catch(err => {
      console.warn('[SyncPull] Error fetching salesOrders:', err.message);
      return [];
    });

    const payments = await this.prisma.customerPayment.findMany({
      where: { businessId, createdAt: { gt: lastSyncedAt } },
    }).catch(err => {
      console.warn('[SyncPull] Error fetching payments:', err.message);
      return [];
    });

    const suppliers = await this.prisma.supplier.findMany({
      where: { businessId, updatedAt: { gt: lastSyncedAt } },
    }).catch(err => {
      console.warn('[SyncPull] Error fetching suppliers:', err.message);
      return [];
    });

    const purchaseOrders = await this.prisma.purchaseOrder.findMany({
      where: { ...branchFilter, updatedAt: { gt: lastSyncedAt } },
      include: { items: true },
    }).catch(err => {
      console.warn('[SyncPull] Error fetching purchaseOrders:', err.message);
      return [];
    });

    const branches = await this.prisma.branch.findMany({
      where: { businessId, updatedAt: { gt: lastSyncedAt } },
    }).catch(err => {
      console.warn('[SyncPull] Error fetching branches:', err.message);
      return [];
    });

    // Data minimization: exclude unnecessary sensitive fields from user pull
    const users = await this.prisma.user.findMany({
      where: { businessId, updatedAt: { gt: lastSyncedAt } },
      select: {
        id: true, businessId: true, branchId: true, username: true,
        role: true, fullName: true, isActive: true,
        createdAt: true, updatedAt: true,
      }
    }).catch(err => {
      console.warn('[SyncPull] Error fetching users:', err.message);
      return [];
    });

    return {
      serverTime: new Date().toISOString(),
      changes: {
        products, customers, inventoryMovements, salesOrders,
        payments, suppliers, purchaseOrders, branches, users,
      },
    };
  }

  @Post('push')
  async push(@Request() req: any, @Body() body: any) {
    const { businessId, sub: userId, role: userRole } = req.user;
    let { branchId } = req.user;

    if (!branchId) {
      const branch = await this.prisma.branch.findFirst({
        where: { businessId },
        orderBy: { createdAt: 'asc' },
      });
      branchId = branch?.id || null;
    }

    const {
      products = [], customers = [], salesOrders = [],
      inventoryMovements = [], payments = [], suppliers = [],
      purchaseOrders = [], branches = [], users = []
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

        // 1. Process Products (Scope check by businessId)
        for (const product of products) {
          try {
            const existing = await tx.product.findFirst({
              where: {
                businessId,
                OR: [{ id: product.id }, { sku: product.sku }]
              }
            });

            if (existing) {
              await tx.product.update({
                where: { id: existing.id },
                data: {
                  sku: product.sku,
                  name: product.name,
                  costPrice: product.costPrice,
                  sellingPrice: product.sellingPrice,
                  minStockLevel: product.minStockLevel || 0,
                  unitOfMeasure: product.unitOfMeasure || 'Pcs',
                  isActive: product.isActive !== undefined ? product.isActive : true,
                },
              });
            } else {
              await tx.product.create({
                data: {
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
            }
            syncedProductIds.push(product.id);
          } catch (err: any) {
            pushFailure(product.id, 'product', 'PRODUCT_UPSERT_FAILED', err.message);
          }
        }

        // 2. Process Suppliers (Scope check by businessId)
        for (const supplier of suppliers) {
          try {
            const existing = await tx.supplier.findFirst({
              where: { id: supplier.id, businessId }
            });

            if (existing) {
              await tx.supplier.update({
                where: { id: existing.id },
                data: {
                  name: supplier.name,
                  phone: supplier.phone || null,
                  email: supplier.email || null,
                  address: supplier.address || null,
                },
              });
            } else {
              await tx.supplier.create({
                data: {
                  id: supplier.id,
                  businessId,
                  name: supplier.name,
                  phone: supplier.phone || null,
                  email: supplier.email || null,
                  address: supplier.address || null,
                },
              });
            }
            syncedSupplierIds.push(supplier.id);
          } catch (err: any) {
            pushFailure(supplier.id, 'supplier', 'SUPPLIER_UPSERT_FAILED', err.message);
          }
        }

        // 3. Process Customers (Scope check by businessId)
        for (const customer of customers) {
          try {
            const existing = await tx.customer.findFirst({
              where: { id: customer.id, businessId }
            });

            if (existing) {
              await tx.customer.update({
                where: { id: existing.id },
                data: {
                  name: customer.name,
                  phone: customer.phone || null,
                  creditLimit: customer.creditLimit ?? 0,
                  outstandingBalance: customer.outstandingBalance ?? 0,
                },
              });
            } else {
              await tx.customer.create({
                data: {
                  id: customer.id,
                  businessId,
                  name: customer.name,
                  phone: customer.phone || null,
                  creditLimit: customer.creditLimit ?? 0,
                  outstandingBalance: customer.outstandingBalance ?? 0,
                },
              });
            }
            syncedCustomerIds.push(customer.id);
          } catch (err: any) {
            pushFailure(customer.id, 'customer', 'CUSTOMER_UPSERT_FAILED', err.message);
          }
        }

        // 4. Process Purchase Orders (Scope check by branch's businessId)
        for (const po of purchaseOrders) {
          try {
            const existingPo = await tx.purchaseOrder.findFirst({
              where: { id: po.id, branch: { businessId } }
            });

            if (!existingPo) {
              if (po.supplierId) {
                const sExists = await tx.supplier.findFirst({
                  where: { id: po.supplierId, businessId }
                });
                if (!sExists) {
                  await tx.supplier.create({
                    data: { id: po.supplierId, businessId, name: `Imported Supplier (${po.supplierId.slice(0, 8)})` }
                  });
                }
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
                const pExists = await tx.product.findFirst({
                  where: { id: item.productId, businessId }
                });
                if (!pExists) {
                  await tx.product.create({
                    data: { id: item.productId, businessId, sku: `IMP-${item.productId.slice(0,6)}`, name: `Imported Item (${item.productId.slice(0,6)})`, costPrice: 0, sellingPrice: 0 }
                  });
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
          } catch (err: any) {
            pushFailure(po.id, 'purchaseOrder', 'PO_CREATE_FAILED', err.message);
          }
        }

        // 5. Process Sales Orders (Scope check by branch's businessId)
        for (const order of salesOrders) {
          try {
            const existingOrder = await tx.salesOrder.findFirst({
              where: { id: order.id, branch: { businessId } }
            });

            if (!existingOrder) {
              if (order.customerId) {
                const cExists = await tx.customer.findFirst({
                  where: { id: order.customerId, businessId }
                });
                if (!cExists) {
                  await tx.customer.create({
                    data: { id: order.customerId, businessId, name: `Imported Customer (${order.customerId.slice(0, 8)})` }
                  });
                }
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
                const pExists = await tx.product.findFirst({
                  where: { id: item.productId, businessId }
                });
                if (!pExists) {
                  await tx.product.create({
                    data: { id: item.productId, businessId, sku: `IMP-${item.productId.slice(0,6)}`, name: `Imported Product (${item.productId.slice(0,6)})`, costPrice: 0, sellingPrice: 0 }
                  });
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
            }
            syncedOrderIds.push(order.id);
          } catch (err: any) {
            pushFailure(order.id, 'salesOrder', 'SALES_ORDER_FAILED', err.message);
          }
        }

        // 6. Process Payments (Scope check by businessId)
        for (const payment of payments) {
          try {
            const existingPayment = await tx.customerPayment.findFirst({
              where: { id: payment.id, businessId }
            });

            if (!existingPayment) {
              if (payment.customerId) {
                const cExists = await tx.customer.findFirst({
                  where: { id: payment.customerId, businessId }
                });
                if (!cExists) {
                  await tx.customer.create({
                    data: { id: payment.customerId, businessId, name: `Imported Customer (${payment.customerId.slice(0, 8)})` }
                  });
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
          } catch (err: any) {
            pushFailure(payment.id, 'payment', 'PAYMENT_FAILED', err.message);
          }
        }

        // 7. Process Inventory Movements (Scope check by branch's businessId)
        for (const movement of inventoryMovements) {
          try {
            const existingMovement = await tx.inventoryMovement.findFirst({
              where: { id: movement.id, branch: { businessId } }
            });

            if (!existingMovement) {
              if (movement.productId) {
                const pExists = await tx.product.findFirst({
                  where: { id: movement.productId, businessId }
                });
                if (!pExists) {
                  await tx.product.create({
                    data: { id: movement.productId, businessId, sku: `IMP-${movement.productId.slice(0,6)}`, name: `Imported Product (${movement.productId.slice(0,6)})`, costPrice: 0, sellingPrice: 0 }
                  });
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
          } catch (err: any) {
            pushFailure(movement.id, 'inventory', 'MOVEMENT_FAILED', err.message);
          }
        }

        // 8. Process Branches (Scope check by businessId)
        for (const branch of branches) {
          try {
            const existing = await tx.branch.findFirst({
              where: { id: branch.id, businessId }
            });

            if (existing) {
              await tx.branch.update({
                where: { id: existing.id },
                data: {
                  name: branch.name,
                  location: branch.location || null,
                  isActive: branch.isActive !== undefined ? branch.isActive : true,
                },
              });
            } else {
              await tx.branch.create({
                data: {
                  id: branch.id,
                  businessId,
                  name: branch.name,
                  location: branch.location || null,
                  isActive: branch.isActive !== undefined ? branch.isActive : true,
                },
              });
            }
            syncedBranchIds.push(branch.id);
          } catch (err: any) {
            pushFailure(branch.id, 'branch', 'BRANCH_UPSERT_FAILED', err.message);
          }
        }

        // 9. Process Users (Strict ownership check & Bcrypt Password Hashing)
        for (const user of users) {
          try {
            const existing = await tx.user.findFirst({
              where: { id: user.id, businessId }
            });

            if (existing) {
              // Role modifications during sync require OWNER or SUPERADMIN privilege
              const roleToUpdate = (userRole === 'OWNER' || userRole === 'SUPERADMIN') ? (user.role || existing.role) : existing.role;

              const updateData: any = {
                username: user.username || existing.username,
                role: roleToUpdate,
                branchId: user.branchId || existing.branchId,
              };

              // If client supplied a new password, hash it properly using bcrypt
              if (user.password && user.password !== 'default123') {
                updateData.passwordHash = bcrypt.hashSync(user.password, 10);
              }

              await tx.user.update({
                where: { id: existing.id },
                data: updateData,
              });
            } else {
              // Create new user scoped strictly to caller's businessId with bcrypt hashed password
              const rawPassword = (user.password && user.password !== 'default123') ? user.password : `Pass_${Math.random().toString(36).slice(2, 8)}`;
              const hashedPass = bcrypt.hashSync(rawPassword, 10);

              await tx.user.create({
                data: {
                  id: user.id,
                  username: user.username,
                  passwordHash: hashedPass,
                  role: user.role || 'CASHIER',
                  fullName: user.fullName || user.username,
                  phoneNumber: user.phoneNumber || '',
                  branchId: user.branchId || null,
                  businessId, // Enforce authenticated businessId
                },
              });
            }
            syncedUserIds.push(user.id);
          } catch (err: any) {
            pushFailure(user.id, 'user', 'USER_UPSERT_FAILED', err.message);
          }
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

