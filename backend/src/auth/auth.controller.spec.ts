import { GUARDS_METADATA } from '@nestjs/common/constants';

jest.mock(
  '@prisma/adapter-better-sqlite3',
  () => ({ PrismaBetterSqlite3: class PrismaBetterSqlite3 {} }),
  { virtual: true },
);

import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('AuthController getUsers', () => {
  const prisma = {
    user: {
      findMany: jest.fn(),
    },
  } as any;

  const controller = new AuthController({} as any, prisma);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires JWT authentication', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, AuthController.prototype.getUsers);

    expect(guards).toContain(JwtAuthGuard);
  });

  it('scopes results to the authenticated business, ignoring a supplied business ID', async () => {
    prisma.user.findMany.mockResolvedValue([]);

    await controller.getUsers(
      { user: { businessId: 'business-a', branchId: null } },
      undefined,
    );

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { businessId: 'business-a' },
      }),
    );
  });

  it('limits branch-scoped users to their authenticated branch', async () => {
    prisma.user.findMany.mockResolvedValue([]);

    await controller.getUsers(
      { user: { businessId: 'business-a', branchId: 'branch-a' } },
      'branch-b',
    );

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { businessId: 'business-a', branchId: 'branch-a' },
      }),
    );
  });
});
