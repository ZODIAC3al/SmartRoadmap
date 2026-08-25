import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AiFeatureKey =
  | 'AI_ROADMAP'
  | 'AI_REMEDIAL_CONTENT'
  | 'AI_QUIZ_GENERATION'
  | 'AI_CHEATSHEET'
  | 'AI_AUDIO_SUMMARY'
  | 'AI_AUDIO_NARRATION'
  | 'AI_CAREER_ANALYSIS'
  | 'AI_INTERVIEW'
  | 'AI_VOICE_AGENT'
  | 'AI_CANDIDATE_MATCH'
  | 'AI_CANDIDATE_RANKING'
  | 'AI_CV_ANALYSIS'
  | 'AI_SKILL_GAP'
  | 'AI_RECRUITMENT_ASSISTANT'
  | 'AI_COMPANY_INSIGHTS'
  | 'AI_EXECUTIVE_BI';

@Schema({ timestamps: true })
export class AiUsageLedger extends Document {
  @Prop({ type: String, required: true, index: true })
  requestId!: string;

  @Prop({ type: String, required: true, index: true })
  reservationId!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Company', index: true })
  companyId?: Types.ObjectId;

  @Prop({ type: String, required: true })
  role!: string;

  @Prop({ type: String, required: true })
  plan!: string;

  @Prop({ type: String, required: true, index: true })
  featureKey!: string;

  @Prop({ type: String, required: true })
  provider!: string;

  @Prop({ type: String, required: true })
  aiModel!: string;

  @Prop({ type: Number, default: 0 })
  inputTokens!: number;

  @Prop({ type: Number, default: 0 })
  outputTokens!: number;

  @Prop({ type: Number, default: 0 })
  totalTokens!: number;

  @Prop({ type: Number, required: true, default: 0 })
  creditsConsumed!: number;

  @Prop({ type: String, required: true, enum: ['success', 'fallback', 'failed'], default: 'success' })
  status!: 'success' | 'fallback' | 'failed';

  @Prop({ type: Date, default: Date.now, index: true })
  timestamp!: Date;
}

export const AiUsageLedgerSchema = SchemaFactory.createForClass(AiUsageLedger);
AiUsageLedgerSchema.index({ userId: 1, timestamp: -1 });
AiUsageLedgerSchema.index({ companyId: 1, timestamp: -1 });
