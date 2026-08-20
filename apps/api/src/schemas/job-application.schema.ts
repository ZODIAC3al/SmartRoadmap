import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ApplicationStatus =
  | 'Applied'
  | 'Interviewing'
  | 'Accepted'
  | 'Rejected'
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

  @Prop({ required: true, index: true })
  company!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  companyId?: Types.ObjectId;

  @Prop()
  cvId?: string;

  @Prop()
  cvTitle?: string;

  /** Complete frozen snapshot of candidate CV at time of application */
  @Prop({ type: Object, default: null })
  cvSnapshot?: Record<string, any>;

  /** Complete frozen snapshot of candidate Skill Passport at time of application */
  @Prop({ type: Object, default: null })
  passportSnapshot?: Record<string, any>;

  @Prop({ default: 0 })
  matchScore!: number;

  @Prop({
    type: String,
    enum: [
      'Applied',
      'Interviewing',
      'Accepted',
      'Rejected',
      'interested',
      'applied',
      'under_review',
      'interview',
      'rejected',
      'offer',
      'hired',
    ],
    default: 'Applied',
    index: true,
  })
  status!: ApplicationStatus;

  @Prop()
  notes?: string;

  @Prop()
  appliedAt?: Date;

  @Prop({
    type: [
      {
        status: { type: String, required: true },
        changedBy: { type: String, default: 'System' },
        changedAt: { type: Date, default: () => new Date() },
        notes: { type: String },
      },
    ],
    default: [],
  })
  statusHistory?: Array<{
    status: string;
    changedBy: string;
    changedAt: Date;
    notes?: string;
  }>;
}

export const JobApplicationSchema =
  SchemaFactory.createForClass(JobApplication);
// Compound unique index: one application record per user per job
JobApplicationSchema.index({ userId: 1, jobId: 1 }, { unique: true });
JobApplicationSchema.index({ companyId: 1, createdAt: -1 });
JobApplicationSchema.index({ company: 1, createdAt: -1 });
