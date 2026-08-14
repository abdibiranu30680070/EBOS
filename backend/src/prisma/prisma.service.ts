import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  // When generated client types are not available to TypeScript,
  // allow indexed access to model properties and runtime helpers.
  // This is a targeted, minimal workaround so controllers can use
  // `this.prisma.product`, `this.prisma.$transaction`, etc.
  [key: string]: any;
  
  constructor() {
    super();
  }

  async onModuleInit() {
    await this.$connect();
  }
}
