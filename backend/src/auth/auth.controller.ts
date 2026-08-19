import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UnauthorizedException,
  BadRequestException,
  HttpCode,
  HttpStatus,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('api/v1/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('users')
  async getUsers(@Request() req: any, @Query('branchId') requestedBranchId?: string) {
    const { businessId, branchId: authenticatedBranchId } = req.user;
    if (!businessId) {
      return [];
    }

    // A branch user cannot widen the result set by supplying another branch ID.
    const branchId = authenticatedBranchId ?? requestedBranchId;

    const users = await this.prisma.user.findMany({
      where: {
        businessId,
        ...(branchId ? { branchId } : {}),
      },
      orderBy: { username: 'asc' },
      select: {
        id: true,
        username: true,
        role: true,
        businessId: true,
        branchId: true,
        fullName: true,
        isActive: true,
        createdAt: true,
      },
    });

    return users.map((user) => ({
      ...user,
      syncStatus: 'SYNCED',
    }));
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: any) {
    const { username, password, fullName, businessId, branchId, role, phoneNumber } = body;
    if (!username || !password || !fullName || !businessId) {
      throw new BadRequestException('Username, password, fullName, and businessId are required');
    }

    const user = await this.authService.registerUser({
      username,
      password,
      fullName,
      businessId,
      branchId,
      role,
      phoneNumber,
    });

    return {
      message: 'User created successfully and is active.',
      user,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: any) {
    const { username, password, businessId } = body;
    if (!username || !password || !businessId) {
      throw new UnauthorizedException('Username, password, and businessId are required');
    }

    const result = await this.authService.validateUser(username, password, businessId);
    if (result && result.error === 'INVALID_BUSINESS_ID') {
      throw new UnauthorizedException(`Business ID "${businessId}" not found. Please check your Business ID or register a new store.`);
    }
    if (!result || result.error === 'INVALID_CREDENTIALS') {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (result.error === 'INACTIVE_USER') {
      throw new UnauthorizedException('User account is inactive. Please contact your administrator.');
    }

    return this.authService.login(result);
  }
}
