import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationType =
  | 'message_received'
  | 'pipeline_stage_changed'
  | 'certificate_verified'
  | 'certificate_rejected'
  | 'job_application_received'
  | 'roadmap_module_unlocked'
  | 'assessment_remedial_assigned'
  | 'subscription_past_due'
  | 'subscription_upgraded'
  | 'admin_broadcast';

@Schema({ timestamps: true })
export class Notification extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({
    type: String,
    enum: [
      'message_received',
      'pipeline_stage_changed',
      'certificate_verified',
      'certificate_rejected',
      'job_application_received',
      'roadmap_module_unlocked',
      'assessment_remedial_assigned',
      'subscription_past_due',
      'subscription_upgraded',
      'admin_broadcast',
    ],
    required: true,
  })
  type!: NotificationType;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  body!: string;

  @Prop({ default: '/dashboard' })
  linkTo!: string;

  @Prop({ default: false, index: true })
  isRead!: boolean;

  @Prop({ type: Object, default: {} })
  meta?: Record<string, any>;

  @Prop({ type: Date })
  expiresAt?: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Explicit compound index for fast bell dropdown queries
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

// Production TTL cleanup index for auto-expiring 90-day notification retention
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
