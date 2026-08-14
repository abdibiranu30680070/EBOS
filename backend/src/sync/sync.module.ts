import { Module } from '@nestjs/common';
import { SyncController } from './sync.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [SyncController],
})
export class SyncModule {}
