import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * Persisted GitHub connection for a user.
 * The `accessToken` is encrypted at rest (see TokenCipher) and is `select: false`
 * so it is never returned by default — only the service reads it server-side.
 */
@Schema({ timestamps: true })
export class GitHubAccount extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, index: true })
  githubId!: string;

  @Prop()
  username?: string;

  @Prop()
  fullName?: string;

  @Prop()
  avatar?: string;

  @Prop()
  bio?: string;

  @Prop()
  location?: string;

  @Prop()
  website?: string;

  @Prop()
  email?: string;

  @Prop({ default: 0 })
  followers!: number;

  @Prop({ default: 0 })
  following!: number;

  /** Encrypted OAuth access token (never returned to clients). */
  @Prop({ required: true, select: false })
  accessToken!: string;

  @Prop({ type: Object, default: {} })
  languagesSummary?: Record<string, number>;

  @Prop({ default: 0 })
  totalStars?: number;

  @Prop({ type: Date })
  lastSyncedAt?: Date;

  @Prop()
  scope?: string;

  @Prop({ type: Date })
  tokenExpiresAt?: Date;

  @Prop({ type: Date })
  connectedAt?: Date;
}

export const GitHubAccountSchema = SchemaFactory.createForClass(GitHubAccount);
