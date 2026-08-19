import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  // When generated client types are not available to TypeScript,
  // allow indexed access to model properties and runtime helpers.
  // This is a targeted, minimal workaround so controllers can use
  // `this.prisma.product`, `this.prisma.$transaction`, etc.
  [key: string]: any;
  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL must be set');
    }

    const adapter = new PrismaPg({ connectionString });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
