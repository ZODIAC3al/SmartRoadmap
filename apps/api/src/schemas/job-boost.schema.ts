import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type JobBoostSource = 'subscription_included' | 'paid';

@Schema({ timestamps: true })
export class JobBoost extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Job', required: true, index: true })
  jobId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true, index: true })
  companyId!: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['subscription_included', 'paid'],
    default: 'paid',
  })
  source!: JobBoostSource;

  @Prop()
  stripePaymentIntentId?: string;

  @Prop({ default: () => new Date() })
  startedAt!: Date;

  @Prop({
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days boost
    index: true,
  })
  expiresAt!: Date;
}

export const JobBoostSchema = SchemaFactory.createForClass(JobBoost);
JobBoostSchema.index({ jobId: 1, expiresAt: -1 });
JobBoostSchema.index({ companyId: 1, expiresAt: -1 });
