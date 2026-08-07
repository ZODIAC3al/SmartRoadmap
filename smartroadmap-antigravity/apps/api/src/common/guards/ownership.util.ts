import { ForbiddenException } from '@nestjs/common';
import type { JwtUser } from '../decorators/current-user.decorator';

/**
 * Allow access only to the resource owner or an admin.
 * Prevents the IDOR class of bugs (/cv/user/:userId, /roadmap/user/:userId, ...).
 */
export function assertSelfOrAdmin(user: JwtUser, targetUserId: string): void {
  if (user.role === 'admin') return;
  if (user.sub !== targetUserId) {
    throw new ForbiddenException('You can only access your own resources');
  }
}
