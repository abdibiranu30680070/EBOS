import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(username: string, pass: string, businessId: string): Promise<any> {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      return { error: 'INVALID_BUSINESS_ID' };
    }

    const user = await this.prisma.user.findFirst({
      where: {
        username,
        businessId,
      },
      include: {
        business: true,
        branch: true,
      },
    });

    if (!user) {
      return { error: 'INVALID_CREDENTIALS' };
    }

    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) {
      return { error: 'INVALID_CREDENTIALS' };
    }

    if (!user.isActive) {
      return { error: 'INACTIVE_USER' };
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = user;
    return result;
  }

  async registerUser(data: {
    username: string;
    password: string;
    fullName: string;
    phoneNumber?: string;
    businessId: string;
    branchId?: string;
    role?: any;
  }): Promise<any> {
    const existing = await this.prisma.user.findFirst({
      where: {
        username: data.username,
        businessId: data.businessId,
      },
    });

    if (existing) {
      throw new BadRequestException('Username already exists for this business');
    }

    const passwordHash = bcrypt.hashSync(data.password, 10);
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newUser = await this.prisma.user.create({
      data: {
        id: userId,
        username: data.username,
        passwordHash,
        fullName: data.fullName,
        phoneNumber: data.phoneNumber || '',
        businessId: data.businessId,
        branchId: data.branchId || null,
        role: data.role || 'CASHIER',
        isActive: true, // Always active upon creation so user can log in immediately
      },
      include: {
        business: true,
        branch: true,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...result } = newUser;
    return result;
  }

  async login(user: any) {
    const payload = {
      username: user.username,
      sub: user.id,
      role: user.role,
      businessId: user.businessId,
      branchId: user.branchId,
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        businessId: user.businessId,
        branchId: user.branchId,
        businessName: user.business?.name,
        branchName: user.branch?.name || null,
        isActive: user.isActive,
      },
    };
  }

  async validateToken(token: string): Promise<any> {
    try {
      return this.jwtService.verify(token);
    } catch {
      return null;
    }
  }
}
