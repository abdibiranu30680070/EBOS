import { Module } from '@nestjs/common';
import { BranchesController } from './branches.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [BranchesController],
})
export class BranchesModule {}
