import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ _id: false })
export class CodeTestCaseResult {
  @Prop({ required: true })
  testCaseId!: string;

  @Prop({ required: true })
  passed!: boolean;

  @Prop({ default: '' })
  actualOutput!: string;

  @Prop({ default: '' })
  expectedOutput!: string;

  @Prop({ default: 0 })
  executionTimeMs!: number;
}

@Schema({ timestamps: true })
export class CodeSubmission extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: String, default: null, index: true })
  challengeId!: string | null;

  @Prop({ required: true })
  language!: string;

  @Prop({ required: true })
  code!: string;

  @Prop({ default: '' })
  stdin!: string;

  @Prop({ required: true, enum: ['queued', 'running', 'completed', 'error', 'timeout'], default: 'queued' })
  status!: 'queued' | 'running' | 'completed' | 'error' | 'timeout';

  @Prop({ type: [CodeTestCaseResult], default: [] })
  results!: CodeTestCaseResult[];
}

export const CodeSubmissionSchema = SchemaFactory.createForClass(CodeSubmission);
