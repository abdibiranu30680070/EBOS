import { Module } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [CustomersController],
})
export class CustomersModule {}
