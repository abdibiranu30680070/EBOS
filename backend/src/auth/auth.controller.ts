import { Controller, Post, Body, UnauthorizedException, BadRequestException, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
    if (!result || result.error === 'INVALID_CREDENTIALS') {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (result.error === 'INACTIVE_USER') {
      throw new UnauthorizedException('User account is inactive. Please contact your administrator.');
    }

    return this.authService.login(result);
  }
}
