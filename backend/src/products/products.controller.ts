import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/v1/products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getProducts(@Request() req: any) {
    const { businessId } = req.user;
    return this.prisma.product.findMany({
      where: { businessId },
      orderBy: { name: 'asc' },
    });
  }

  @Post()
  async upsertProduct(@Request() req: any, @Body() body: any) {
    const { businessId } = req.user;
    const { id, sku, name, costPrice, sellingPrice, minStockLevel, unitOfMeasure, isActive } = body;

    return this.prisma.product.upsert({
      where: { id },
      update: {
        sku,
        name,
        costPrice,
        sellingPrice,
        minStockLevel: minStockLevel || 0,
        unitOfMeasure: unitOfMeasure || 'Pcs',
        isActive: isActive !== undefined ? isActive : true,
      },
      create: {
        id,
        businessId,
        sku,
        name,
        costPrice,
        sellingPrice,
        minStockLevel: minStockLevel || 0,
        unitOfMeasure: unitOfMeasure || 'Pcs',
        isActive: isActive !== undefined ? isActive : true,
      },
    });
  }

  @Put(':id')
  async updateProduct(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    const { businessId } = req.user;
    const { sku, name, costPrice, sellingPrice, minStockLevel, unitOfMeasure, isActive } = body;

    return this.prisma.product.update({
      where: { id },
      data: {
        sku,
        name,
        costPrice,
        sellingPrice,
        minStockLevel: minStockLevel || 0,
        unitOfMeasure: unitOfMeasure || 'Pcs',
        isActive: isActive !== undefined ? isActive : true,
        businessId,
      },
    });
  }

  @Delete(':id')
  async deleteProduct(@Request() req: any, @Param('id') id: string) {
    const { businessId } = req.user;

    const existing = await this.prisma.product.findFirst({ where: { id, businessId } });
    if (!existing) {
      return { deleted: false, id };
    }

    await this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    return { deleted: true, id };
  }
}
