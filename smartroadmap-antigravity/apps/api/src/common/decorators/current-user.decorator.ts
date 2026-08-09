import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AppRole } from './roles.decorator';

export interface JwtUser {
  sub: string;
  email: string;
  role: AppRole;
}

/**
 * The ONLY trusted source of the caller identity.
 * Never read `userId` from the request body again.
 */
export const CurrentUser = createParamDecorator(
  (data: keyof JwtUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: JwtUser | undefined = request.user;
    return data && user ? user[data] : user;
  },
);
