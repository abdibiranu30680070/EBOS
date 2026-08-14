import { Module }       from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService }    from './app.service';

import { PrismaModule }    from './prisma/prisma.module';
import { AuthModule }      from './auth/auth.module';
import { ProductsModule }  from './products/products.module';
import { CustomersModule } from './customers/customers.module';
import { SyncModule }      from './sync/sync.module';

@Module({
  imports: [
    // Load .env variables globally across all modules
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ProductsModule,
    CustomersModule,
    SyncModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
