import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ApplicationStatus =
  | 'interested'
  | 'applied'
  | 'under_review'
  | 'interview'
  | 'rejected'
  | 'offer'
  | 'hired';

@Schema({ timestamps: true })
export class JobApplication extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, index: true })
  jobId!: string;

  @Prop({ required: true })
  jobTitle!: string;

  @Prop({ required: true })
  company!: string;

  @Prop()
  cvId?: string;

  @Prop()
  cvTitle?: string;

  @Prop({ default: 0 })
  matchScore!: number;

  @Prop({
    type: String,
    enum: ['interested', 'applied', 'under_review', 'interview', 'rejected', 'offer', 'hired'],
    default: 'interested',
  })
  status!: ApplicationStatus;

  @Prop()
  notes?: string;

  @Prop()
  appliedAt?: Date;
}

export const JobApplicationSchema = SchemaFactory.createForClass(JobApplication);
// Compound unique index: one application record per user per job
JobApplicationSchema.index({ userId: 1, jobId: 1 }, { unique: true });
