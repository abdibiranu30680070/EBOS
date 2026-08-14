import { PrismaService } from '../prisma/prisma.service';
export declare class CustomersController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getCustomers(req: any): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        businessId: string;
        phone: string | null;
        creditLimit: import("@prisma/client-runtime-utils").Decimal;
        outstandingBalance: import("@prisma/client-runtime-utils").Decimal;
    }[]>;
    upsertCustomer(req: any, body: any): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        businessId: string;
        phone: string | null;
        creditLimit: import("@prisma/client-runtime-utils").Decimal;
        outstandingBalance: import("@prisma/client-runtime-utils").Decimal;
    }>;
}
