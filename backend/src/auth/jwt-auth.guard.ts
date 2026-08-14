import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from './auth.service';
import { ROLES_KEY } from './roles.decorator';
import { UserRole } from '@prisma/client';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.split(' ')[1];
    const payload = await this.authService.validateToken(token);
    if (!payload) {
      throw new UnauthorizedException('Token is invalid or expired');
    }

    // Attach user information to request
    request.user = payload;

    // Check Roles
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const userHasRole = requiredRoles.includes(payload.role);
    if (!userHasRole) {
      throw new ForbiddenException('You do not have permission to access this resource');
    }

    return true;
  }
}
