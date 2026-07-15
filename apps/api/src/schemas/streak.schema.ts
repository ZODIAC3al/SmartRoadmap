import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Streak extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ default: 0 })
  currentStreak!: number;

  @Prop({ default: 0 })
  longestStreak!: number;

  @Prop({ required: true, default: '' })
  lastActivityDate!: string; // 'YYYY-MM-DD' in user's timezone

  @Prop({ default: 2 })
  freezesAvailable!: number;

  @Prop({ default: 'UTC' })
  timezone!: string;
}

export const StreakSchema = SchemaFactory.createForClass(Streak);
