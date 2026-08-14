import { Controller, Get, Post, Body, UseGuards, Request, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MovementType, PaymentMode } from '@prisma/client';

@Controller('api/v1/sync')
@UseGuards(JwtAuthGuard)
export class SyncController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('pull')
  async pull(@Request() req: any, @Query('lastSyncedAt') lastSyncedAtStr?: string) {
    const { businessId, branchId } = req.user;
    // Handle empty or invalid lastSyncedAt
    const lastSyncedAt = lastSyncedAtStr && !isNaN(Date.parse(lastSyncedAtStr)) 
      ? new Date(lastSyncedAtStr) 
      : new Date(0);

    const products = await this.prisma.product.findMany({
      where: {
        businessId,
        updatedAt: { gt: lastSyncedAt },
      },
    });

    const customers = await this.prisma.customer.findMany({
      where: {
        businessId,
        updatedAt: { gt: lastSyncedAt },
      },
    });

    const inventoryMovements = await this.prisma.inventoryMovement.findMany({
      where: {
        branchId,
        createdAt: { gt: lastSyncedAt },
      },
    });

    const salesOrders = await this.prisma.salesOrder.findMany({
      where: {
        branchId,
        updatedAt: { gt: lastSyncedAt },
      },
      include: {
        items: true,
      },
    });

    const payments = await this.prisma.customerPayment.findMany({
      where: {
        businessId,
        createdAt: { gt: lastSyncedAt },
      },
    });

    return {
      serverTime: new Date().toISOString(),
      changes: {
        products,
        customers,
        inventoryMovements,
        salesOrders,
        payments,
      },
    };
  }

  @Post('push')
  async push(@Request() req: any, @Body() body: any) {
    const { businessId, branchId, sub: userId } = req.user;
    const { customers = [], salesOrders = [], inventoryMovements = [], payments = [] } = body;

    const results = await this.prisma.$transaction(async (tx) => {
      const syncedCustomerIds: string[] = [];
      const syncedOrderIds: string[] = [];
      const syncedMovementIds: string[] = [];
      const syncedPaymentIds: string[] = [];

      // 1. Process Customers (created/updated offline)
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

      // 2. Process Sales Orders
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
              paymentMode: order.paymentMode as PaymentMode,
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

      // 3. Process Payments
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
              paymentMode: payment.paymentMode as PaymentMode,
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

      // 4. Process Inventory Movements
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
              type: movement.type as MovementType,
              referenceId: movement.referenceId || null,
              notes: movement.notes || null,
              createdById: userId,
              createdAt: new Date(movement.createdAt),
            },
          });
        }
        syncedMovementIds.push(movement.id);
      }

      // 5. Add Audit Log
      await tx.auditLog.create({
        data: {
          id: `aud_${Date.now()}`,
          userId,
          action: 'SYNC_PUSH',
          payload: JSON.stringify({
            ordersCount: salesOrders.length,
            movementsCount: inventoryMovements.length,
            paymentsCount: payments.length,
          }),
        },
      });

      return {
        customers: syncedCustomerIds,
        salesOrders: syncedOrderIds,
        inventoryMovements: syncedMovementIds,
        payments: syncedPaymentIds,
      };
    });

    return {
      success: true,
      synced: results,
      serverTime: new Date().toISOString(),
    };
  }
}
