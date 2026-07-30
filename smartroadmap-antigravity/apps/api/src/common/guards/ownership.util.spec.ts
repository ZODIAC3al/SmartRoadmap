import { ForbiddenException } from '@nestjs/common';
import { assertSelfOrAdmin } from './ownership.util';
import type { JwtUser } from '../decorators/current-user.decorator';

const learner: JwtUser = { sub: 'user-1', email: 'a@b.com', role: 'learner' };
const admin: JwtUser = { sub: 'user-9', email: 'admin@b.com', role: 'admin' };

describe('assertSelfOrAdmin', () => {
  it('allows the owner', () => {
    expect(() => assertSelfOrAdmin(learner, 'user-1')).not.toThrow();
  });

  it('blocks access to another user resource (the old IDOR)', () => {
    expect(() => assertSelfOrAdmin(learner, 'user-2')).toThrow(
      ForbiddenException,
    );
  });

  it('allows admins', () => {
    expect(() => assertSelfOrAdmin(admin, 'user-2')).not.toThrow();
  });
});
