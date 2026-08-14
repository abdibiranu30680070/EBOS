import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/v1/customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getCustomers(@Request() req: any) {
    const { businessId } = req.user;
    return this.prisma.customer.findMany({
      where: { businessId },
      orderBy: { name: 'asc' },
    });
  }

  @Post()
  async upsertCustomer(@Request() req: any, @Body() body: any) {
    const { businessId } = req.user;
    const { id, name, phone, creditLimit, outstandingBalance } = body;

    return this.prisma.customer.upsert({
      where: { id },
      update: {
        name,
        phone,
        creditLimit: creditLimit || 0.0,
        outstandingBalance: outstandingBalance || 0.0,
      },
      create: {
        id,
        businessId,
        name,
        phone,
        creditLimit: creditLimit || 0.0,
        outstandingBalance: outstandingBalance || 0.0,
      },
    });
  }
}
