import { Module } from '@nestjs/common';
import { BranchesController } from './branches.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BranchesController],
})
export class BranchesModule {}
