import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

/**
 * CompanyApprovalGuard
 *
 * Must be applied AFTER JwtAuthGuard (which populates request.user).
 *
 * Blocks company accounts whose `companyStatus` is 'pending' or 'rejected'
 * from accessing protected company-only endpoints.
 *
 * Backend security boundary — cannot be bypassed by manipulating the frontend.
 */
@Injectable()
export class CompanyApprovalGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Only enforce for company-role users
    if (!user || user.role !== 'company') return true;

    if (!user.companyStatus || user.companyStatus === 'pending') {
      throw new ForbiddenException(
        'Company account is awaiting admin approval. You will be able to access the platform after your account is approved.',
      );
    }

    if (user.companyStatus === 'rejected') {
      throw new ForbiddenException(
        'Company account registration has been rejected. Please contact support.',
      );
    }

    return true;
  }
}
