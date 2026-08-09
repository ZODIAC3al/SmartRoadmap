import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class AudioSummary extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, index: true })
  moduleId!: string;

  @Prop({ default: '' })
  script!: string;

  @Prop({ default: '' })
  audioUrl!: string;

  @Prop({ default: 0 })
  durationSeconds!: number;

  @Prop({ default: 'alloy' })
  voice!: string;

  @Prop({ enum: ['gemini', 'groq', 'openai', 'mock'], default: 'mock' })
  provider!: 'gemini' | 'groq' | 'openai' | 'mock';

  @Prop({ enum: ['pending', 'ready', 'failed'], default: 'pending' })
  status!: 'pending' | 'ready' | 'failed';
}

export const AudioSummarySchema = SchemaFactory.createForClass(AudioSummary);
AudioSummarySchema.index({ userId: 1, moduleId: 1 });
