import { SyncController } from './sync.controller';

describe('SyncController push', () => {
  it('rejects sales order items whose related product is missing and reports the failure details', async () => {
    const prisma = {
      branch: {
        findFirst: jest.fn().mockResolvedValue({ id: 'branch-1' }),
      },
      $transaction: async (callback: (tx: any) => Promise<any>) => {
        const tx = {
          product: {
            upsert: jest.fn(),
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn(),
          },
          supplier: {
            upsert: jest.fn(),
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn(),
          },
          purchaseOrder: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn(),
          },
          purchaseOrderItem: {
            create: jest.fn(),
          },
          customer: {
            upsert: jest.fn(),
            findUnique: jest.fn().mockResolvedValue({ id: 'customer-1' }),
            create: jest.fn(),
            update: jest.fn(),
          },
          salesOrder: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn(),
          },
          salesOrderItem: {
            create: jest.fn(),
          },
          customerPayment: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn(),
          },
          inventoryMovement: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn(),
          },
          branch: {
            upsert: jest.fn(),
          },
          user: {
            upsert: jest.fn(),
          },
          auditLog: {
            create: jest.fn(),
          },
        };

        return callback(tx);
      },
    } as any;

    const controller = new SyncController(prisma);

    const result = await controller.push(
      { user: { businessId: 'biz-1', sub: 'user-1', branchId: 'branch-1' } },
      {
        customers: [],
        products: [],
        salesOrders: [
          {
            id: 'sale-1',
            customerId: 'customer-1',
            paymentMode: 'CREDIT',
            totalAmount: 50,
            discountAmount: 0,
            paidAmount: 0,
            items: [
              {
                id: 'sale-item-1',
                productId: 'missing-product-1',
                quantity: 2,
                unitPrice: 25,
                totalPrice: 50,
              },
            ],
            createdAt: new Date().toISOString(),
          },
        ],
        inventoryMovements: [],
        payments: [],
        suppliers: [],
        purchaseOrders: [],
        branches: [],
        users: [],
      },
    );

    expect(result.failed).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'product',
          reason: 'PRODUCT_NOT_FOUND',
          id: 'missing-product-1',
        }),
      ]),
    );
    expect(result.synced.salesOrders).toEqual([]);
  });
});
