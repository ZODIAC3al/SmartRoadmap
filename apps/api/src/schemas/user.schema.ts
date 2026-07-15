import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AuthProvider = 'local' | 'google';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({
    required: true,
    unique: true,
    index: true,
    lowercase: true,
    trim: true,
  })
  email!: string;

  /** bcrypt hash. Never returned by the API (see `select: false`). */
  @Prop({ required: true, select: false })
  passwordHash!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({
    default: 'learner',
    enum: ['learner', 'company', 'admin'],
    index: true,
  })
  role!: 'learner' | 'company' | 'admin';

  /** Prevents account-linking attacks: a google account cannot be password-logged-in. */
  @Prop({ default: 'local', enum: ['local', 'google'] })
  provider!: AuthProvider;

  @Prop({ index: true, sparse: true })
  googleId?: string;

  @Prop()
  avatarUrl?: string;

  @Prop()
  username?: string;

  @Prop()
  phone?: string;

  @Prop()
  bio?: string;

  @Prop({ default: false })
  isVerified!: boolean;

  @Prop({ default: 'en' })
  locale!: string;

  @Prop({ default: 'smartdark' })
  theme!: string;

  @Prop({ default: 'system' })
  themePreference!: string;

  @Prop({
    type: [{
      dayOfWeek: Number,
      startHour: Number,
      endHour: Number,
    }],
    default: [],
  })
  studyAvailability!: Array<{ dayOfWeek: number; startHour: number; endHour: number }>;

  // ── Subscription (set ONLY by verified PayPal captures/webhooks) ──
  @Prop({ default: 'free', enum: ['free', 'pro_learner', 'company_tier'] })
  plan!: 'free' | 'pro_learner' | 'company_tier';

  @Prop({ default: 'inactive', enum: ['inactive', 'active', 'expired'] })
  subscriptionStatus!: 'inactive' | 'active' | 'expired';

  @Prop()
  subscriptionExpiresAt?: Date;

  /** Invalidate all refresh tokens issued before this instant (logout-all / password change). */
  @Prop({ default: () => new Date() })
  tokensValidFrom!: Date;

  /**
   * Hashed, still-valid refresh tokens (one entry per signed-in device).
   * A refresh token that verifies cryptographically but is NOT in this list has
   * already been used → it was replayed → we treat it as theft and revoke everything.
   */
  @Prop({ type: [String], default: [], select: false })
  refreshTokenHashes!: string[];

  // ── One-time tokens (stored hashed; the raw value only ever exists in the email) ──
  @Prop({ select: false })
  verificationTokenHash?: string;

  @Prop({ select: false })
  verificationExpiresAt?: Date;

  @Prop({ select: false })
  resetTokenHash?: string;

  @Prop({ select: false })
  resetExpiresAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
