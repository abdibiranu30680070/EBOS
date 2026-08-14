import { PrismaService } from '../prisma/prisma.service';
export declare class SyncController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    pull(req: any, lastSyncedAtStr?: string): Promise<{
        serverTime: string;
        changes: {
            products: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                isActive: boolean;
                businessId: string;
                sku: string;
                costPrice: import("@prisma/client-runtime-utils").Decimal;
                sellingPrice: import("@prisma/client-runtime-utils").Decimal;
                minStockLevel: import("@prisma/client-runtime-utils").Decimal;
                unitOfMeasure: string;
            }[];
            customers: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                businessId: string;
                phone: string | null;
                creditLimit: import("@prisma/client-runtime-utils").Decimal;
                outstandingBalance: import("@prisma/client-runtime-utils").Decimal;
            }[];
            inventoryMovements: {
                id: string;
                createdAt: Date;
                branchId: string;
                productId: string;
                quantityDelta: import("@prisma/client-runtime-utils").Decimal;
                type: import("@prisma/client").$Enums.MovementType;
                referenceId: string | null;
                notes: string | null;
                createdById: string | null;
            }[];
            salesOrders: ({
                items: {
                    id: string;
                    productId: string;
                    orderId: string;
                    quantity: import("@prisma/client-runtime-utils").Decimal;
                    unitPrice: import("@prisma/client-runtime-utils").Decimal;
                    totalPrice: import("@prisma/client-runtime-utils").Decimal;
                }[];
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                branchId: string;
                customerId: string | null;
                userId: string | null;
                totalAmount: import("@prisma/client-runtime-utils").Decimal;
                discountAmount: import("@prisma/client-runtime-utils").Decimal;
                paidAmount: import("@prisma/client-runtime-utils").Decimal;
                paymentMode: import("@prisma/client").$Enums.PaymentMode;
            })[];
            payments: {
                id: string;
                createdAt: Date;
                businessId: string;
                createdById: string | null;
                customerId: string;
                paymentMode: import("@prisma/client").$Enums.PaymentMode;
                amount: import("@prisma/client-runtime-utils").Decimal;
                referenceNumber: string | null;
            }[];
        };
    }>;
    push(req: any, body: any): Promise<{
        success: boolean;
        synced: {
            customers: string[];
            salesOrders: string[];
            inventoryMovements: string[];
            payments: string[];
        };
        serverTime: string;
    }>;
}
