import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * A user's portfolio project. GitHub repositories are imported here as
 * `source: 'github'` projects; users can also add manual projects or import
 * them from LinkedIn. Every project is editable and is reused by the Resume
 * Builder, Portfolio Builder, ATS Analysis and Job Matching features.
 */
@Schema({ timestamps: true })
export class Project extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ enum: ['github', 'manual', 'linkedin'], default: 'manual' })
  source!: 'github' | 'manual' | 'linkedin';

  /** GitHub repository id — used for idempotent re-imports (dedupe). */
  @Prop({ index: true, sparse: true })
  githubRepoId?: number;

  @Prop()
  githubUrl?: string;

  @Prop({ required: true })
  name!: string;

  @Prop()
  description?: string;

  @Prop()
  demoLink?: string;

  @Prop({ type: [String], default: [] })
  technologies!: string[];

  @Prop()
  readmeSnippet?: string;

  @Prop({ type: Object, default: {} })
  languages?: Record<string, number>;

  @Prop({ default: 0 })
  stars?: number;

  @Prop({ default: 0 })
  forks?: number;

  @Prop({ type: Date })
  lastUpdated?: Date;

  @Prop({ type: Date })
  importedAt?: Date;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
