import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Build the adapter outside the class so it's guaranteed to exist
// before super() is called — avoids Prisma 7 "no options" error.
function buildAdapter() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      '[EBOS] DATABASE_URL environment variable is not set.\n' +
      '  → On Render: add it in Dashboard > Environment > Environment Variables\n' +
      '  → Locally: create a .env file (see .env.example)'
    );
  }
  return new PrismaPg({ connectionString });
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  // Allow indexed access so controllers can use this.prisma.product, etc.
  [key: string]: any;

  constructor() {
    super({ adapter: buildAdapter() });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
