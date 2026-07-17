import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { OAuth2Client, type TokenPayload } from 'google-auth-library';
import { User } from '../../schemas/user.schema';
import type { AppRole } from '../../common/decorators/roles.decorator';
import { RegisterDto, UpdateProfileDto } from './dto/auth.dto';
import { OnboardingService } from './onboarding.service';
import { MailService } from '../mail/mail.service';

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: AppRole;
  avatarUrl?: string;
  username?: string;
  phone?: string;
  bio?: string;
  plan: string;
  subscriptionStatus: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly googleClient?: OAuth2Client;

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly onboarding: OnboardingService,
    private readonly mail: MailService,
  ) {
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    this.googleClient = clientId ? new OAuth2Client(clientId) : undefined;
    if (!this.googleClient) {
      this.logger.warn(
        'GOOGLE_CLIENT_ID is not set — Google sign-in is disabled.',
      );
    }
  }

  // ────────────────────────────── Tokens ──────────────────────────────

  /** One-way hash for anything we persist but must never be able to read back. */
  private sha256(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  private async issueTokens(user: User) {
    const base = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(
        { ...base, type: 'access' },
        {
          secret: this.config.getOrThrow<string>('JWT_SECRET'),
          expiresIn: this.config.get<string>('JWT_EXPIRY', '15m') as any,
        },
      ),
      this.jwt.signAsync(
        { sub: base.sub, type: 'refresh', jti: randomUUID() },
        {
          secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
          expiresIn: this.config.get<string>(
            'JWT_REFRESH_EXPIRY',
            '30d',
          ) as any,
        },
      ),
    ]);

    // Remember this refresh token (hashed). One entry per device, capped at 10.
    await this.userModel.updateOne(
      { _id: user._id },
      {
        $push: {
          refreshTokenHashes: {
            $each: [this.sha256(refreshToken)],
            $slice: -10,
          },
        },
      },
    );

    return { accessToken, refreshToken };
  }

  /**
   * Refresh with ROTATION + REUSE DETECTION.
   *
   * Every refresh burns the old token and issues a new one. If a token that is
   * cryptographically valid shows up but is no longer in the user's list, it has
   * already been spent — which means someone replayed a stolen token. We then
   * revoke every session for that account rather than serve the attacker.
   */
  async refresh(refreshToken: string) {
    let payload: any;
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Not a refresh token');
    }

    const user = await this.userModel
      .findById(payload.sub)
      .select('+refreshTokenHashes');
    if (!user) throw new UnauthorizedException('User no longer exists');

    // Revoked by a password change / logout-all?
    // NOTE: `iat` is whole seconds while `tokensValidFrom` has millisecond
    // precision, so a token minted in the same second as the revocation looks
    // "older" than it is. The 1s tolerance stops us from revoking valid tokens.
    const issuedAtMs = (payload.iat ?? 0) * 1000;
    if (
      user.tokensValidFrom &&
      issuedAtMs + 1000 < user.tokensValidFrom.getTime()
    ) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    const hash = this.sha256(refreshToken);
    if (!user.refreshTokenHashes?.includes(hash)) {
      this.logger.warn(
        `Refresh token REPLAY detected for user ${user._id.toString()} — revoking all sessions.`,
      );
      await this.userModel.updateOne(
        { _id: user._id },
        { refreshTokenHashes: [], tokensValidFrom: new Date() },
      );
      throw new UnauthorizedException(
        'Refresh token has already been used. All sessions revoked.',
      );
    }

    // Burn the used token, then mint a fresh pair.
    await this.userModel.updateOne(
      { _id: user._id },
      { $pull: { refreshTokenHashes: hash } },
    );

    const tokens = await this.issueTokens(user);
    return { ...tokens, user: this.toPublicUser(user) };
  }

  /** Verifies a refresh token without rotating it (used by logout). */
  async decodeRefresh(refreshToken: string): Promise<any> {
    return this.jwt.verifyAsync(refreshToken, {
      secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
    });
  }

  /** Signs the user out of this device (or all of them). */
  async revokeSession(
    userId: string,
    refreshToken?: string,
    allDevices = false,
  ): Promise<void> {
    if (allDevices) {
      await this.userModel.updateOne(
        { _id: userId },
        { refreshTokenHashes: [], tokensValidFrom: new Date() },
      );
      return;
    }
    if (refreshToken) {
      await this.userModel.updateOne(
        { _id: userId },
        { $pull: { refreshTokenHashes: this.sha256(refreshToken) } },
      );
    }
  }

  // ────────────────────────────── Passwords ───────────────────────────

  private hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.config.get<number>('BCRYPT_ROUNDS', 12));
  }

  // bcrypt.compare is constant-time — no manual `!==` comparisons anymore.
  private verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // ────────────────────────────── Auth flows ──────────────────────────

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();

    if (await this.userModel.exists({ email })) {
      throw new BadRequestException('User with this email already exists.');
    }

    const user = await new this.userModel({
      email,
      name: dto.name.trim(),
      passwordHash: await this.hashPassword(dto.password),
      // Defence in depth: even if the DTO layer were bypassed, only these two
      // roles are reachable through public registration. 'admin' never is.
      role: dto.role === 'company' ? 'company' : 'learner',
      provider: 'local',
      isVerified: false,
    }).save();

    // Demo/onboarding content is seeded once, on signup only — never on the
    // login hot path (it used to add 6 DB writes to every single login).
    void this.onboarding.seedForUser(user._id.toString());
    void this.sendVerificationEmail(user._id.toString());

    const tokens = await this.issueTokens(user);
    return { ...tokens, user: this.toPublicUser(user) };
  }

  async login(email: string, password: string) {
    // `passwordHash` is select:false on the schema — request it explicitly.
    const user = await this.userModel
      .findOne({ email: email.toLowerCase().trim() })
      .select('+passwordHash');

    // Generic message + a dummy compare so we don't leak account existence
    // through either the response text or the response time.
    if (!user || user.provider !== 'local') {
      await bcrypt.compare(
        password,
        '$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin',
      );
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (!(await this.verifyPassword(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const tokens = await this.issueTokens(user);
    return { ...tokens, user: this.toPublicUser(user) };
  }

  /**
   * Google sign-in.
   * The client sends the Google-issued ID token; we verify its signature and
   * audience against Google's public keys. We NEVER trust a client-supplied email.
   */
  async googleLogin(idToken: string) {
    if (!this.googleClient) {
      throw new BadRequestException(
        'Google sign-in is not configured on this server.',
      );
    }

    let payload: TokenPayload | undefined;
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: this.config.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      });
      payload = ticket.getPayload();
    } catch (err: any) {
      this.logger.warn(`Rejected Google ID token: ${err.message}`);
      throw new UnauthorizedException('Invalid Google credential.');
    }

    if (!payload?.email || !payload.email_verified) {
      throw new UnauthorizedException('Google account has no verified email.');
    }

    const email = payload.email.toLowerCase();
    let user = await this.userModel.findOne({ email });

    if (user && user.provider !== 'google') {
      // The email already belongs to a password account — do not silently take it over.
      throw new ForbiddenException(
        'This email is registered with a password. Please sign in with your password.',
      );
    }

    if (!user) {
      user = await new this.userModel({
        email,
        name: payload.name?.trim() || email.split('@')[0],
        // Random unusable hash: this account can only ever log in via Google.
        passwordHash: await this.hashPassword(randomUUID()),
        role: 'learner',
        provider: 'google',
        googleId: payload.sub,
        avatarUrl: payload.picture,
        isVerified: true,
      }).save();
      void this.onboarding.seedForUser(user._id.toString());
    }

    const tokens = await this.issueTokens(user);
    return { ...tokens, user: this.toPublicUser(user) };
  }

  // ──────────────────── Email verification & password reset ────────────────

  /** Generates a raw token for the email + the hash we actually store. */
  private oneTimeToken(): { raw: string; hash: string } {
    const raw = randomBytes(32).toString('hex');
    return { raw, hash: this.sha256(raw) };
  }

  async sendVerificationEmail(userId: string): Promise<void> {
    const user = await this.userModel.findById(userId);
    if (!user || user.isVerified) return;

    const { raw, hash } = this.oneTimeToken();
    await this.userModel.updateOne(
      { _id: user._id },
      {
        verificationTokenHash: hash,
        verificationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
      },
    );
    await this.mail.sendVerification(user.email, user.name, raw);
  }

  async verifyEmail(rawToken: string): Promise<{ success: true }> {
    const user = await this.userModel.findOne({
      verificationTokenHash: this.sha256(rawToken),
      verificationExpiresAt: { $gt: new Date() },
    });
    if (!user)
      throw new BadRequestException(
        'This verification link is invalid or has expired.',
      );

    await this.userModel.updateOne(
      { _id: user._id },
      {
        isVerified: true,
        $unset: { verificationTokenHash: 1, verificationExpiresAt: 1 },
      },
    );
    return { success: true };
  }

  /**
   * Always returns the same response, whether or not the email exists —
   * otherwise this endpoint becomes a free user-enumeration oracle.
   */
  async requestPasswordReset(email: string): Promise<{ success: true }> {
    const user = await this.userModel.findOne({
      email: email.toLowerCase().trim(),
    });

    if (user && user.provider === 'local') {
      const { raw, hash } = this.oneTimeToken();
      await this.userModel.updateOne(
        { _id: user._id },
        {
          resetTokenHash: hash,
          resetExpiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1h
        },
      );
      await this.mail.sendPasswordReset(user.email, user.name, raw);
    }

    return { success: true };
  }

  async resetPassword(
    rawToken: string,
    newPassword: string,
  ): Promise<{ success: true }> {
    const user = await this.userModel.findOne({
      resetTokenHash: this.sha256(rawToken),
      resetExpiresAt: { $gt: new Date() },
    });
    if (!user)
      throw new BadRequestException(
        'This reset link is invalid or has expired.',
      );

    await this.userModel.updateOne(
      { _id: user._id },
      {
        passwordHash: await this.hashPassword(newPassword),
        // Changing the password kills every existing session, everywhere.
        tokensValidFrom: new Date(),
        refreshTokenHashes: [],
        $unset: { resetTokenHash: 1, resetExpiresAt: 1 },
      },
    );

    this.logger.log(
      `Password reset completed for ${user.email}; all sessions revoked.`,
    );
    return { success: true };
  }

  // ────────────────────────────── Profile ─────────────────────────────

  /** userId ALWAYS comes from the verified JWT, never from the request body. */
  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<PublicUser> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: dto }, // dto is whitelisted: role/email/plan can't sneak in
      { new: true },
    );
    if (!user) throw new NotFoundException('User profile not found.');
    return this.toPublicUser(user);
  }

  async findUserById(id: string): Promise<User | null> {
    return this.userModel.findById(id);
  }

  async findAllUsers(): Promise<PublicUser[]> {
    const users = await this.userModel
      .find()
      .sort({ createdAt: -1 })
      .limit(500);
    return users.map((u) => this.toPublicUser(u));
  }

  /** Admin-only role change. */
  async changeRole(userId: string, role: AppRole): Promise<PublicUser> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { role, tokensValidFrom: new Date() },
      { new: true },
    );
    if (!user) throw new NotFoundException('User not found.');
    return this.toPublicUser(user);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ success: true }> {
    const user = await this.userModel.findById(userId).select('+passwordHash');
    if (!user) throw new NotFoundException('User not found.');

    if (!(await this.verifyPassword(currentPassword, user.passwordHash))) {
      throw new BadRequestException('Incorrect current password.');
    }

    user.passwordHash = await this.hashPassword(newPassword);
    user.tokensValidFrom = new Date();
    user.refreshTokenHashes = [];
    await user.save();

    this.logger.log(`Password updated by user ${user.email}; all sessions revoked.`);
    return { success: true };
  }

  toPublicUser(user: User): PublicUser {
    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      avatarUrl: user.avatarUrl,
      username: user.username,
      phone: user.phone,
      bio: user.bio,
      plan: user.plan ?? 'free',
      subscriptionStatus: user.subscriptionStatus ?? 'inactive',
    };
  }
}
