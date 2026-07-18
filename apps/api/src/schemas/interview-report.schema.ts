import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InterviewReportDocument = InterviewReport & Document;

@Schema({ timestamps: true })
export class InterviewReport {
  @Prop({ type: Types.ObjectId, ref: 'InterviewSession', required: true, index: true })
  sessionId!: Types.ObjectId;

  @Prop({ type: String, required: true, index: true })
  userId!: string;

  @Prop({ default: 0 })
  overallScore!: number;

  @Prop({ default: 0 })
  technicalScore!: number;

  @Prop({ default: 0 })
  problemSolvingScore!: number;

  @Prop({ default: 0 })
  communicationScore!: number;

  @Prop({ default: 0 })
  confidenceScore!: number;

  @Prop({ type: [String], default: [] })
  strengths: string[] = [];

  @Prop({ type: [String], default: [] })
  weaknesses: string[] = [];

  /** Per-question breakdown: { questionId, questionText, answer, score, feedback, idealAnswer } */
  @Prop({ type: [Object], default: [] })
  questionFeedback: any[] = [];

  @Prop({ type: [String], default: [] })
  recommendations: string[] = [];

  @Prop({ type: [String], default: [] })
  achievements: string[] = [];

  @Prop({ type: [Object], default: [] })
  roadmapUpdates: any[] = [];
}

export const InterviewReportSchema = SchemaFactory.createForClass(InterviewReport);
