"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Seeding database...');
    await prisma.auditLog.deleteMany({});
    await prisma.customerPayment.deleteMany({});
    await prisma.salesOrderItem.deleteMany({});
    await prisma.salesOrder.deleteMany({});
    await prisma.inventoryMovement.deleteMany({});
    await prisma.customer.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.branch.deleteMany({});
    await prisma.business.deleteMany({});
    const business = await prisma.business.create({
        data: {
            id: 'bus_mercato_001',
            name: 'Mercato Wholesale Traders',
            tin: '1234567890',
        },
    });
    console.log(`Created business: ${business.name}`);
    const branch = await prisma.branch.create({
        data: {
            id: 'br_mercato_main',
            businessId: business.id,
            name: 'Mercato Main Store',
            location: 'Addis Ababa, Mercato, Block B',
            isActive: true,
        },
    });
    console.log(`Created branch: ${branch.name}`);
    const passwordHash = bcrypt.hashSync('almaz123', 10);
    const user = await prisma.user.create({
        data: {
            id: 'usr_almaz_001',
            businessId: business.id,
            branchId: branch.id,
            username: 'almaz',
            passwordHash: passwordHash,
            role: client_1.UserRole.OWNER,
            fullName: 'Almaz Tekle',
            phoneNumber: '+251911223344',
            isActive: true,
        },
    });
    console.log(`Created user: ${user.username} (${user.fullName})`);
    const customer = await prisma.customer.create({
        data: {
            id: 'cust_kebede_001',
            businessId: business.id,
            name: 'Kebede Balcha',
            phone: '+251912345678',
            creditLimit: 50000.00,
            outstandingBalance: 0.00,
        },
    });
    console.log(`Created customer: ${customer.name}`);
    const product1 = await prisma.product.create({
        data: {
            id: 'prod_oil_3l',
            businessId: business.id,
            sku: 'OIL-SUN-3L',
            name: 'Sunflower Cooking Oil 3L',
            costPrice: 450.00,
            sellingPrice: 600.00,
            minStockLevel: 10.00,
            unitOfMeasure: 'Pcs',
            isActive: true,
        },
    });
    const product2 = await prisma.product.create({
        data: {
            id: 'prod_flour_10k',
            businessId: business.id,
            sku: 'WHEAT-FLOUR-10KG',
            name: 'Premium Wheat Flour 10Kg',
            costPrice: 800.00,
            sellingPrice: 1050.00,
            minStockLevel: 5.00,
            unitOfMeasure: 'Pcs',
            isActive: true,
        },
    });
    const product3 = await prisma.product.create({
        data: {
            id: 'prod_sugar_5k',
            businessId: business.id,
            sku: 'SUGAR-5KG',
            name: 'Sugar 5Kg',
            costPrice: 320.00,
            sellingPrice: 400.00,
            minStockLevel: 20.00,
            unitOfMeasure: 'Pcs',
            isActive: true,
        },
    });
    console.log(`Created 3 products: ${product1.sku}, ${product2.sku}, ${product3.sku}`);
    await prisma.inventoryMovement.createMany({
        data: [
            {
                id: 'mv_oil_init',
                branchId: branch.id,
                productId: product1.id,
                quantityDelta: 100.00,
                type: 'STOCK_IN',
                notes: 'Initial opening stock',
                createdById: user.id,
            },
            {
                id: 'mv_flour_init',
                branchId: branch.id,
                productId: product2.id,
                quantityDelta: 50.00,
                type: 'STOCK_IN',
                notes: 'Initial opening stock',
                createdById: user.id,
            },
            {
                id: 'mv_sugar_init',
                branchId: branch.id,
                productId: product3.id,
                quantityDelta: 200.00,
                type: 'STOCK_IN',
                notes: 'Initial opening stock',
                createdById: user.id,
            },
        ],
    });
    console.log('Seeded initial inventory movements.');
    console.log('Seeding complete! Owner Login Info:');
    console.log('-----------------------------------');
    console.log('Business ID: bus_mercato_001');
    console.log('Username:    almaz');
    console.log('Password:    almaz123');
    console.log('-----------------------------------');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map