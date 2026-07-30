import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ _id: false })
export class CodingTestCase {
  @Prop({ required: true })
  id!: string;

  @Prop({ default: '' })
  input!: string;

  @Prop({ required: true })
  expectedOutput!: string;

  @Prop({ default: false })
  isHidden!: boolean;
}

@Schema({ timestamps: true })
export class CodingChallenge extends Document {
  @Prop({ required: true, index: true })
  moduleId!: string;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  prompt!: string; // Markdown description

  @Prop({ required: true, enum: ['easy', 'medium', 'hard'], default: 'medium' })
  difficulty!: 'easy' | 'medium' | 'hard';

  @Prop({ type: Map, of: String, default: {} })
  starterCode!: Map<string, string>; // language -> code mapping

  @Prop({ type: [CodingTestCase], default: [] })
  testCases!: CodingTestCase[];

  @Prop({ required: true, enum: ['seed', 'ai_generated'], default: 'seed' })
  createdBy!: 'seed' | 'ai_generated';
}

export const CodingChallengeSchema = SchemaFactory.createForClass(CodingChallenge);

@Schema({ timestamps: true })
export class ChallengeAttempt extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'CodingChallenge', required: true, index: true })
  challengeId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'CodeSubmission', default: null })
  bestSubmissionId!: Types.ObjectId | null;

  @Prop({ default: false })
  passed!: boolean;

  @Prop({ default: 0 })
  attemptsCount!: number;
}

export const ChallengeAttemptSchema = SchemaFactory.createForClass(ChallengeAttempt);
ChallengeAttemptSchema.index({ userId: 1, challengeId: 1 }, { unique: true });
