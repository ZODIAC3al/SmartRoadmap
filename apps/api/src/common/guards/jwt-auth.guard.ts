import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const header: string | undefined = request.headers?.authorization;
    let tokenStr: string | undefined;

    if (header?.startsWith('Bearer ')) {
      tokenStr = header.slice(7);
    } else if (
      request.query?.token &&
      typeof request.query.token === 'string'
    ) {
      tokenStr = request.query.token;
    } else if (request.cookies?.access_token) {
      tokenStr = request.cookies.access_token;
    }

    if (!tokenStr) {
      throw new UnauthorizedException('Missing bearer token');
    }

    try {
      const payload = await this.jwt.verifyAsync(tokenStr, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
      });
      if (payload.type && payload.type !== 'access') {
        throw new UnauthorizedException(
          'Refresh tokens cannot be used to access resources',
        );
      }
      request.user = {
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
        ...(payload.companyStatus ? { companyStatus: payload.companyStatus } : {}),
      };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
