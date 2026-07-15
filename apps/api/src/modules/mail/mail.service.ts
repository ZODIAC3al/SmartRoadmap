import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

/**
 * Transactional email.
 *
 * Dev: logs the message (and the link) to the console — no provider needed.
 * Prod: sends through Resend. `env.validation.ts` requires RESEND_API_KEY in
 * production, so we can never *silently* drop a password-reset email.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly apiKey?: string;
  private readonly from: string;
  private readonly appUrl: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('RESEND_API_KEY');
    this.from = this.config.get<string>(
      'EMAIL_FROM',
      'noreply@smartroadmap.io',
    );
    this.appUrl = this.config
      .get<string>('FRONTEND_URL', 'http://localhost:3001')
      .split(',')[0];

    if (!this.apiKey) {
      this.logger.warn(
        'RESEND_API_KEY not set — emails will be logged to the console.',
      );
    }
  }

  private async send(
    to: string,
    subject: string,
    html: string,
    preview: string,
  ): Promise<void> {
    if (!this.apiKey) {
      this.logger.log(`[MAIL → ${to}] ${subject}\n         ${preview}`);
      return;
    }

    try {
      await axios.post(
        'https://api.resend.com/emails',
        { from: `SmartRoadmap <${this.from}>`, to, subject, html },
        {
          headers: { Authorization: `Bearer ${this.apiKey}` },
          timeout: 10_000,
        },
      );
      this.logger.log(`Sent "${subject}" to ${to}`);
    } catch (error: any) {
      // Never leak provider errors to the caller — the endpoint response must not
      // reveal whether an address exists or whether delivery succeeded.
      this.logger.error(
        `Failed to send "${subject}" to ${to}: ${error.message}`,
      );
    }
  }

  async sendPasswordReset(
    to: string,
    name: string,
    token: string,
  ): Promise<void> {
    const link = `${this.appUrl}/auth/reset-password?token=${token}`;
    await this.send(
      to,
      'Reset your SmartRoadmap password',
      `<p>Hi ${name},</p>
       <p>Click below to choose a new password. The link expires in 1 hour.</p>
       <p><a href="${link}">Reset password</a></p>
       <p>If you didn't request this, you can safely ignore this email.</p>`,
      `Reset link: ${link}`,
    );
  }

  async sendVerification(
    to: string,
    name: string,
    token: string,
  ): Promise<void> {
    const link = `${this.appUrl}/auth/verify-email?token=${token}`;
    await this.send(
      to,
      'Verify your SmartRoadmap email',
      `<p>Welcome, ${name}!</p>
       <p>Confirm your email address to activate your account:</p>
       <p><a href="${link}">Verify email</a></p>`,
      `Verification link: ${link}`,
    );
  }
}
