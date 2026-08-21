import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PlanTier = 'starter' | 'growth' | 'scale';
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing';

@Schema({ timestamps: true })
export class Subscription extends Document {
  @Prop({
    type: Types.ObjectId,
    ref: 'Company',
    required: true,
    unique: true,
    index: true,
  })
  companyId!: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['starter', 'growth', 'scale'],
    default: 'starter',
    index: true,
  })
  plan!: PlanTier;

  @Prop({
    type: String,
    enum: ['active', 'past_due', 'canceled', 'trialing'],
    default: 'active',
  })
  status!: SubscriptionStatus;

  @Prop()
  stripeSubscriptionId?: string;

  @Prop()
  stripePriceId?: string;

  @Prop()
  currentPeriodEnd?: Date;

  @Prop({ default: 1 })
  seatsIncluded!: number;

  @Prop({ default: 1 }) // -1 = unlimited
  jobPostLimit!: number;

  @Prop({ default: 0 })
  messagesIncluded!: number;

  @Prop({ default: 0 })
  boostsIncluded!: number;

  @Prop({
    type: {
      jobPostsActive: { type: Number, default: 0 },
      messagesSentThisPeriod: { type: Number, default: 0 },
      boostsUsedThisPeriod: { type: Number, default: 0 },
    },
    default: {
      jobPostsActive: 0,
      messagesSentThisPeriod: 0,
      boostsUsedThisPeriod: 0,
    },
  })
  usage!: {
    jobPostsActive: number;
    messagesSentThisPeriod: number;
    boostsUsedThisPeriod: number;
  };
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
// Explicit unique index on companyId to prevent double-subscription race conditions
SubscriptionSchema.index({ companyId: 1 }, { unique: true });
