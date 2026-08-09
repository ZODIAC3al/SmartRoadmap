import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class TrackCertification extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, index: true })
  trackId!: string;

  /** Human-readable roadmap/track title */
  @Prop({ required: true })
  trackTitle!: string;

  /** Unique certificate ID like DEV-CERT-XXXXXXXXXXXXXXXX */
  @Prop({ required: true, unique: true, index: true })
  certificateId!: string;

  /** All skills/topics verified at the time of issuance */
  @Prop({ type: [String], default: [] })
  verifiedSkills!: string[];

  /** Shareable URL for verification */
  @Prop({ required: true })
  shareableUrl!: string;

  /** ISO date string for expiry (3 years from issuance) */
  @Prop({ required: true })
  expiresAt!: Date;

  /** Badge/achievement key granted alongside the cert */
  @Prop({ required: true })
  badgeKey!: string;

  /** Overall progress % at the time of completion */
  @Prop({ default: 100 })
  progressPercentage!: number;

  @Prop({ default: 0 })
  longestStreakDays!: number;
}

export const TrackCertificationSchema =
  SchemaFactory.createForClass(TrackCertification);
TrackCertificationSchema.index({ userId: 1, trackId: 1 }, { unique: true });
