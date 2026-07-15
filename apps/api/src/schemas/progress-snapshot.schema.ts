import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class ProgressSnapshot extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Roadmap', required: true, index: true })
  roadmapId!: Types.ObjectId;

  @Prop({ required: true })
  moduleId!: string;

  @Prop({ required: true, enum: ['module_started', 'module_completed', 'module_failed', 'quiz_attempt'] })
  event!: 'module_started' | 'module_completed' | 'module_failed' | 'quiz_attempt';

  @Prop({ default: 0 })
  scoreAtEvent!: number;

  @Prop({ default: 0 })
  timeSpentSeconds!: number;
}

export const ProgressSnapshotSchema = SchemaFactory.createForClass(ProgressSnapshot);
// Create compound index for fast time-series queries
ProgressSnapshotSchema.index({ userId: 1, createdAt: -1 });
