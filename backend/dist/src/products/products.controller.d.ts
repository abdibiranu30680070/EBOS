import { PrismaService } from '../prisma/prisma.service';
export declare class ProductsController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getProducts(req: any): Promise<{
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
    }[]>;
    upsertProduct(req: any, body: any): Promise<{
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
    }>;
}
