import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class CalendarEvent extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true, enum: ['study_session', 'quiz_reminder', 'job_interview', 'custom'], default: 'custom' })
  type!: 'study_session' | 'quiz_reminder' | 'job_interview' | 'custom';

  @Prop({ type: String, default: null })
  moduleId!: string | null;

  @Prop({ required: true })
  startAt!: Date;

  @Prop({ required: true })
  endAt!: Date;

  @Prop({ enum: ['none', 'daily', 'weekly'], default: 'none' })
  recurrence!: 'none' | 'daily' | 'weekly';

  @Prop({ default: 30 })
  reminderMinutesBefore!: number;

  @Prop({ default: false })
  completed!: boolean;
}

export const CalendarEventSchema = SchemaFactory.createForClass(CalendarEvent);
