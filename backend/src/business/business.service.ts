import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class BusinessService {
  constructor(private prisma: PrismaService) {}

  async registerBusiness(data: any) {
    const { businessName, tin, ownerName, phone, username, password } = data;

    // 1. Verify business name uniqueness
    const existingName = await this.prisma.business.findFirst({
      where: { name: { equals: businessName.trim(), mode: 'insensitive' } },
    });
    if (existingName) {
      throw new ConflictException(`A business named "${businessName}" already exists. If this is your store, please sign in using your Business ID (${existingName.id}).`);
    }

    // 2. Verify TIN uniqueness if provided
    if (tin && tin.trim()) {
      const existingTin = await this.prisma.business.findFirst({
        where: { tin: tin.trim() },
      });
      if (existingTin) {
        throw new ConflictException(`A business with TIN "${tin}" already exists. Please sign in using your Business ID (${existingTin.id}).`);
      }
    }

    // 3. Verify username uniqueness
    if (username) {
      const existingUser = await this.prisma.user.findFirst({
        where: { username: username.trim() },
      });
      if (existingUser) {
        throw new ConflictException(`Username "${username}" is already registered. Please choose a different username.`);
      }
    }

    const businessId = `bus_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const branchId   = `br_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const userId     = `usr_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const passwordHash = await bcrypt.hash(password, 10);

    // Create everything in a single atomic transaction
    return this.prisma.$transaction(async (tx: any) => {
      const business = await tx.business.create({
        data: {
          id: businessId,
          name: businessName,
          tin: tin || null,
        },
      });

      const branch = await tx.branch.create({
        data: {
          id: branchId,
          businessId: business.id,
          name: 'Main Store',
        },
      });

      const user = await tx.user.create({
        data: {
          id: userId,
          businessId: business.id,
          branchId: branch.id,
          username,
          passwordHash,
          role: 'OWNER',
          fullName: ownerName,
          phoneNumber: phone,
          isActive: true,
        },
      });

      return {
        businessId: business.id,
        businessName: business.name,
        branchId: branch.id,
        username: user.username,
        role: user.role,
      };
    });
  }
}
