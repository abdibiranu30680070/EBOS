import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  // When generated client types are not available to TypeScript,
  // allow indexed access to model properties and runtime helpers.
  // This is a targeted, minimal workaround so controllers can use
  // `this.prisma.product`, `this.prisma.$transaction`, etc.
  [key: string]: any;
  constructor() {
    const adapter = new PrismaBetterSqlite3({
      url: process.env.DATABASE_URL || 'file:./dev.db',
    });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
