import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserRecommendationDocument = UserRecommendation & Document;

export enum RecommendationCategory {
  Course = 'course',
  Project = 'project',
  Article = 'article',
  Certification = 'certification',
  Job = 'job',
}

export enum RecommendationStatus {
  Active = 'active',
  Saved = 'saved',
  Completed = 'completed',
  Dismissed = 'dismissed',
}

@Schema({ timestamps: true })
export class UserRecommendation {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ enum: RecommendationCategory, required: true, index: true })
  category!: RecommendationCategory;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({ required: true, min: 0, max: 100, default: 85 })
  matchScore!: number;

  @Prop({ required: true })
  reason!: string;

  @Prop()
  url?: string;

  @Prop({ enum: ['beginner', 'intermediate', 'advanced'], default: 'intermediate' })
  difficulty?: 'beginner' | 'intermediate' | 'advanced';

  @Prop()
  estimatedTime?: string;

  @Prop({ enum: RecommendationStatus, default: RecommendationStatus.Active, index: true })
  status!: RecommendationStatus;

  @Prop()
  aiInsight?: string;
}

export const UserRecommendationSchema = SchemaFactory.createForClass(UserRecommendation);
