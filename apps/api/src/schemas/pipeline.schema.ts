import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PipelineStage =
  | 'applied'
  | 'screening'
  | 'interview'
  | 'offer'
  | 'hired'
  | 'rejected';

@Schema({ timestamps: true })
export class ApplicantPipeline extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Job', required: true, index: true })
  jobId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  candidateId!: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'],
    default: 'applied',
    index: true,
  })
  stage!: PipelineStage;

  @Prop({ default: 0 })
  matchScore!: number;

  @Prop({
    type: [
      {
        authorId: { type: Types.ObjectId, ref: 'User', required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: () => new Date() },
      },
    ],
    default: [],
  })
  notes?: Array<{
    authorId: Types.ObjectId;
    text: string;
    createdAt: Date;
  }>;

  @Prop({ min: 1, max: 5 })
  rating?: number;

  @Prop({
    type: [
      {
        stage: { type: String, required: true },
        changedAt: { type: Date, default: () => new Date() },
        changedBy: { type: Types.ObjectId, ref: 'User' },
      },
    ],
    default: [],
  })
  stageHistory?: Array<{
    stage: string;
    changedAt: Date;
    changedBy?: Types.ObjectId;
  }>;
}

export const ApplicantPipelineSchema =
  SchemaFactory.createForClass(ApplicantPipeline);

// Compound indexes for fast Kanban stage queries & candidate uniqueness per job
ApplicantPipelineSchema.index({ jobId: 1, stage: 1 });
ApplicantPipelineSchema.index({ jobId: 1, candidateId: 1 }, { unique: true });
