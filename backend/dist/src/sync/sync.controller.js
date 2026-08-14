"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let SyncController = class SyncController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async pull(req, lastSyncedAtStr) {
        const { businessId, branchId } = req.user;
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
    async push(req, body) {
        const { businessId, branchId, sub: userId } = req.user;
        const { customers = [], salesOrders = [], inventoryMovements = [], payments = [] } = body;
        const results = await this.prisma.$transaction(async (tx) => {
            const syncedCustomerIds = [];
            const syncedOrderIds = [];
            const syncedMovementIds = [];
            const syncedPaymentIds = [];
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
            for (const order of salesOrders) {
                const existingOrder = await tx.salesOrder.findUnique({
                    where: { id: order.id },
                });
                if (!existingOrder) {
                    await tx.salesOrder.create({
                        data: {
                            id: order.id,
                            branchId,
                            customerId: order.customerId || null,
                            userId: userId,
                            totalAmount: order.totalAmount,
                            discountAmount: order.discountAmount || 0,
                            paidAmount: order.paidAmount || 0,
                            paymentMode: order.paymentMode,
                            createdAt: new Date(order.createdAt),
                        },
                    });
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
                            paymentMode: payment.paymentMode,
                            referenceNumber: payment.referenceNumber || null,
                            createdById: userId,
                            createdAt: new Date(payment.createdAt),
                        },
                    });
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
                            type: movement.type,
                            referenceId: movement.referenceId || null,
                            notes: movement.notes || null,
                            createdById: userId,
                            createdAt: new Date(movement.createdAt),
                        },
                    });
                }
                syncedMovementIds.push(movement.id);
            }
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
};
exports.SyncController = SyncController;
__decorate([
    (0, common_1.Get)('pull'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('lastSyncedAt')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SyncController.prototype, "pull", null);
__decorate([
    (0, common_1.Post)('push'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SyncController.prototype, "push", null);
exports.SyncController = SyncController = __decorate([
    (0, common_1.Controller)('api/v1/sync'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SyncController);
//# sourceMappingURL=sync.controller.js.map