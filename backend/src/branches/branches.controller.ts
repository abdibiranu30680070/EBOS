import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/v1/branches')
export class BranchesController {
  constructor(private readonly prisma: PrismaService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getBranches(@Req() req: any, @Query('businessId') queryBusinessId?: string) {
    const businessId = req.user?.businessId || queryBusinessId;
    return this.prisma.branch.findMany({
      where: {
        ...(businessId ? { businessId } : {}),
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createBranch(@Req() req: any, @Body() body: any) {
    const businessId = body.businessId || req.user?.businessId;
    const branchId = body.id || `br_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    
    return this.prisma.branch.create({
      data: {
        id: branchId,
        businessId,
        name: body.name,
        location: body.location || '',
        isActive: body.isActive !== undefined ? body.isActive : true,
      },
    });
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updateBranch(@Param('id') id: string, @Body() body: any) {
    const { name, location, isActive } = body;
    return this.prisma.branch.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(location !== undefined ? { location } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
    });
  }
}
