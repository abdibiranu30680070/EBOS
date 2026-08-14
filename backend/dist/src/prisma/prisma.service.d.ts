import { OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
export declare class PrismaService extends PrismaClient implements OnModuleInit {
    [key: string]: any;
    constructor();
    onModuleInit(): Promise<void>;
}
