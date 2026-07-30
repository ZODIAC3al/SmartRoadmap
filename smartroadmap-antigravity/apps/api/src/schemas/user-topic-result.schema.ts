import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class UserTopicResult extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, index: true })
  trackId!: string;

  @Prop({ required: true, index: true })
  topicId!: string;

  @Prop({ default: 0 })
  attempts!: number;

  @Prop({ default: 0 })
  failedAttempts!: number;

  @Prop({ default: 0 })
  failPercentage!: number;

  @Prop({ default: 0 })
  lastScore!: number;

  @Prop({
    enum: ['not_started', 'in_progress', 'passed', 'failed', 'remedial_inserted'],
    default: 'not_started',
  })
  status!: 'not_started' | 'in_progress' | 'passed' | 'failed' | 'remedial_inserted';
}

export const UserTopicResultSchema = SchemaFactory.createForClass(UserTopicResult);
UserTopicResultSchema.index({ userId: 1, trackId: 1, topicId: 1 }, { unique: true });
