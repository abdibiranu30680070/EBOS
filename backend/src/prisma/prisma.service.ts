import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  // When generated client types are not available to TypeScript,
  // allow indexed access to model properties and runtime helpers.
  // This is a targeted, minimal workaround so controllers can use
  // `this.prisma.product`, `this.prisma.$transaction`, etc.
  [key: string]: any;
  constructor() {
    // Use persistent storage path for Render deployment
    const dbPath = process.env.DATABASE_URL || 'file:./dev.db';
    const dbDir = path.dirname(dbPath.replace('file:', ''));
    
    // Ensure database directory exists
    if (dbDir && dbDir !== '.' && !fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    const adapter = new PrismaBetterSqlite3({
      url: dbPath,
    });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
