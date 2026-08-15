import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class BusinessService {
  constructor(private prisma: PrismaService) {}

  async registerBusiness(data: any) {
    const { businessName, tin, ownerName, phone, username, password } = data;

    // Optional: verify TIN uniqueness if provided
    if (tin) {
      const existing = await this.prisma.business.findUnique({ where: { tin } });
      if (existing) {
        throw new ConflictException('A business with this TIN already exists.');
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
