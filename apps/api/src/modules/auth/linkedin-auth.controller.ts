import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import {
  CurrentUser,
  type JwtUser,
} from '../../common/decorators/current-user.decorator';
import { LinkedInService } from '../profile-import/linkedin.service';

/**
 * Handles the LinkedIn OAuth 2.0 / OpenID Connect flow.
 *
 * Registered endpoints:
 *   GET  /auth/linkedin          → redirect to LinkedIn authorize page
 *   GET  /auth/linkedin/callback → OAuth callback (public — no JWT required)
 *   GET  /auth/linkedin/status   → returns { configured, apiLimitations }
 *   DELETE /auth/linkedin        → disconnect the linked account
 */
@ApiTags('auth-linkedin')
@Controller('auth/linkedin')
export class LinkedInAuthController {
  constructor(private readonly linkedin: LinkedInService) {}

  /** Returns whether LinkedIn OAuth is configured on the server. */
  @Get('status')
  linkedinStatus() {
    return {
      configured: this.linkedin.isConfigured(),
      // LinkedIn's standard OpenID API only exposes name/email/picture.
      apiLimitations: true,
    };
  }

  /**
   * Builds and returns the LinkedIn authorization URL.
   * The frontend should redirect the browser to this URL.
   */
  @Get()
  async linkedinConnect(@CurrentUser() user: JwtUser) {
    const url = await this.linkedin.buildAuthUrl(user.sub);
    return { configured: true, url };
  }

  /**
   * OAuth callback — LinkedIn redirects here after the user authorizes.
   * This endpoint is PUBLIC (no JWT).
   * On success: redirects to http://localhost:3001/profile/import?linkedin=connected
   * On error:   redirects to http://localhost:3001/profile/import?linkedin=error&message=...
   */
  @Public()
  @Get('callback')
  async linkedinCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Query('error_description') errorDescription: string,
    @Res() res: Response,
  ) {
    const frontend = (process.env.FRONTEND_URL ?? 'http://localhost:3001')
      .split(',')[0]
      .trim();

    if (error) {
      const msg = encodeURIComponent(errorDescription || error);
      return res.redirect(
        `${frontend}/profile/import?linkedin=error&message=${msg}`,
      );
    }
    if (!code || !state) {
      return res.redirect(
        `${frontend}/profile/import?linkedin=error&message=Missing+code+or+state`,
      );
    }
    try {
      await this.linkedin.handleCallback(code, state);
      return res.redirect(`${frontend}/profile/import?linkedin=connected`);
    } catch (err: any) {
      const msg = encodeURIComponent(
        err?.message ?? 'LinkedIn connection failed',
      );
      return res.redirect(
        `${frontend}/profile/import?linkedin=error&message=${msg}`,
      );
    }
  }

  /** Disconnects the LinkedIn account for the current user. */
  @Delete()
  @HttpCode(HttpStatus.OK)
  async linkedinDisconnect(@CurrentUser() user: JwtUser) {
    await this.linkedin.disconnect(user.sub);
    return { success: true };
  }
}
