import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InterviewSessionDocument = InterviewSession & Document;

export enum InterviewStatus {
  Pending = 'pending',
  InProgress = 'in_progress',
  Paused = 'paused',
  Completed = 'completed',
  TimedOut = 'timed_out',
}

export enum InterviewType {
  Technical = 'technical',
  Behavioral = 'behavioral',
  Mixed = 'mixed',
}

export enum InterviewDifficulty {
  Easy = 'easy',
  Medium = 'medium',
  Hard = 'hard',
  Adaptive = 'adaptive',
}

export enum InterviewMode {
  Text = 'text',
  Voice = 'voice', // future support
}

export interface InterviewConfig {
  type: InterviewType;
  difficulty: InterviewDifficulty;
  durationMinutes: number;
  language: 'en' | 'ar' | 'mixed';
  mode: InterviewMode;
}

@Schema({ timestamps: true })
export class InterviewSession {
  @Prop({ type: String, required: true })
  userId!: string;

  @Prop({ type: Types.ObjectId, ref: 'Roadmap', required: false })
  roadmapId?: Types.ObjectId;

  @Prop({ required: true, type: Object })
  config!: InterviewConfig;

  @Prop({ enum: InterviewStatus, default: InterviewStatus.Pending })
  status!: InterviewStatus;

  @Prop({ type: [Types.ObjectId], default: [] })
  moduleIds: Types.ObjectId[] = [];

  @Prop({ type: [String], default: [] })
  topicIds: string[] = [];

  @Prop({ type: [Object], default: [] })
  questions: any[] = [];

  @Prop({ type: [Object], default: [] })
  answers: any[] = [];

  @Prop({ default: 0 })
  currentQuestionIndex!: number;

  @Prop({ type: Date })
  startedAt?: Date;

  @Prop({ type: Date })
  pausedAt?: Date;

  @Prop({ type: Date })
  completedAt?: Date;
}

export const InterviewSessionSchema = SchemaFactory.createForClass(InterviewSession);
