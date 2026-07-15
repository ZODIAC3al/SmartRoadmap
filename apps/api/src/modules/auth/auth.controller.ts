import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Patch,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, type JwtUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { REFRESH_COOKIE, clearRefreshCookie, setRefreshCookie } from '../../common/cookies';
import {
  ChangeRoleDto,
  ForgotPasswordDto,
  GoogleLoginDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  UpdateProfileDto,
  VerifyEmailDto,
} from './dto/auth.dto';

/**
 * Brute-force budget for credential endpoints. 5/min in production; CI raises it
 * so the (legitimate) test suite doesn't throttle itself.
 */
const AUTH_LIMIT = Number(process.env.AUTH_THROTTLE_LIMIT ?? 5);
const FORGOT_LIMIT = Number(process.env.AUTH_THROTTLE_LIMIT ?? 3);

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  /**
   * The refresh token is returned as an httpOnly cookie and NOT in the JSON body,
   * so it can never be stolen by XSS. Only the short-lived access token reaches JS.
   */
  private withCookie(
    res: Response,
    result: { accessToken: string; refreshToken: string; user: unknown },
  ) {
    setRefreshCookie(res, result.refreshToken);
    return { accessToken: result.accessToken, user: result.user };
  }

  @Public()
  @Throttle({ default: { limit: AUTH_LIMIT, ttl: 60_000 } })
  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    return this.withCookie(res, await this.authService.register(dto));
  }

  @Public()
  @Throttle({ default: { limit: AUTH_LIMIT, ttl: 60_000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    return this.withCookie(res, await this.authService.login(dto.email, dto.password));
  }

  /** Expects a Google Identity Services ID token — verified against Google. */
  @Public()
  @Throttle({ default: { limit: AUTH_LIMIT * 2, ttl: 60_000 } })
  @Post('google')
  @HttpCode(HttpStatus.OK)
  async google(@Body() dto: GoogleLoginDto, @Res({ passthrough: true }) res: Response) {
    return this.withCookie(res, await this.authService.googleLogin(dto.idToken));
  }

  /** Rotates the session using the httpOnly cookie. No token in the request body. */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (!token) throw new UnauthorizedException('No refresh session');
    return this.withCookie(res, await this.authService.refresh(token));
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (token) {
      // Burn this device's refresh token server-side too, not just the cookie.
      try {
        const payload: any = await this.authService.decodeRefresh(token);
        if (payload?.sub) await this.authService.revokeSession(payload.sub, token);
      } catch {
        /* an unparsable cookie is not an error worth surfacing on logout */
      }
    }
    clearRefreshCookie(res);
    return { success: true };
  }

  /** Signs the user out of every device (used after suspicious activity). */
  @ApiBearerAuth()
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  async logoutAll(@CurrentUser() user: JwtUser, @Res({ passthrough: true }) res: Response) {
    await this.authService.revokeSession(user.sub, undefined, true);
    clearRefreshCookie(res);
    return { success: true };
  }

  // ── Email verification ────────────────────────────────────────────────────

  @Public()
  @Throttle({ default: { limit: AUTH_LIMIT * 2, ttl: 60_000 } })
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  @ApiBearerAuth()
  @Throttle({ default: { limit: FORGOT_LIMIT, ttl: 300_000 } })
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(@CurrentUser() user: JwtUser) {
    await this.authService.sendVerificationEmail(user.sub);
    return { success: true };
  }

  // ── Password reset ────────────────────────────────────────────────────────

  /** Always 200, whether the email exists or not (no user enumeration). */
  @Public()
  @Throttle({ default: { limit: FORGOT_LIMIT, ttl: 300_000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(dto.email);
  }

  @Public()
  @Throttle({ default: { limit: AUTH_LIMIT, ttl: 60_000 } })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.resetPassword(dto.token, dto.password);
    clearRefreshCookie(res); // every old session is dead; force a clean login
    return result;
  }

  @ApiBearerAuth()
  @Get('me')
  async me(@CurrentUser() user: JwtUser) {
    const found = await this.authService.findUserById(user.sub);
    if (!found) throw new NotFoundException('User not found');
    return this.authService.toPublicUser(found);
  }

  /** The user id is taken from the JWT — the body can no longer target someone else. */
  @ApiBearerAuth()
  @Patch('me')
  @HttpCode(HttpStatus.OK)
  async updateProfile(@CurrentUser() user: JwtUser, @Body() dto: UpdateProfileDto) {
    return { success: true, user: await this.authService.updateProfile(user.sub, dto) };
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get('users')
  async getAllUsers() {
    return { success: true, data: await this.authService.findAllUsers() };
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Patch('users/role')
  async changeRole(@Body() dto: ChangeRoleDto) {
    return { success: true, user: await this.authService.changeRole(dto.userId, dto.role) };
  }
}
