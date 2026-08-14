import { Controller, Post, Body, UnauthorizedException, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: any) {
    const { username, password, businessId } = body;
    if (!username || !password || !businessId) {
      throw new UnauthorizedException('Username, password, and businessId are required');
    }

    const user = await this.authService.validateUser(username, password, businessId);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials or inactive user');
    }

    return this.authService.login(user);
  }
}
